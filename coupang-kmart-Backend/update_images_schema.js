const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const sql = `
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';
`;

pool.query(sql)
    .then(() => {
        console.log('Products table updated with image_urls array');
        process.exit(0);
    })
    .catch((err) => {
        console.error('Error migrating image_urls:', err);
        process.exit(1);
    });
