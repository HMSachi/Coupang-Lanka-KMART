const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const sql = `
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS buying_price DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS discount_value DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS discount_type VARCHAR(20) DEFAULT 'percentage',
ADD COLUMN IF NOT EXISTS tax_percentage DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS unit_type VARCHAR(20) DEFAULT 'Piece',
ADD COLUMN IF NOT EXISTS expiry_date DATE;
`;

pool.query(sql)
    .then(() => {
        console.log('Products table schema expanded successfully');
        process.exit(0);
    })
    .catch((err) => {
        console.error('Error migrating products schema:', err);
        process.exit(1);
    });
