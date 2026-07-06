const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const branchRoutes = require('./routes/branchRoutes');
const reportRoutes = require('./routes/reportRoutes');
const orderRoutes = require('./routes/orderRoutes');
const returnRoutes = require('./routes/returnRoutes');
const darazRoutes = require('./routes/darazRoutes');

const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/daraz', darazRoutes);

app.get('/api/debug-db', async (req, res) => {
    const { Pool } = require('pg');
    try {
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });
        const result = await pool.query('SELECT NOW()');
        await pool.end();
        res.json({
            success: true,
            time: result.rows[0].now,
            envExists: !!process.env.DATABASE_URL
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message || 'No message property on error',
            errorName: err.name,
            errorString: err.toString(),
            stack: err.stack,
            envExists: !!process.env.DATABASE_URL,
            envLength: process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0
        });
    }
});

app.get('/', (req, res) => {
    res.send('API is running');
});

module.exports = app;
