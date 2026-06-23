const db = require('../config/db');

// Create Daraz Order
exports.createOrder = async (req, res) => {
    const {
        daraz_order_id,
        customer_name,
        customer_phone,
        total_amount,
        status,
        payment_status,
        tracking_number,
        remarks,
        branch_id,
        order_date,
        delivery_address,
        product_name,
        quantity,
        unit_price,
        delivery_fee,
        discount,
        payment_method,
        items
    } = req.body;

    const cashier_name = req.user ? req.user.name : 'Unknown Cashier';

    try {
        const checkRes = await db.query('SELECT id FROM daraz_orders WHERE daraz_order_id = $1', [daraz_order_id]);
        if (checkRes.rows.length > 0) {
            return res.status(400).json({ error: 'Daraz Order ID already exists' });
        }

        // Backend total amount calculation or validation
        const qty = parseInt(quantity) || 1;
        const price = parseFloat(unit_price) || 0.00;
        const fee = parseFloat(delivery_fee) || 0.00;
        const disc = parseFloat(discount) || 0.00;
        const calculatedAmount = (qty * price) + fee - disc;
        const finalTotalAmount = total_amount !== undefined ? parseFloat(total_amount) : calculatedAmount;
        const itemsStr = items ? (typeof items === 'string' ? items : JSON.stringify(items)) : null;

        const result = await db.query(`
            INSERT INTO daraz_orders (
                daraz_order_id, customer_name, customer_phone, total_amount,
                status, payment_status, tracking_number, remarks, cashier_name, branch_id,
                order_date, delivery_address, product_name, quantity, unit_price,
                delivery_fee, discount, payment_method, items
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
            RETURNING *
        `, [
            daraz_order_id,
            customer_name || '',
            customer_phone || '',
            finalTotalAmount,
            status || 'New',
            payment_status || 'pending',
            tracking_number || '',
            remarks || '',
            cashier_name,
            branch_id || req.user?.branch_id || null,
            order_date || new Date().toISOString().slice(0, 10),
            delivery_address || '',
            product_name || '',
            qty,
            price,
            fee,
            disc,
            payment_method || 'Cash on Delivery',
            itemsStr
        ]);

        const order = result.rows[0];

        // If payment is marked as received during creation, log in cash transactions
        if (payment_status === 'received') {
            const batchNum = `DARAZ-${daraz_order_id}-${Date.now().toString().slice(-4)}`;
            await db.query(`
                INSERT INTO cash_transactions (
                    order_id, type, amount, reason, batch_number, cashier_name, branch_id, is_pending, settled_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, false, CURRENT_TIMESTAMP)
            `, [
                daraz_order_id,
                'IN',
                finalTotalAmount,
                `Daraz Settlement for Order #${daraz_order_id}`,
                batchNum,
                cashier_name,
                order.branch_id
            ]);
        }

        res.status(201).json(order);
    } catch (err) {
        console.error('Error creating Daraz order:', err);
        res.status(500).json({ error: err.message });
    }
};

