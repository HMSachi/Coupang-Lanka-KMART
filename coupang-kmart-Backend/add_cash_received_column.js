const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function addCashReceivedColumn() {
    try {
        console.log('Adding cash_received_by column to orders table...');
        await pool.query(`
            ALTER TABLE orders 
            ADD COLUMN IF NOT EXISTS cash_received_by VARCHAR(255);
        `);
        console.log('Column added successfully.');
    } catch (err) {
        console.error('Error adding column:', err);
    } finally {
        await pool.end();
    }
}

addCashReceivedColumn();
