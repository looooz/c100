export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}

export function colorDistance(c1, c2) {
  const dr = c1.r - c2.r
  const dg = c1.g - c2.g
  const db = c1.b - c2.b
  return Math.sqrt(dr * dr + dg * dg + db * db)
}

export function removeBackground(imageData, targetColor, tolerance = 30) {
  const data = imageData.data
  const target = hexToRgb(targetColor)
  if (!target) return imageData

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    
    const distance = colorDistance({ r, g, b }, target)
    
    if (distance < tolerance) {
      data[i + 3] = 0
    }
  }
  
  return imageData
}

export function replaceBackground(imageData, newColor) {
  const data = imageData.data
  const color = hexToRgb(newColor)
  if (!color) return imageData

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) {
      data[i] = color.r
      data[i + 1] = color.g
      data[i + 2] = color.b
      data[i + 3] = 255
    }
  }
  
  return imageData
}

export function adjustBrightness(imageData, value) {
  const data = imageData.data
  const adjustment = Math.round(value * 2.55)
  
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.max(0, Math.min(255, data[i] + adjustment))
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + adjustment))
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + adjustment))
  }
  
  return imageData
}

export function adjustContrast(imageData, value) {
  const data = imageData.data
  const factor = (259 * (value + 255)) / (255 * (259 - value))
  
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.max(0, Math.min(255, factor * (data[i] - 128) + 128))
    data[i + 1] = Math.max(0, Math.min(255, factor * (data[i + 1] - 128) + 128))
    data[i + 2] = Math.max(0, Math.min(255, factor * (data[i + 2] - 128) + 128))
  }
  
  return imageData
}

export function adjustSaturation(imageData, value) {
  const data = imageData.data
  const sat = value / 100
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    
    const gray = 0.299 * r + 0.587 * g + 0.114 * b
    
    data[i] = Math.max(0, Math.min(255, gray + sat * (r - gray)))
    data[i + 1] = Math.max(0, Math.min(255, gray + sat * (g - gray)))
    data[i + 2] = Math.max(0, Math.min(255, gray + sat * (b - gray)))
  }
  
  return imageData
}

export function getDominantColor(imageData) {
  const data = imageData.data
  const colorCounts = {}
  
  for (let i = 0; i < data.length; i += 16) {
    const r = Math.round(data[i] / 16) * 16
    const g = Math.round(data[i + 1] / 16) * 16
    const b = Math.round(data[i + 2] / 16) * 16
    const key = `${r},${g},${b}`
    colorCounts[key] = (colorCounts[key] || 0) + 1
  }
  
  let maxCount = 0
  let dominantKey = null
  
  for (const key in colorCounts) {
    if (colorCounts[key] > maxCount) {
      maxCount = colorCounts[key]
      dominantKey = key
    }
  }
  
  if (dominantKey) {
    const [r, g, b] = dominantKey.split(',').map(Number)
    return rgbToHex(r, g, b)
  }
  
  return '#ffffff'
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

export function formatDate(timestamp) {
  const date = new Date(timestamp)
  const pad = n => n.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}