// Get All Daraz Orders
exports.getOrders = async (req, res) => {
    try {
        const { search, status, payment_status } = req.query;
        let query = 'SELECT * FROM daraz_orders WHERE 1=1';
        const params = [];

        if (status && status !== 'ALL') {
            params.push(status.toLowerCase());
            query += ` AND LOWER(status) = $${params.length}`;
        }

        if (payment_status && payment_status !== 'ALL') {
            params.push(payment_status.toLowerCase());
            query += ` AND LOWER(payment_status) = $${params.length}`;
        }

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (daraz_order_id ILIKE $${params.length} OR customer_name ILIKE $${params.length} OR customer_phone ILIKE $${params.length} OR tracking_number ILIKE $${params.length} OR product_name ILIKE $${params.length})`;
        }

        query += ' ORDER BY created_at DESC';

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching Daraz orders:', err);
        res.status(500).json({ error: err.message });
    }
};

// Get Daraz Order Stats
exports.getStats = async (req, res) => {
    try {
        const statsQuery = `
            SELECT 
                COUNT(*)::integer AS total_orders,
                COUNT(CASE WHEN LOWER(status) NOT IN ('delivered', 'cancelled', 'returned') THEN 1 END)::integer AS pending_orders,
                COUNT(CASE WHEN LOWER(status) = 'delivered' THEN 1 END)::integer AS delivered_orders,
                COUNT(CASE WHEN LOWER(status) = 'cancelled' THEN 1 END)::integer AS cancelled_orders,
                COALESCE(SUM(CASE WHEN LOWER(payment_status) = 'pending' AND LOWER(status) NOT IN ('cancelled', 'returned') THEN total_amount ELSE 0 END), 0)::float AS pending_payments,
                COALESCE(SUM(CASE WHEN LOWER(payment_status) = 'received' THEN total_amount ELSE 0 END), 0)::float AS received_payments,
                COALESCE(SUM(CASE WHEN LOWER(status) NOT IN ('cancelled', 'returned') THEN total_amount ELSE 0 END), 0)::float AS total_sales,
                COUNT(CASE WHEN created_at::date = CURRENT_DATE THEN 1 END)::integer AS today_orders,
                COALESCE(SUM(CASE WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE) AND LOWER(status) NOT IN ('cancelled', 'returned') THEN total_amount ELSE 0 END), 0)::float AS this_month_sales
            FROM daraz_orders;
        `;
        const result = await db.query(statsQuery);
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error calculating Daraz stats:', err);
        res.status(500).json({ error: err.message });
    }
};

// Update Daraz Order Details
exports.updateOrder = async (req, res) => {
    const { id } = req.params;
    const {
        customer_name,
        customer_phone,
        total_amount,
        status,
        tracking_number,
        remarks,
        order_date,
        delivery_address,
        product_name,
        quantity,
        unit_price,
        delivery_fee,
        discount,
        payment_method,
        payment_status,
        items
    } = req.body;

    const cashier_name = req.user ? req.user.name : 'Unknown Cashier';

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // Fetch current order to check payment status change
        const orderRes = await client.query('SELECT * FROM daraz_orders WHERE id = $1', [id]);
        if (orderRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Daraz Order not found' });
        }
        const currentOrder = orderRes.rows[0];

        // Recalculate amount if needed, safely handling null values from historical orders
        const qty = quantity !== undefined ? (parseInt(quantity) || 0) : (parseInt(currentOrder.quantity) || 1);
        const price = unit_price !== undefined ? (parseFloat(unit_price) || 0) : (parseFloat(currentOrder.unit_price) || 0.00);
        const fee = delivery_fee !== undefined ? (parseFloat(delivery_fee) || 0) : (parseFloat(currentOrder.delivery_fee) || 0.00);
        const disc = discount !== undefined ? (parseFloat(discount) || 0) : (parseFloat(currentOrder.discount) || 0.00);
        const calculatedAmount = (qty * price) + fee - disc;
        const finalTotalAmount = total_amount !== undefined ? parseFloat(total_amount) : calculatedAmount;
        const itemsStr = items !== undefined ? (items ? (typeof items === 'string' ? items : JSON.stringify(items)) : null) : undefined;

        const result = await client.query(`
            UPDATE daraz_orders SET
                customer_name = COALESCE($1, customer_name),
                customer_phone = COALESCE($2, customer_phone),
                total_amount = $3,
                status = COALESCE($4, status),
                tracking_number = COALESCE($5, tracking_number),
                remarks = COALESCE($6, remarks),
                order_date = COALESCE($7, order_date),
                delivery_address = COALESCE($8, delivery_address),
                product_name = COALESCE($9, product_name),
                quantity = COALESCE($10, quantity),
                unit_price = COALESCE($11, unit_price),
                delivery_fee = COALESCE($12, delivery_fee),
                discount = COALESCE($13, discount),
                payment_method = COALESCE($14, payment_method),
                payment_status = COALESCE($15, payment_status),
                items = COALESCE($16, items),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $17
            RETURNING *
        `, [
            customer_name,
            customer_phone,
            finalTotalAmount,
            status,
            tracking_number,
            remarks,
            order_date,
            delivery_address,
            product_name,
            quantity !== undefined ? parseInt(quantity) : null,
            unit_price !== undefined ? parseFloat(unit_price) : null,
            delivery_fee !== undefined ? parseFloat(delivery_fee) : null,
            discount !== undefined ? parseFloat(discount) : null,
            payment_method,
            payment_status,
            itemsStr,
            id
        ]);

        const updatedOrder = result.rows[0];

        // Handle payment status transitions to 'received'
        const isNowReceived = payment_status === 'received' || (payment_status === undefined && currentOrder.payment_status === 'received');
        const wasReceived = currentOrder.payment_status === 'received';

        if (isNowReceived && !wasReceived) {
            const batchNum = `DARAZ-${updatedOrder.daraz_order_id}-${Date.now().toString().slice(-4)}`;
            await client.query(`
                INSERT INTO cash_transactions (
                    order_id, type, amount, reason, batch_number, cashier_name, branch_id, is_pending, settled_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, false, CURRENT_TIMESTAMP)
            `, [
                updatedOrder.daraz_order_id,
                'IN',
                finalTotalAmount,
                `Daraz Settlement for Order #${updatedOrder.daraz_order_id}`,
                batchNum,
                cashier_name,
                updatedOrder.branch_id
            ]);
        }

        await client.query('COMMIT');
        res.json(updatedOrder);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error updating Daraz order:', err);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
};

// Update Payment Status (and record cash transaction)
exports.updatePaymentStatus = async (req, res) => {
    const { id } = req.params;
    const { payment_status } = req.body;
    const cashier_name = req.user ? req.user.name : 'Unknown Cashier';

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // Get current details
        const orderRes = await client.query('SELECT * FROM daraz_orders WHERE id = $1', [id]);
        if (orderRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Daraz Order not found' });
        }

        const order = orderRes.rows[0];

        // Update payment status
        const updateRes = await client.query(`
            UPDATE daraz_orders
            SET payment_status = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
        `, [payment_status, id]);

        const updatedOrder = updateRes.rows[0];

        // If status changed to received and it was pending, log a cash transaction
        if (payment_status === 'received' && order.payment_status !== 'received') {
            const batchNum = `DARAZ-${order.daraz_order_id}-${Date.now().toString().slice(-4)}`;
            await client.query(`
                INSERT INTO cash_transactions (
                    order_id, type, amount, reason, batch_number, cashier_name, branch_id, is_pending, settled_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, false, CURRENT_TIMESTAMP)
            `, [
                order.daraz_order_id,
                'IN',
                order.total_amount,
                `Daraz Settlement for Order #${order.daraz_order_id}`,
                batchNum,
                cashier_name,
                order.branch_id
            ]);
        }

        await client.query('COMMIT');
        res.json(updatedOrder);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error updating Daraz payment status:', err);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
};

