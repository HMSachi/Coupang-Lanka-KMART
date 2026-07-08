const express = require('express');
const router = express.Router();
const branchController = require('../controllers/branchController');
const { authenticateToken, isAdmin, isStaff } = require('../middlewares/authMiddleware');

// Branch and Subadmin Creation
// Public route for customer website to see active branches
router.get('/public', branchController.getBranches);

router.get('/', authenticateToken, isAdmin, branchController.getBranches);
router.post('/', authenticateToken, isAdmin, branchController.createBranch);
router.post('/subadmin', authenticateToken, isAdmin, branchController.createSubAdmin);
router.put('/:id', authenticateToken, isAdmin, branchController.updateBranch);

// Cashier management (Subadmin & Admin)
router.get('/cashiers/:branch_id', authenticateToken, isStaff, branchController.getCashiers);
router.post('/cashier', authenticateToken, isStaff, branchController.createCashier);

module.exports = router;
