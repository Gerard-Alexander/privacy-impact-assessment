const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController/dashboardController');
const allAssessmentController = require('../controllers/assessmentController/allAssessmentController');
const { requireAuth } = require('../middleware/auth');


router.get('/', requireAuth, dashboardController.dashboard);
router.get('/all', requireAuth, allAssessmentController.allAssessments);
router.post('/archive', requireAuth, allAssessmentController.archiveAssessment);
router.post('/restore', requireAuth, allAssessmentController.restoreAssessment);
router.post('/delete-permanent', requireAuth, allAssessmentController.permanentDeleteAssessment);

module.exports = router;