<template>
  <div class="panel">
    <div class="form-item">
      <label>亮度</label>
      <el-slider v-model="brightness" :min="-100" :max="100" :step="1" @change="applyAdjustments" />
      <div class="value-display">{{ brightness > 0 ? '+' : '' }}{{ brightness }}</div>
    </div>

    <div class="form-item">
      <label>对比度</label>
      <el-slider v-model="contrast" :min="-100" :max="100" :step="1" @change="applyAdjustments" />
      <div class="value-display">{{ contrast > 0 ? '+' : '' }}{{ contrast }}</div>
    </div>

    <div class="form-item">
      <label>饱和度</label>
      <el-slider v-model="saturation" :min="-100" :max="100" :step="1" @change="applyAdjustments" />
      <div class="value-display">{{ saturation > 0 ? '+' : '' }}{{ saturation }}</div>
    </div>

    <el-button @click="resetAdjustments" style="width: 100%">
      重置调整
    </el-button>

    <el-divider>旋转与翻转</el-divider>

    <div class="btn-group">
      <el-button @click="rotateLeft" :disabled="!hasImage">
        <el-icon><RefreshLeft /></el-icon>
        左90°
      </el-button>
      <el-button @click="rotateRight" :disabled="!hasImage">
        <el-icon><RefreshRight /></el-icon>
        右90°
      </el-button>
    </div>

    <div class="btn-group">
      <el-button @click="flipHorizontal" :disabled="!hasImage">
        水平翻转
      </el-button>
      <el-button @click="flipVertical" :disabled="!hasImage">
        垂直翻转
      </el-button>
    </div>

    <el-divider>裁切边框</el-divider>

    <div class="form-item">
      <label>边框宽度</label>
      <el-slider v-model="borderWidth" :min="0" :max="50" />
    </div>

    <div class="form-item">
      <label>边框颜色</label>
      <el-color-picker v-model="borderColor" />
    </div>

    <el-button @click="applyBorder" :disabled="!hasImage" style="width: 100%">
      应用边框
    </el-button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  adjustApi: Object,
  transformApi: Object,
  hasImage: Boolean
})

const emit = defineEmits(['state-change'])

const brightness = computed({
  get: () => props.adjustApi?.brightness?.value ?? 0,
  set: (val) => { if (props.adjustApi?.brightness) props.adjustApi.brightness.value = val }
})
const contrast = computed({
  get: () => props.adjustApi?.contrast?.value ?? 0,
  set: (val) => { if (props.adjustApi?.contrast) props.adjustApi.contrast.value = val }
})
const saturation = computed({
  get: () => props.adjustApi?.saturation?.value ?? 0,
  set: (val) => { if (props.adjustApi?.saturation) props.adjustApi.saturation.value = val }
})
const borderWidth = computed({
  get: () => props.adjustApi?.borderWidth?.value ?? 0,
  set: (val) => { if (props.adjustApi?.borderWidth) props.adjustApi.borderWidth.value = val }
})
const borderColor = computed({
  get: () => props.adjustApi?.borderColor?.value ?? '#000000',
  set: (val) => { if (props.adjustApi?.borderColor) props.adjustApi.borderColor.value = val }
})

function applyAdjustments() {
  props.adjustApi?.applyAdjustments?.(() => emit('state-change'))
}

function resetAdjustments() {
  props.adjustApi?.resetAdjustments?.(() => emit('state-change'))
}

function rotateLeft() {
  props.transformApi?.rotateLeft?.(() => emit('state-change'))
}

function rotateRight() {
  props.transformApi?.rotateRight?.(() => emit('state-change'))
}

function flipHorizontal() {
  props.transformApi?.flipHorizontal?.(() => emit('state-change'))
}

function flipVertical() {
  props.transformApi?.flipVertical?.(() => emit('state-change'))
}

function applyBorder() {
  props.transformApi?.applyBorder?.(
    borderWidth.value,
    borderColor.value,
    () => emit('state-change')
  )
}
</script>
