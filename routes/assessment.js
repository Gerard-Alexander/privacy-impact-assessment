const express = require('express');
const router = express.Router();
const dpsNameController = require('../controllers/assessmentController/dpsNameController');
const authorizedPartiesController = require('../controllers/assessmentController/authorizedPartiesController');
const processDataLifeCycleController = require('../controllers/assessmentController/processDataLifeCycleController');
const personalInfoInventoryController = require('../controllers/assessmentController/personalInfoInventoryController');
const threatsAndControlsController = require('../controllers/assessmentController/threatsAndControlsController');
const securityMeasuresController = require('../controllers/assessmentController/securityMeasuresController');
const { finishAssessment } = require('../controllers/assessmentController/finishAssessmentController');
const { shareAssessment, getShareUsers } = require('../controllers/assessmentController/shareAssessmentController');
const { requireAuth, requireAssessmentAccess } = require('../middleware/auth');
const { dlcUpload } = require('../controllers/uploadController/uploadController');

// Routes for Assessment Step 1 (DPS Information)
router.get('/', (req, res, next) => {
  // Ensure a fresh assessment starts (do not reuse previously selected one)
  // Note: clear session BEFORE requireAssessmentAccess — it still reads req.query.id
  if (req.session) req.session.currentAssessmentId = null;
  return next();
}, requireAuth, requireAssessmentAccess, dpsNameController.dpsName);
router.post('/dpsname', requireAuth, requireAssessmentAccess, dpsNameController.saveDpsName);

// Routes for Assessment Step 2 (Authorized Parties) - Step 2
router.get('/authorizedparties', requireAuth, requireAssessmentAccess, authorizedPartiesController.authorizedParties);
router.post('/authorizedparties', requireAuth, requireAssessmentAccess, authorizedPartiesController.saveAuthorizedParties);

// Routes for Assessment Step 3 (Process Data Cycle) - Step 3
router.get('/processdatalifecycle', requireAuth, requireAssessmentAccess, processDataLifeCycleController.processDataLifeCycle);
router.post('/processdatalifecycle', requireAuth, requireAssessmentAccess, dlcUpload.any(), processDataLifeCycleController.saveProcessDataLifeCycle);

// Router for Personal Information Inventory (PII) - Step 4
router.get('/personalinfoinventory', requireAuth, requireAssessmentAccess, personalInfoInventoryController.personalInfoInventory);
router.post('/personalinfoinventory', requireAuth, requireAssessmentAccess, personalInfoInventoryController.savePersonalInfoInventory);

// Router for Threats and Controls - Step 5
router.get('/threatsandcontrols', requireAuth, requireAssessmentAccess, threatsAndControlsController.threatsAndControls);
router.post('/threatsandcontrols', requireAuth, requireAssessmentAccess, threatsAndControlsController.saveThreatsAndControls);

// Router for Security Measures - Step 6
router.get('/securitymeasures', requireAuth, requireAssessmentAccess, securityMeasuresController.securityMeasures);
router.post('/securitymeasures', requireAuth, requireAssessmentAccess, securityMeasuresController.saveSecurityMeasures);

const riskHeatmapController = require('../controllers/assessmentController/riskHeatmapController');

// Router for Risk Heatmap - Step 7
router.get('/riskheatmap', requireAuth, requireAssessmentAccess, riskHeatmapController.riskHeatmap);

// Finish assessment
router.get('/finish', requireAuth, requireAssessmentAccess, finishAssessment);

// --- SHARE ROUTES ---
// GET  /assessment/share/users?piaAssessmentId=X  — fetch users list for modal (AJAX)
router.get('/share/users', requireAuth, getShareUsers);
// POST /assessment/share  — save share selections
router.post('/share', requireAuth, shareAssessment);

module.exports = router;
