const express = require('express');
const router = express.Router();
const userProfileController = require('../controllers/userProfileController/userProfileController');
const { requireAuth } = require('../middleware/auth');

// Routes for User Profile Page
router.get('/', requireAuth, userProfileController.profile);
// Removed unused /logout-page (use /logout instead)

module.exports = router;