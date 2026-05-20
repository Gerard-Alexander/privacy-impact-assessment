const fs = require('fs');
const path = require('path');
const multer = require('multer');

const dlcUploadDir = path.join(__dirname, '..', '..', 'uploads', 'dlc');
fs.mkdirSync(dlcUploadDir, { recursive: true });

const piiUploadDir = path.join(__dirname, '..', '..', 'uploads', 'pii');
fs.mkdirSync(piiUploadDir, { recursive: true });

const dlcStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, dlcUploadDir),
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const baseName = path
      .basename(file.originalname, extension)
      .replace(/[^a-z0-9_-]/gi, '_')
      .slice(0, 50);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${baseName || 'dlc'}-${uniqueSuffix}${extension}`);
  }
});

const piiStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, piiUploadDir),
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const baseName = path
      .basename(file.originalname, extension)
      .replace(/[^a-z0-9_-]/gi, '_')
      .slice(0, 50);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${baseName || 'pii'}-${uniqueSuffix}${extension}`);
  }
});

const dlcUpload = multer({
  storage: dlcStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      return cb(null, true);
    }
    return cb(new Error('Only image uploads are allowed for DLC diagrams.'));
  }
});

const piiUpload = multer({
  storage: piiStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      return cb(null, true);
    }
    return cb(new Error('Only image uploads are allowed for PII forms.'));
  }
});

module.exports = {
  dlcUpload,
  piiUpload
};