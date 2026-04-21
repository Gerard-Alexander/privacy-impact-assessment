const express = require('express');
const router = express.Router();
const indexController = require('../controllers/indexController');

// Routes for the index Page
router.get('/', indexController.home);
router.get('/login-page', indexController.loginPage);
router.get('/register-page', indexController.registerPage);
router.post('/register-page', indexController.registerSubmit);

router.get('/index', (req, res) => {
  res.redirect('/');
});

module.exports = router;