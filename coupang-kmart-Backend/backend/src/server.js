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
        
        // Ensure inventory_history table exists and is backfilled
        client.query(`
            CREATE TABLE IF NOT EXISTS inventory_history (
                id SERIAL PRIMARY KEY,
                product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
                branch_id INTEGER REFERENCES branches(id) ON DELETE CASCADE,
                quantity INTEGER NOT NULL,
                action_type VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `, (createTableErr) => {
            if (createTableErr) {
                console.error("Error creating inventory_history table:", createTableErr);
            } else {
                console.log("Verified inventory_history table exists.");
                // Backfill existing branch inventories if history is empty
                client.query(`
                    INSERT INTO inventory_history (product_id, branch_id, quantity, action_type, created_at)
                    SELECT product_id, branch_id, stock_quantity, 'INITIAL_LINK', updated_at
                    FROM product_inventory pi
                    WHERE pi.stock_quantity > 0 
                      AND NOT EXISTS (
                          SELECT 1 FROM inventory_history ih 
                          WHERE ih.product_id = pi.product_id AND ih.branch_id = pi.branch_id
                      );
                `, (backfillErr, backfillRes) => {
                    if (backfillErr) {
                        console.error("Error backfilling inventory_history:", backfillErr);
                    } else if (backfillRes && backfillRes.rowCount > 0) {
                        console.log(`Backfilled ${backfillRes.rowCount} inventory logs.`);
                    }
                });
            }
        });

        release();
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
