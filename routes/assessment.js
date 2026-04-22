const express = require('express');
const router = express.Router();
const dpsNameController = require('../controllers/assessmentController/dpsNameController');
const authorizedPartiesController = require('../controllers/assessmentController/authorizedPartiesController');
const { requireAuth } = require('../middleware/auth');

// Routes for Assessment Step 1 (DPS Information)
router.get('/', requireAuth, dpsNameController.dpsName);
router.post('/dpsname', requireAuth, dpsNameController.saveDpsName);

// Routes for Assessment Step 2 (Authorized Parties)
router.get('/authorizedparties', requireAuth, authorizedPartiesController.authorizedParties);
router.post('/authorizedparties', requireAuth, authorizedPartiesController.saveAuthorizedParties);

module.exports = router;
