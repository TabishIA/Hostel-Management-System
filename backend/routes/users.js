const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const auth = require('../middleware/auth');
const nodemailer = require('nodemailer');
const router = express.Router();
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Email setup (replace with your SMTP details)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
    }
});

// Warden adds a student (admin only)
router.post('/add-student', auth, async (req, res) => {
    if (req.user.role !== 'authority') return res.status(403).json({ error: 'Access denied' });
    const {
        username, name, roll_number, mobile_number, email,
        family_contact, branch, class: studentClass, room_number // Changed from room_id
    } = req.body;

    try {
        if (!username || !name || !roll_number || !mobile_number || !email || !branch || !studentClass) {
            return res.status(400).json({ error: 'All required fields must be provided' });
        }

        const password = username; // Initial password = reg ID
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            'INSERT INTO users (username, password, name, roll_number, mobile_number, email, family_contact, branch, class, room_number, role) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *', // Changed room_id to room_number
            [username, hashedPassword, name, roll_number, mobile_number, email, family_contact || null, branch, studentClass, room_number || null, 'student']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Warden adds another warden (admin only)
router.post('/add-warden', auth, async (req, res) => {
    if (req.user.role !== 'authority') return res.status(403).json({ error: 'Access denied' });
    const { username, name, roll_number, mobile_number, email, family_contact } = req.body;

    try {
        if (!username || !name || !roll_number || !mobile_number || !email) {
            return res.status(400).json({ error: 'All required fields must be provided' });
        }

        const password = username; // Initial password = username
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            'INSERT INTO users (username, password, name, roll_number, mobile_number, email, family_contact, role) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [username, hashedPassword, name, roll_number, mobile_number, email, family_contact || null, 'authority']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (!user.rows.length) return res.status(400).json({ error: 'Invalid credentials' });

        const validPassword = await bcrypt.compare(password, user.rows[0].password);
        if (!validPassword) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign(
            { id: user.rows[0].id, role: user.rows[0].role },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await pool.query(
            'SELECT username, name, roll_number, mobile_number, email, family_contact, branch, class, room_number, role FROM users WHERE id = $1', // Changed room_id to room_number
            [req.user.id]
        );
        if (!user.rows.length) return res.status(404).json({ error: 'User not found' });
        res.json(user.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Request OTP for password change
router.post('/request-otp', auth, async (req, res) => {
    try {
        const user = await pool.query('SELECT email FROM users WHERE id = $1', [req.user.id]);
        if (!user.rows.length) return res.status(404).json({ error: 'User not found' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 10 * 60 * 1000);

        await pool.query(
            'UPDATE users SET password_reset_otp = $1, password_reset_expires = $2 WHERE id = $3',
            [otp, expires, req.user.id]
        );

        await transporter.sendMail({
            to: user.rows[0].email,
            subject: 'Password Change OTP',
            text: `Your OTP for password change is ${otp}. It expires in 10 minutes.`
        });

        res.json({ message: 'OTP sent to your email' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Change password with OTP
router.post('/change-password', auth, async (req, res) => {
    const { otp, new_password } = req.body;
    try {
        if (!otp || !new_password) {
            return res.status(400).json({ error: 'OTP and new password are required' });
        }

        const user = await pool.query(
            'SELECT password_reset_otp, password_reset_expires FROM users WHERE id = $1',
            [req.user.id]
        );
        if (!user.rows.length) return res.status(404).json({ error: 'User not found' });

        const { password_reset_otp, password_reset_expires } = user.rows[0];
        if (password_reset_otp !== otp || new Date() > new Date(password_reset_expires)) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        const hashedPassword = await bcrypt.hash(new_password, 10);
        await pool.query(
            'UPDATE users SET password = $1, password_reset_otp = NULL, password_reset_expires = NULL WHERE id = $2',
            [hashedPassword, req.user.id]
        );

        res.json({ message: 'Password changed successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;