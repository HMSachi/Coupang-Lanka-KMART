const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

exports.createOrder = async (req, res) => {
    const {
        order_id, customer_name, customer_email, customer_phone,
        address, city, postal_code, shipping_method, delivery_date,
        payment_method, subtotal, shipping_cost, total_amount,
        instructions, items
    } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Insert order
        const orderRes = await client.query(`
            INSERT INTO orders (
                order_id, customer_name, customer_email, customer_phone, 
                address, city, postal_code, shipping_method, delivery_date, 
                payment_method, subtotal, shipping_cost, total_amount, 
                instructions
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING id
        `, [
            order_id, customer_name, customer_email, customer_phone,
            address, city, postal_code, shipping_method, delivery_date,
            payment_method, subtotal, shipping_cost, total_amount,
            instructions
        ]);

        const dbOrderId = orderRes.rows[0].id;

        // Insert items
        for (const item of items) {
            await client.query(`
                INSERT INTO order_items (
                    order_id, product_id, product_name, quantity, price, image_url
                ) VALUES ($1, $2, $3, $4, $5, $6)
            `, [
                dbOrderId, item.id || null, item.name, item.quantity,
                item.price || item.base_price || 0, item.image_urls?.[0] || null
            ]);
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'Order created successfully', id: dbOrderId, order_id });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error creating order:', err);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
};

exports.getOrders = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getOrderById = async (req, res) => {
    const { id } = req.params;
    try {
        const orderRes = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
        if (orderRes.rows.length === 0) return res.status(404).json({ error: 'Order not found' });

        const itemsRes = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [id]);

        res.json({
            ...orderRes.rows[0],
            items: itemsRes.rows
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateOrderStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        const result = await pool.query(
            'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
