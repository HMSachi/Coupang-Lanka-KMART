const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function addReturnReportBatchColumns() {
    try {
        console.log('Adding return report and cash batch columns...');
        await pool.query(`
            ALTER TABLE return_records
                ADD COLUMN IF NOT EXISTS return_ref VARCHAR(100),
                ADD COLUMN IF NOT EXISTS cash_batch_number VARCHAR(100),
                ADD COLUMN IF NOT EXISTS cash_batch_created_at TIMESTAMP;

            CREATE INDEX IF NOT EXISTS idx_return_records_return_ref
                ON return_records(return_ref);
        `);
        console.log('Return report and cash batch columns are ready.');
    } catch (err) {
        console.error('Error adding return report columns:', err);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

addReturnReportBatchColumns();
