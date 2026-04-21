const express = require('express');
const router = express.Router();
const dpsNameController = require('../controllers/assessmentController/dpsNameController');
const { requireAuth } = require('../middleware/auth');

// Routes for User Profile Page

router.get('/', requireAuth, dpsNameController.dpsName);

module.exports = router;