const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const sql = `
ALTER TABLE products ADD COLUMN IF NOT EXISTS global_stock_quantity INTEGER DEFAULT 0;
`;

pool.query(sql)
    .then(() => {
        console.log('product_inventory successfully updated to support branch_id');
        process.exit(0);
    })
    .catch((err) => {
        console.error('Error updating:', err);
        process.exit(1);
    });
