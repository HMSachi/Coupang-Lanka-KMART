const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function addReturnManagementTables() {
    try {
        console.log('Creating return management tables...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS return_reasons (
                id SERIAL PRIMARY KEY,
                reason VARCHAR(255) NOT NULL UNIQUE,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS return_policy_settings (
                id INTEGER PRIMARY KEY DEFAULT 1,
                return_allowed_days INTEGER NOT NULL DEFAULT 7,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT one_return_policy_row CHECK (id = 1)
            );

            INSERT INTO return_policy_settings (id, return_allowed_days)
            VALUES (1, 7)
            ON CONFLICT (id) DO NOTHING;

            CREATE TABLE IF NOT EXISTS non_returnable_products (
                id SERIAL PRIMARY KEY,
                product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(product_id)
            );

            CREATE TABLE IF NOT EXISTS return_records (
                id SERIAL PRIMARY KEY,
                order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
                order_ref VARCHAR(100),
                product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
                product_name VARCHAR(255) NOT NULL,
                reason_id INTEGER REFERENCES return_reasons(id) ON DELETE SET NULL,
                reason_text VARCHAR(255),
                refund_amount DECIMAL(10, 2) DEFAULT 0,
                cashier_name VARCHAR(255),
                branch_id INTEGER,
                status VARCHAR(50) DEFAULT 'completed',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Return management tables are ready.');
    } catch (err) {
        console.error('Error creating return management tables:', err);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

addReturnManagementTables();
