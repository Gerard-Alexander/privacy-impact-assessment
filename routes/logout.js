const express = require('express');
const router = express.Router();
const logoutController = require('../controllers/loginoutController/logoutController');

router.get('/', logoutController.logout);

module.exports = router;