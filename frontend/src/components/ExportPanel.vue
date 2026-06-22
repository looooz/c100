<template>
  <div class="panel">
    <div class="form-item">
      <label>导出格式</label>
      <el-radio-group v-model="exportFormat" size="small">
        <el-radio-button value="png">PNG</el-radio-button>
        <el-radio-button value="jpg">JPG</el-radio-button>
        <el-radio-button value="pdf">PDF</el-radio-button>
      </el-radio-group>
    </div>

    <div v-if="exportFormat === 'jpg'" class="form-item">
      <label>图片质量</label>
      <el-slider v-model="exportQuality" :min="0.1" :max="1" :step="0.05" />
      <div class="value-display">{{ Math.round(exportQuality * 100) }}%</div>
    </div>

    <div class="form-item">
      <label>导出尺寸</label>
      <el-radio-group v-model="exportScale" size="small">
        <el-radio-button :value="1">原尺寸</el-radio-button>
        <el-radio-button :value="2">2x</el-radio-button>
        <el-radio-button :value="3">3x</el-radio-button>
      </el-radio-group>
    </div>

    <div v-if="exportFormat === 'png'" class="form-item">
      <label>透明背景</label>
      <el-switch v-model="exportTransparent" />
    </div>

    <div class="export-preview">
      <div class="preview-label">预览信息</div>
      <div class="preview-info">
        尺寸: {{ exportWidth }} × {{ exportHeight }} px
      </div>
    </div>

    <el-button type="primary" size="large" @click="handleExport" style="width: 100%">
      <el-icon><Download /></el-icon>
      一键下载
    </el-button>

    <el-button v-if="hasLayoutPreview" @click="exportLayout" style="width: 100%; margin-top: 10px">
      导出版排版图片
    </el-button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  exportApi: Object,
  hasLayoutPreview: Boolean
})

const exportFormat = computed({
  get: () => props.exportApi?.exportFormat?.value ?? 'jpg',
  set: (val) => { if (props.exportApi?.exportFormat) props.exportApi.exportFormat.value = val }
})
const exportQuality = computed({
  get: () => props.exportApi?.exportQuality?.value ?? 0.9,
  set: (val) => { if (props.exportApi?.exportQuality) props.exportApi.exportQuality.value = val }
})
const exportScale = computed({
  get: () => props.exportApi?.exportScale?.value ?? 1,
  set: (val) => { if (props.exportApi?.exportScale) props.exportApi.exportScale.value = val }
})
const exportTransparent = computed({
  get: () => props.exportApi?.exportTransparent?.value ?? false,
  set: (val) => { if (props.exportApi?.exportTransparent) props.exportApi.exportTransparent.value = val }
})
const exportWidth = computed(() => props.exportApi?.exportWidth?.value ?? 0)
const exportHeight = computed(() => props.exportApi?.exportHeight?.value ?? 0)

function handleExport() {
  props.exportApi?.handleExport?.()
}

function exportLayout() {
  props.exportApi?.exportLayout?.()
}
</script>
