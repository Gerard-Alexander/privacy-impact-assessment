const express = require('express');
const router = express.Router();
const userProfileController = require('../controllers/userProfileController/userProfileController');
const UsersController = require('../controllers/userProfileController/UsersController');
const { requireAuth } = require('../middleware/auth');

// Routes for User Profile Page (Self)
router.get('/', requireAuth, userProfileController.profile);
router.get('/edit', requireAuth, userProfileController.editProfile);
router.post('/edit', requireAuth, userProfileController.updateProfileSubmit);

// Admin-only: manage and create accounts (Other Users)
router.get('/manage-users', requireAuth, userProfileController.manageUsers);
router.get('/create-user', requireAuth, userProfileController.renderCreateUserPage);
router.post('/create-user', requireAuth, userProfileController.createUserSubmit);

// Admin-only: edit specifically other users
router.get('/manage-users/edit/:id', requireAuth, UsersController.editUserByAdmin);
router.post('/manage-users/edit/:id', requireAuth, UsersController.updateUserByAdminSubmit);
router.post('/manage-users/delete/:id', requireAuth, UsersController.deactivateUser);

module.exports = router;
