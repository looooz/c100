import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { FabricImage } from 'fabric'
import { PRESET_COLORS } from '../utils/constants'

export function useCutout(canvasApi) {
  const cutoutMode = ref('auto')
  const tolerance = ref(30)
  const brushSize = ref(20)
  const isManualCutoutMode = ref(false)
  const currentBgColor = ref('#FFFFFF')
  const customBgColor = ref('#FFFFFF')
  const transparentBg = ref(false)
  const presetColors = ref(PRESET_COLORS)

  let maskCanvas = null
  let isDrawing = false
  let lastX = 0
  let lastY = 0
  let isErasing = false
  let previewOverlayCanvas = null

  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 255, g: 255, b: 255 }
  }

  function getEdgeColor(imageData) {
    const data = imageData.data
    const width = imageData.width
    const height = imageData.height
    let r = 0, g = 0, b = 0, count = 0
    const sampleStep = Math.max(1, Math.floor(Math.min(width, height) / 50))

    for (let x = 0; x < width; x += sampleStep) {
      const i = x * 4
      r += data[i]; g += data[i + 1]; b += data[i + 2]; count++
    }
    for (let x = 0; x < width; x += sampleStep) {
      const i = ((height - 1) * width + x) * 4
      r += data[i]; g += data[i + 1]; b += data[i + 2]; count++
    }
    for (let y = 0; y < height; y += sampleStep) {
      const i = (y * width) * 4
      r += data[i]; g += data[i + 1]; b += data[i + 2]; count++
    }
    for (let y = 0; y < height; y += sampleStep) {
      const i = (y * width + width - 1) * 4
      r += data[i]; g += data[i + 1]; b += data[i + 2]; count++
    }

    return '#' + [r, g, b].map(x => {
      const hex = Math.round(x / count).toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }).join('')
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
  }

  function getImagePixelData() {
    const mainImage = canvasApi.getMainImage()
    if (!mainImage) return null

    const imgWidth = mainImage.width
    const imgHeight = mainImage.height

    const renderCanvas = document.createElement('canvas')
    renderCanvas.width = imgWidth
    renderCanvas.height = imgHeight
    const renderCtx = renderCanvas.getContext('2d')

    const element = mainImage.getElement ? mainImage.getElement() : mainImage._element
    if (!element) return null

    renderCtx.drawImage(element, 0, 0, imgWidth, imgHeight)
    return {
      canvas: renderCanvas,
      ctx: renderCtx,
      imageData: renderCtx.getImageData(0, 0, imgWidth, imgHeight),
      width: imgWidth,
      height: imgHeight
    }
  }

  async function autoCutout() {
    const mainImage = canvasApi.getMainImage()
    if (!mainImage) {
      ElMessage.warning('请先上传照片')
      return
    }

    try {
      const pixelData = getImagePixelData()
      if (!pixelData) {
        ElMessage.error('无法获取图像数据')
        return
      }

      const { canvas: renderCanvas, ctx: renderCtx, imageData, width: imgWidth, height: imgHeight } = pixelData
      const bgColor = getEdgeColor(imageData)

      const data = imageData.data
      const target = hexToRgb(bgColor)
      const tol = tolerance.value

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        const dr = r - target.r
        const dg = g - target.g
        const db = b - target.b
        const distance = Math.sqrt(dr * dr + dg * dg + db * db)

        if (distance < tol) {
          data[i + 3] = 0
        }
      }

      renderCtx.putImageData(imageData, 0, 0)

      const newDataURL = renderCanvas.toDataURL('image/png')
      const newImg = await FabricImage.fromURL(newDataURL)

      await canvasApi.replaceMainImage(newImg, true)
      applyBgColorSettings()

      ElMessage.success('智能抠图完成')
      return true
    } catch (err) {
      ElMessage.error('抠图失败')
      console.error('autoCutout error:', err)
      return false
    }
  }

  function initMaskCanvas() {
    const mainImage = canvasApi.getMainImage()
    if (!mainImage) return

    const imgWidth = mainImage.width
    const imgHeight = mainImage.height
    maskCanvas = document.createElement('canvas')
    maskCanvas.width = imgWidth
    maskCanvas.height = imgHeight
    const ctx = maskCanvas.getContext('2d')
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, imgWidth, imgHeight)
  }

  function toggleManualCutout() {
    const mainImage = canvasApi.getMainImage()
    if (!mainImage) {
      ElMessage.warning('请先上传照片')
      return
    }

    isManualCutoutMode.value = !isManualCutoutMode.value
    if (isManualCutoutMode.value) {
      initMaskCanvas()
      ElMessage.info('涂抹需要保留的区域，右键切换擦除模式')
    } else {
      applyMaskCutout()
    }
  }

  function canvasToMaskCoord(pointerX, pointerY) {
    const imgRect = canvasApi.getImageRect()
    if (imgRect.width <= 0 || imgRect.height <= 0) return null

    const maskX = (pointerX - imgRect.left) / imgRect.width * maskCanvas.width
    const maskY = (pointerY - imgRect.top) / imgRect.height * maskCanvas.height

    if (maskX < 0 || maskX > maskCanvas.width || maskY < 0 || maskY > maskCanvas.height) {
      return null
    }
    return { x: maskX, y: maskY }
  }

  function handleMouseDown(opt) {
    if (!isManualCutoutMode.value || !canvasApi.getMainImage() || !maskCanvas) return false

    const pointer = canvasApi.getFabricCanvas().getPointer(opt.e)
    const coord = canvasToMaskCoord(pointer.x, pointer.y)
    if (!coord) return false

    isDrawing = true
    isErasing = opt.e.button === 2
    lastX = coord.x
    lastY = coord.y
    drawOnMask(coord.x, coord.y)
    return true
  }

  function handleMouseMove(opt) {
    if (!isDrawing || !isManualCutoutMode.value || !maskCanvas) return false

    const pointer = canvasApi.getFabricCanvas().getPointer(opt.e)
    const coord = canvasToMaskCoord(pointer.x, pointer.y)
    if (!coord) return false

    drawOnMaskLine(lastX, lastY, coord.x, coord.y)
    lastX = coord.x
    lastY = coord.y
    return true
  }

  function handleMouseUp() {
    if (!isDrawing) return false
    isDrawing = false
    return true
  }

  function drawOnMask(x, y) {
    if (!maskCanvas) return
    const ctx = maskCanvas.getContext('2d')
    ctx.fillStyle = isErasing ? '#000000' : '#ffffff'
    ctx.beginPath()
    ctx.arc(x, y, brushSize.value, 0, Math.PI * 2)
    ctx.fill()
  }

  function drawOnMaskLine(x1, y1, x2, y2) {
    if (!maskCanvas) return
    const ctx = maskCanvas.getContext('2d')
    ctx.strokeStyle = isErasing ? '#000000' : '#ffffff'
    ctx.lineWidth = brushSize.value * 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }

  async function applyMaskCutout() {
    if (!maskCanvas || !canvasApi.getMainImage()) return

    try {
      const mainImage = canvasApi.getMainImage()
      const pixelData = getImagePixelData()
      if (!pixelData) {
        ElMessage.error('无法获取图像数据')
        return
      }

      const { canvas: tempCanvas, ctx, width: imgWidth, height: imgHeight } = pixelData

      ctx.globalCompositeOperation = 'destination-in'
      ctx.drawImage(maskCanvas, 0, 0, imgWidth, imgHeight)
      ctx.globalCompositeOperation = 'source-over'

      const newDataURL = tempCanvas.toDataURL('image/png')
      const newImg = await FabricImage.fromURL(newDataURL)

      await canvasApi.replaceMainImage(newImg, true)

      isManualCutoutMode.value = false
      maskCanvas = null
      applyBgColorSettings()

      ElMessage.success('手动抠图完成')
    } catch (e) {
      console.error('applyMaskCutout error:', e)
      ElMessage.error('手动抠图失败')
    }
  }

  function selectBgColor(color) {
    currentBgColor.value = color
    customBgColor.value = color
    transparentBg.value = false
    applyBgColor()
  }

  function applyCustomBgColor(color) {
    currentBgColor.value = color
    transparentBg.value = false
    applyBgColor()
  }

  function applyBgColor() {
    if (!transparentBg.value) {
      canvasApi.setBackgroundColor(currentBgColor.value)
    }
  }

  function applyBgColorSettings() {
    if (!transparentBg.value) {
      canvasApi.setBackgroundColor(currentBgColor.value)
    } else {
      canvasApi.setBackgroundColor('transparent')
    }
  }

  function toggleTransparentBg(val) {
    if (val) {
      canvasApi.setBackgroundColor('transparent')
    } else {
      canvasApi.setBackgroundColor(currentBgColor.value)
    }
  }

  function isInManualMode() {
    return isManualCutoutMode.value
  }

  return {
    cutoutMode,
    tolerance,
    brushSize,
    isManualCutoutMode,
    currentBgColor,
    customBgColor,
    transparentBg,
    presetColors,
    autoCutout,
    toggleManualCutout,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    selectBgColor,
    applyCustomBgColor,
    applyBgColor,
    toggleTransparentBg,
    isInManualMode
  }
}
