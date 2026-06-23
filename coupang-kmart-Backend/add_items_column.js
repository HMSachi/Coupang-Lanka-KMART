const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const sql = `
ALTER TABLE daraz_orders 
ADD COLUMN IF NOT EXISTS items TEXT;
`;

console.log('Running migration to add items column to daraz_orders...');
pool.query(sql)
    .then(() => {
        console.log('daraz_orders table successfully updated with items column');
        process.exit(0);
    })
    .catch((err) => {
        console.error('Error adding items column:', err);
        process.exit(1);
    });
