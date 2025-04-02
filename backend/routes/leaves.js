const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all leaves (warden only)
router.get('/', auth, async (req, res) => {
    if (req.user.role !== 'authority') return res.status(403).json({ error: 'Access denied' });
    const { status, date } = req.query; // Optional filters
    try {
        let query = `
            SELECT l.*, u.username, u.name, u.room_number, u.branch, u.class, u.mobile_number, u.family_contact as user_family_contact
            FROM leaves l
            JOIN users u ON l.user_id = u.id
        `;
        const params = [];
        if (status) {
            query += ` WHERE l.status = $1`;
            params.push(status);
        }
        if (date) {
            query += params.length ? ` AND $2::date BETWEEN l.start_date AND l.end_date` : ` WHERE $1::date BETWEEN l.start_date AND l.end_date`;
            params.push(date);
        }
        query += ` ORDER BY l.submitted_at DESC`;
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get my leaves (student only)
router.get('/my-leaves', auth, async (req, res) => {
    if (req.user.role !== 'student') return res.status(403).json({ error: 'Access denied' });
    try {
        const result = await pool.query(
            'SELECT * FROM leaves WHERE user_id = $1 ORDER BY submitted_at DESC',
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Submit a leave request (student only)
router.post('/', auth, async (req, res) => {
    if (req.user.role !== 'student') return res.status(403).json({ error: 'Access denied' });
    const { reason, start_date, end_date, address, family_contact } = req.body;
    try {
        if (!reason || !start_date || !end_date || !address || !family_contact) {
            return res.status(400).json({ error: 'All fields (reason, start_date, end_date, address, family_contact) are required' });
        }
        const result = await pool.query(
            'INSERT INTO leaves (user_id, reason, start_date, end_date, address, family_contact) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [req.user.id, reason, start_date, end_date, address, family_contact]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Approve or reject a leave (warden only)
router.put('/:id', auth, async (req, res) => {
    if (req.user.role !== 'authority') return res.status(403).json({ error: 'Access denied' });
    const { id } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'
    try {
        if (!status || !['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Status must be "approved" or "rejected"' });
        }
        const result = await pool.query(
            'UPDATE leaves SET status = $1, reviewed_at = CURRENT_TIMESTAMP WHERE id = $2 AND status = \'pending\' RETURNING *',
            [status, id]
        );
        if (!result.rows.length) return res.status(404).json({ error: 'Leave not found or already reviewed' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;