const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/auth');
const router = express.Router();

// Add a room (warden only)
router.post('/', auth, async (req, res) => {
    if (req.user.role !== 'authority') return res.status(403).json({ error: 'Access denied' });
    const { room_number, capacity, description } = req.body;
    try {
        if (!room_number || !capacity) {
            return res.status(400).json({ error: 'room_number and capacity are required' });
        }
        const result = await pool.query(
            'INSERT INTO rooms (room_number, capacity, description) VALUES ($1, $2, $3) RETURNING *',
            [room_number, capacity, description || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Assign student to a room (warden only)
router.put('/assign', auth, async (req, res) => {
    if (req.user.role !== 'authority') return res.status(403).json({ error: 'Access denied' });
    const { username, room_number } = req.body;
    try {
        if (!username || !room_number) {
            return res.status(400).json({ error: 'username and room_number are required' });
        }

        // Check room capacity
        const room = await pool.query(
            'SELECT capacity, (SELECT COUNT(*) FROM users WHERE room_number = $1) as occupant_count FROM rooms WHERE room_number = $1',
            [room_number]
        );
        if (!room.rows.length) return res.status(404).json({ error: 'Room not found' });
        if (room.rows[0].occupant_count >= room.rows[0].capacity) {
            return res.status(400).json({ error: 'Room is at full capacity' });
        }

        const result = await pool.query(
            'UPDATE users SET room_number = $1 WHERE username = $2 RETURNING *',
            [room_number, username]
        );
        if (!result.rows.length) return res.status(404).json({ error: 'Student not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Unassign or move student (warden only)
router.put('/unassign', auth, async (req, res) => {
    if (req.user.role !== 'authority') return res.status(403).json({ error: 'Access denied' });
    const { username, new_room_number } = req.body;
    try {
        if (!username) return res.status(400).json({ error: 'username is required' });

        if (new_room_number) {
            // Move to new room
            const room = await pool.query(
                'SELECT capacity, (SELECT COUNT(*) FROM users WHERE room_number = $1) as occupant_count FROM rooms WHERE room_number = $1',
                [new_room_number]
            );
            if (!room.rows.length) return res.status(404).json({ error: 'New room not found' });
            if (room.rows[0].occupant_count >= room.rows[0].capacity) {
                return res.status(400).json({ error: 'New room is at full capacity' });
            }
            const result = await pool.query(
                'UPDATE users SET room_number = $1 WHERE username = $2 RETURNING *',
                [new_room_number, username]
            );
            if (!result.rows.length) return res.status(404).json({ error: 'Student not found' });
            res.json(result.rows[0]);
        } else {
            // Unassign
            const result = await pool.query(
                'UPDATE users SET room_number = NULL WHERE username = $1 RETURNING *',
                [username]
            );
            if (!result.rows.length) return res.status(404).json({ error: 'Student not found' });
            res.json(result.rows[0]);
        }
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// View all rooms (warden only)
router.get('/', auth, async (req, res) => {
    if (req.user.role !== 'authority') return res.status(403).json({ error: 'Access denied' });
    try {
        const rooms = await pool.query(
            'SELECT r.*, ARRAY_AGG(JSONB_BUILD_OBJECT(\'username\', u.username, \'name\', u.name)) as occupants, COUNT(u.username) as occupant_count FROM rooms r LEFT JOIN users u ON r.room_number = u.room_number GROUP BY r.room_number'
        );
        res.json(rooms.rows.map(row => ({
            ...row,
            occupants: row.occupants.filter(o => o.username !== null),
            occupant_count: parseInt(row.occupant_count, 10)
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// View my room (any authenticated user)
router.get('/my-room', auth, async (req, res) => {
    try {
        const user = await pool.query('SELECT room_number FROM users WHERE id = $1', [req.user.id]);
        if (!user.rows.length || !user.rows[0].room_number) {
            return res.status(404).json({ error: 'No room assigned' });
        }
        const room = await pool.query('SELECT * FROM rooms WHERE room_number = $1', [user.rows[0].room_number]);
        res.json(room.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;