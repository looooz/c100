import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const MAX_HISTORY = 30

export function useHistoryState(canvasApi, adjustApi) {
  const historyStack = ref([])
  const historyIndex = ref(-1)

  function saveState() {
    const fabricCanvas = canvasApi.getFabricCanvas()
    if (!fabricCanvas) return
    try {
      const state = {
        canvasJSON: fabricCanvas.toJSON(),
        canvasWidth: fabricCanvas.width,
        canvasHeight: fabricCanvas.height,
        bgColor: fabricCanvas.backgroundColor,
        brightness: adjustApi.brightness.value,
        contrast: adjustApi.contrast.value,
        saturation: adjustApi.saturation.value
      }

      if (historyIndex.value < historyStack.value.length - 1) {
        historyStack.value = historyStack.value.slice(0, historyIndex.value + 1)
      }

      historyStack.value.push(JSON.stringify(state))

      if (historyStack.value.length > MAX_HISTORY) {
        historyStack.value.shift()
      } else {
        historyIndex.value++
      }
    } catch (e) {
      console.error('保存状态失败', e)
    }
  }

  async function restoreState(stateStr) {
    try {
      const state = JSON.parse(stateStr)
      canvasApi.setAnimating(true)

      const fabricCanvas = canvasApi.getFabricCanvas()
      fabricCanvas.clear()
      fabricCanvas.setWidth(state.canvasWidth)
      fabricCanvas.setHeight(state.canvasHeight)
      fabricCanvas.backgroundColor = state.bgColor

      await fabricCanvas.loadFromJSON(state.canvasJSON)

      canvasApi.setMainImage(null)
      fabricCanvas.getObjects().forEach(obj => {
        if (obj.type === 'image') {
          canvasApi.setMainImage(obj)
        }
      })

      adjustApi.brightness.value = state.brightness
      adjustApi.contrast.value = state.contrast
      adjustApi.saturation.value = state.saturation

      fabricCanvas.renderAll()

      setTimeout(() => {
        canvasApi.setAnimating(false)
      }, 50)
    } catch (e) {
      console.error('恢复状态失败', e)
      canvasApi.setAnimating(false)
    }
  }

  async function undo() {
    if (historyIndex.value <= 0) {
      ElMessage.info('没有可撤销的操作')
      return
    }
    historyIndex.value--
    await restoreState(historyStack.value[historyIndex.value])
    ElMessage.success('已撤销')
  }

  async function redo() {
    if (historyIndex.value >= historyStack.value.length - 1) {
      ElMessage.info('没有可重做的操作')
      return
    }
    historyIndex.value++
    await restoreState(historyStack.value[historyIndex.value])
    ElMessage.success('已重做')
  }

  function canUndo() {
    return historyIndex.value > 0
  }

  function canRedo() {
    return historyIndex.value < historyStack.value.length - 1
  }

  return {
    historyStack,
    historyIndex,
    saveState,
    restoreState,
    undo,
    redo,
    canUndo,
    canRedo
  }
}
