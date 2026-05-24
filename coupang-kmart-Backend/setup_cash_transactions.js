const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function setupCashTransactions() {
    try {
        console.log('Creating cash_transactions table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS cash_transactions (
                id SERIAL PRIMARY KEY,
                order_id VARCHAR(255),
                type VARCHAR(50) NOT NULL, -- 'IN' or 'OUT'
                amount DECIMAL(12, 2) NOT NULL,
                reason VARCHAR(255),
                batch_number VARCHAR(255),
                cashier_name VARCHAR(255),
                branch_id INTEGER,
                is_pending BOOLEAN DEFAULT false,
                settled_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Table created successfully.');
    } catch (err) {
        console.error('Error creating table:', err);
    } finally {
        await pool.end();
    }
}

setupCashTransactions();
