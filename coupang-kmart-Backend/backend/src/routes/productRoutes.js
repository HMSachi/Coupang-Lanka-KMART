const express = require('express');
const productController = require('../controllers/productController');
const { authenticateToken, isAdmin, isStaff } = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(process.cwd(), 'uploads');
const modelUploadDir = path.join(uploadDir, '3d');

fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(modelUploadDir, { recursive: true });

// Multer storage config
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
});
const upload = multer({ storage });

const modelStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, modelUploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
});

const modelUpload = multer({
    storage: modelStorage,
    fileFilter: (req, file, cb) => {
        const allowedExtensions = ['.glb', '.gltf'];
        const ext = path.extname(file.originalname).toLowerCase();

        if (!allowedExtensions.includes(ext)) {
            return cb(new Error('Only .glb and .gltf 3D model files are allowed'));
        }

        cb(null, true);
    }
});

const router = express.Router();

router.get('/categories', productController.getCategories);
router.post('/categories', authenticateToken, isAdmin, productController.createCategory);
router.put('/categories/:id', authenticateToken, isAdmin, productController.updateCategory);
router.delete('/categories/:id', authenticateToken, isAdmin, productController.deleteCategory);

router.get('/items', productController.getProducts);
router.get('/items/:id/branch-stock', productController.getProductBranchStock);
router.post('/items', authenticateToken, isAdmin, productController.createProduct);
router.put('/items/:id', authenticateToken, isAdmin, productController.updateProduct);
router.delete('/items/:id', authenticateToken, isAdmin, productController.deleteProduct);

router.post('/upload-images', authenticateToken, isAdmin, upload.array('images', 3), (req, res) => {
    const filePaths = req.files.map(file => `/uploads/${file.filename}`);
    res.json({ urls: filePaths });
});

router.post('/upload-3d-model', authenticateToken, isAdmin, modelUpload.single('model'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No 3D model file uploaded' });
    }

    res.json({ url: `/uploads/3d/${req.file.filename}` });
});

// Public routes for website
router.get('/public/branch-inventory/:branch_id', productController.getBranchInventory);

// Staff branch control
router.get('/branch-inventory/:branch_id', authenticateToken, isStaff, productController.getBranchInventory);
router.post('/branch-inventory', authenticateToken, isStaff, productController.addBranchInventory);
router.put('/inventory/:id', authenticateToken, isStaff, productController.updateInventory);
router.get('/branch-inventory-history/:branch_id', authenticateToken, isStaff, productController.getBranchInventoryHistory);

module.exports = router;
