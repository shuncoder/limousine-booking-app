const express = require('express');
const router = express.Router();

const auth = require('../middlewares/authMiddleware');
const {
  listMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} = require('../controllers/notificationController');

router.use(auth);

router.get('/', listMyNotifications);
router.get('/unread-count', getUnreadCount);
router.post('/read-all', markAllAsRead);
router.post('/:id/read', markAsRead);

module.exports = router;
