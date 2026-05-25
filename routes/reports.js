const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController/reportsController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, reportsController.reportsMain);

module.exports = router;
