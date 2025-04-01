const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all students' attendance for today (warden only)
router.get('/', auth, async (req, res) => {
    if (req.user.role !== 'authority') return res.status(403).json({ error: 'Access denied' });
    try {
        const today = new Date().toISOString().split('T')[0];
        const students = await pool.query(
            'SELECT u.username, u.name, u.room_number, COALESCE(a.status, $1) as status FROM users u LEFT JOIN attendance a ON u.username = a.username AND a.date = $2 WHERE u.role = $3',
            ['absent', today, 'student']
        );
        res.json(students.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Mark attendance (warden only)
router.put('/mark', auth, async (req, res) => {
    if (req.user.role !== 'authority') return res.status(403).json({ error: 'Access denied' });
    const { username, status, date } = req.body;
    try {
        if (!username || !status || !['present', 'absent'].includes(status)) {
            return res.status(400).json({ error: 'Invalid username or status (must be "present" or "absent")' });
        }

        const markDate = date || new Date().toISOString().split('T')[0];
        const now = new Date();

        const result = await pool.query(
            'INSERT INTO attendance (username, date, status, check_in_time) VALUES ($1, $2, $3, $4) ON CONFLICT (username, date) DO UPDATE SET status = $3, check_in_time = $4 RETURNING *',
            [username, markDate, status, now]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get attendance history (warden only)
router.get('/history', auth, async (req, res) => {
    if (req.user.role !== 'authority') return res.status(403).json({ error: 'Access denied' });
    const { start_date, end_date } = req.query;
    try {
        if (!start_date || !end_date) {
            return res.status(400).json({ error: 'start_date and end_date are required' });
        }

        const history = await pool.query(
            'SELECT u.username, u.name, a.date, a.status FROM users u LEFT JOIN attendance a ON u.username = a.username WHERE u.role = $1 AND a.date BETWEEN $2 AND $3 ORDER BY a.date',
            ['student', start_date, end_date]
        );
        res.json(history.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;