const AdminNotification = require('../models/AdminNotification');

async function createAdminLog({ adminUserId, action, entityType, entityId = null, details = '', metadata = null }) {
  if (!adminUserId || !action || !entityType) return;
  try {
    await AdminNotification.create({
      adminUserId,
      action,
      entityType,
      entityId: entityId ? String(entityId) : null,
      details,
      metadata,
    });
  } catch (err) {
    console.error('createAdminLog error', err);
  }
}

module.exports = { createAdminLog };
