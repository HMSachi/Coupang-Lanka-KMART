const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function addPosSessionOrderColumns() {
    try {
        console.log('Adding POS session order columns to orders table...');
        await pool.query(`
            ALTER TABLE orders
            ADD COLUMN IF NOT EXISTS cashier_name VARCHAR(255),
            ADD COLUMN IF NOT EXISTS register_id VARCHAR(100),
            ADD COLUMN IF NOT EXISTS session_id VARCHAR(100),
            ADD COLUMN IF NOT EXISTS session_start_time TIMESTAMP,
            ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP,
            ADD COLUMN IF NOT EXISTS payment_details JSONB,
            ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS vat_amount DECIMAL(10, 2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS service_charge DECIMAL(10, 2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS change_due DECIMAL(10, 2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS branch_id INTEGER;
        `);
        console.log('POS session order columns added successfully.');
    } catch (err) {
        console.error('Error adding POS session order columns:', err);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

addPosSessionOrderColumns();
