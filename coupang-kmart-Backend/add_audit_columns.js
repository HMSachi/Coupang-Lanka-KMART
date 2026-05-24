const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function addAuditColumns() {
    try {
        console.log('Adding audit columns to orders table...');
        await pool.query(`
            ALTER TABLE orders 
            ADD COLUMN IF NOT EXISTS approved_by VARCHAR(255),
            ADD COLUMN IF NOT EXISTS processed_by VARCHAR(255),
            ADD COLUMN IF NOT EXISTS shipped_by VARCHAR(255),
            ADD COLUMN IF NOT EXISTS delivered_by VARCHAR(255);
        `);
        console.log('Columns added successfully.');
    } catch (err) {
        console.error('Error adding columns:', err);
    } finally {
        await pool.end();
    }
}

addAuditColumns();
