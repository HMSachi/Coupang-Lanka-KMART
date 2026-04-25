const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken, isAdmin, isStaff } = require('../middlewares/authMiddleware');

router.get('/categories', productController.getCategories);
router.post('/categories', authenticateToken, isAdmin, productController.createCategory);
router.put('/categories/:id', authenticateToken, isAdmin, productController.updateCategory);
router.delete('/categories/:id', authenticateToken, isAdmin, productController.deleteCategory);

router.get('/items', productController.getProducts);
router.post('/items', authenticateToken, isAdmin, productController.createProduct);
router.put('/items/:id', authenticateToken, isAdmin, productController.updateProduct);
router.delete('/items/:id', authenticateToken, isAdmin, productController.deleteProduct);

// Staff branch control
router.get('/branch-inventory/:branch_id', authenticateToken, isStaff, productController.getBranchInventory);
router.post('/branch-inventory', authenticateToken, isStaff, productController.addBranchInventory);
router.put('/inventory/:id', authenticateToken, isStaff, productController.updateInventory);

module.exports = router;
