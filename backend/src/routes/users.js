const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const { getProfile, updateProfile, deleteAccount } = require('../controllers/userController');

router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.delete('/profile', auth, deleteAccount);

module.exports = router;
