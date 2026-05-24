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
        instructions, items, status
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
                instructions, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING id
        `, [
            order_id,
            customer_name || 'POS Customer',
            customer_email || '',
            customer_phone || '',
            address || '',
            city || '',
            postal_code || '',
            shipping_method || 'In-Store',
            delivery_date || new Date(),
            payment_method || 'Hold',
            subtotal || 0,
            shipping_cost || 0,
            total_amount || 0,
            instructions || '',
            status || 'pending'
        ]);

        const dbOrderId = orderRes.rows[0].id;

        // Insert items
        for (const item of items) {
            await client.query(`
                INSERT INTO order_items (
                    order_id, product_id, product_name, quantity, price, image_url
                ) VALUES ($1, $2, $3, $4, $5, $6)
            `, [
                dbOrderId, item.id || null, item.name, item.qty || item.quantity,
                item.price || item.base_price || 0, item.image_url || (item.image_urls?.[0]) || null
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

exports.updateOrder = async (req, res) => {
    const { id } = req.params;
    const {
        customer_name, customer_email, customer_phone,
        address, city, postal_code, shipping_method, delivery_date,
        payment_method, subtotal, shipping_cost, total_amount,
        instructions, items, status
    } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Update order main details
        await client.query(`
            UPDATE orders SET 
                customer_name = COALESCE($1, customer_name),
                customer_email = COALESCE($2, customer_email),
                customer_phone = COALESCE($3, customer_phone),
                address = COALESCE($4, address),
                city = COALESCE($5, city),
                postal_code = COALESCE($6, postal_code),
                shipping_method = COALESCE($7, shipping_method),
                delivery_date = COALESCE($8, delivery_date),
                payment_method = COALESCE($9, payment_method),
                subtotal = COALESCE($10, subtotal),
                shipping_cost = COALESCE($11, shipping_cost),
                total_amount = COALESCE($12, total_amount),
                instructions = COALESCE($13, instructions),
                status = COALESCE($14, status)
            WHERE id = $15
        `, [
            customer_name || null, customer_email || null, customer_phone || null,
            address || null, city || null, postal_code || null, shipping_method || null,
            delivery_date || null, payment_method || null, subtotal || null,
            shipping_cost || null, total_amount || null, instructions || null,
            status || null, id
        ]);

        // If items are provided, replace them
        if (items && items.length > 0) {
            // Delete old items
            await client.query('DELETE FROM order_items WHERE order_id = $1', [id]);

            // Insert new items
            for (const item of items) {
                await client.query(`
                    INSERT INTO order_items (
                        order_id, product_id, product_name, quantity, price, image_url
                    ) VALUES ($1, $2, $3, $4, $5, $6)
                `, [
                    id, item.id || null, item.name, item.qty || item.quantity,
                    item.price || item.base_price || 0, item.image_url || (item.image_urls?.[0]) || null
                ]);
            }
        }

        await client.query('COMMIT');
        res.json({ message: 'Order updated successfully' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error updating order:', err);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
};

exports.getHoldOrders = async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM orders WHERE status = 'hold' ORDER BY created_at DESC");

        // Fetch items for each order
        const ordersWithItems = await Promise.all(result.rows.map(async (order) => {
            const itemsRes = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
            return { ...order, items: itemsRes.rows };
        }));

        res.json(ordersWithItems);
    } catch (err) {
        res.status(500).json({ error: err.message });
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
    const { status, cashier_name } = req.body;

    let updateField = '';
    const upperStatus = (status || '').toUpperCase();

    if (upperStatus === 'PROCESSING') updateField = 'approved_by';
    else if (upperStatus === 'READY TO DELIVERY') updateField = 'processed_by';
    else if (upperStatus === 'ON DELIVERY') updateField = 'shipped_by';
    else if (upperStatus === 'DELIVERED') updateField = 'delivered_by';
    else if (upperStatus === 'CASH RECEIVED') updateField = 'cash_received_by';

    try {
        let query = 'UPDATE orders SET status = $1';
        let params = [status, id];

        if (updateField && cashier_name) {
            query += `, ${updateField} = $3`;
            params.push(cashier_name);
        }

        query += ' WHERE id = $2 RETURNING *';

        const result = await pool.query(query, params);
        const order = result.rows[0];

        // If status changed to CASH_RECEIVED, create a pending cash transaction
        if (upperStatus === 'CASH RECEIVED') {
            const batchNum = `BATCH-${order.order_id}-${Date.now().toString().slice(-4)}`;
            await pool.query(`
                INSERT INTO cash_transactions (
                    order_id, type, amount, reason, batch_number, cashier_name, is_pending
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
                order.order_id, 'IN', order.total_amount,
                `COD Collection for Order #${order.order_id}`,
                batchNum, cashier_name, true
            ]);

            // Return the batch number so frontend can show it
            order.batch_number = batchNum;
        }

        res.json(order);
    } catch (err) {
        console.error('Error updating status with audit:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.getCashTransactions = async (req, res) => {
    try {
        const { pending } = req.query;
        let query = 'SELECT * FROM cash_transactions';
        let params = [];

        if (pending === 'true') {
            query += ' WHERE is_pending = true';
        }

        query += ' ORDER BY created_at DESC';
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.settleCashTransaction = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query(
            'UPDATE cash_transactions SET is_pending = false, settled_at = CURRENT_TIMESTAMP WHERE id = $1',
            [id]
        );
        res.json({ message: 'Transaction settled successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getSessionOrderReport = async (req, res) => {
    const { cashier_name, start_time } = req.query;
    try {
        const result = await pool.query(`
            SELECT * FROM orders 
            WHERE (cashier_name = $1 OR approved_by = $1 OR processed_by = $1 OR shipped_by = $1 OR delivered_by = $1 OR cash_received_by = $1)
            AND created_at >= $2
            ORDER BY created_at DESC
        `, [cashier_name, start_time]);

        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
