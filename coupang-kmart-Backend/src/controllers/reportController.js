const pool = require('../config/db');

exports.submitReport = async (req, res) => {
    try {
        const { cashier_name, branch_id, report_data } = req.body;

        let branchIdToUse = branch_id;
        if (!branchIdToUse || isNaN(branchIdToUse)) {
            branchIdToUse = null; // fallback for tests
        }

        const result = await pool.query(
            `INSERT INTO cashier_reports (cashier_name, branch_id, report_data, status) 
             VALUES ($1, $2, $3, 'SENT_TO_SUBADMIN') RETURNING *`,
            [cashier_name, branchIdToUse, report_data]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

exports.getReports = async (req, res) => {
    try {
        const { status } = req.query;
        let query = 'SELECT * FROM cashier_reports';
        const params = [];
        if (status) {
            query += ' WHERE status = $1';
            params.push(status);
        }
        query += ' ORDER BY created_at DESC';

        const result = await pool.query(query, params);
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateReportStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const result = await pool.query(
            `UPDATE cashier_reports SET status = $1 WHERE id = $2 RETURNING *`,
            [status, id]
        );

        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
