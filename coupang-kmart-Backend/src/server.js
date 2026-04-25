require('dotenv').config();
const app = require('./app');
const db = require('./config/db');

const PORT = process.env.PORT || 5000;

// Test the database connection when the server starts
db.pool.connect((err, client, release) => {
    if (err) {
        console.error('Database Connection Error:', err.stack);
    } else {
        console.log('Successfully connected to Supabase PostgreSQL Database!');
        release();
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
