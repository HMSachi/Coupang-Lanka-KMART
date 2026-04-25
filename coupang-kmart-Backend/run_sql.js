const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const sqlFile = path.join(__dirname, 'db_scripts.sql');
const sql = fs.readFileSync(sqlFile, 'utf8');

pool.query(sql)
    .then(() => {
        console.log('Database schema successfully updated based on db_scripts.sql');
        process.exit(0);
    })
    .catch((err) => {
        console.error('Error updating database schema:', err);
        process.exit(1);
    });
