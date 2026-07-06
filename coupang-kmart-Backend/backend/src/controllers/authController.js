const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

const getAdminEmails = () => {
    const emails = process.env.ADMIN_EMAILS || '';
    return emails.split(',').map(e => e.trim().toLowerCase());
};

exports.signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if user already exists
        const existingUser = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const adminEmails = getAdminEmails();
        const role = adminEmails.includes(email.toLowerCase()) ? 'admin' : 'user';

        const result = await db.query(
            'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
            [name, email, hashedPassword, role]
        );

        const user = result.rows[0];
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'secret123', { expiresIn: '7d' });

        res.status(201).json({ message: 'User created successfully', user, token });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const result = await db.query('SELECT u.*, b.name as branch_name FROM users u LEFT JOIN branches b ON u.branch_id = b.id WHERE u.email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check again if role needs to be updated based on .env
        let role = user.role;
        const adminEmails = getAdminEmails();
        if (adminEmails.includes(user.email.toLowerCase()) && role !== 'admin') {
            await db.query('UPDATE users SET role = $1 WHERE id = $2', ['admin', user.id]);
            role = 'admin';
            user.role = role;
        }

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role, branch_name: user.branch_name, branch_id: user.branch_id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '7d' });

        res.status(200).json({ message: 'Logged in successfully', user: { id: user.id, name: user.name, email: user.email, role: user.role, branch_name: user.branch_name, branch_id: user.branch_id }, token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getMe = async (req, res) => {
    try {
        const result = await db.query('SELECT u.id, u.name, u.email, u.role, u.branch_id, b.name as branch_name FROM users u LEFT JOIN branches b ON u.branch_id = b.id WHERE u.id = $1', [req.user.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ user: result.rows[0] });
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
