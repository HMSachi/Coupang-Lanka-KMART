const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const sqlFile = path.join(__dirname, 'create_orders_table.sql');
const sql = fs.readFileSync(sqlFile, 'utf8');

console.log('Running migration: create_orders_table.sql...');

pool.query(sql)
    .then(() => {
        console.log('Successfully created orders and order_items tables.');
        process.exit(0);
    })
    .catch((err) => {
        console.error('Error running migration:', err);
        process.exit(1);
    });
