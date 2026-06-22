<template>
  <div class="panel">
    <div class="form-item">
      <label>抠图方式</label>
      <el-radio-group v-model="cutoutMode" size="small">
        <el-radio-button value="auto">智能抠图</el-radio-button>
        <el-radio-button value="manual">手动抠图</el-radio-button>
      </el-radio-group>
    </div>

    <div v-if="cutoutMode === 'auto'" class="form-item">
      <label>容差值</label>
      <el-slider v-model="tolerance" :min="5" :max="100" :step="5" />
    </div>

    <div v-if="cutoutMode === 'auto'" class="form-item">
      <el-button @click="autoCutout" :disabled="!hasImage" style="width: 100%">
        一键智能抠图
      </el-button>
    </div>

    <div v-if="cutoutMode === 'manual'" class="form-item">
      <label>画笔大小</label>
      <el-slider v-model="brushSize" :min="5" :max="100" />
    </div>

    <div v-if="cutoutMode === 'manual'" class="form-item">
      <el-button @click="toggleManualCutout" :disabled="!hasImage" :type="isManualCutoutMode ? 'warning' : ''" style="width: 100%">
        {{ isManualCutoutMode ? '退出涂抹模式' : '开始涂抹抠图' }}
      </el-button>
      <div class="tip">涂抹需要保留的区域，右键切换为擦除模式</div>
    </div>

    <el-divider>预设背景色</el-divider>

    <div class="color-grid">
      <div
        v-for="color in presetColors"
        :key="color.name"
        class="color-item"
        :class="{ active: currentBgColor === color.color }"
        @click="selectBgColor(color.color)"
      >
        <div class="color-preview" :style="{ backgroundColor: color.color }"></div>
        <div class="color-name">{{ color.name }}</div>
        <div class="color-purpose">{{ color.purpose }}</div>
      </div>
    </div>

    <div class="form-item">
      <label>自定义颜色</label>
      <el-color-picker v-model="customBgColor" @change="applyCustomBgColor" />
    </div>

    <div class="form-item">
      <label>透明背景</label>
      <el-switch v-model="transparentBg" @change="toggleTransparentBg" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  cutoutApi: Object,
  hasImage: Boolean
})

const emit = defineEmits(['state-change'])

const cutoutMode = computed({
  get: () => props.cutoutApi?.cutoutMode?.value ?? 'auto',
  set: (val) => { if (props.cutoutApi?.cutoutMode) props.cutoutApi.cutoutMode.value = val }
})
const tolerance = computed({
  get: () => props.cutoutApi?.tolerance?.value ?? 30,
  set: (val) => { if (props.cutoutApi?.tolerance) props.cutoutApi.tolerance.value = val }
})
const brushSize = computed({
  get: () => props.cutoutApi?.brushSize?.value ?? 20,
  set: (val) => { if (props.cutoutApi?.brushSize) props.cutoutApi.brushSize.value = val }
})
const isManualCutoutMode = computed(() => props.cutoutApi?.isManualCutoutMode?.value ?? false)
const currentBgColor = computed({
  get: () => props.cutoutApi?.currentBgColor?.value ?? '#FFFFFF',
  set: (val) => { if (props.cutoutApi?.currentBgColor) props.cutoutApi.currentBgColor.value = val }
})
const customBgColor = computed({
  get: () => props.cutoutApi?.customBgColor?.value ?? '#FFFFFF',
  set: (val) => { if (props.cutoutApi?.customBgColor) props.cutoutApi.customBgColor.value = val }
})
const transparentBg = computed({
  get: () => props.cutoutApi?.transparentBg?.value ?? false,
  set: (val) => { if (props.cutoutApi?.transparentBg) props.cutoutApi.transparentBg.value = val }
})
const presetColors = computed(() => props.cutoutApi?.presetColors?.value ?? [])

async function autoCutout() {
  const result = await props.cutoutApi?.autoCutout?.()
  if (result) {
    emit('state-change')
  }
}

function toggleManualCutout() {
  props.cutoutApi?.toggleManualCutout?.()
  emit('state-change')
}

function selectBgColor(color) {
  props.cutoutApi?.selectBgColor?.(color)
  emit('state-change')
}

function applyCustomBgColor(color) {
  props.cutoutApi?.applyCustomBgColor?.(color)
  emit('state-change')
}

function toggleTransparentBg(val) {
  props.cutoutApi?.toggleTransparentBg?.(val)
  emit('state-change')
}
</script>
