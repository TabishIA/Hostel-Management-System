const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all students' attendance for today (admin only)
router.get('/', auth, async (req, res) => {
    if (req.user.role !== 'authority') return res.status(403).json({ error: 'Access denied' });
    try {
        const today = new Date().toISOString().split('T')[0];
        const students = await pool.query(
            'SELECT u.id, u.username, u.room_id, COALESCE(a.status, $1) as status FROM users u LEFT JOIN attendance a ON u.id = a.user_id AND a.date = $2 WHERE u.role = $3',
            ['absent', today, 'student']
        );

        // Integrate with leaves (optional, if leave system exists)
        const leaves = await pool.query(
            'SELECT user_id FROM leaves WHERE status = $1 AND $2 BETWEEN start_date AND end_date',
            ['approved', today]
        );
        const onLeaveIds = leaves.rows.map(l => l.user_id);

        const attendanceList = students.rows.map(student => ({
            ...student,
            status: onLeaveIds.includes(student.id) ? 'on_leave' : student.status
        }));

        res.json(attendanceList);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Mark attendance for a student (admin only)
router.put('/mark', auth, async (req, res) => {
    if (req.user.role !== 'authority') return res.status(403).json({ error: 'Access denied' });
    const { user_id, status, date } = req.body; // date optional, defaults to today
    try {
        if (!user_id || !status || !['present', 'absent'].includes(status)) {
            return res.status(400).json({ error: 'Invalid user_id or status (must be "present" or "absent")' });
        }

        const markDate = date || new Date().toISOString().split('T')[0];
        const now = new Date();

        const result = await pool.query(
            'INSERT INTO attendance (user_id, date, status, check_in_time) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id, date) DO UPDATE SET status = $3, check_in_time = $4 RETURNING *',
            [user_id, markDate, status, now]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get attendance history for analysis (admin only)
router.get('/history', auth, async (req, res) => {
    if (req.user.role !== 'authority') return res.status(403).json({ error: 'Access denied' });
    const { start_date, end_date } = req.query; // e.g., ?start_date=2025-03-01&end_date=2025-03-31
    try {
        if (!start_date || !end_date) {
            return res.status(400).json({ error: 'start_date and end_date are required' });
        }

        const history = await pool.query(
            'SELECT u.id, u.username, a.date, a.status FROM users u LEFT JOIN attendance a ON u.id = a.user_id WHERE u.role = $1 AND a.date BETWEEN $2 AND $3 ORDER BY a.date',
            ['student', start_date, end_date]
        );
        res.json(history.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;