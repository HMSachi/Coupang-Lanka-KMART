const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.post('/', reportController.submitReport);
router.get('/', reportController.getReports);
router.put('/:id/status', reportController.updateReportStatus);

module.exports = router;
