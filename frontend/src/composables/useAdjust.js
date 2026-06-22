import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { filters } from 'fabric'

const { Brightness, Contrast, Saturation } = filters

export function useAdjust(canvasApi) {
  const brightness = ref(0)
  const contrast = ref(0)
  const saturation = ref(0)
  const borderWidth = ref(0)
  const borderColor = ref('#000000')

  let adjustSaveTimer = null

  function applyAdjustments(onChange) {
    const mainImage = canvasApi.getMainImage()
    if (!mainImage || mainImage.type !== 'image') return

    mainImage.filters = []
    if (brightness.value !== 0) {
      mainImage.filters.push(new Brightness({ brightness: brightness.value / 100 }))
    }
    if (contrast.value !== 0) {
      mainImage.filters.push(new Contrast({ contrast: contrast.value / 100 }))
    }
    if (saturation.value !== 0) {
      mainImage.filters.push(new Saturation({ saturation: saturation.value / 100 }))
    }
    mainImage.applyFilters()
    canvasApi.renderAll()

    if (adjustSaveTimer) clearTimeout(adjustSaveTimer)
    adjustSaveTimer = setTimeout(() => {
      onChange && onChange()
    }, 500)
  }

  function resetAdjustments(onReset) {
    brightness.value = 0
    contrast.value = 0
    saturation.value = 0
    const mainImage = canvasApi.getMainImage()
    if (mainImage) {
      mainImage.filters = []
      mainImage.applyFilters()
      canvasApi.renderAll()
      onReset && onReset()
    }
  }

  return {
    brightness,
    contrast,
    saturation,
    borderWidth,
    borderColor,
    applyAdjustments,
    resetAdjustments
  }
}
