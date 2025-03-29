const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/auth');
const router = express.Router();

// Add a new room (admin only)
router.post('/', auth, async (req, res) => {
    if (req.user.role !== 'authority') return res.status(403).json({ error: 'Access denied' });
    const { room_number, capacity, description } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO rooms (room_number, capacity, description) VALUES ($1, $2, $3) RETURNING *',
            [room_number, capacity, description || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Assign a student to a room (admin only)
router.put('/assign', auth, async (req, res) => {
    if (req.user.role !== 'authority') return res.status(403).json({ error: 'Access denied' });
    const { user_id, room_id } = req.body;
    try {
        // Check room capacity
        const room = await pool.query('SELECT capacity FROM rooms WHERE id = $1', [room_id]);
        if (!room.rows.length) return res.status(404).json({ error: 'Room not found' });

        const currentOccupants = await pool.query(
            'SELECT COUNT(*) FROM users WHERE room_id = $1',
            [room_id]
        );
        const occupantCount = parseInt(currentOccupants.rows[0].count);
        if (occupantCount >= room.rows[0].capacity) {
            return res.status(400).json({ error: 'Room is at full capacity' });
        }

        const result = await pool.query(
            'UPDATE users SET room_id = $1 WHERE id = $2 AND role = $3 RETURNING *',
            [room_id, user_id, 'student']
        );
        if (!result.rows.length) return res.status(404).json({ error: 'Student not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Get all rooms (admin only)
router.get('/', auth, async (req, res) => {
    if (req.user.role !== 'authority') return res.status(403).json({ error: 'Access denied' });
    try {
        const result = await pool.query('SELECT * FROM rooms');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// (Optional) Get a user's room assignment
router.get('/my-room', auth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT r.* FROM rooms r JOIN users u ON r.id = u.room_id WHERE u.id = $1',
            [req.user.id]
        );
        if (!result.rows.length) return res.status(404).json({ error: 'No room assigned' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;