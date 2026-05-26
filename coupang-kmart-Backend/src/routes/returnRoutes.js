const express = require('express');
const router = express.Router();
const returnController = require('../controllers/returnController');
const { authenticateToken, isAdmin, isStaff } = require('../middlewares/authMiddleware');

router.get('/config', authenticateToken, isStaff, returnController.getReturnConfig);
router.get('/dashboard', authenticateToken, isAdmin, returnController.getReturnDashboard);
router.post('/', authenticateToken, isStaff, returnController.createReturn);
router.get('/', authenticateToken, isStaff, returnController.getReturns);
router.post('/reasons', authenticateToken, isAdmin, returnController.saveReturnReason);
router.put('/reasons/:id', authenticateToken, isAdmin, returnController.updateReturnReason);
router.delete('/reasons/:id', authenticateToken, isAdmin, returnController.deleteReturnReason);
router.put('/policy', authenticateToken, isAdmin, returnController.saveReturnPolicy);
router.get('/order/:orderId', authenticateToken, isStaff, returnController.getReturnsByOrder);
router.get('/:returnRef', authenticateToken, isStaff, returnController.getReturnByRef);
router.put('/:returnRef/cash-batch', authenticateToken, isStaff, returnController.markCashBatch);

module.exports = router;
