const Notification = require('../models/Notification');
const { emitNotification } = require('../sockets/socket');

async function createNotification({
  userId,
  type,
  title,
  body = '',
  tripId = null,
  ticketId = null,
  metadata = null,
}) {
  if (!userId || !type || !title) return null;

  try {
    const notification = await Notification.create({
      userId,
      type,
      title,
      body,
      tripId,
      ticketId,
      metadata,
    });

    emitNotification(userId, {
      _id: String(notification._id),
      userId: String(notification.userId),
      type: notification.type,
      title: notification.title,
      body: notification.body,
      tripId: notification.tripId ? String(notification.tripId) : null,
      ticketId: notification.ticketId ? String(notification.ticketId) : null,
      metadata: notification.metadata || null,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
    });

    return notification;
  } catch (err) {
    console.error('createNotification error', err);
    return null;
  }
}

module.exports = { createNotification };
