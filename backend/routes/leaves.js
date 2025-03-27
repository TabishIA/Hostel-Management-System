const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all complaints (authority only)
router.get('/', auth, async (req, res) => {
    if (req.user.role !== 'authority') return res.status(403).json({ error: 'Access denied' });
    try {
        const result = await pool.query('SELECT * FROM complaints');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Submit a complaint (students only)
router.post('/', auth, async (req, res) => {
    if (req.user.role !== 'student') return res.status(403).json({ error: 'Access denied' });
    const { description } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO complaints (user_id, description) VALUES ($1, $2) RETURNING *',
            [req.user.id, description]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;