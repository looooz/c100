const express = require('express');
const multer = require('multer');
const { uploadConfig } = require('../config/uploadConfig');
const { uploadFile, getUploads } = require('../controllers/uploadController');

const router = express.Router();
const upload = multer(uploadConfig);

router.post('/upload', upload.single('file'), uploadFile);
router.get('/uploads', getUploads);

module.exports = router;
