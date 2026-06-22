import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { FabricImage } from 'fabric'
import { PRESET_SIZES, LAYOUT_PRESETS } from '../utils/constants'

export function useLayout(canvasApi) {
  const currentLayout = ref('')
  const layoutPhotoSize = ref('1寸')
  const layoutRows = ref(4)
  const layoutCols = ref(2)
  const layoutGap = ref(10)
  const layoutBgColor = ref('#FFFFFF')
  const layoutPreview = ref(false)
  const layoutPaperWidth = ref(0)
  const layoutPaperHeight = ref(0)
  const layoutPresets = ref(LAYOUT_PRESETS)
  const presetSizes = ref(PRESET_SIZES)
  let layoutImage = null

  function selectLayoutPreset(preset) {
    currentLayout.value = preset.name
    layoutPhotoSize.value = preset.sizeName
    layoutRows.value = preset.rows
    layoutCols.value = preset.cols
  }

  function generateLayout(onComplete) {
    if (!canvasApi.hasImage.value || !canvasApi.getMainImage()) {
      ElMessage.warning('请先上传照片')
      return
    }

    const size = presetSizes.value.find(s => s.name === layoutPhotoSize.value)
    if (!size) {
      ElMessage.error('未找到对应尺寸')
      return
    }

    const photoWidth = size.width
    const photoHeight = size.height
    const paperWidth = photoWidth * layoutCols.value + layoutGap.value * (layoutCols.value + 1)
    const paperHeight = photoHeight * layoutRows.value + layoutGap.value * (layoutRows.value + 1)

    layoutPaperWidth.value = paperWidth
    layoutPaperHeight.value = paperHeight

    const tempCanvas = document.createElement('canvas')
    const ctx = tempCanvas.getContext('2d')
    tempCanvas.width = paperWidth
    tempCanvas.height = paperHeight

    ctx.fillStyle = layoutBgColor.value
    ctx.fillRect(0, 0, paperWidth, paperHeight)

    const photoCanvas = document.createElement('canvas')
    const photoCtx = photoCanvas.getContext('2d')
    photoCanvas.width = photoWidth
    photoCanvas.height = photoHeight

    const dataURL = canvasApi.toDataURL({ format: 'png', multiplier: 1 })
    const img = new Image()
    img.onload = () => {
      photoCtx.drawImage(img, 0, 0, photoWidth, photoHeight)

      for (let row = 0; row < layoutRows.value; row++) {
        for (let col = 0; col < layoutCols.value; col++) {
          const x = layoutGap.value + col * (photoWidth + layoutGap.value)
          const y = layoutGap.value + row * (photoHeight + layoutGap.value)
          ctx.drawImage(photoCanvas, x, y, photoWidth, photoHeight)
        }
      }

      const layoutDataURL = tempCanvas.toDataURL('image/png')
      FabricImage.fromURL(layoutDataURL).then((layoutImg) => {
        layoutImage = layoutImg
        layoutPreview.value = true
        showLayoutPreview(layoutImg, paperWidth, paperHeight)
        ElMessage.success('排版生成成功')
        onComplete && onComplete()
      })
    }
    img.src = dataURL
  }

  function showLayoutPreview(img, width, height) {
    canvasApi.getFabricCanvas().clear()
    canvasApi.setDimensions(width, height)
    img.set({
      left: width / 2,
      top: height / 2,
      originX: 'center',
      originY: 'center',
      selectable: false
    })
    canvasApi.addObject(img)
    canvasApi.renderAll()
  }

  function getLayoutImage() {
    return layoutImage
  }

  function clearLayoutPreview() {
    layoutPreview.value = false
    layoutImage = null
  }

  return {
    currentLayout,
    layoutPhotoSize,
    layoutRows,
    layoutCols,
    layoutGap,
    layoutBgColor,
    layoutPreview,
    layoutPaperWidth,
    layoutPaperHeight,
    layoutPresets,
    presetSizes,
    selectLayoutPreset,
    generateLayout,
    showLayoutPreview,
    getLayoutImage,
    clearLayoutPreview
  }
}
