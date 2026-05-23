const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

exports.getBranches = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT b.*, u.name as subadmin_name, u.email as subadmin_email 
            FROM branches b
            LEFT JOIN users u ON u.branch_id = b.id AND u.role = 'subadmin'
            ORDER BY b.id ASC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createBranch = async (req, res) => {
    const { name, location } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO branches (name, location) VALUES ($1, $2) RETURNING *',
            [name, location]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createSubAdmin = async (req, res) => {
    const { name, email, password, branch_id } = req.body;
    try {
        // Hash the password securely
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Store into users as subadmin assigning to a specific branch_id
        const result = await pool.query(
            'INSERT INTO users (name, email, password, role, branch_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, branch_id',
            [name, email, hashedPassword, 'subadmin', branch_id]
        );
        res.status(201).json({ message: 'SubAdmin created successfully', user: result.rows[0] });
    } catch (err) {
        // usually 23505 duplicate key error if email matches
        res.status(500).json({ error: err.message });
    }
};

exports.createCashier = async (req, res) => {
    const { name, email, password, branch_id } = req.body;

    // Security check: If requester is subadmin, they can only create for THEIR branch
    // We allow a gentle check here to handle cases where token sync might be in progress
    const requesterBranchId = req.user.branch_id;

    if (req.user.role === 'subadmin') {
        if (!requesterBranchId || parseInt(branch_id) !== parseInt(requesterBranchId)) {
            console.error(`Branch Mismatch: Body=${branch_id}, UserToken=${requesterBranchId}`);
            return res.status(403).json({
                error: 'Security Mismatch: Your session is not currently associated with this branch. Please Log Out and Log In again to sync your branch credentials.'
            });
        }
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const result = await pool.query(
            'INSERT INTO users (name, email, password, role, branch_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, branch_id',
            [name, email, hashedPassword, 'cashier', branch_id]
        );
        res.status(201).json({ message: 'Cashier created successfully', user: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getCashiers = async (req, res) => {
    const { branch_id } = req.params;

    // Security check
    const requesterBranchId = req.user.branch_id;
    if (req.user.role === 'subadmin') {
        if (!requesterBranchId || parseInt(branch_id) !== parseInt(requesterBranchId)) {
            return res.status(403).json({
                error: 'Security Mismatch: Please Log Out and Log In again to sync your branch data.'
            });
        }
    }

    try {
        const result = await pool.query(
            'SELECT id, name, email, branch_id FROM users WHERE role = $1 AND branch_id = $2',
            ['cashier', branch_id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getBranchStats = async (req, res) => {
    try {
        // Add basic statistic aggregation if needed
        res.json({ message: "Metrics logic ready for deployment" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
