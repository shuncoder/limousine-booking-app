const express = require('express');
const router = express.Router();
const { register, verifyPhone } = require('../controllers/authController');

router.post('/register', register);
router.post('/verify-phone', verifyPhone);

module.exports = router;
