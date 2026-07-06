const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function addProduct3DModelColumns() {
    try {
        await pool.query(`
            ALTER TABLE products
            ADD COLUMN IF NOT EXISTS model_3d_url TEXT,
            ADD COLUMN IF NOT EXISTS model_3d_status VARCHAR(30) DEFAULT 'none'
        `);

        console.log('Product 3D model columns are ready.');
    } catch (err) {
        console.error('Failed to add product 3D model columns:', err);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

addProduct3DModelColumns();
