const express = require('express');
const router = express.Router();
const loginController = require('../controllers/loginoutController/loginController');
const { checkLoginRateLimit } = require('../middleware/loginRateLimit');

router.post('/', checkLoginRateLimit, loginController.loginSubmit);


module.exports = router;
