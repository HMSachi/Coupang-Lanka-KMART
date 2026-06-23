const express = require('express');
const router = express.Router();
const darazController = require('../controllers/darazController');
const { authenticateToken, isStaff } = require('../middlewares/authMiddleware');

// Get all Daraz orders
router.get('/orders', authenticateToken, isStaff, darazController.getOrders);

// Get Daraz dashboard statistics
router.get('/orders/stats', authenticateToken, isStaff, darazController.getStats);

// Create a new Daraz order manually
router.post('/orders', authenticateToken, isStaff, darazController.createOrder);

// Update Daraz order details
router.put('/orders/:id', authenticateToken, isStaff, darazController.updateOrder);

// Update Daraz payment settlement status (records a cash transaction on received)
router.put('/orders/:id/payment', authenticateToken, isStaff, darazController.updatePaymentStatus);

module.exports = router;
