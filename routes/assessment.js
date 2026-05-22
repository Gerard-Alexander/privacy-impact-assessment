const express = require('express');
const router = express.Router();
const dpsNameController = require('../controllers/assessmentController/dpsNameController');
const authorizedPartiesController = require('../controllers/assessmentController/authorizedPartiesController');
const processDataLifeCycleController = require('../controllers/assessmentController/processDataLifeCycleController');
const personalInfoInventoryController = require('../controllers/assessmentController/personalInfoInventoryController');
const threatsAndControlsController = require('../controllers/assessmentController/threatsAndControlsController');
const securityMeasuresController = require('../controllers/assessmentController/securityMeasuresController');
const { finishAssessment } = require('../controllers/assessmentController/finishAssessmentController');
const { requireAuth } = require('../middleware/auth');
const { dlcUpload } = require('../controllers/uploadController/uploadController');

// Routes for Assessment Step 1 (DPS Information)
router.get('/', (req, res, next) => {
  // Ensure a fresh assessment starts (do not reuse previously selected one)
  if (req.session) req.session.currentAssessmentId = null;
  return next();
}, requireAuth, dpsNameController.dpsName);
router.post('/dpsname', requireAuth, dpsNameController.saveDpsName);

// Routes for Assessment Step 2 (Authorized Parties) - Step 2
router.get('/authorizedparties', requireAuth, authorizedPartiesController.authorizedParties);
router.post('/authorizedparties', requireAuth, authorizedPartiesController.saveAuthorizedParties);

// Routes for Assessment Step 3 (Process Data Cycle) - Step 3
router.get('/processdatalifecycle', requireAuth, processDataLifeCycleController.processDataLifeCycle);
router.post('/processdatalifecycle', requireAuth, dlcUpload.any(), processDataLifeCycleController.saveProcessDataLifeCycle);

// Router for Personal Information Inventory (PII) - Step 4
router.get('/personalinfoinventory', requireAuth, personalInfoInventoryController.personalInfoInventory);
router.post('/personalinfoinventory', requireAuth, personalInfoInventoryController.savePersonalInfoInventory);

// Router for Threats and Controls - Step 5
router.get('/threatsandcontrols', requireAuth, threatsAndControlsController.threatsAndControls);
router.post('/threatsandcontrols', requireAuth, threatsAndControlsController.saveThreatsAndControls);

// Router for Security Measures - Step 6
router.get('/securitymeasures', requireAuth, securityMeasuresController.securityMeasures);
router.post('/securitymeasures', requireAuth, securityMeasuresController.saveSecurityMeasures);

const riskHeatmapController = require('../controllers/assessmentController/riskHeatmapController');

// Router for Risk Heatmap - Step 7
router.get('/riskheatmap', requireAuth, riskHeatmapController.riskHeatmap);

// Finish assessment (Step 7)
router.get('/finish', requireAuth, finishAssessment);

module.exports = router;

