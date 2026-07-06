const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const sql = `
ALTER TABLE daraz_orders 
ADD COLUMN IF NOT EXISTS order_date DATE,
ADD COLUMN IF NOT EXISTS delivery_address TEXT,
ADD COLUMN IF NOT EXISTS product_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS unit_price DECIMAL(12, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(12, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS discount DECIMAL(12, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'Cash on Delivery';
`;

console.log('Running migration to alter daraz_orders table...');
pool.query(sql)
    .then(() => {
        console.log('daraz_orders table successfully updated with new columns');
        process.exit(0);
    })
    .catch((err) => {
        console.error('Error altering daraz_orders table:', err);
        process.exit(1);
    });
