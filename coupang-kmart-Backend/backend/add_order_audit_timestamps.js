const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function addOrderAuditTimestamps() {
    try {
        console.log('Adding order audit timestamp columns...');
        await pool.query(`
            ALTER TABLE orders
            ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
            ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP,
            ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP,
            ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP,
            ADD COLUMN IF NOT EXISTS cash_received_at TIMESTAMP;
        `);
        console.log('Order audit timestamp columns added successfully.');
    } catch (err) {
        console.error('Error adding order audit timestamp columns:', err);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

addOrderAuditTimestamps();
