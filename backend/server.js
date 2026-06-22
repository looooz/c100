const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 5100;

const PUBLIC_DIR = path.join(__dirname, 'public');
const UPLOADS_DIR = path.join(PUBLIC_DIR, 'uploads');
const HISTORY_FILE = path.join(__dirname, 'history.json');

app.use(cors({
  origin: 'http://localhost:3100',
  credentials: true
}));

app.use(express.json());
app.use('/public', express.static(PUBLIC_DIR));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueName = uuidv4() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const fileFilter = function (req, file, cb) {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('只支持 JPG、PNG、WebP 格式的图片'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

function readHistory() {
  try {
    const data = fs.readFileSync(HISTORY_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

function writeHistory(history) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf8');
}

app.post('/api/upload', upload.single('file'), (req, res) => {
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
});

app.get('/api/uploads', (req, res) => {
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
});

app.get('/api/history', (req, res) => {
  const history = readHistory();
  const recentHistory = history.slice(0, 10);
  
  res.json({
    success: true,
    history: recentHistory
  });
});

app.post('/api/history', (req, res) => {
  const { id, name, thumbnail, timestamp } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: '缺少名称字段' });
  }
  
  const newItem = {
    id: id || uuidv4(),
    name: name,
    thumbnail: thumbnail || '',
    timestamp: timestamp || Date.now()
  };
  
  const history = readHistory();
  history.unshift(newItem);
  
  const limitedHistory = history.slice(0, 50);
  writeHistory(limitedHistory);
  
  res.json({
    success: true,
    item: newItem
  });
});

app.delete('/api/history/:id', (req, res) => {
  const { id } = req.params;
  const history = readHistory();
  
  const index = history.findIndex(item => item.id === id);
  if (index === -1) {
    return res.status(404).json({ error: '历史记录不存在' });
  }
  
  history.splice(index, 1);
  writeHistory(history);
  
  res.json({
    success: true,
    message: '删除成功'
  });
});

app.delete('/api/history', (req, res) => {
  writeHistory([]);
  
  res.json({
    success: true,
    message: '已清空所有历史记录'
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
