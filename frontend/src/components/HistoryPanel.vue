<template>
  <div class="panel">
    <div class="form-item">
      <el-button @click="saveToHistory" :disabled="!hasImage" type="primary" style="width: 100%">
        <el-icon><Plus /></el-icon>
        保存到历史记录
      </el-button>
    </div>

    <el-divider>最近编辑</el-divider>

    <div v-if="historyList.length === 0" class="empty-history">
      <el-empty description="暂无历史记录" :image-size="80" />
    </div>

    <div v-else class="history-list">
      <div
        v-for="item in historyList"
        :key="item.id"
        class="history-item"
      >
        <div class="history-thumb" @click="loadHistoryItem(item)">
          <img v-if="item.thumbnail" :src="item.thumbnail" alt="缩略图" />
          <div v-else class="no-thumb">无缩略图</div>
        </div>
        <div class="history-info">
          <div class="history-name">{{ item.name }}</div>
          <div class="history-time">{{ formatDate(item.timestamp) }}</div>
        </div>
        <div class="history-actions">
          <el-button size="small" @click="loadHistoryItem(item)">
            编辑
          </el-button>
          <el-button size="small" type="danger" @click="removeHistory(item.id)">
            删除
          </el-button>
        </div>
      </div>
    </div>

    <el-button v-if="historyList.length > 0" type="danger" plain @click="clearAllHistory" style="width: 100%; margin-top: 10px">
      清空历史记录
    </el-button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  historyListApi: Object,
  hasImage: Boolean
})

const historyList = computed(() => props.historyListApi?.historyList?.value ?? [])
const formatDate = (timestamp) => props.historyListApi?.formatDate?.(timestamp) ?? ''

async function saveToHistory() {
  await props.historyListApi?.saveToHistory?.()
}

async function loadHistoryItem(item) {
  await props.historyListApi?.loadHistoryItem?.(item)
}

async function removeHistory(id) {
  await props.historyListApi?.removeHistory?.(id)
}

async function clearAllHistory() {
  await props.historyListApi?.clearAllHistory?.()
}
</script>
