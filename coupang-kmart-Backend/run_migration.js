const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const sql = `
ALTER TABLE product_inventory ADD COLUMN IF NOT EXISTS branch_id INTEGER REFERENCES branches(id) ON DELETE CASCADE;
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
