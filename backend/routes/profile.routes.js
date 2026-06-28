const express = require('express');
const profileController = require('../controllers/profile.controller');

const router = express.Router();

router.get('/:userId', profileController.get);
router.put('/:userId', profileController.update);

module.exports = router;
