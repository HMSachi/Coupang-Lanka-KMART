const { Pool } = require('pg');
require('dotenv').config();

// Initialize connection pool using Supabase connection string
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Supabase requires SSL connections
    ssl: {
        rejectUnauthorized: false
    }
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

module.exports = {
    // Export a query helper function
    query: (text, params) => pool.query(text, params),
    // Export the raw pool in case it's needed
    pool
};
