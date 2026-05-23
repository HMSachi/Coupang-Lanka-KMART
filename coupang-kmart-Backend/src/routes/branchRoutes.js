const express = require('express');
const router = express.Router();
const branchController = require('../controllers/branchController');
const { authenticateToken, isAdmin, isStaff } = require('../middlewares/authMiddleware');

// Branch and Subadmin Creation
// Protect with Master Admin token logic
router.get('/', authenticateToken, isAdmin, branchController.getBranches);
router.post('/', authenticateToken, isAdmin, branchController.createBranch);
router.post('/subadmin', authenticateToken, isAdmin, branchController.createSubAdmin);

// Cashier management (Subadmin & Admin)
router.get('/cashiers/:branch_id', authenticateToken, isStaff, branchController.getCashiers);
router.post('/cashier', authenticateToken, isStaff, branchController.createCashier);

module.exports = router;
