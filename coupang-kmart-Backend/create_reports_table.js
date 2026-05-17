const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const sql = `
CREATE TABLE IF NOT EXISTS cashier_reports (
    id SERIAL PRIMARY KEY,
    cashier_name VARCHAR(255),
    branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
    report_data JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'SENT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

pool.query(sql)
    .then(() => {
        console.log('cashier_reports table created successfully');
        process.exit(0);
    })
    .catch((err) => {
        console.error('Error creating table:', err);
        process.exit(1);
    });
