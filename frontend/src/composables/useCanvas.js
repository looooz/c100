import { ref, computed, nextTick } from 'vue'
import { Canvas, FabricImage } from 'fabric'

const DAMPING_FACTOR = 0.35
const RETURN_ANIMATION_DURATION = 250

export function useCanvas() {
  const canvasRef = ref(null)
  const hasImage = ref(false)
  let fabricCanvas = null
  let mainImage = null
  let isDraggingImage = false
  let animating = false

  const canvasWrapperStyle = computed(() => {
    if (!fabricCanvas) return {}
    return {
      width: fabricCanvas.width + 'px',
      height: fabricCanvas.height + 'px'
    }
  })

  function initCanvas(canvasId = 'fabric-canvas') {
    fabricCanvas = new Canvas(canvasId, {
      width: 600,
      height: 800,
      backgroundColor: '#f0f0f0',
      preserveObjectStacking: true,
      selection: false
    })
    return fabricCanvas
  }

  function getFabricCanvas() {
    return fabricCanvas
  }

  function getMainImage() {
    return mainImage
  }

  function setMainImage(img) {
    mainImage = img
    hasImage.value = !!img
  }

  function clearCanvas() {
    if (!fabricCanvas) return
    fabricCanvas.clear()
    fabricCanvas.backgroundColor = '#f0f0f0'
    mainImage = null
    hasImage.value = false
  }

  function getImageBounds(obj) {
    if (!obj) return { left: 0, top: 0, right: 0, bottom: 0 }
    const objRect = obj.getBoundingRect()
    return {
      left: objRect.left,
      top: objRect.top,
      right: objRect.left + objRect.width,
      bottom: objRect.top + objRect.height
    }
  }

  function getCanvasBounds() {
    if (!fabricCanvas) return { left: 0, top: 0, right: 0, bottom: 0 }
    return {
      left: 0,
      top: 0,
      right: fabricCanvas.width,
      bottom: fabricCanvas.height
    }
  }

  function applyDamping(obj) {
    if (!obj || animating) return
    const objBounds = getImageBounds(obj)
    const canvasBounds = getCanvasBounds()

    let offsetX = 0
    let offsetY = 0

    if (objBounds.left < canvasBounds.left) {
      offsetX = (canvasBounds.left - objBounds.left) * (1 - DAMPING_FACTOR)
    } else if (objBounds.right > canvasBounds.right) {
      offsetX = -(objBounds.right - canvasBounds.right) * (1 - DAMPING_FACTOR)
    }

    if (objBounds.top < canvasBounds.top) {
      offsetY = (canvasBounds.top - objBounds.top) * (1 - DAMPING_FACTOR)
    } else if (objBounds.bottom > canvasBounds.bottom) {
      offsetY = -(objBounds.bottom - canvasBounds.bottom) * (1 - DAMPING_FACTOR)
    }

    if (offsetX !== 0 || offsetY !== 0) {
      obj.set({
        left: obj.left + offsetX,
        top: obj.top + offsetY
      })
      obj.setCoords()
    }
  }

  function animateReturnToBounds(obj, onComplete) {
    if (!obj || animating) return
    const objBounds = getImageBounds(obj)
    const canvasBounds = getCanvasBounds()

    let targetLeft = obj.left
    let targetTop = obj.top

    if (objBounds.left < canvasBounds.left) {
      targetLeft = obj.left + (canvasBounds.left - objBounds.left)
    } else if (objBounds.right > canvasBounds.right) {
      targetLeft = obj.left - (objBounds.right - canvasBounds.right)
    }

    if (objBounds.top < canvasBounds.top) {
      targetTop = obj.top + (canvasBounds.top - objBounds.top)
    } else if (objBounds.bottom > canvasBounds.bottom) {
      targetTop = obj.top - (objBounds.bottom - canvasBounds.bottom)
    }

    if (targetLeft === obj.left && targetTop === obj.top) {
      onComplete && onComplete()
      return
    }

    animating = true
    obj.animate({
      left: targetLeft,
      top: targetTop
    }, {
      duration: RETURN_ANIMATION_DURATION,
      easing: (t, b, c, d) => {
        const ts = (t /= d) * t
        const tc = ts * t
        return b + c * (-2 * tc + 3 * ts)
      },
      onChange: () => {
        obj.setCoords()
        fabricCanvas.renderAll()
      },
      onComplete: () => {
        animating = false
        obj.setCoords()
        fabricCanvas.renderAll()
        onComplete && onComplete()
      }
    })
  }

  function handleObjectMoving(opt) {
    const obj = opt.target
    if (obj === mainImage) {
      isDraggingImage = true
      applyDamping(obj)
    }
  }

  function handleObjectModified(opt, onAnimComplete) {
    const obj = opt.target
    if (obj === mainImage && isDraggingImage) {
      isDraggingImage = false
      animateReturnToBounds(obj, () => {
        onAnimComplete && onAnimComplete()
      })
    }
  }

  function getIsDraggingImage() {
    return isDraggingImage
  }

  function setIsDraggingImage(val) {
    isDraggingImage = val
  }

  function getAnimating() {
    return animating
  }

  function setAnimating(val) {
    animating = val
  }

  async function replaceMainImage(newImg, preserveProps = true) {
    if (!fabricCanvas) return

    const oldImage = mainImage

    if (preserveProps && oldImage) {
      const props = {
        left: oldImage.left,
        top: oldImage.top,
        originX: 'center',
        originY: 'center',
        selectable: true,
        scaleX: oldImage.scaleX,
        scaleY: oldImage.scaleY,
        angle: oldImage.angle || 0,
        flipX: oldImage.flipX,
        flipY: oldImage.flipY
      }
      newImg.set(props)

      if (oldImage.filters && oldImage.filters.length > 0) {
        newImg.filters = [...oldImage.filters]
        newImg.applyFilters()
      }
    }

    if (oldImage) {
      fabricCanvas.remove(oldImage)
    }

    mainImage = newImg
    hasImage.value = true

    fabricCanvas.add(newImg)
    fabricCanvas.sendToBack(newImg)
    fabricCanvas.renderAll()

    return newImg
  }

  function getImageRect() {
    if (!mainImage) return { left: 0, top: 0, width: 0, height: 0 }
    return {
      left: mainImage.left - (mainImage.width * mainImage.scaleX) / 2,
      top: mainImage.top - (mainImage.height * mainImage.scaleY) / 2,
      width: mainImage.width * mainImage.scaleX,
      height: mainImage.height * mainImage.scaleY
    }
  }

  function renderAll() {
    fabricCanvas && fabricCanvas.renderAll()
  }

  function setBackgroundColor(color) {
    if (fabricCanvas) {
      fabricCanvas.backgroundColor = color
      fabricCanvas.renderAll()
    }
  }

  function getBackgroundColor() {
    return fabricCanvas ? fabricCanvas.backgroundColor : null
  }

  function setDimensions(width, height) {
    if (fabricCanvas) {
      fabricCanvas.setWidth(width)
      fabricCanvas.setHeight(height)
    }
  }

  function getDimensions() {
    if (!fabricCanvas) return { width: 0, height: 0 }
    return { width: fabricCanvas.width, height: fabricCanvas.height }
  }

  function toDataURL(options = {}) {
    if (!fabricCanvas) return ''
    return fabricCanvas.toDataURL(options)
  }

  function addObject(obj) {
    if (fabricCanvas && obj) {
      fabricCanvas.add(obj)
      fabricCanvas.renderAll()
    }
  }

  function removeObject(obj) {
    if (fabricCanvas && obj) {
      fabricCanvas.remove(obj)
      fabricCanvas.renderAll()
    }
  }

  function getActiveObject() {
    return fabricCanvas ? fabricCanvas.getActiveObject() : null
  }

  function setActiveObject(obj) {
    if (fabricCanvas && obj) {
      fabricCanvas.setActiveObject(obj)
    }
  }

  function getObjects() {
    return fabricCanvas ? fabricCanvas.getObjects() : []
  }

  function sendToBack(obj) {
    if (fabricCanvas && obj) {
      fabricCanvas.sendToBack(obj)
    }
  }

  async function loadFromJSON(json) {
    if (!fabricCanvas) return
    await fabricCanvas.loadFromJSON(json)
    const objects = fabricCanvas.getObjects()
    mainImage = null
    objects.forEach(obj => {
      if (obj.type === 'image') {
        mainImage = obj
      }
    })
    hasImage.value = !!mainImage
  }

  function toJSON() {
    return fabricCanvas ? fabricCanvas.toJSON() : null
  }

  return {
    canvasRef,
    hasImage,
    canvasWrapperStyle,
    initCanvas,
    getFabricCanvas,
    getMainImage,
    setMainImage,
    clearCanvas,
    getImageBounds,
    getCanvasBounds,
    applyDamping,
    animateReturnToBounds,
    handleObjectMoving,
    handleObjectModified,
    getIsDraggingImage,
    setIsDraggingImage,
    getAnimating,
    setAnimating,
    replaceMainImage,
    getImageRect,
    renderAll,
    setBackgroundColor,
    getBackgroundColor,
    setDimensions,
    getDimensions,
    toDataURL,
    addObject,
    removeObject,
    getActiveObject,
    setActiveObject,
    getObjects,
    sendToBack,
    loadFromJSON,
    toJSON
  }
}
