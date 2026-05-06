const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const { runAstar } = require('../controllers/routingController');

router.use(auth);

router.post('/astar', runAstar);

module.exports = router;
