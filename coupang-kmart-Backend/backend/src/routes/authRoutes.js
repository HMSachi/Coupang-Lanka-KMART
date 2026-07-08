const express = require('express');
const { signup, login, getMe, getAllUsers, createUser, deleteUser } = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', authenticateToken, getMe);

// User Management Routes (Admin protected inside controller)
router.get('/users', authenticateToken, getAllUsers);
router.post('/users', authenticateToken, createUser);
router.delete('/users/:id', authenticateToken, deleteUser);

module.exports = router;
