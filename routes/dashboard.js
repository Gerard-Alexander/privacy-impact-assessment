const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController/dashboardController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, dashboardController.dashboard);
router.get('/dpsname', requireAuth, dashboardController.dpsname);

module.exports = router;