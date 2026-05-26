const express = require('express');
const router = express.Router();
const { requireAuth, requireAssessmentAccess } = require('../middleware/auth');
const { exportAssessmentExcel } = require('../controllers/exportController/exportAssessmentExcelController');

router.get('/assessment', requireAuth, requireAssessmentAccess, exportAssessmentExcel);

module.exports = router;
