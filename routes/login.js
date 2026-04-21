const express = require('express');
const router = express.Router();
const loginController = require('../controllers/loginoutController/loginController');

router.post('/', loginController.loginSubmit);


module.exports = router;
