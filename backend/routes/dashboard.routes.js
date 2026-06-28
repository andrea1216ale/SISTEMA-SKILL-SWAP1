const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');

const router = express.Router();
router.get('/:userId', dashboardController.get);
module.exports = router;
