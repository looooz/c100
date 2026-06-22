import { ElMessage } from 'element-plus'
import { Rect } from 'fabric'

export function useTransform(canvasApi) {
  function rotateLeft(onChange) {
    const mainImage = canvasApi.getMainImage()
    if (!mainImage) return
    const currentAngle = mainImage.angle || 0
    mainImage.set({ angle: currentAngle - 90 })
    canvasApi.renderAll()
    onChange && onChange()
  }

  function rotateRight(onChange) {
    const mainImage = canvasApi.getMainImage()
    if (!mainImage) return
    const currentAngle = mainImage.angle || 0
    mainImage.set({ angle: currentAngle + 90 })
    canvasApi.renderAll()
    onChange && onChange()
  }

  function flipHorizontal(onChange) {
    const mainImage = canvasApi.getMainImage()
    if (!mainImage) return
    mainImage.set('flipX', !mainImage.flipX)
    canvasApi.renderAll()
    onChange && onChange()
  }

  function flipVertical(onChange) {
    const mainImage = canvasApi.getMainImage()
    if (!mainImage) return
    mainImage.set('flipY', !mainImage.flipY)
    canvasApi.renderAll()
    onChange && onChange()
  }

  function applyBorder(borderWidth, borderColor, onChange) {
    const mainImage = canvasApi.getMainImage()
    if (!mainImage || borderWidth <= 0) return

    const imgRect = canvasApi.getImageRect()
    const borderRect = new Rect({
      left: imgRect.left - borderWidth,
      top: imgRect.top - borderWidth,
      width: imgRect.width + borderWidth * 2,
      height: imgRect.height + borderWidth * 2,
      fill: 'transparent',
      stroke: borderColor,
      strokeWidth: borderWidth,
      selectable: false
    })

    canvasApi.addObject(borderRect)
    canvasApi.sendToBack(borderRect)
    canvasApi.renderAll()
    ElMessage.success('边框已应用')
    onChange && onChange()
  }

  return {
    rotateLeft,
    rotateRight,
    flipHorizontal,
    flipVertical,
    applyBorder
  }
}
