const express = require('express');
const router = express.Router();
const userProfileController = require('../controllers/userProfileController/userProfileController');
const UsersController = require('../controllers/userProfileController/UsersController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Routes for User Profile Page (Self)
router.get('/', requireAuth, userProfileController.profile);
router.get('/edit', requireAuth, userProfileController.editProfile);
router.post('/edit', requireAuth, userProfileController.updateProfileSubmit);

// Admin-only: manage and create accounts (Other Users)
router.get('/manage-users', requireAuth, requireAdmin, userProfileController.manageUsers);
router.get('/create-user', requireAuth, requireAdmin, userProfileController.renderCreateUserPage);
router.post('/create-user', requireAuth, requireAdmin, userProfileController.createUserSubmit);

// Admin-only: edit specifically other users
router.get('/manage-users/edit/:id', requireAuth, requireAdmin, UsersController.editUserByAdmin);
router.post('/manage-users/edit/:id', requireAuth, requireAdmin, UsersController.updateUserByAdminSubmit);
router.get('/manage-users/password/:id', requireAuth, requireAdmin, UsersController.renderChangePasswordPage);
router.post('/manage-users/password/:id', requireAuth, requireAdmin, UsersController.changePasswordByAdmin);
router.post('/manage-users/delete/:id', requireAuth, requireAdmin, UsersController.deactivateUser);

module.exports = router;
