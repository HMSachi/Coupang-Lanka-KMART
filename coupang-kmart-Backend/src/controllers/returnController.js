const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

exports.getReturnConfig = async (req, res) => {
    try {
        const [reasonsRes, policyRes, productsRes] = await Promise.all([
            pool.query('SELECT * FROM return_reasons ORDER BY created_at DESC'),
            pool.query('SELECT * FROM return_policy_settings WHERE id = 1'),
            pool.query(`
                SELECT nrp.product_id, p.name, p.base_price, c.name AS category_name
                FROM non_returnable_products nrp
                JOIN products p ON p.id = nrp.product_id
                LEFT JOIN categories c ON c.id = p.category_id
                ORDER BY p.name ASC
            `)
        ]);

        res.json({
            reasons: reasonsRes.rows,
            policy: policyRes.rows[0] || { id: 1, return_allowed_days: 7 },
            non_returnable_products: productsRes.rows
        });
    } catch (err) {
        console.error('Error loading return config:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.saveReturnReason = async (req, res) => {
    const { reason, is_active = true } = req.body;

    if (!reason || !reason.trim()) {
        return res.status(400).json({ error: 'Return reason is required' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO return_reasons (reason, is_active)
             VALUES ($1, $2)
             RETURNING *`,
            [reason.trim(), is_active]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error saving return reason:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.updateReturnReason = async (req, res) => {
    const { id } = req.params;
    const { reason, is_active } = req.body;

    try {
        const result = await pool.query(
            `UPDATE return_reasons
             SET reason = COALESCE($1, reason),
                 is_active = COALESCE($2, is_active),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $3
             RETURNING *`,
            [reason || null, typeof is_active === 'boolean' ? is_active : null, id]
        );

        if (result.rows.length === 0) return res.status(404).json({ error: 'Reason not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating return reason:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.deleteReturnReason = async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query('DELETE FROM return_reasons WHERE id = $1', [id]);
        res.json({ message: 'Return reason deleted' });
    } catch (err) {
        console.error('Error deleting return reason:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.saveReturnPolicy = async (req, res) => {
    const { return_allowed_days, non_returnable_product_ids = [] } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const policyRes = await client.query(
            `INSERT INTO return_policy_settings (id, return_allowed_days)
             VALUES (1, $1)
             ON CONFLICT (id)
             DO UPDATE SET return_allowed_days = EXCLUDED.return_allowed_days,
                           updated_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [parseInt(return_allowed_days, 10) || 0]
        );

        await client.query('DELETE FROM non_returnable_products');
        for (const productId of non_returnable_product_ids) {
            await client.query(
                `INSERT INTO non_returnable_products (product_id)
                 VALUES ($1)
                 ON CONFLICT (product_id) DO NOTHING`,
                [productId]
            );
        }

        await client.query('COMMIT');
        res.json({ policy: policyRes.rows[0], non_returnable_product_ids });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error saving return policy:', err);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
};

exports.createReturn = async (req, res) => {
    const {
        order_id,
        order_ref,
        branch_id,
        items = []
    } = req.body;
    const cashierName = req.body.cashier_name || req.user?.name || req.user?.username || req.user?.email || 'cashier';

    if (!order_id || !order_ref) {
        return res.status(400).json({ error: 'Order reference is required' });
    }

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'At least one return item is required' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        const returnRef = `RTN-${Date.now()}`;

        const productIds = items.map(item => Number(item.product_id)).filter(Boolean);
        let validProductIds = new Set();
        if (productIds.length > 0) {
            const validProductsRes = await client.query(
                'SELECT id FROM products WHERE id = ANY($1::int[])',
                [productIds]
            );
            validProductIds = new Set(validProductsRes.rows.map(row => Number(row.id)));

            const blockedRes = await client.query(
                'SELECT product_id FROM non_returnable_products WHERE product_id = ANY($1::int[])',
                [productIds]
            );
            if (blockedRes.rows.length > 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    error: 'One or more selected items are marked as non-returnable',
                    blocked_product_ids: blockedRes.rows.map(row => row.product_id)
                });
            }
        }

        const priorReturnsRes = await client.query(
            `SELECT id, return_ref, product_id, product_name, quantity
             FROM return_records
             WHERE order_id = $1`,
            [order_id]
        );

        const created = [];
        for (const item of items) {
            const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
            const unitPrice = Number(item.unit_price) || 0;
            const refundAmount = Number(item.refund_amount) || unitPrice * quantity;
            const productId = Number(item.product_id);
            const safeProductId = productId && validProductIds.has(productId) ? productId : null;
            const duplicateReturn = priorReturnsRes.rows.find(returnItem => {
                if (safeProductId && Number(returnItem.product_id) === safeProductId) return true;
                return String(returnItem.product_name || '').trim().toLowerCase() === String(item.product_name || '').trim().toLowerCase();
            });

            if (!item.product_name || !item.reason_id || !item.return_method || !item.condition_confirmed) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Every return item needs product, reason, method, and condition confirmation' });
            }

            if (duplicateReturn) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    error: `${item.product_name} was already returned in ${duplicateReturn.return_ref || `RTN-${duplicateReturn.id}`}`,
                    return_ref: duplicateReturn.return_ref || `RTN-${duplicateReturn.id}`,
                    product_name: item.product_name
                });
            }

            const insertRes = await client.query(
                `INSERT INTO return_records (
                    return_ref, order_id, order_ref, product_id, product_name, reason_id, reason_text,
                    refund_amount, cashier_name, branch_id, status, quantity, return_method,
                    custom_note, condition_confirmed, unit_price
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'completed', $11, $12, $13, $14, $15)
                RETURNING *`,
                [
                    returnRef,
                    order_id,
                    order_ref,
                    safeProductId,
                    item.product_name,
                    item.reason_id,
                    item.reason_text || null,
                    refundAmount,
                    cashierName,
                    branch_id || null,
                    quantity,
                    item.return_method,
                    item.custom_note || null,
                    Boolean(item.condition_confirmed),
                    unitPrice
                ]
            );
            created.push(insertRes.rows[0]);
        }

        await client.query('COMMIT');
        res.status(201).json({
            message: 'Return recorded successfully',
            return_ref: returnRef,
            records: created,
            total_refund_amount: created.reduce((sum, item) => sum + Number(item.refund_amount || 0), 0),
            report: buildReturnReport(created, null)
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error creating return:', err);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
};

exports.getReturnsByOrder = async (req, res) => {
    const { orderId } = req.params;

    try {
        const result = await pool.query(
            `SELECT id, return_ref, order_id, order_ref, product_id, product_name, quantity,
                    refund_amount, reason_text, custom_note, return_method, created_at
             FROM return_records
             WHERE order_id = $1
             ORDER BY created_at DESC, id DESC`,
            [orderId]
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Error loading order return records:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.getReturns = async (req, res) => {
    try {
        const result = await pool.query(`
            WITH grouped_returns AS (
                SELECT
                    COALESCE(return_ref, 'RTN-' || id::text) AS group_ref,
                    *
                FROM return_records
            )
            SELECT
                group_ref AS return_ref,
                MIN(created_at) AS created_at,
                MAX(order_ref) AS order_ref,
                MAX(cashier_name) AS cashier_name,
                MAX(return_method) AS return_method,
                MAX(cash_batch_number) AS cash_batch_number,
                COUNT(*)::int AS item_count,
                COALESCE(SUM(refund_amount), 0)::numeric AS total_refund_amount
            FROM grouped_returns
            GROUP BY group_ref
            ORDER BY MIN(created_at) DESC
            LIMIT 100
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error loading returns:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.getReturnByRef = async (req, res) => {
    const { returnRef } = req.params;
    try {
        const recordsRes = await pool.query(
            `SELECT * FROM return_records
             WHERE return_ref = $1 OR ('RTN-' || id::text) = $1
             ORDER BY id ASC`,
            [returnRef]
        );

        if (recordsRes.rows.length === 0) {
            return res.status(404).json({ error: 'Return report not found' });
        }

        const orderId = recordsRes.rows[0].order_id;
        const orderRes = orderId
            ? await pool.query('SELECT * FROM orders WHERE id = $1', [orderId])
            : { rows: [] };

        res.json(buildReturnReport(recordsRes.rows, orderRes.rows[0] || null));
    } catch (err) {
        console.error('Error loading return report:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.markCashBatch = async (req, res) => {
    const { returnRef } = req.params;
    const { cash_batch_number } = req.body;

    if (!cash_batch_number) {
        return res.status(400).json({ error: 'Cash batch number is required' });
    }

    try {
        const result = await pool.query(
            `UPDATE return_records
             SET cash_batch_number = $1,
                 cash_batch_created_at = CURRENT_TIMESTAMP
             WHERE return_ref = $2
             RETURNING *`,
            [cash_batch_number, returnRef]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Return report not found' });
        }

        res.json(buildReturnReport(result.rows, null));
    } catch (err) {
        console.error('Error marking return cash batch:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.getReturnDashboard = async (req, res) => {
    try {
        const todayRes = await pool.query(`
            SELECT COUNT(*)::int AS count
            FROM return_records
            WHERE created_at::date = CURRENT_DATE
        `);

        const monthRes = await pool.query(`
            SELECT COUNT(*)::int AS count, COALESCE(SUM(refund_amount), 0)::numeric AS refund_amount
            FROM return_records
            WHERE date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE)
        `);

        const topProductsRes = await pool.query(`
            SELECT product_name, COUNT(*)::int AS return_count, COALESCE(SUM(refund_amount), 0)::numeric AS refund_amount
            FROM return_records
            WHERE date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE)
            GROUP BY product_name
            ORDER BY return_count DESC, refund_amount DESC
            LIMIT 5
        `);

        const ordersRes = await pool.query(`
            SELECT COUNT(*)::int AS count
            FROM orders
            WHERE date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE)
            AND LOWER(status) IN ('completed', 'delivered', 'cash received')
        `);

        const monthlyReturns = monthRes.rows[0]?.count || 0;
        const monthlyOrders = ordersRes.rows[0]?.count || 0;
        const returnPercentage = monthlyOrders ? (monthlyReturns / monthlyOrders) * 100 : 0;

        res.json({
            total_returns_today: todayRes.rows[0]?.count || 0,
            monthly_returns: monthlyReturns,
            refund_amount: Number(monthRes.rows[0]?.refund_amount || 0),
            most_returned_products: topProductsRes.rows,
            return_percentage: returnPercentage
        });
    } catch (err) {
        console.error('Error loading return dashboard:', err);
        res.status(500).json({ error: err.message });
    }
};

function buildReturnReport(records, order) {
    const first = records[0] || {};
    const total = records.reduce((sum, item) => sum + Number(item.refund_amount || 0), 0);
    return {
        return_ref: first.return_ref || `RTN-${first.id}`,
        order_id: first.order_id,
        order_ref: first.order_ref,
        created_at: first.created_at,
        cashier_name: first.cashier_name,
        branch_id: first.branch_id,
        return_method: first.return_method,
        cash_batch_number: first.cash_batch_number,
        cash_batch_created_at: first.cash_batch_created_at,
        total_refund_amount: total,
        customer: {
            name: order?.customer_name || 'POS Customer',
            phone: order?.customer_phone || '',
            email: order?.customer_email || ''
        },
        order: order ? {
            status: order.status,
            payment_method: order.payment_method,
            total_amount: Number(order.total_amount || 0),
            completed_at: order.completed_at || order.created_at
        } : null,
        items: records.map(item => ({
            id: item.id,
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: Number(item.unit_price || 0),
            refund_amount: Number(item.refund_amount || 0),
            reason_id: item.reason_id,
            reason_text: item.reason_text,
            custom_note: item.custom_note,
            return_method: item.return_method,
            condition_confirmed: item.condition_confirmed
        }))
    };
}
