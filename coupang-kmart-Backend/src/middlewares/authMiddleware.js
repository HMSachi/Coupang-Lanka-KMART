const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

exports.authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!process.env.JWT_SECRET) {
        console.error('CRITICAL: JWT_SECRET is NOT loaded in authMiddleware!');
    }

    if (token == null) return res.status(401).json({ message: 'Unauthorized' });

    jwt.verify(token, process.env.JWT_SECRET || 'secret123', async (err, user) => {
        if (err) {
            console.error('JWT Verification Error:', err.message);
            return res.status(403).json({ message: 'Forbidden: Invalid Token' });
        }

        try {
            const result = await db.query(
                `SELECT u.id, u.name, u.email, u.role, u.branch_id, b.name AS branch_name
                 FROM users u
                 LEFT JOIN branches b ON u.branch_id = b.id
                 WHERE u.id = $1`,
                [user.id]
            );

            req.user = result.rows[0] || user;
            next();
        } catch (dbErr) {
            console.error('Auth user refresh error:', dbErr.message);
            req.user = user;
            next();
        }
    });
};

exports.isAdmin = (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const role = req.user.role ? req.user.role.toLowerCase() : '';
    // Allow superadmin, admin, and subadmin
    if (role === 'admin' || role === 'superadmin' || role === 'subadmin') {
        next();
    } else {
        console.warn(`Access denied for role: ${req.user.role} on admin route`);
        res.status(403).json({ message: 'Admin access required' });
    }
};

exports.isStaff = (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const role = req.user.role ? req.user.role.toLowerCase() : '';
    const validRoles = ['admin', 'subadmin', 'cashier', 'superadmin'];

    if (validRoles.includes(role)) {
        next();
    } else {
        console.warn(`Access denied for role: ${req.user.role} on staff route`);
        res.status(403).json({ message: 'Staff access required' });
    }
};
