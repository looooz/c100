import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as api from '../utils/api'
import { formatDate } from '../utils/imageUtils'

export function useHistoryList(canvasApi) {
  const historyList = ref([])

  async function loadHistory() {
    try {
      const res = await api.getHistory()
      historyList.value = res.history || []
    } catch (err) {
      console.error('加载历史记录失败', err)
    }
  }

  async function saveToHistory() {
    if (!canvasApi.hasImage.value) {
      ElMessage.warning('请先上传照片')
      return
    }

    try {
      const thumbnail = canvasApi.toDataURL({
        format: 'jpeg',
        quality: 0.6,
        multiplier: 0.3
      })

      const name = `证件照_${new Date().toLocaleString()}`
      const res = await api.saveHistory({
        name,
        thumbnail,
        timestamp: Date.now()
      })

      historyList.value.unshift(res.item)
      if (historyList.value.length > 10) {
        historyList.value = historyList.value.slice(0, 10)
      }

      ElMessage.success('已保存到历史记录')
    } catch (err) {
      ElMessage.error('保存失败')
      console.error(err)
    }
  }

  async function loadHistoryItem(item) {
    ElMessage.info('历史记录功能需配合完整的状态存储使用，当前版本保存缩略图预览')
  }

  async function removeHistory(id) {
    try {
      await api.deleteHistory(id)
      historyList.value = historyList.value.filter(item => item.id !== id)
      ElMessage.success('删除成功')
    } catch (err) {
      ElMessage.error('删除失败')
      console.error(err)
    }
  }

  async function clearAllHistory() {
    try {
      await ElMessageBox.confirm('确定要清空所有历史记录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      await api.clearHistory()
      historyList.value = []
      ElMessage.success('已清空历史记录')
    } catch (err) {
      if (err !== 'cancel') {
        console.error(err)
      }
    }
  }

  return {
    historyList,
    loadHistory,
    saveToHistory,
    loadHistoryItem,
    removeHistory,
    clearAllHistory,
    formatDate
  }
}
