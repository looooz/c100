import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { saveAs } from 'file-saver'
import jsPDF from 'jspdf'

export function useExport(canvasApi, layoutApi) {
  const exportFormat = ref('jpg')
  const exportQuality = ref(0.9)
  const exportScale = ref(1)
  const exportTransparent = ref(false)

  const exportWidth = computed(() => {
    return Math.round(canvasApi.getDimensions().width * exportScale.value)
  })

  const exportHeight = computed(() => {
    return Math.round(canvasApi.getDimensions().height * exportScale.value)
  })

  function handleExport() {
    const fabricCanvas = canvasApi.getFabricCanvas()
    if (!fabricCanvas) return

    const multiplier = exportScale.value
    const format = exportFormat.value === 'jpg' ? 'jpeg' : 'png'
    const quality = exportFormat.value === 'jpg' ? exportQuality.value : 1

    const bgSave = fabricCanvas.backgroundColor

    if (exportFormat.value === 'png' && exportTransparent.value) {
      fabricCanvas.backgroundColor = 'transparent'
    } else if (exportFormat.value === 'jpg') {
      const transparentBg = !bgSave || bgSave === 'transparent'
      if (transparentBg) {
        fabricCanvas.backgroundColor = '#ffffff'
      }
    }
    fabricCanvas.renderAll()

    const dataURL = fabricCanvas.toDataURL({
      format: format,
      quality: quality,
      multiplier: multiplier
    })

    fabricCanvas.backgroundColor = bgSave
    fabricCanvas.renderAll()

    if (exportFormat.value === 'pdf') {
      exportPDF(dataURL)
    } else {
      const byteString = atob(dataURL.split(',')[1])
      const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0]
      const ab = new ArrayBuffer(byteString.length)
      const ia = new Uint8Array(ab)
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i)
      }
      const blob = new Blob([ab], { type: mimeString })
      saveAs(blob, `证件照.${exportFormat.value === 'jpg' ? 'jpg' : 'png'}`)
      ElMessage.success('导出成功')
    }
  }

  function exportPDF(imageDataURL) {
    const { width, height } = canvasApi.getDimensions()
    const pdf = new jsPDF({
      orientation: width > height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [width * exportScale.value, height * exportScale.value]
    })
    pdf.addImage(imageDataURL, 'PNG', 0, 0, width * exportScale.value, height * exportScale.value)
    const pdfBlob = pdf.output('blob')
    saveAs(pdfBlob, '证件照.pdf')
    ElMessage.success('PDF导出成功')
  }

  function exportLayout() {
    if (!layoutApi.getLayoutImage()) {
      ElMessage.warning('请先生成排版')
      return
    }

    const tempCanvas = document.createElement('canvas')
    const ctx = tempCanvas.getContext('2d')
    tempCanvas.width = layoutApi.layoutPaperWidth.value
    tempCanvas.height = layoutApi.layoutPaperHeight.value

    const dataURL = canvasApi.toDataURL({ format: 'png', multiplier: 1 })
    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, 0, 0, layoutApi.layoutPaperWidth.value, layoutApi.layoutPaperHeight.value)
      const layoutDataURL = tempCanvas.toDataURL('image/jpeg', 0.95)

      const byteString = atob(layoutDataURL.split(',')[1])
      const ab = new ArrayBuffer(byteString.length)
      const ia = new Uint8Array(ab)
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i)
      }
      const blob = new Blob([ab], { type: 'image/jpeg' })
      saveAs(blob, '排版打印.jpg')
      ElMessage.success('排版图片导出成功')
    }
    img.src = dataURL
  }

  return {
    exportFormat,
    exportQuality,
    exportScale,
    exportTransparent,
    exportWidth,
    exportHeight,
    handleExport,
    exportPDF,
    exportLayout
  }
}
