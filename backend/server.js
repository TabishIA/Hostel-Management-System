const express = require('express');
const pool = require('./config/db');
const userRoutes = require('./routes/users');
const complaintRoutes = require('./routes/complaints');
const leaveRoutes = require('./routes/leaves');
const roomRoutes = require('./routes/rooms');

const app = express();
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/rooms', roomRoutes); 

app.get('/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ time: result.rows[0].now });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(5000, () => {
    console.log('Server running on port 5000');
});