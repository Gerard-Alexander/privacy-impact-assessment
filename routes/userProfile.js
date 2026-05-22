const express = require('express');
const router = express.Router();
const userProfileController = require('../controllers/userProfileController/userProfileController');
const { requireAuth } = require('../middleware/auth');

// Routes for User Profile Page
router.get('/', requireAuth, userProfileController.profile);

// Admin-only: create new accounts
router.get('/create-user', requireAuth, userProfileController.renderCreateUserPage);
router.post('/create-user', requireAuth, userProfileController.createUserSubmit);

module.exports = router;
