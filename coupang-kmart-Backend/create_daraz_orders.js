const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const sql = `
CREATE TABLE IF NOT EXISTS daraz_orders (
    id SERIAL PRIMARY KEY,
    daraz_order_id VARCHAR(255) UNIQUE NOT NULL,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(255),
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'delivered', 'cancelled'
    payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'received'
    tracking_number VARCHAR(255),
    remarks TEXT,
    cashier_name VARCHAR(255),
    branch_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

console.log('Running migration to create daraz_orders table...');
pool.query(sql)
    .then(() => {
        console.log('daraz_orders table successfully created');
        process.exit(0);
    })
    .catch((err) => {
        console.error('Error creating daraz_orders table:', err);
        process.exit(1);
    });
