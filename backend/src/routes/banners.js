const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/requireRole');
const { listBanners, createBanner, deleteBanner } = require('../controllers/bannerController');

const router = express.Router();

const uploadDir = path.resolve(process.cwd(), 'uploads', 'banners');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed'));
      return;
    }
    cb(null, true);
  },
});

router.get('/', listBanners);
router.post('/', auth, requireRole('admin', 'staff'), upload.single('image'), createBanner);
router.delete('/:id', auth, requireRole('admin', 'staff'), deleteBanner);

module.exports = router;
