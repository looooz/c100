const express = require('express');
const cors = require('cors');
const path = require('path');

const { getPublicDir } = require('./config/uploadConfig');
const uploadRoutes = require('./routes/uploadRoutes');
const historyRoutes = require('./routes/historyRoutes');

const app = express();
const PORT = process.env.PORT || 5100;

app.use(cors({
  origin: 'http://localhost:3100',
  credentials: true
}));

app.use(express.json());
app.use('/public', express.static(getPublicDir()));

app.use('/api', uploadRoutes);
app.use('/api', historyRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});

module.exports = app;
