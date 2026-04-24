const Banner = require('../models/Banner');
const { createAdminLog } = require('../utils/adminAudit');

exports.listBanners = async (req, res) => {
  try {
    const onlyActive = String(req.query.active || '') === 'true';
    const query = onlyActive ? { isActive: true } : {};
    const items = await Banner.find(query).sort({ createdAt: -1 });
    res.json({ items });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.createBanner = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: 'Image file is required' });

    const imageUrl = `/uploads/banners/${req.file.filename}`;
    const banner = await Banner.create({
      imageUrl,
      uploadedBy: req.user.id,
      isActive: true,
    });

    await createAdminLog({
      adminUserId: req.user.id,
      action: 'create',
      entityType: 'banner',
      entityId: banner.id,
      details: `Uploaded banner ${banner.id}`,
    });

    res.status(201).json(banner);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) return res.status(404).json({ msg: 'Banner not found' });

    await createAdminLog({
      adminUserId: req.user.id,
      action: 'delete',
      entityType: 'banner',
      entityId: req.params.id,
      details: `Deleted banner ${req.params.id}`,
    });

    res.json({ ok: true, id: req.params.id });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};
