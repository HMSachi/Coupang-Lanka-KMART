const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken, isStaff } = require('../middlewares/authMiddleware');

// Guest can create order
router.post('/', orderController.createOrder);

// Admin/Subadmin/Staff can manage orders
router.get('/', authenticateToken, isStaff, orderController.getOrders);
router.get('/:id', authenticateToken, isStaff, orderController.getOrderById);
router.put('/:id/status', authenticateToken, isStaff, orderController.updateOrderStatus);

module.exports = router;
