<template>
  <div class="panel">
    <div class="form-item">
      <label>排版预设</label>
      <div class="layout-presets">
        <div
          v-for="preset in layoutPresets"
          :key="preset.name"
          class="layout-preset-item"
          :class="{ active: currentLayout === preset.name }"
          @click="selectLayoutPreset(preset)"
        >
          {{ preset.name }}
        </div>
      </div>
    </div>

    <el-divider>自定义排版</el-divider>

    <div class="form-item">
      <label>照片尺寸</label>
      <el-select v-model="layoutPhotoSize" size="small" style="width: 100%">
        <el-option
          v-for="size in presetSizes"
          :key="size.name"
          :label="size.name + ' (' + size.width + '×' + size.height + ')'"
          :value="size.name"
        />
      </el-select>
    </div>

    <div class="form-item">
      <label>行数</label>
      <el-input-number v-model="layoutRows" :min="1" :max="10" size="small" />
    </div>

    <div class="form-item">
      <label>列数</label>
      <el-input-number v-model="layoutCols" :min="1" :max="10" size="small" />
    </div>

    <div class="form-item">
      <label>间距 (px)</label>
      <el-slider v-model="layoutGap" :min="0" :max="50" />
    </div>

    <div class="form-item">
      <label>纸张背景色</label>
      <el-color-picker v-model="layoutBgColor" />
    </div>

    <el-button type="primary" @click="generateLayout" :disabled="!hasImage" style="width: 100%">
      生成排版预览
    </el-button>

    <div v-if="layoutPreview" class="layout-info">
      <el-divider>排版信息</el-divider>
      <div>纸张尺寸: {{ layoutPaperWidth }} × {{ layoutPaperHeight }} px</div>
      <div>照片数量: {{ layoutRows * layoutCols }} 张</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  layoutApi: Object,
  hasImage: Boolean
})

const emit = defineEmits(['state-change'])

const currentLayout = computed({
  get: () => props.layoutApi?.currentLayout?.value ?? '',
  set: (val) => { if (props.layoutApi?.currentLayout) props.layoutApi.currentLayout.value = val }
})
const layoutPhotoSize = computed({
  get: () => props.layoutApi?.layoutPhotoSize?.value ?? '1寸',
  set: (val) => { if (props.layoutApi?.layoutPhotoSize) props.layoutApi.layoutPhotoSize.value = val }
})
const layoutRows = computed({
  get: () => props.layoutApi?.layoutRows?.value ?? 4,
  set: (val) => { if (props.layoutApi?.layoutRows) props.layoutApi.layoutRows.value = val }
})
const layoutCols = computed({
  get: () => props.layoutApi?.layoutCols?.value ?? 2,
  set: (val) => { if (props.layoutApi?.layoutCols) props.layoutApi.layoutCols.value = val }
})
const layoutGap = computed({
  get: () => props.layoutApi?.layoutGap?.value ?? 10,
  set: (val) => { if (props.layoutApi?.layoutGap) props.layoutApi.layoutGap.value = val }
})
const layoutBgColor = computed({
  get: () => props.layoutApi?.layoutBgColor?.value ?? '#FFFFFF',
  set: (val) => { if (props.layoutApi?.layoutBgColor) props.layoutApi.layoutBgColor.value = val }
})
const layoutPreview = computed(() => props.layoutApi?.layoutPreview?.value ?? false)
const layoutPaperWidth = computed(() => props.layoutApi?.layoutPaperWidth?.value ?? 0)
const layoutPaperHeight = computed(() => props.layoutApi?.layoutPaperHeight?.value ?? 0)
const layoutPresets = computed(() => props.layoutApi?.layoutPresets?.value ?? [])
const presetSizes = computed(() => props.layoutApi?.presetSizes?.value ?? [])

function selectLayoutPreset(preset) {
  props.layoutApi?.selectLayoutPreset?.(preset)
}

function generateLayout() {
  props.layoutApi?.generateLayout?.(() => emit('state-change'))
}
</script>
