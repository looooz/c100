<template>
  <div class="app-container">
    <header class="app-header">
      <div class="header-title">
        <el-icon :size="24" color="#409eff"><Picture /></el-icon>
        <span>在线证件照制作工具</span>
      </div>
      <div class="header-actions">
        <el-button @click="rotateLeft" :disabled="!hasImage" size="small">
          <el-icon><RefreshLeft /></el-icon>
          <span class="hidden-sm">左旋90°</span>
        </el-button>
        <el-button @click="rotateRight" :disabled="!hasImage" size="small">
          <el-icon><RefreshRight /></el-icon>
          <span class="hidden-sm">右旋90°</span>
        </el-button>
        <el-button @click="flipHorizontal" :disabled="!hasImage" size="small">
          水平翻转
        </el-button>
        <el-button @click="flipVertical" :disabled="!hasImage" size="small">
          垂直翻转
        </el-button>
        <el-button type="primary" @click="handleExport" size="small">
          <el-icon><Download /></el-icon>
          <span>导出照片</span>
        </el-button>
      </div>
    </header>

    <div class="app-body">
      <div class="sidebar">
        <div class="sidebar-nav">
          <div
            v-for="tab in tabs"
            :key="tab.name"
            class="nav-item"
            :class="{ active: activeTab === tab.name }"
            @click="activeTab = tab.name"
          >
            <el-icon :size="20"><component :is="tab.icon" /></el-icon>
            <span>{{ tab.label }}</span>
          </div>
        </div>

        <div class="sidebar-content">
          <UploadPanel
            v-show="activeTab === 'upload'"
            :upload-api="uploadApi"
            :crop-api="cropApi"
            :has-image="hasImage"
            @state-change="saveState"
          />
          <BackgroundPanel
            v-show="activeTab === 'background'"
            :cutout-api="cutoutApi"
            :has-image="hasImage"
            @state-change="saveState"
          />
          <AdjustPanel
            v-show="activeTab === 'adjust'"
            :adjust-api="adjustApi"
            :transform-api="transformApi"
            :has-image="hasImage"
            @state-change="saveState"
          />
          <LayoutPanel
            v-show="activeTab === 'layout'"
            :layout-api="layoutApi"
            :has-image="hasImage"
            @state-change="saveState"
          />
          <ExportPanel
            v-show="activeTab === 'export'"
            :export-api="exportApi"
            :has-layout-preview="layoutApi.layoutPreview.value"
          />
          <HistoryPanel
            v-show="activeTab === 'history'"
            :history-list-api="historyListApi"
            :has-image="hasImage"
          />
        </div>
      </div>

      <main class="canvas-area">
        <div class="canvas-scroll">
          <div class="canvas-wrapper" :style="canvasWrapperStyle">
            <canvas ref="canvasRef" id="fabric-canvas" @contextmenu.prevent></canvas>
          </div>
        </div>
        
        <div v-if="!hasImage" class="empty-canvas-tip">
          <el-icon :size="64" color="#c0c4cc"><Picture /></el-icon>
          <p>请上传照片开始制作证件照</p>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, markRaw, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Upload,
  Brush,
  Setting,
  Grid,
  Download,
  Clock,
  UploadFilled,
  RefreshLeft,
  RefreshRight,
  Picture,
  Plus
} from '@element-plus/icons-vue'

import { useCanvas } from './composables/useCanvas'
import { useUpload } from './composables/useUpload'
import { useCrop } from './composables/useCrop'
import { useCutout } from './composables/useCutout'
import { useAdjust } from './composables/useAdjust'
import { useTransform } from './composables/useTransform'
import { useLayout } from './composables/useLayout'
import { useExport } from './composables/useExport'
import { useHistoryState } from './composables/useHistoryState'
import { useHistoryList } from './composables/useHistoryList'

import UploadPanel from './components/UploadPanel.vue'
import BackgroundPanel from './components/BackgroundPanel.vue'
import AdjustPanel from './components/AdjustPanel.vue'
import LayoutPanel from './components/LayoutPanel.vue'
import ExportPanel from './components/ExportPanel.vue'
import HistoryPanel from './components/HistoryPanel.vue'

const tabs = [
  { name: 'upload', label: '上传', icon: markRaw(Upload) },
  { name: 'background', label: '背景', icon: markRaw(Brush) },
  { name: 'adjust', label: '调整', icon: markRaw(Setting) },
  { name: 'layout', label: '排版', icon: markRaw(Grid) },
  { name: 'export', label: '导出', icon: markRaw(Download) },
  { name: 'history', label: '历史', icon: markRaw(Clock) }
]

