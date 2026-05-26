const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken, isStaff } = require('../middlewares/authMiddleware');

// Guest can create order
router.post('/', orderController.createOrder);

// Admin/Subadmin/Staff can manage orders
router.get('/', authenticateToken, isStaff, orderController.getOrders);
router.get('/hold', authenticateToken, isStaff, orderController.getHoldOrders);
router.get('/completed/session', authenticateToken, isStaff, orderController.getCompletedSessionOrders);
router.get('/transactions/all', authenticateToken, isStaff, orderController.getCashTransactions);
router.put('/transactions/:id/settle', authenticateToken, isStaff, orderController.settleCashTransaction);
router.get('/reports/session-orders', authenticateToken, isStaff, orderController.getSessionOrderReport);
router.get('/reports/online-session-orders', authenticateToken, isStaff, orderController.getOnlineSessionOrderReport);
router.get('/:id', authenticateToken, isStaff, orderController.getOrderById);
router.put('/:id', authenticateToken, isStaff, orderController.updateOrder);
router.put('/:id/status', authenticateToken, isStaff, orderController.updateOrderStatus);

module.exports = router;
