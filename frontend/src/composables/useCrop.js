import { ref, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { FabricImage, Rect } from 'fabric'
import { PRESET_SIZES } from '../utils/constants'

export function useCrop(canvasApi, uploadApi) {
  const cropMode = ref('none')
  const currentPreset = ref('')
  const customWidth = ref(400)
  const customHeight = ref(600)
  const presetSizes = ref(PRESET_SIZES)
  let cropRect = null

  function selectPresetSize(size) {
    currentPreset.value = size.name
    cropMode.value = 'preset'
    createCropRect(size.width, size.height)
  }

  function applyCustomSize() {
    if (customWidth.value > 0 && customHeight.value > 0) {
      cropMode.value = 'custom'
      createCropRect(customWidth.value, customHeight.value)
    }
  }

  function createCropRect(width, height) {
    if (!canvasApi.hasImage.value || !canvasApi.getMainImage()) return

    if (cropRect) {
      canvasApi.removeObject(cropRect)
    }

    const mainImage = canvasApi.getMainImage()
    const imgRect = {
      left: mainImage.left - (mainImage.width * mainImage.scaleX) / 2,
      top: mainImage.top - (mainImage.height * mainImage.scaleY) / 2,
      width: mainImage.width * mainImage.scaleX,
      height: mainImage.height * mainImage.scaleY
    }

    const scale = Math.min(imgRect.width / width, imgRect.height / height, 1)
    const rectWidth = width * scale
    const rectHeight = height * scale

    const isPresetMode = cropMode.value === 'preset'

    cropRect = new Rect({
      left: imgRect.left + (imgRect.width - rectWidth) / 2,
      top: imgRect.top + (imgRect.height - rectHeight) / 2,
      width: rectWidth,
      height: rectHeight,
      fill: 'rgba(0, 0, 0, 0.3)',
      stroke: '#409eff',
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      selectable: !isPresetMode,
      hasControls: !isPresetMode,
      lockMovementX: isPresetMode,
      lockMovementY: isPresetMode,
      lockScalingX: isPresetMode,
      lockScalingY: isPresetMode,
      lockRotation: isPresetMode,
      lockUniScaling: true,
      transparentCorners: false,
      cornerColor: '#409eff',
      cornerSize: 10,
      hoverCursor: isPresetMode ? 'default' : 'move'
    })

    if (!isPresetMode) {
      cropRect.setControlsVisibility({
        mt: false,
        mb: false,
        ml: false,
        mr: false
      })
    } else {
      cropRect.setControlsVisibility({
        mt: false,
        mb: false,
        ml: false,
        mr: false,
        tl: false,
        tr: false,
        bl: false,
        br: false,
        mtr: false
      })
    }

    canvasApi.addObject(cropRect)
    if (!isPresetMode) {
      canvasApi.setActiveObject(cropRect)
    }
    canvasApi.renderAll()

    uploadApi.cropWidth.value = Math.round(rectWidth)
    uploadApi.cropHeight.value = Math.round(rectHeight)
  }

  function updateCropInfo() {
    if (cropRect) {
      uploadApi.cropWidth.value = Math.round(cropRect.width * cropRect.scaleX)
      uploadApi.cropHeight.value = Math.round(cropRect.height * cropRect.scaleY)
    }
  }

  function applyCrop() {
    if (!cropRect || !canvasApi.getMainImage()) {
      ElMessage.warning('请先创建裁剪框')
      return
    }

    const croppedCanvas = document.createElement('canvas')
    const ctx = croppedCanvas.getContext('2d')
    const cropX = cropRect.left
    const cropY = cropRect.top
    const cropW = cropRect.width * cropRect.scaleX
    const cropH = cropRect.height * cropRect.scaleY

    croppedCanvas.width = cropW
    croppedCanvas.height = cropH

    const tempCanvas = document.createElement('canvas')
    const tempCtx = tempCanvas.getContext('2d')
    tempCanvas.width = canvasApi.getDimensions().width
    tempCanvas.height = canvasApi.getDimensions().height

    const dataURL = canvasApi.toDataURL({
      format: 'png',
      multiplier: 1
    })

    const img = new Image()
    img.onload = () => {
      tempCtx.drawImage(img, 0, 0)
      ctx.drawImage(tempCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH)

      const newDataURL = croppedCanvas.toDataURL('image/png')
      FabricImage.fromURL(newDataURL).then((newImg) => {
        canvasApi.clearCanvas()

        newImg.set({
          left: cropW / 2,
          top: cropH / 2,
          originX: 'center',
          originY: 'center',
          selectable: true
        })

        canvasApi.setDimensions(cropW, cropH)
        canvasApi.setMainImage(newImg)
        canvasApi.addObject(newImg)
        canvasApi.renderAll()

        uploadApi.cropWidth.value = cropW
        uploadApi.cropHeight.value = cropH
        cropRect = null
        cropMode.value = 'none'
        currentPreset.value = ''

        ElMessage.success('裁剪完成')
      })
    }
    img.src = dataURL
  }

  function removeCropRect() {
    if (cropRect) {
      canvasApi.removeObject(cropRect)
      cropRect = null
      cropMode.value = 'none'
      currentPreset.value = ''
      canvasApi.renderAll()
      ElMessage.success('已删除裁剪框')
    }
  }

  function getCropRect() {
    return cropRect
  }

  function isCropRect(obj) {
    return obj === cropRect
  }

  return {
    cropMode,
    currentPreset,
    customWidth,
    customHeight,
    presetSizes,
    selectPresetSize,
    applyCustomSize,
    createCropRect,
    updateCropInfo,
    applyCrop,
    removeCropRect,
    getCropRect,
    isCropRect
  }
}
