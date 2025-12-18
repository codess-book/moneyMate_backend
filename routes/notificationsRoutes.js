const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');

const {
  getNotifications,
  markAsRead,
  deleteNotification,
  // deleteNotification,
} = require('../controllers/NotificationController');

router.get('/', authMiddleware, getNotifications);
router.put('/:id/read', authMiddleware, markAsRead);
router.delete('/:id', authMiddleware, deleteNotification);
// router.delete('/', authMiddleware, deleteNotification);

module.exports = router;
