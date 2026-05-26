const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function addReturnWorkflowColumns() {
    try {
        console.log('Adding return workflow columns...');
        await pool.query(`
            ALTER TABLE return_records
                ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1,
                ADD COLUMN IF NOT EXISTS return_method VARCHAR(50),
                ADD COLUMN IF NOT EXISTS custom_note TEXT,
                ADD COLUMN IF NOT EXISTS condition_confirmed BOOLEAN NOT NULL DEFAULT false,
                ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10, 2) DEFAULT 0;
        `);
        console.log('Return workflow columns are ready.');
    } catch (err) {
        console.error('Error adding return workflow columns:', err);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

addReturnWorkflowColumns();
