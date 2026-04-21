const express = require('express');
const router = express.Router();
const dpsNameController = require('../controllers/assessmentController/dpsNameController');
const { requireAuth } = require('../middleware/auth');

// Routes for Assessment Step 1 (DPS Information)
router.get('/', requireAuth, dpsNameController.dpsName);
router.post('/', requireAuth, dpsNameController.saveDpsName);

module.exports = router;