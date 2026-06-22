const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { ensureDir } = require('../utils/fileUtils');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const UPLOADS_DIR = path.join(PUBLIC_DIR, 'uploads');

ensureDir(UPLOADS_DIR);

const storage = {
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueName = uuidv4() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
};

const fileFilter = function (req, file, cb) {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('只支持 JPG、PNG、WebP 格式的图片'), false);
  }
};

const uploadConfig = {
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
};

function getUploadsDir() {
  return UPLOADS_DIR;
}

function getPublicDir() {
  return PUBLIC_DIR;
}

module.exports = {
  storage,
  fileFilter,
  uploadConfig,
  getUploadsDir,
  getPublicDir,
  UPLOADS_DIR,
  PUBLIC_DIR
};
