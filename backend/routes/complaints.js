const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all complaints (warden only)
router.get('/', auth, async (req, res) => {
    if (req.user.role !== 'authority') return res.status(403).json({ error: 'Access denied' });
    const { status, category, room_number } = req.query;
    try {
        let query = `
            SELECT c.*, u.username, u.name, u.mobile_number
            FROM complaints c
            JOIN users u ON c.user_id = u.id
        `;
        const params = [];
        if (status) {
            query += ` WHERE c.status = $1`;
            params.push(status);
        }
        if (category) {
            query += params.length ? ` AND c.category = $${params.length + 1}` : ` WHERE c.category = $1`;
            params.push(category);
        }
        if (room_number) {
            query += params.length ? ` AND c.room_number = $${params.length + 1}` : ` WHERE c.room_number = $1`;
            params.push(room_number);
        }
        query += ` ORDER BY c.submitted_at DESC`;
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get my complaints (student only)
router.get('/my-complaints', auth, async (req, res) => {
    if (req.user.role !== 'student') return res.status(403).json({ error: 'Access denied' });
    try {
        const result = await pool.query(
            'SELECT * FROM complaints WHERE user_id = $1 ORDER BY submitted_at DESC',
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Submit a complaint (student only)
router.post('/', auth, async (req, res) => {
    if (req.user.role !== 'student') return res.status(403).json({ error: 'Access denied' });
    const { category, description } = req.body;
    try {
        if (!category || !description) {
            return res.status(400).json({ error: 'Category and description are required' });
        }
        const user = await pool.query('SELECT room_number FROM users WHERE id = $1', [req.user.id]);
        if (!user.rows.length) return res.status(404).json({ error: 'User not found' });

        const result = await pool.query(
            'INSERT INTO complaints (user_id, room_number, category, description) VALUES ($1, $2, $3, $4) RETURNING *',
            [req.user.id, user.rows[0].room_number, category, description]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Update complaint status (warden only)
router.put('/:id', auth, async (req, res) => {
    if (req.user.role !== 'authority') return res.status(403).json({ error: 'Access denied' });
    const { id } = req.params;
    const { status } = req.body;
    try {
        if (!status || !['pending', 'in_progress', 'warden_approved'].includes(status)) {
            return res.status(400).json({ error: 'Status must be "pending", "in_progress", or "warden_approved"' });
        }
        console.log('Status received:', status, typeof status); // Debug
        let query;
        if (status === 'warden_approved') {
            query = `
                UPDATE complaints 
                SET status = $1, 
                    updated_at = CURRENT_TIMESTAMP, 
                    warden_approved_at = CURRENT_TIMESTAMP 
                WHERE id = $2 
                RETURNING *
            `;
        } else {
            query = `
                UPDATE complaints 
                SET status = $1, 
                    updated_at = CURRENT_TIMESTAMP 
                WHERE id = $2 
                RETURNING *
            `;
        }
        const result = await pool.query(query, [status, id]);
        if (!result.rows.length) return res.status(404).json({ error: 'Complaint not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Query error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Student confirms resolution (student only)
router.put('/:id/confirm', auth, async (req, res) => {
    if (req.user.role !== 'student') return res.status(403).json({ error: 'Access denied' });
    const { id } = req.params;
    try {
        const complaint = await pool.query('SELECT user_id, status FROM complaints WHERE id = $1', [id]);
        if (!complaint.rows.length) return res.status(404).json({ error: 'Complaint not found' });
        if (complaint.rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Not your complaint' });
        if (complaint.rows[0].status !== 'warden_approved') return res.status(400).json({ error: 'Complaint must be warden_approved first' });

        const result = await pool.query(
            'UPDATE complaints SET status = \'resolved\', student_approved_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
            [id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;