const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function markExchangeBatchUsedForOrder(client, batchNumber, exchangeOrderId) {
    if (!batchNumber) return;

    const result = await client.query(
        `UPDATE return_exchange_batches
         SET status = 'used',
             used_at = COALESCE(used_at, CURRENT_TIMESTAMP),
             exchange_order_id = COALESCE($2, exchange_order_id),
             updated_at = CURRENT_TIMESTAMP
         WHERE batch_number = $1
         RETURNING id`,
        [batchNumber, exchangeOrderId || null]
    );

    if (result.rows.length === 0) {
        throw new Error('Exchange batch not found or not available');
    }
}

exports.createOrder = async (req, res) => {
    const {
        order_id, customer_name, customer_email, customer_phone,
        address, city, postal_code, shipping_method, delivery_date,
        payment_method, subtotal, shipping_cost, total_amount,
        instructions, items, status, cashier_name, register_id,
        session_id, session_start_time, completed_at, payment_details,
        discount_amount, vat_amount, service_charge, change_due, branch_id,
        exchange_batch_number
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
                instructions, status, cashier_name, register_id, session_id,
                session_start_time, completed_at, payment_details, discount_amount,
                vat_amount, service_charge, change_due, branch_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
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
            status || 'pending',
            cashier_name || null,
            register_id || null,
            session_id || null,
            session_start_time || null,
            completed_at || null,
            payment_details ? JSON.stringify(payment_details) : null,
            discount_amount || 0,
            vat_amount || 0,
            service_charge || 0,
            change_due || 0,
            branch_id || null
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

        await markExchangeBatchUsedForOrder(client, exchange_batch_number, order_id);

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
        order_id,
        customer_name, customer_email, customer_phone,
        address, city, postal_code, shipping_method, delivery_date,
        payment_method, subtotal, shipping_cost, total_amount,
        instructions, items, status, cashier_name, register_id,
        session_id, session_start_time, completed_at, payment_details,
        discount_amount, vat_amount, service_charge, change_due, branch_id,
        exchange_batch_number
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
                status = COALESCE($14, status),
                cashier_name = COALESCE($15, cashier_name),
                register_id = COALESCE($16, register_id),
                session_id = COALESCE($17, session_id),
                session_start_time = COALESCE($18, session_start_time),
                completed_at = COALESCE($19, completed_at),
                payment_details = COALESCE($20, payment_details),
                discount_amount = COALESCE($21, discount_amount),
                vat_amount = COALESCE($22, vat_amount),
                service_charge = COALESCE($23, service_charge),
                change_due = COALESCE($24, change_due),
                branch_id = COALESCE($25, branch_id),
                order_id = COALESCE($26, order_id)
            WHERE id = $27
        `, [
            customer_name || null, customer_email || null, customer_phone || null,
            address || null, city || null, postal_code || null, shipping_method || null,
            delivery_date || null, payment_method || null, subtotal || null,
            shipping_cost || null, total_amount || null, instructions || null,
            status || null, cashier_name || null, register_id || null, session_id || null,
            session_start_time || null, completed_at || null,
            payment_details ? JSON.stringify(payment_details) : null,
            discount_amount ?? null, vat_amount ?? null, service_charge ?? null,
            change_due ?? null, branch_id || null, order_id || null, id
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

        await markExchangeBatchUsedForOrder(client, exchange_batch_number, order_id);

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

exports.getCompletedSessionOrders = async (req, res) => {
    const { session_id, cashier_name, start_time } = req.query;

    try {
        if (!session_id && !(cashier_name && start_time)) {
            return res.json([]);
        }

        const params = [];
        let where = "status = 'completed'";

        if (session_id) {
            params.push(session_id);
            where += ` AND session_id = $${params.length}`;
        } else if (cashier_name && start_time) {
            params.push(cashier_name);
            where += ` AND cashier_name = $${params.length}`;
            params.push(start_time);
            where += ` AND created_at >= $${params.length}`;
        }

        const result = await pool.query(`
            SELECT * FROM orders
            WHERE ${where}
            ORDER BY COALESCE(completed_at, created_at) DESC
        `, params);

        const ordersWithItems = await Promise.all(result.rows.map(async (order) => {
            const itemsRes = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
            return { ...order, items: itemsRes.rows };
        }));

        res.json(ordersWithItems);
    } catch (err) {
        console.error('Error fetching completed session orders:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.getOrders = async (req, res) => {
    try {
        const { source } = req.query;
        let query = 'SELECT * FROM orders';

        if (source === 'online') {
            query += `
                WHERE cashier_name IS NULL
                AND session_id IS NULL
                AND register_id IS NULL
                AND COALESCE(shipping_method, '') <> 'In-Store'
                AND order_id NOT LIKE 'HOLD-%'
                AND order_id NOT LIKE 'INV-%'
            `;
        }

        query += ' ORDER BY created_at DESC';
        const result = await pool.query(query);
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
    let timestampField = '';
    const upperStatus = (status || '').toUpperCase();

    if (upperStatus === 'PROCESSING') {
        updateField = 'approved_by';
        timestampField = 'approved_at';
    } else if (upperStatus === 'READY TO DELIVERY') {
        updateField = 'processed_by';
        timestampField = 'processed_at';
    } else if (upperStatus === 'ON DELIVERY') {
        updateField = 'shipped_by';
        timestampField = 'shipped_at';
    } else if (upperStatus === 'DELIVERED') {
        updateField = 'delivered_by';
        timestampField = 'delivered_at';
    } else if (upperStatus === 'CASH RECEIVED') {
        updateField = 'cash_received_by';
        timestampField = 'cash_received_at';
    }

    try {
        let query = 'UPDATE orders SET status = $1';
        let params = [status, id];

        if (updateField && cashier_name) {
            query += `, ${updateField} = $3`;
            params.push(cashier_name);
        }

        if (timestampField) {
            query += `, ${timestampField} = CURRENT_TIMESTAMP`;
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
    const { cashier_name, start_time, end_time, session_id } = req.query;
    try {
        if (!cashier_name || !start_time || !end_time) {
            return res.status(400).json({ error: 'cashier_name, start_time and end_time are required' });
        }

        const params = [cashier_name, start_time, end_time];

        if (session_id) {
            params.push(session_id);
        }

        const result = await pool.query(`
            SELECT * FROM orders 
            WHERE (
                ${session_id ? `session_id = $4 OR` : ''}
                (
                    cashier_name = $1
                    AND COALESCE(session_start_time, created_at) >= $2
                    AND COALESCE(completed_at, created_at) <= $3
                )
            )
            AND (
                session_id IS NOT NULL
                OR register_id IS NOT NULL
                OR cashier_name IS NOT NULL
                OR COALESCE(shipping_method, '') = 'In-Store'
                OR order_id LIKE 'HOLD-%'
                OR order_id LIKE 'INV-%'
            )
            ORDER BY COALESCE(completed_at, created_at) DESC
        `, params);

        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getOnlineSessionOrderReport = async (req, res) => {
    const { cashier_name, start_time, end_time } = req.query;

    try {
        if (!cashier_name || !start_time || !end_time) {
            return res.status(400).json({ error: 'cashier_name, start_time and end_time are required' });
        }

        const result = await pool.query(`
            SELECT *,
                ARRAY_REMOVE(ARRAY[
                    CASE WHEN approved_by = $1 AND approved_at BETWEEN $2 AND $3 THEN 'Approved' END,
                    CASE WHEN processed_by = $1 AND processed_at BETWEEN $2 AND $3 THEN 'Processed' END,
                    CASE WHEN shipped_by = $1 AND shipped_at BETWEEN $2 AND $3 THEN 'Handover' END,
                    CASE WHEN delivered_by = $1 AND delivered_at BETWEEN $2 AND $3 THEN 'Delivered' END,
                    CASE WHEN cash_received_by = $1 AND cash_received_at BETWEEN $2 AND $3 THEN 'Cash Received' END
                ], NULL) AS session_actions
            FROM orders
            WHERE cashier_name IS NULL
            AND session_id IS NULL
            AND register_id IS NULL
            AND COALESCE(shipping_method, '') <> 'In-Store'
            AND order_id NOT LIKE 'HOLD-%'
            AND order_id NOT LIKE 'INV-%'
            AND (
                (approved_by = $1 AND approved_at BETWEEN $2 AND $3)
                OR (processed_by = $1 AND processed_at BETWEEN $2 AND $3)
                OR (shipped_by = $1 AND shipped_at BETWEEN $2 AND $3)
                OR (delivered_by = $1 AND delivered_at BETWEEN $2 AND $3)
                OR (cash_received_by = $1 AND cash_received_at BETWEEN $2 AND $3)
            )
            ORDER BY GREATEST(
                COALESCE(approved_at, 'epoch'::timestamp),
                COALESCE(processed_at, 'epoch'::timestamp),
                COALESCE(shipped_at, 'epoch'::timestamp),
                COALESCE(delivered_at, 'epoch'::timestamp),
                COALESCE(cash_received_at, 'epoch'::timestamp)
            ) DESC
        `, [cashier_name, start_time, end_time]);

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching online session order report:', err);
        res.status(500).json({ error: err.message });
    }
};
