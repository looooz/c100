<template>
  <div class="panel">
    <div
      class="upload-area"
      :class="{ 'drag-over': isDragOver }"
      @click="triggerUpload"
      @dragover.prevent="isDragOver = true"
      @dragleave="isDragOver = false"
      @drop.prevent="handleDrop"
    >
      <el-icon class="upload-icon" :size="40"><UploadFilled /></el-icon>
      <div class="upload-text">点击或拖拽上传照片</div>
      <div class="upload-tip">支持 JPG、PNG、WebP 格式</div>
      <input
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style="display: none"
        @change="handleFileSelect"
      />
    </div>

    <el-divider>裁剪操作</el-divider>

    <div class="form-item">
      <label>裁剪模式</label>
      <el-radio-group v-model="cropMode" size="small">
        <el-radio-button value="none">自由</el-radio-button>
        <el-radio-button value="preset">预设</el-radio-button>
        <el-radio-button value="custom">自定义</el-radio-button>
      </el-radio-group>
    </div>

    <div v-if="cropMode === 'preset'" class="form-item">
      <label>预设尺寸</label>
      <div class="size-grid">
        <div
          v-for="size in presetSizes"
          :key="size.name"
          class="size-item"
          :class="{ active: currentPreset === size.name }"
          @click="selectPresetSize(size)"
        >
          <div class="size-name">{{ size.name }}</div>
          <div class="size-desc">{{ size.width }}×{{ size.height }}px</div>
          <div class="size-mm">{{ size.mmWidth }}×{{ size.mmHeight }}mm</div>
        </div>
      </div>
    </div>

    <div v-if="cropMode === 'custom'" class="form-item">
      <label>自定义尺寸</label>
      <div class="custom-size">
        <el-input-number v-model="customWidth" :min="50" :max="2000" size="small" placeholder="宽" />
        <span class="x">×</span>
        <el-input-number v-model="customHeight" :min="50" :max="2000" size="small" placeholder="高" />
      </div>
      <el-button size="small" @click="applyCustomSize" style="margin-top: 8px">应用裁剪</el-button>
    </div>

    <div v-if="hasImage" class="form-item">
      <label>裁剪框信息</label>
      <div class="crop-info">
        <span>宽度: {{ cropWidth }}px</span>
        <span>高度: {{ cropHeight }}px</span>
      </div>
    </div>

    <el-button v-if="hasImage" type="success" @click="applyCrop" style="width: 100%">
      确认裁剪
    </el-button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  uploadApi: Object,
  cropApi: Object,
  hasImage: Boolean
})

const emit = defineEmits(['state-change'])

const fileInput = computed(() => props.uploadApi?.fileInput)
const isDragOver = computed({
  get: () => props.uploadApi?.isDragOver?.value ?? false,
  set: (val) => { if (props.uploadApi?.isDragOver) props.uploadApi.isDragOver.value = val }
})
const cropMode = computed({
  get: () => props.cropApi?.cropMode?.value ?? 'none',
  set: (val) => { if (props.cropApi?.cropMode) props.cropApi.cropMode.value = val }
})
const currentPreset = computed({
  get: () => props.cropApi?.currentPreset?.value ?? '',
  set: (val) => { if (props.cropApi?.currentPreset) props.cropApi.currentPreset.value = val }
})
const customWidth = computed({
  get: () => props.cropApi?.customWidth?.value ?? 400,
  set: (val) => { if (props.cropApi?.customWidth) props.cropApi.customWidth.value = val }
})
const customHeight = computed({
  get: () => props.cropApi?.customHeight?.value ?? 600,
  set: (val) => { if (props.cropApi?.customHeight) props.cropApi.customHeight.value = val }
})
const presetSizes = computed(() => props.cropApi?.presetSizes?.value ?? [])
const cropWidth = computed(() => props.uploadApi?.cropWidth?.value ?? 0)
const cropHeight = computed(() => props.uploadApi?.cropHeight?.value ?? 0)

function triggerUpload() {
  props.uploadApi?.triggerUpload?.()
}

function handleFileSelect(e) {
  props.uploadApi?.handleFileSelect?.(e)
  emit('state-change')
}

function handleDrop(e) {
  props.uploadApi?.handleDrop?.(e)
  emit('state-change')
}

function selectPresetSize(size) {
  props.cropApi?.selectPresetSize?.(size)
  emit('state-change')
}

function applyCustomSize() {
  props.cropApi?.applyCustomSize?.()
  emit('state-change')
}

function applyCrop() {
  props.cropApi?.applyCrop?.()
  emit('state-change')
}
</script>
