import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { FabricImage } from 'fabric'

export function useUpload(canvasApi) {
  const fileInput = ref(null)
  const isDragOver = ref(false)
  const cropWidth = ref(0)
  const cropHeight = ref(0)

  function triggerUpload() {
    fileInput.value?.click()
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (file) {
      loadImageFile(file)
    }
  }

  function handleDrop(e) {
    isDragOver.value = false
    const file = e.dataTransfer?.files?.[0]
    if (file && file.type.startsWith('image/')) {
      loadImageFile(file)
    } else {
      ElMessage.error('请上传有效的图片文件')
    }
  }

  async function loadImageFile(file) {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const img = await FabricImage.fromURL(e.target.result)
        canvasApi.clearCanvas()

        const maxWidth = 600
        const maxHeight = 800
        const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1)
        img.scale(scale)

        const canvasWidth = Math.round(img.width * scale)
        const canvasHeight = Math.round(img.height * scale)

        canvasApi.setDimensions(canvasWidth, canvasHeight)

        img.set({
          left: canvasWidth / 2,
          top: canvasHeight / 2,
          originX: 'center',
          originY: 'center',
          selectable: true,
          hasControls: true
        })

        canvasApi.setMainImage(img)
        canvasApi.addObject(img)
        canvasApi.setActiveObject(img)

        cropWidth.value = canvasWidth
        cropHeight.value = canvasHeight

        ElMessage.success('照片上传成功')
      } catch (err) {
        ElMessage.error('照片加载失败')
        console.error(err)
      }
    }
    reader.readAsDataURL(file)
  }

  return {
    fileInput,
    isDragOver,
    cropWidth,
    cropHeight,
    triggerUpload,
    handleFileSelect,
    handleDrop,
    loadImageFile
  }
}
