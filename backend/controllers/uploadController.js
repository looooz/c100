const fs = require('fs');
const path = require('path');
const { UPLOADS_DIR } = require('../config/uploadConfig');
const PORT = process.env.PORT || 5100;

async function uploadFile(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请选择要上传的文件' });
    }

    const fileUrl = `http://localhost:${PORT}/public/uploads/${req.file.filename}`;

    res.json({
      success: true,
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (err) {
    console.error('上传文件失败:', err);
    res.status(500).json({ error: '上传文件失败' });
  }
}

async function getUploads(req, res) {
  try {
    fs.readdir(UPLOADS_DIR, (err, files) => {
      if (err) {
        return res.status(500).json({ error: '读取文件列表失败' });
      }

      const fileList = files.map(file => {
        const filePath = path.join(UPLOADS_DIR, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          url: `http://localhost:${PORT}/public/uploads/${file}`,
          size: stats.size,
          createdAt: stats.birthtime
        };
      }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      res.json({
        success: true,
        files: fileList
      });
    });
  } catch (err) {
    console.error('获取文件列表失败:', err);
    res.status(500).json({ error: '获取文件列表失败' });
  }
}

module.exports = {
  uploadFile,
  getUploads
};
