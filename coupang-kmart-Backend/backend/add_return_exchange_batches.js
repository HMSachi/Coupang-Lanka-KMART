const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function addReturnExchangeBatches() {
    try {
        console.log('Creating return exchange batch table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS return_exchange_batches (
                id SERIAL PRIMARY KEY,
                batch_number VARCHAR(100) NOT NULL UNIQUE,
                return_ref VARCHAR(100) NOT NULL UNIQUE,
                order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
                order_ref VARCHAR(100),
                customer JSONB DEFAULT '{}'::jsonb,
                cashier_name VARCHAR(255),
                branch_id INTEGER,
                amount DECIMAL(10, 2) DEFAULT 0,
                status VARCHAR(30) NOT NULL DEFAULT 'pending',
                items JSONB NOT NULL DEFAULT '[]'::jsonb,
                return_report JSONB DEFAULT '{}'::jsonb,
                exchange_order_id VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                used_at TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_return_exchange_batches_status
                ON return_exchange_batches(status);

            CREATE INDEX IF NOT EXISTS idx_return_exchange_batches_return_ref
                ON return_exchange_batches(return_ref);
        `);
        console.log('Return exchange batch table is ready.');
    } catch (err) {
        console.error('Error creating return exchange batch table:', err);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

addReturnExchangeBatches();
