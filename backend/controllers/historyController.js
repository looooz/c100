const { v4: uuidv4 } = require('uuid');
const { readHistory, writeHistory } = require('../utils/fileUtils');

async function getHistory(req, res) {
  try {
    const history = readHistory();
    const recentHistory = history.slice(0, 10);

    res.json({
      success: true,
      history: recentHistory
    });
  } catch (err) {
    console.error('获取历史记录失败:', err);
    res.status(500).json({ error: '获取历史记录失败' });
  }
}

async function saveHistory(req, res) {
  try {
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
  } catch (err) {
    console.error('保存历史记录失败:', err);
    res.status(500).json({ error: '保存历史记录失败' });
  }
}

async function deleteHistory(req, res) {
  try {
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
  } catch (err) {
    console.error('删除历史记录失败:', err);
    res.status(500).json({ error: '删除历史记录失败' });
  }
}

async function clearHistory(req, res) {
  try {
    writeHistory([]);

    res.json({
      success: true,
      message: '已清空所有历史记录'
    });
  } catch (err) {
    console.error('清空历史记录失败:', err);
    res.status(500).json({ error: '清空历史记录失败' });
  }
}

module.exports = {
  getHistory,
  saveHistory,
  deleteHistory,
  clearHistory
};
