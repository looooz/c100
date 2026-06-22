const express = require('express');
const {
  getHistory,
  saveHistory,
  deleteHistory,
  clearHistory
} = require('../controllers/historyController');

const router = express.Router();

router.get('/history', getHistory);
router.post('/history', saveHistory);
router.delete('/history/:id', deleteHistory);
router.delete('/history', clearHistory);

module.exports = router;
