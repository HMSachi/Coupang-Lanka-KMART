const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!process.env.JWT_SECRET) {
        console.error('CRITICAL: JWT_SECRET is NOT loaded in authMiddleware!');
    }

    if (token == null) return res.status(401).json({ message: 'Unauthorized' });

    jwt.verify(token, process.env.JWT_SECRET || 'secret123', (err, user) => {
        if (err) {
            console.error('JWT Verification Error:', err.message);
            return res.status(403).json({ message: 'Forbidden: Invalid Token' });
        }
        req.user = user;
        next();
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
