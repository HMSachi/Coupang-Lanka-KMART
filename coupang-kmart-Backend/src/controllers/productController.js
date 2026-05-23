const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Categories
exports.getCategories = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM categories ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createCategory = async (req, res) => {
    const { name, description, image_url } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO categories (name, description, image_url) VALUES ($1, $2, $3) RETURNING *',
            [name, description, image_url]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateCategory = async (req, res) => {
    const { id } = req.params;
    const { name, description, image_url, is_active } = req.body;
    try {
        const result = await pool.query(
            'UPDATE categories SET name = $1, description = $2, image_url = $3, is_active = $4 WHERE id = $5 RETURNING *',
            [name, description, image_url, is_active, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        await pool.query('DELETE FROM categories WHERE id = $1', [req.params.id]);
        res.json({ message: 'Category deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Products
exports.getProducts = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.*, c.name as category_name,
            COALESCE((SELECT SUM(stock_quantity) FROM product_inventory WHERE product_id = p.id), 0) as total_stock_qty
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            ORDER BY p.id ASC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getProductBranchStock = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(`
            SELECT b.name as branch_name, COALESCE(pi.stock_quantity, 0) as stock_quantity, b.location
            FROM branches b
            LEFT JOIN product_inventory pi ON pi.branch_id = b.id AND pi.product_id = $1
            ORDER BY b.name ASC
        `, [id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


exports.createProduct = async (req, res) => {
    const {
        category_id, name, description, base_price, discount_price, image_url,
        global_stock_quantity, buying_price, discount_value, discount_type,
        tax_percentage, unit_type, expiry_date, image_urls
    } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO products (
                category_id, name, description, base_price, discount_price, image_url, 
                global_stock_quantity, buying_price, discount_value, discount_type, 
                tax_percentage, unit_type, expiry_date, image_urls
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
            [
                category_id || null, name, description, base_price, discount_price || null, image_url,
                parseInt(global_stock_quantity) || 0, buying_price || 0, discount_value || 0,
                discount_type || 'percentage', tax_percentage || 0, unit_type || 'Piece', expiry_date || null, image_urls || []
            ]
        );

        await pool.query(
            'INSERT INTO product_inventory (product_id, stock_quantity) VALUES ($1, 0)',
            [result.rows[0].id]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateProduct = async (req, res) => {
    const { id } = req.params;
    const {
        category_id, name, description, base_price, discount_price, image_url,
        is_active, global_stock_quantity, buying_price, discount_value,
        discount_type, tax_percentage, unit_type, expiry_date, image_urls
    } = req.body;
    try {
        const result = await pool.query(
            `UPDATE products SET 
                category_id = $1, name = $2, description = $3, base_price = $4, 
                discount_price = $5, image_url = $6, is_active = $7, 
                global_stock_quantity = $8, buying_price = $9, discount_value = $10, 
                discount_type = $11, tax_percentage = $12, unit_type = $13, 
                expiry_date = $14, image_urls = $15 
            WHERE id = $16 RETURNING *`,
            [
                category_id || null, name, description, base_price, discount_price || null, image_url,
                is_active, parseInt(global_stock_quantity) || 0, buying_price || 0,
                discount_value || 0, discount_type || 'percentage', tax_percentage || 0,
                unit_type || 'Piece', expiry_date || null, image_urls || [], id
            ]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
        res.json({ message: 'Product deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Inventory
exports.getBranchInventory = async (req, res) => {
    const { branch_id } = req.params;

    // Security check: Restricted roles can only see THEIR branch
    if (req.user.role !== 'admin') {
        const userBranchId = req.user.branch_id;
        if (!userBranchId || parseInt(branch_id) !== parseInt(userBranchId)) {
            return res.status(403).json({ error: 'Unauthorized access to other branch inventory.' });
        }
    }

    try {
        const result = await pool.query(`
            SELECT 
                pi.id as inventory_id, p.id as product_id, p.name, c.name as category_name, 
                p.base_price, pi.stock_quantity, pi.low_stock_threshold, p.image_url,
                p.description, p.unit_type, p.discount_value, p.discount_type, 
                p.tax_percentage, p.expiry_date, p.image_urls
            FROM product_inventory pi
            JOIN products p ON pi.product_id = p.id
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE pi.branch_id = $1
            ORDER BY p.name ASC
        `, [branch_id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.addBranchInventory = async (req, res) => {
    const { product_id, branch_id, stock_quantity, low_stock_threshold } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Check if product exists and has enough global stock
        const productRes = await client.query('SELECT global_stock_quantity FROM products WHERE id = $1 FOR UPDATE', [product_id]);
        if (productRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Product not found.' });
        }

        const availableStock = productRes.rows[0].global_stock_quantity;
        const requestedStock = parseInt(stock_quantity) || 0;

        if (availableStock < requestedStock) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: `Insufficient stock in global warehouse. Available: ${availableStock}` });
        }

        // 2. Check if already linked
        const existing = await client.query('SELECT id FROM product_inventory WHERE product_id = $1 AND branch_id = $2', [product_id, branch_id]);
        if (existing.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'This product is already linked to your branch inventory. Please just update the stock instead.' });
        }

        // 3. Deduct from global stock
        await client.query('UPDATE products SET global_stock_quantity = global_stock_quantity - $1 WHERE id = $2', [requestedStock, product_id]);

        // 4. Add to branch inventory
        const result = await client.query(
            'INSERT INTO product_inventory (product_id, branch_id, stock_quantity, low_stock_threshold) VALUES ($1, $2, $3, $4) RETURNING *',
            [product_id, branch_id, requestedStock, low_stock_threshold]
        );

        await client.query('COMMIT');
        res.status(201).json(result.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error adding branch inventory:', err);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
};

exports.updateInventory = async (req, res) => {
    const { id } = req.params; // inventory record id
    const { stock_quantity, low_stock_threshold } = req.body;
    try {
        const result = await pool.query(
            'UPDATE product_inventory SET stock_quantity = $1, low_stock_threshold = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
            [stock_quantity, low_stock_threshold, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