const activeTab = ref('upload')

const canvasApi = useCanvas()
const uploadApi = useUpload(canvasApi)
const cropApi = useCrop(canvasApi, uploadApi)
const cutoutApi = useCutout(canvasApi)
const adjustApi = useAdjust(canvasApi)
const transformApi = useTransform(canvasApi)
const layoutApi = useLayout(canvasApi)
const exportApi = useExport(canvasApi, layoutApi)
const historyStateApi = useHistoryState(canvasApi, adjustApi)
const historyListApi = useHistoryList(canvasApi)

const { canvasRef, hasImage, canvasWrapperStyle } = canvasApi
const { saveState } = historyStateApi

function handleObjectModified(opt) {
  cropApi.updateCropInfo()
  canvasApi.handleObjectModified(opt, () => {
    nextTick(() => saveState())
  })
  if (cropApi.isCropRect(opt.target)) {
    nextTick(() => saveState())
  }
}

function handleObjectMoving(opt) {
  cropApi.updateCropInfo()
  canvasApi.handleObjectMoving(opt)
}

function handleMouseDown(opt) {
  const handled = cutoutApi.handleMouseDown(opt)
  if (handled) {
    canvasApi.getFabricCanvas().discardActiveObject()
    canvasApi.renderAll()
  }
}

function handleMouseMove(opt) {
  cutoutApi.handleMouseMove(opt)
}

function handleMouseUp() {
  cutoutApi.handleMouseUp()
}

function handleKeyDown(e) {
  const isCtrl = e.ctrlKey || e.metaKey
  const isShift = e.shiftKey
  const key = e.key.toLowerCase()

  if (isCtrl && key === 'z' && !isShift) {
    e.preventDefault()
    historyStateApi.undo()
  } else if ((isCtrl && key === 'y') || (isCtrl && isShift && key === 'z')) {
    e.preventDefault()
    historyStateApi.redo()
  } else if (isCtrl && key === 's') {
    e.preventDefault()
    exportApi.handleExport()
  } else if (isCtrl && key === 'r' && !isShift) {
    e.preventDefault()
    if (hasImage.value) {
      rotateRight()
    }
  } else if (isCtrl && isShift && key === 'r') {
    e.preventDefault()
    if (hasImage.value) {
      rotateLeft()
    }
  } else if (isCtrl && key === 'h') {
    e.preventDefault()
    if (hasImage.value) {
      flipHorizontal()
    }
  } else if (isCtrl && key === 'v' && !isShift) {
    e.preventDefault()
    if (hasImage.value) {
      flipVertical()
    }
  } else if (key === 'delete' || key === 'backspace') {
    if (hasImage.value && !cutoutApi.isInManualMode()) {
      const active = canvasApi.getActiveObject()
      if (active && cropApi.isCropRect(active)) {
        e.preventDefault()
        cropApi.removeCropRect()
        nextTick(() => saveState())
      }
    }
  }
}

function rotateLeft() {
  transformApi.rotateLeft(() => nextTick(() => saveState()))
}

function rotateRight() {
  transformApi.rotateRight(() => nextTick(() => saveState()))
}

function flipHorizontal() {
  transformApi.flipHorizontal(() => nextTick(() => saveState()))
}

function flipVertical() {
  transformApi.flipVertical(() => nextTick(() => saveState()))
}

function handleExport() {
  exportApi.handleExport()
}

