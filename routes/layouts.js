const express = require('express');
const router = express.Router();

router.get('/layout', layoutController.getUsername);

module.exports = router;