export const PRESET_SIZES = [
  { name: '1寸', width: 295, height: 413, mmWidth: 25, mmHeight: 35 },
  { name: '2寸', width: 413, height: 626, mmWidth: 35, mmHeight: 49 },
  { name: '小1寸', width: 260, height: 378, mmWidth: 22, mmHeight: 32 },
  { name: '小2寸', width: 378, height: 531, mmWidth: 32, mmHeight: 40 },
  { name: '护照', width: 390, height: 567, mmWidth: 33, mmHeight: 48 },
  { name: '驾照', width: 378, height: 472, mmWidth: 32, mmHeight: 40 },
  { name: '社保卡', width: 358, height: 441, mmWidth: 30, mmHeight: 37 },
  { name: '简历照', width: 400, height: 533, mmWidth: 34, mmHeight: 45 }
]

export const PRESET_COLORS = [
  { name: '白色', color: '#FFFFFF', purpose: '护照、身份证' },
  { name: '红色', color: '#E53E3E', purpose: '结婚证、一寸照' },
  { name: '蓝色', color: '#3B82F6', purpose: '毕业证、工作证' },
  { name: '浅蓝', color: '#87CEEB', purpose: '驾驶证' },
  { name: '绿色', color: '#22C55E', purpose: '部分地区证件' }
]

export const LAYOUT_PRESETS = [
  { name: '1寸x8张', rows: 4, cols: 2, sizeName: '1寸', width: 295, height: 413 },
  { name: '2寸x4张', rows: 2, cols: 2, sizeName: '2寸', width: 413, height: 626 }
]

export const EXPORT_SIZES = [
  { name: '原尺寸', value: 1 },
  { name: '2x', value: 2 },
  { name: '3x', value: 3 }
]
