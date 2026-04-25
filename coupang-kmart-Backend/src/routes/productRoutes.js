const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken, isAdmin } = require('../middlewares/authMiddleware');

// Wrap with authenticateToken and authorizeRole('admin') if needed, 
// for now anyone can view but only admins can modify

router.get('/categories', productController.getCategories);
router.post('/categories', authenticateToken, isAdmin, productController.createCategory);
router.put('/categories/:id', authenticateToken, isAdmin, productController.updateCategory);
router.delete('/categories/:id', authenticateToken, isAdmin, productController.deleteCategory);

router.get('/items', productController.getProducts);
router.post('/items', authenticateToken, isAdmin, productController.createProduct);
router.put('/items/:id', authenticateToken, isAdmin, productController.updateProduct);
router.delete('/items/:id', authenticateToken, isAdmin, productController.deleteProduct);

router.put('/inventory/:id', authenticateToken, isAdmin, productController.updateInventory);

module.exports = router;