onMounted(async () => {
  await nextTick()
  const fabricCanvas = canvasApi.initCanvas('fabric-canvas')
  uploadApi.fileInput.value = document.querySelector('input[type="file"]')

  fabricCanvas.on('object:modified', handleObjectModified)
  fabricCanvas.on('object:scaling', cropApi.updateCropInfo)
  fabricCanvas.on('object:moving', handleObjectMoving)
  fabricCanvas.on('mouse:down', handleMouseDown)
  fabricCanvas.on('mouse:move', handleMouseMove)
  fabricCanvas.on('mouse:up', handleMouseUp)

  historyListApi.loadHistory()
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  background-color: #f5f7fa;
  overflow: hidden;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  height: 56px;
  padding: 0 20px;
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
  z-index: 10;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.app-body {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.sidebar {
  display: flex;
  width: 360px;
  flex-shrink: 0;
  background-color: #fff;
  border-right: 1px solid #e4e7ed;
  overflow: hidden;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  width: 80px;
  flex-shrink: 0;
  background-color: #fafafa;
  border-right: 1px solid #e4e7ed;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 72px;
  font-size: 12px;
  color: #606266;
  cursor: pointer;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.nav-item:hover {
  background-color: #f0f7ff;
  color: #409eff;
}

.nav-item.active {
  background-color: #ecf5ff;
  color: #409eff;
  border-left-color: #409eff;
  font-weight: 500;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.panel {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-item label {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
}

.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  background-color: #fafafa;
}

.upload-area:hover,
.upload-area.drag-over {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.upload-icon {
  color: #409eff;
  margin-bottom: 8px;
}

.upload-text {
  font-size: 14px;
  color: #606266;
  margin-bottom: 4px;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
}

.size-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.size-item {
  padding: 10px 6px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s;
}

.size-item:hover {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.size-item.active {
  border-color: #409eff;
  background-color: #409eff;
  color: #fff;
}

.size-name {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 2px;
}

.size-desc {
  font-size: 11px;
  opacity: 0.9;
}

.size-mm {
  font-size: 10px;
  opacity: 0.8;
}

.custom-size {
  display: flex;
  align-items: center;
  gap: 8px;
}

.custom-size .x {
  color: #909399;
}

.crop-info {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #909399;
  padding: 8px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.color-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.color-item {
  padding: 8px;
  border: 2px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.color-item:hover {
  border-color: #dcdfe6;
}

.color-item.active {
  border-color: #409eff;
}

.color-preview {
  width: 100%;
  height: 30px;
  border-radius: 4px;
  margin-bottom: 6px;
  border: 1px solid #e4e7ed;
}

.color-name {
  font-size: 13px;
  font-weight: 500;
}

.color-purpose {
  font-size: 10px;
  color: #909399;
}

.tip {
  font-size: 12px;
  color: #909399;
  margin-top: 6px;
}

.value-display {
  text-align: center;
  font-size: 12px;
  color: #909399;
  margin-top: -4px;
}

.btn-group {
  display: flex;
  gap: 8px;
}

.btn-group .el-button {
  flex: 1;
}

.layout-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.layout-preset-item {
  padding: 8px 12px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.layout-preset-item:hover {
  border-color: #409eff;
  color: #409eff;
}

.layout-preset-item.active {
  background-color: #409eff;
  border-color: #409eff;
  color: #fff;
}

.layout-info {
  font-size: 12px;
  color: #606266;
  line-height: 1.8;
}

.export-preview {
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 6px;
}

.preview-label {
  font-size: 13px;
  font-weight: 500;
  color: #606266;
  margin-bottom: 8px;
}

.preview-info {
  font-size: 12px;
  color: #909399;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 400px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  gap: 10px;
  padding: 10px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  align-items: center;
}

.history-thumb {
  width: 50px;
  height: 60px;
  border-radius: 4px;
  overflow: hidden;
  background-color: #f0f2f5;
  cursor: pointer;
  flex-shrink: 0;
}

.history-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-thumb {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #c0c4cc;
}

.history-info {
  flex: 1;
  min-width: 0;
}

.history-name {
  font-size: 13px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-time {
  font-size: 11px;
  color: #909399;
  margin-top: 2px;
}

.history-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
}

.empty-history {
  padding: 20px 0;
}

.canvas-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f2f5;
  background-image:
    linear-gradient(45deg, #e4e7ed 25%, transparent 25%),
    linear-gradient(-45deg, #e4e7ed 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #e4e7ed 75%),
    linear-gradient(-45deg, transparent 75%, #e4e7ed 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
  position: relative;
  overflow: hidden;
}

.canvas-scroll {
  width: 100%;
  height: 100%;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30px;
  box-sizing: border-box;
}

.canvas-wrapper {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  background-color: #fff;
  flex-shrink: 0;
}

#fabric-canvas {
  display: block;
}

.empty-canvas-tip {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #c0c4cc;
  pointer-events: none;
}

.empty-canvas-tip p {
  margin-top: 16px;
  font-size: 16px;
}

@media (max-width: 1200px) {
  .sidebar {
    width: 320px;
  }
  .header-actions .hidden-sm {
    display: none;
  }
}
</style>
