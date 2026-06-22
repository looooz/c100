const fs = require('fs');
const path = require('path');

const HISTORY_FILE = path.join(__dirname, '..', 'history.json');

function readHistory() {
  try {
    if (!fs.existsSync(HISTORY_FILE)) {
      return [];
    }
    const data = fs.readFileSync(HISTORY_FILE, 'utf8');
    if (!data) {
      return [];
    }
    return JSON.parse(data);
  } catch (err) {
    console.error('读取历史记录失败:', err);
    return [];
  }
}

function writeHistory(history) {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('写入历史记录失败:', err);
    return false;
  }
}

function ensureDir(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    return true;
  } catch (err) {
    console.error('创建目录失败:', err);
    return false;
  }
}

module.exports = {
  readHistory,
  writeHistory,
  ensureDir,
  HISTORY_FILE
};
