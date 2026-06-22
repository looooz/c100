<template>
  <div class="app-container">
    <header class="app-header">
      <div class="header-title">
        <el-icon :size="24" color="#409eff"><Picture /></el-icon>
        <span>在线证件照制作工具</span>
      </div>
      <div class="header-actions">
        <el-button @click="rotateLeft" :disabled="!hasImage">
          <el-icon><RefreshLeft /></el-icon>
          左旋90°
        </el-button>
        <el-button @click="rotateRight" :disabled="!hasImage">
          <el-icon><RefreshRight /></el-icon>
          右旋90°
        </el-button>
        <el-button @click="flipHorizontal" :disabled="!hasImage">
          水平翻转
        </el-button>
        <el-button @click="flipVertical" :disabled="!hasImage">
          垂直翻转
        </el-button>
        <el-button type="primary" @click="handleExport">
          <el-icon><Download /></el-icon>
          导出照片
        </el-button>
      </div>
    </header>

    <div class="app-main">
      <aside class="sidebar">
        <el-tabs v-model="activeTab" tab-position="left" class="sidebar-tabs">
          <el-tab-pane label="上传" name="upload">
            <div class="panel-content">
              <div
                class="upload-area"
                :class="{ 'drag-over': isDragOver }"
                @click="triggerUpload"
                @dragover.prevent="isDragOver = true"
                @dragleave="isDragOver = false"
                @drop.prevent="handleDrop"
              >
                <el-icon class="upload-icon"><UploadFilled /></el-icon>
                <div class="upload-text">点击或拖拽上传照片</div>
                <div class="upload-tip">支持 JPG、PNG、WebP 格式</div>
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style="display: none"
                  @change="handleFileSelect"
                />
              </div>

              <el-divider>裁剪操作</el-divider>

              <div class="form-item">
                <label>裁剪模式</label>
                <el-radio-group v-model="cropMode" size="small">
                  <el-radio-button value="none">自由</el-radio-button>
                  <el-radio-button value="preset">预设</el-radio-button>
                  <el-radio-button value="custom">自定义</el-radio-button>
                </el-radio-group>
              </div>

              <div v-if="cropMode === 'preset'" class="form-item">
                <label>预设尺寸</label>
                <div class="size-grid">
                  <div
                    v-for="size in presetSizes"
                    :key="size.name"
                    class="size-item"
                    :class="{ active: currentPreset === size.name }"
                    @click="selectPresetSize(size)"
                  >
                    <div class="size-name">{{ size.name }}</div>
                    <div class="size-desc">{{ size.width }}×{{ size.height }}px</div>
                    <div class="size-mm">{{ size.mmWidth }}×{{ size.mmHeight }}mm</div>
                  </div>
                </div>
              </div>

              <div v-if="cropMode === 'custom'" class="form-item">
                <label>自定义尺寸</label>
                <div class="custom-size">
                  <el-input-number v-model="customWidth" :min="50" :max="2000" size="small" placeholder="宽" />
                  <span class="x">×</span>
                  <el-input-number v-model="customHeight" :min="50" :max="2000" size="small" placeholder="高" />
                </div>
                <el-button size="small" @click="applyCustomSize" style="margin-top: 8px">应用裁剪</el-button>
              </div>

              <div v-if="hasImage" class="form-item">
                <label>裁剪框信息</label>
                <div class="crop-info">
                  <span>宽度: {{ cropWidth }}px</span>
                  <span>高度: {{ cropHeight }}px</span>
                </div>
              </div>

              <el-button v-if="hasImage" type="success" @click="applyCrop" style="width: 100%">
                确认裁剪
              </el-button>
            </div>
          </el-tab-pane>

          <el-tab-pane label="背景" name="background">
            <div class="panel-content">
              <div class="form-item">
                <label>抠图方式</label>
                <el-radio-group v-model="cutoutMode" size="small">
                  <el-radio-button value="auto">智能抠图</el-radio-button>
                  <el-radio-button value="manual">手动抠图</el-radio-button>
                </el-radio-group>
              </div>

              <div v-if="cutoutMode === 'auto'" class="form-item">
                <label>容差值</label>
                <el-slider v-model="tolerance" :min="5" :max="100" :step="5" />
              </div>

              <div v-if="cutoutMode === 'auto'" class="form-item">
                <el-button @click="autoCutout" :disabled="!hasImage" style="width: 100%">
                  一键智能抠图
                </el-button>
              </div>

              <div v-if="cutoutMode === 'manual'" class="form-item">
                <label>画笔大小</label>
                <el-slider v-model="brushSize" :min="5" :max="100" />
              </div>

              <div v-if="cutoutMode === 'manual'" class="form-item">
                <el-button @click="toggleManualCutout" :disabled="!hasImage" :type="isManualCutoutMode ? 'warning' : ''" style="width: 100%">
                  {{ isManualCutoutMode ? '退出涂抹模式' : '开始涂抹抠图' }}
                </el-button>
                <div class="tip">涂抹需要保留的区域，右键切换为擦除模式</div>
              </div>

              <el-divider>预设背景色</el-divider>

              <div class="color-grid">
                <div
                  v-for="color in presetColors"
                  :key="color.name"
                  class="color-item"
                  :class="{ active: currentBgColor === color.color }"
                  @click="selectBgColor(color.color)"
                >
                  <div class="color-preview" :style="{ backgroundColor: color.color }"></div>
                  <div class="color-name">{{ color.name }}</div>
                  <div class="color-purpose">{{ color.purpose }}</div>
                </div>
              </div>

              <div class="form-item">
                <label>自定义颜色</label>
                <el-color-picker v-model="customBgColor" @change="applyCustomBgColor" />
              </div>

              <div class="form-item">
                <label>透明背景</label>
                <el-switch v-model="transparentBg" @change="toggleTransparentBg" />
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="调整" name="adjust">
            <div class="panel-content">
              <div class="form-item">
                <label>亮度</label>
                <el-slider v-model="brightness" :min="-100" :max="100" :step="1" @change="applyAdjustments" />
                <div class="value-display">{{ brightness > 0 ? '+' : '' }}{{ brightness }}</div>
              </div>

              <div class="form-item">
                <label>对比度</label>
                <el-slider v-model="contrast" :min="-100" :max="100" :step="1" @change="applyAdjustments" />
                <div class="value-display">{{ contrast > 0 ? '+' : '' }}{{ contrast }}</div>
              </div>

              <div class="form-item">
                <label>饱和度</label>
                <el-slider v-model="saturation" :min="-100" :max="100" :step="1" @change="applyAdjustments" />
                <div class="value-display">{{ saturation > 0 ? '+' : '' }}{{ saturation }}</div>
              </div>

              <el-button @click="resetAdjustments" style="width: 100%">
                重置调整
              </el-button>

              <el-divider>旋转与翻转</el-divider>

              <div class="btn-group">
                <el-button @click="rotateLeft" :disabled="!hasImage">
                  <el-icon><RefreshLeft /></el-icon>
                  左90°
                </el-button>
                <el-button @click="rotateRight" :disabled="!hasImage">
                  <el-icon><RefreshRight /></el-icon>
                  右90°
                </el-button>
              </div>

              <div class="btn-group">
                <el-button @click="flipHorizontal" :disabled="!hasImage">
                  水平翻转
                </el-button>
                <el-button @click="flipVertical" :disabled="!hasImage">
                  垂直翻转
                </el-button>
              </div>

              <el-divider>裁切边框</el-divider>

              <div class="form-item">
                <label>边框宽度</label>
                <el-slider v-model="borderWidth" :min="0" :max="50" />
              </div>

              <div class="form-item">
                <label>边框颜色</label>
                <el-color-picker v-model="borderColor" />
              </div>

              <el-button @click="applyBorder" :disabled="!hasImage" style="width: 100%">
                应用边框
              </el-button>
            </div>
          </el-tab-pane>

          <el-tab-pane label="排版" name="layout">
            <div class="panel-content">
              <div class="form-item">
                <label>排版预设</label>
                <div class="layout-presets">
                  <div
                    v-for="preset in layoutPresets"
                    :key="preset.name"
                    class="layout-preset-item"
                    :class="{ active: currentLayout === preset.name }"
                    @click="selectLayoutPreset(preset)"
                  >
                    {{ preset.name }}
                  </div>
                </div>
              </div>

              <el-divider>自定义排版</el-divider>

              <div class="form-item">
                <label>照片尺寸</label>
                <el-select v-model="layoutPhotoSize" size="small" style="width: 100%">
                  <el-option
                    v-for="size in presetSizes"
                    :key="size.name"
                    :label="size.name + ' (' + size.width + '×' + size.height + ')'"
                    :value="size.name"
                  />
                </el-select>
              </div>

              <div class="form-item">
                <label>行数</label>
                <el-input-number v-model="layoutRows" :min="1" :max="10" size="small" />
              </div>

              <div class="form-item">
                <label>列数</label>
                <el-input-number v-model="layoutCols" :min="1" :max="10" size="small" />
              </div>

              <div class="form-item">
                <label>间距 (px)</label>
                <el-slider v-model="layoutGap" :min="0" :max="50" />
              </div>

              <div class="form-item">
                <label>纸张背景色</label>
                <el-color-picker v-model="layoutBgColor" />
              </div>

              <el-button type="primary" @click="generateLayout" :disabled="!hasImage" style="width: 100%">
                生成排版预览
              </el-button>

              <div v-if="layoutPreview" class="layout-info">
                <el-divider>排版信息</el-divider>
                <div>纸张尺寸: {{ layoutPaperWidth }} × {{ layoutPaperHeight }} px</div>
                <div>照片数量: {{ layoutRows * layoutCols }} 张</div>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="导出" name="export">
            <div class="panel-content">
              <div class="form-item">
                <label>导出格式</label>
                <el-radio-group v-model="exportFormat" size="small">
                  <el-radio-button value="png">PNG</el-radio-button>
                  <el-radio-button value="jpg">JPG</el-radio-button>
                  <el-radio-button value="pdf">PDF</el-radio-button>
                </el-radio-group>
              </div>

              <div v-if="exportFormat === 'jpg'" class="form-item">
                <label>图片质量</label>
                <el-slider v-model="exportQuality" :min="0.1" :max="1" :step="0.05" />
                <div class="value-display">{{ Math.round(exportQuality * 100) }}%</div>
              </div>

              <div class="form-item">
                <label>导出尺寸</label>
                <el-radio-group v-model="exportScale" size="small">
                  <el-radio-button :value="1">原尺寸</el-radio-button>
                  <el-radio-button :value="2">2x</el-radio-button>
                  <el-radio-button :value="3">3x</el-radio-button>
                </el-radio-group>
              </div>

              <div v-if="exportFormat === 'png'" class="form-item">
                <label>透明背景</label>
                <el-switch v-model="exportTransparent" />
              </div>

              <div class="export-preview">
                <div class="preview-label">预览</div>
                <div class="preview-info">
                  尺寸: {{ exportWidth }} × {{ exportHeight }} px
                </div>
              </div>

              <el-button type="primary" size="large" @click="handleExport" style="width: 100%">
                <el-icon><Download /></el-icon>
                一键下载
              </el-button>

              <el-button v-if="layoutPreview" @click="exportLayout" style="width: 100%; margin-top: 10px">
                导出版排版图片
              </el-button>
            </div>
          </el-tab-pane>

          <el-tab-pane label="历史" name="history">
            <div class="panel-content">
              <div class="form-item">
                <el-button @click="saveToHistory" :disabled="!hasImage" type="primary" style="width: 100%">
                  <el-icon><Plus /></el-icon>
                  保存到历史记录
                </el-button>
              </div>

              <el-divider>最近编辑</el-divider>

              <div v-if="historyList.length === 0" class="empty-history">
                <el-empty description="暂无历史记录" :image-size="80" />
              </div>

              <div v-else class="history-list">
                <div
                  v-for="item in historyList"
                  :key="item.id"
                  class="history-item"
                >
                  <div class="history-thumb" @click="loadHistoryItem(item)">
                    <img v-if="item.thumbnail" :src="item.thumbnail" alt="缩略图" />
                    <div v-else class="no-thumb">无缩略图</div>
                  </div>
                  <div class="history-info">
                    <div class="history-name">{{ item.name }}</div>
                    <div class="history-time">{{ formatDate(item.timestamp) }}</div>
                  </div>
                  <div class="history-actions">
                    <el-button size="small" @click="loadHistoryItem(item)">
                      编辑
                    </el-button>
                    <el-button size="small" type="danger" @click="removeHistory(item.id)">
                      删除
                    </el-button>
                  </div>
                </div>
              </div>

              <el-button v-if="historyList.length > 0" type="danger" plain @click="clearAllHistory" style="width: 100%; margin-top: 10px">
                清空历史记录
              </el-button>
            </div>
          </el-tab-pane>
        </el-tabs>
      </aside>

      <main class="canvas-area">
        <div class="canvas-wrapper" :style="canvasWrapperStyle">
          <canvas ref="canvasRef" id="fabric-canvas"></canvas>
        </div>
        
        <div v-if="!hasImage" class="empty-canvas-tip">
          <el-icon :size="64" color="#c0c4cc"><Picture /></el-icon>
          <p>请上传照片开始制作证件照</p>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>import { ref, computed, onMounted, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Canvas, FabricImage, Rect, filters } from 'fabric';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import { PRESET_SIZES, PRESET_COLORS, LAYOUT_PRESETS } from './utils/constants';
import { adjustBrightness, adjustContrast, adjustSaturation, removeBackground, replaceBackground, formatDate, hexToRgb } from './utils/imageUtils';
import * as api from './utils/api';
const { Brightness, Contrast, Saturation } = filters;
const canvasRef = ref(null);
const fileInput = ref(null);
const activeTab = ref('upload');
let fabricCanvas = null;
let mainImage = null;
let cropRect = null;
let maskCanvas = null;
const isDragOver = ref(false);
const hasImage = ref(false);
const presetSizes = ref(PRESET_SIZES);
const presetColors = ref(PRESET_COLORS);
const layoutPresets = ref(LAYOUT_PRESETS);
const cropMode = ref('none');
const currentPreset = ref('');
const customWidth = ref(400);
const customHeight = ref(600);
const cropWidth = ref(0);
const cropHeight = ref(0);
const cutoutMode = ref('auto');
const tolerance = ref(30);
const brushSize = ref(20);
const isManualCutoutMode = ref(false);
const currentBgColor = ref('#FFFFFF');
const customBgColor = ref('#FFFFFF');
const transparentBg = ref(false);
const brightness = ref(0);
const contrast = ref(0);
const saturation = ref(0);
const borderWidth = ref(0);
const borderColor = ref('#000000');
const currentLayout = ref('');
const layoutPhotoSize = ref('1寸');
const layoutRows = ref(4);
const layoutCols = ref(2);
const layoutGap = ref(10);
const layoutBgColor = ref('#FFFFFF');
const layoutPreview = ref(false);
const layoutPaperWidth = ref(0);
const layoutPaperHeight = ref(0);
let layoutImage = null;
const exportFormat = ref('jpg');
const exportQuality = ref(0.9);
const exportScale = ref(1);
const exportTransparent = ref(false);
const historyList = ref([]);
const canvasWrapperStyle = computed(() => {
 if (!fabricCanvas)
 return {};
 return {
 width: fabricCanvas.width + 'px',
 height: fabricCanvas.height + 'px'
 };
});
const exportWidth = computed(() => {
 if (!fabricCanvas)
 return 0;
 return Math.round(fabricCanvas.width * exportScale.value);
});
const exportHeight = computed(() => {
 if (!fabricCanvas)
 return 0;
 return Math.round(fabricCanvas.height * exportScale.value);
});
onMounted(async () => {
 await nextTick();
 initCanvas();
 loadHistory();
});
function initCanvas() {
 fabricCanvas = new Canvas('fabric-canvas', {
 width: 600,
 height: 800,
 backgroundColor: '#f0f0f0',
 preserveObjectStacking: true,
 selection: false
 });
 fabricCanvas.on('object:modified', updateCropInfo);
 fabricCanvas.on('object:scaling', updateCropInfo);
 fabricCanvas.on('object:moving', updateCropInfo);
 fabricCanvas.on('mouse:down', handleMouseDown);
 fabricCanvas.on('mouse:move', handleMouseMove);
 fabricCanvas.on('mouse:up', handleMouseUp);
}
function triggerUpload() {
 fileInput.value?.click();
}
function handleFileSelect(e) {
 const file = e.target.files?.[0];
 if (file) {
 loadImageFile(file);
 }
}
function handleDrop(e) {
 isDragOver.value = false;
 const file = e.dataTransfer?.files?.[0];
 if (file && file.type.startsWith('image/')) {
 loadImageFile(file);
 }
 else {
 ElMessage.error('请上传有效的图片文件');
 }
}
async function loadImageFile(file) {
 const reader = new FileReader();
 reader.onload = async (e) => {
 try {
 const img = await FabricImage.fromURL(e.target.result);
 clearCanvas();
 mainImage = img;
 const maxWidth = 600;
 const maxHeight = 800;
 const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
 img.scale(scale);
 const canvasWidth = Math.round(img.width * scale);
 const canvasHeight = Math.round(img.height * scale);
 fabricCanvas.setWidth(canvasWidth);
 fabricCanvas.setHeight(canvasHeight);
 img.set({
 left: canvasWidth / 2,
 top: canvasHeight / 2,
 originX: 'center',
 originY: 'center',
 selectable: true,
 hasControls: true
 });
 fabricCanvas.add(img);
 fabricCanvas.setActiveObject(img);
 fabricCanvas.renderAll();
 hasImage.value = true;
 cropWidth.value = canvasWidth;
 cropHeight.value = canvasHeight;
 resetAdjustments();
 ElMessage.success('照片上传成功');
 }
 catch (err) {
 ElMessage.error('照片加载失败');
 console.error(err);
 }
 };
 reader.readAsDataURL(file);
}
function clearCanvas() {
 fabricCanvas.clear();
 fabricCanvas.backgroundColor = '#f0f0f0';
 mainImage = null;
 cropRect = null;
 hasImage.value = false;
 layoutPreview.value = false;
 layoutImage = null;
}
function selectPresetSize(size) {
 currentPreset.value = size.name;
 cropMode.value = 'preset';
 createCropRect(size.width, size.height);
}
function applyCustomSize() {
 if (customWidth.value > 0 && customHeight.value > 0) {
 cropMode.value = 'custom';
 createCropRect(customWidth.value, customHeight.value);
 }
}
function createCropRect(width, height) {
 if (!hasImage.value || !mainImage)
 return;
 if (cropRect) {
 fabricCanvas.remove(cropRect);
 }
 const imgRect = {
 left: mainImage.left - (mainImage.width * mainImage.scaleX) / 2,
 top: mainImage.top - (mainImage.height * mainImage.scaleY) / 2,
 width: mainImage.width * mainImage.scaleX,
 height: mainImage.height * mainImage.scaleY
 };
 const scale = Math.min(imgRect.width / width, imgRect.height / height, 1);
 const rectWidth = width * scale;
 const rectHeight = height * scale;
 cropRect = new Rect({
 left: imgRect.left + (imgRect.width - rectWidth) / 2,
 top: imgRect.top + (imgRect.height - rectHeight) / 2,
 width: rectWidth,
 height: rectHeight,
 fill: 'rgba(0, 0, 0, 0.3)',
 stroke: '#409eff',
 strokeWidth: 2,
 strokeDashArray: [5, 5],
 selectable: true,
 hasControls: true,
 lockUniScaling: true,
 transparentCorners: false,
 cornerColor: '#409eff',
 cornerSize: 10
 });
 const ratio = width / height;
 cropRect.setControlsVisibility({
 mt: false,
 mb: false,
 ml: false,
 mr: false
 });
 fabricCanvas.add(cropRect);
 fabricCanvas.setActiveObject(cropRect);
 fabricCanvas.renderAll();
 cropWidth.value = Math.round(rectWidth);
 cropHeight.value = Math.round(rectHeight);
}
function updateCropInfo() {
 if (cropRect) {
 cropWidth.value = Math.round(cropRect.width * cropRect.scaleX);
 cropHeight.value = Math.round(cropRect.height * cropRect.scaleY);
 }
}
function applyCrop() {
 if (!cropRect || !mainImage) {
 ElMessage.warning('请先创建裁剪框');
 return;
 }
 const croppedCanvas = document.createElement('canvas');
 const ctx = croppedCanvas.getContext('2d');
 const cropX = cropRect.left;
 const cropY = cropRect.top;
 const cropW = cropRect.width * cropRect.scaleX;
 const cropH = cropRect.height * cropRect.scaleY;
 croppedCanvas.width = cropW;
 croppedCanvas.height = cropH;
 const tempCanvas = document.createElement('canvas');
 const tempCtx = tempCanvas.getContext('2d');
 tempCanvas.width = fabricCanvas.width;
 tempCanvas.height = fabricCanvas.height;
 const dataURL = fabricCanvas.toDataURL({
 format: 'png',
 multiplier: 1
 });
 const img = new Image();
 img.onload = () => {
 tempCtx.drawImage(img, 0, 0);
 ctx.drawImage(tempCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
 const newDataURL = croppedCanvas.toDataURL('image/png');
 FabricImage.fromURL(newDataURL).then((newImg) => {
 clearCanvas();
 mainImage = newImg;
 newImg.set({
 left: cropW / 2,
 top: cropH / 2,
 originX: 'center',
 originY: 'center',
 selectable: true
 });
 fabricCanvas.setWidth(cropW);
 fabricCanvas.setHeight(cropH);
 fabricCanvas.add(newImg);
 fabricCanvas.renderAll();
 hasImage.value = true;
 cropWidth.value = cropW;
 cropHeight.value = cropH;
 cropRect = null;
 cropMode.value = 'none';
 ElMessage.success('裁剪完成');
 });
 };
 img.src = dataURL;
}
async function autoCutout() {
 if (!mainImage) {
 ElMessage.warning('请先上传照片');
 return;
 }
 try {
 const tempCanvas = document.createElement('canvas');
 const ctx = tempCanvas.getContext('2d');
 const imgWidth = mainImage.width;
 const imgHeight = mainImage.height;
 tempCanvas.width = imgWidth;
 tempCanvas.height = imgHeight;
 const imgElement = mainImage.getElement();
 ctx.drawImage(imgElement, 0, 0, imgWidth, imgHeight);
 const imageData = ctx.getImageData(0, 0, imgWidth, imgHeight);
 const bgColor = getEdgeColor(imageData);
 const processedData = removeBackground(imageData, bgColor, tolerance.value);
 ctx.putImageData(processedData, 0, 0);
 const newDataURL = tempCanvas.toDataURL('image/png');
 const newImg = await FabricImage.fromURL(newDataURL);
 const scaleX = mainImage.scaleX;
 const scaleY = mainImage.scaleY;
 const left = mainImage.left;
 const top = mainImage.top;
 fabricCanvas.remove(mainImage);
 mainImage = newImg;
 newImg.scaleToWidth(imgWidth * scaleX);
 newImg.set({
 left: left,
 top: top,
 originX: 'center',
 originY: 'center',
 selectable: true
 });
 fabricCanvas.add(newImg);
 fabricCanvas.sendToBack(newImg);
 fabricCanvas.renderAll();
 if (!transparentBg.value) {
 fabricCanvas.backgroundColor = currentBgColor.value;
 }
 else {
 fabricCanvas.backgroundColor = 'transparent';
 }
 fabricCanvas.renderAll();
 ElMessage.success('智能抠图完成');
 }
 catch (err) {
 ElMessage.error('抠图失败');
 console.error(err);
 }
}
function getEdgeColor(imageData) {
 const data = imageData.data;
 const width = imageData.width;
 const height = imageData.height;
 let r = 0, g = 0, b = 0, count = 0;
 for (let x = 0; x < width; x += 10) {
 const i = x * 4;
 r += data[i];
 g += data[i + 1];
 b += data[i + 2];
 count++;
 }
 for (let x = 0; x < width; x += 10) {
 const i = ((height - 1) * width + x) * 4;
 r += data[i];
 g += data[i + 1];
 b += data[i + 2];
 count++;
 }
 for (let y = 0; y < height; y += 10) {
 const i = (y * width) * 4;
 r += data[i];
 g += data[i + 1];
 b += data[i + 2];
 count++;
 }
 for (let y = 0; y < height; y += 10) {
 const i = (y * width + width - 1) * 4;
 r += data[i];
 g += data[i + 1];
 b += data[i + 2];
 count++;
 }
 return '#' + [r, g, b].map(x => {
 const hex = Math.round(x / count).toString(16);
 return hex.length === 1 ? '0' + hex : hex;
 }).join('');
}
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let isErasing = false;
function toggleManualCutout() {
 if (!mainImage) {
 ElMessage.warning('请先上传照片');
 return;
 }
 isManualCutoutMode.value = !isManualCutoutMode.value;
 if (isManualCutoutMode.value) {
 initMaskCanvas();
 ElMessage.info('涂抹需要保留的区域，右键切换擦除模式');
 }
 else {
 applyMaskCutout();
 }
}
function initMaskCanvas() {
 if (!mainImage)
 return;
 const imgWidth = mainImage.width;
 const imgHeight = mainImage.height;
 maskCanvas = document.createElement('canvas');
 maskCanvas.width = imgWidth;
 maskCanvas.height = imgHeight;
 const ctx = maskCanvas.getContext('2d');
 ctx.fillStyle = '#000000';
 ctx.fillRect(0, 0, imgWidth, imgHeight);
}
function handleMouseDown(opt) {
 if (!isManualCutoutMode.value || !mainImage)
 return;
 const pointer = fabricCanvas.getPointer(opt.e);
 const imgRect = getImageRect();
 if (pointer.x >= imgRect.left && pointer.x <= imgRect.left + imgRect.width &&
 pointer.y >= imgRect.top && pointer.y <= imgRect.top + imgRect.height) {
 isDrawing = true;
 isErasing = opt.e.button === 2;
 const maskX = (pointer.x - imgRect.left) / imgRect.width * maskCanvas.width;
 const maskY = (pointer.y - imgRect.top) / imgRect.height * maskCanvas.height;
 lastX = maskX;
 lastY = maskY;
 drawOnMask(maskX, maskY);
 }
}
function handleMouseMove(opt) {
 if (!isDrawing || !isManualCutoutMode.value)
 return;
 const pointer = fabricCanvas.getPointer(opt.e);
 const imgRect = getImageRect();
 const maskX = (pointer.x - imgRect.left) / imgRect.width * maskCanvas.width;
 const maskY = (pointer.y - imgRect.top) / imgRect.height * maskCanvas.height;
 drawOnMaskLine(lastX, lastY, maskX, maskY);
 lastX = maskX;
 lastY = maskY;
}
function handleMouseUp() {
 isDrawing = false;
}
function getImageRect() {
 if (!mainImage)
 return { left: 0, top: 0, width: 0, height: 0 };
 return {
 left: mainImage.left - (mainImage.width * mainImage.scaleX) / 2,
 top: mainImage.top - (mainImage.height * mainImage.scaleY) / 2,
 width: mainImage.width * mainImage.scaleX,
 height: mainImage.height * mainImage.scaleY
 };
}
function drawOnMask(x, y) {
 if (!maskCanvas)
 return;
 const ctx = maskCanvas.getContext('2d');
 ctx.fillStyle = isErasing ? '#000000' : '#ffffff';
 ctx.beginPath();
 ctx.arc(x, y, brushSize.value, 0, Math.PI * 2);
 ctx.fill();
 updateMaskedPreview();
}
function drawOnMaskLine(x1, y1, x2, y2) {
 if (!maskCanvas)
 return;
 const ctx = maskCanvas.getContext('2d');
 ctx.strokeStyle = isErasing ? '#000000' : '#ffffff';
 ctx.lineWidth = brushSize.value * 2;
 ctx.lineCap = 'round';
 ctx.beginPath();
 ctx.moveTo(x1, y1);
 ctx.lineTo(x2, y2);
 ctx.stroke();
 updateMaskedPreview();
}
async function updateMaskedPreview() {
 if (!maskCanvas || !mainImage)
 return;
 const tempCanvas = document.createElement('canvas');
 const ctx = tempCanvas.getContext('2d');
 const imgWidth = mainImage.width;
 const imgHeight = mainImage.height;
 tempCanvas.width = imgWidth;
 tempCanvas.height = imgHeight;
 const imgElement = mainImage.getElement();
 ctx.drawImage(imgElement, 0, 0, imgWidth, imgHeight);
 ctx.globalCompositeOperation = 'destination-in';
 ctx.drawImage(maskCanvas, 0, 0, imgWidth, imgHeight);
 const newDataURL = tempCanvas.toDataURL('image/png');
 try {
 const newImg = await FabricImage.fromURL(newDataURL);
 const scaleX = mainImage.scaleX;
 const scaleY = mainImage.scaleY;
 const left = mainImage.left;
 const top = mainImage.top;
 fabricCanvas.remove(mainImage);
 mainImage = newImg;
 newImg.scaleToWidth(imgWidth * scaleX);
 newImg.set({
 left: left,
 top: top,
 originX: 'center',
 originY: 'center',
 selectable: true
 });
 fabricCanvas.add(newImg);
 fabricCanvas.sendToBack(newImg);
 fabricCanvas.renderAll();
 }
 catch (e) {
 console.error(e);
 }
}
function applyMaskCutout() {
 if (!maskCanvas || !mainImage)
 return;
 isManualCutoutMode.value = false;
 if (!transparentBg.value) {
 fabricCanvas.backgroundColor = currentBgColor.value;
 }
 else {
 fabricCanvas.backgroundColor = 'transparent';
 }
 fabricCanvas.renderAll();
 maskCanvas = null;
 ElMessage.success('手动抠图完成');
}
function selectBgColor(color) {
 currentBgColor.value = color;
 customBgColor.value = color;
 transparentBg.value = false;
 applyBgColor();
}
function applyCustomBgColor(color) {
 currentBgColor.value = color;
 transparentBg.value = false;
 applyBgColor();
}
function applyBgColor() {
 if (fabricCanvas && !transparentBg.value) {
 fabricCanvas.backgroundColor = currentBgColor.value;
 fabricCanvas.renderAll();
 }
}
function toggleTransparentBg(val) {
 if (val) {
 fabricCanvas.backgroundColor = 'transparent';
 }
 else {
 fabricCanvas.backgroundColor = currentBgColor.value;
 }
 fabricCanvas.renderAll();
}
function applyAdjustments() {
 if (!mainImage || mainImage.type !== 'image')
 return;
 mainImage.filters = [];
 if (brightness.value !== 0) {
 mainImage.filters.push(new Brightness({ brightness: brightness.value / 100 }));
 }
 if (contrast.value !== 0) {
 mainImage.filters.push(new Contrast({ contrast: contrast.value / 100 }));
 }
 if (saturation.value !== 0) {
 mainImage.filters.push(new Saturation({ saturation: saturation.value / 100 }));
 }
 mainImage.applyFilters();
 fabricCanvas.renderAll();
}
function resetAdjustments() {
 brightness.value = 0;
 contrast.value = 0;
 saturation.value = 0;
 if (mainImage) {
 mainImage.filters = [];
 mainImage.applyFilters();
 fabricCanvas.renderAll();
 }
}
function rotateLeft() {
 if (!mainImage)
 return;
 const currentAngle = mainImage.angle || 0;
 mainImage.set({ angle: currentAngle - 90 });
 fabricCanvas.renderAll();
}
function rotateRight() {
 if (!mainImage)
 return;
 const currentAngle = mainImage.angle || 0;
 mainImage.set({ angle: currentAngle + 90 });
 fabricCanvas.renderAll();
}
function flipHorizontal() {
 if (!mainImage)
 return;
 mainImage.set('flipX', !mainImage.flipX);
 fabricCanvas.renderAll();
}
function flipVertical() {
 if (!mainImage)
 return;
 mainImage.set('flipY', !mainImage.flipY);
 fabricCanvas.renderAll();
}
function applyBorder() {
 if (!mainImage || borderWidth.value <= 0)
 return;
 const imgRect = getImageRect();
 const borderRect = new Rect({
 left: imgRect.left - borderWidth.value,
 top: imgRect.top - borderWidth.value,
 width: imgRect.width + borderWidth.value * 2,
 height: imgRect.height + borderWidth.value * 2,
 fill: 'transparent',
 stroke: borderColor.value,
 strokeWidth: borderWidth.value,
 selectable: false
 });
 fabricCanvas.add(borderRect);
 fabricCanvas.sendToBack(borderRect);
 fabricCanvas.renderAll();
 ElMessage.success('边框已应用');
}
function selectLayoutPreset(preset) {
 currentLayout.value = preset.name;
 layoutPhotoSize.value = preset.sizeName;
 layoutRows.value = preset.rows;
 layoutCols.value = preset.cols;
}
function generateLayout() {
 if (!hasImage.value || !mainImage) {
 ElMessage.warning('请先上传照片');
 return;
 }
 const size = presetSizes.value.find(s => s.name === layoutPhotoSize.value);
 if (!size) {
 ElMessage.error('未找到对应尺寸');
 return;
 }
 const photoWidth = size.width;
 const photoHeight = size.height;
 const paperWidth = photoWidth * layoutCols.value + layoutGap.value * (layoutCols.value + 1);
 const paperHeight = photoHeight * layoutRows.value + layoutGap.value * (layoutRows.value + 1);
 layoutPaperWidth.value = paperWidth;
 layoutPaperHeight.value = paperHeight;
 const tempCanvas = document.createElement('canvas');
 const ctx = tempCanvas.getContext('2d');
 tempCanvas.width = paperWidth;
 tempCanvas.height = paperHeight;
 ctx.fillStyle = layoutBgColor.value;
 ctx.fillRect(0, 0, paperWidth, paperHeight);
 const photoCanvas = document.createElement('canvas');
 const photoCtx = photoCanvas.getContext('2d');
 photoCanvas.width = photoWidth;
 photoCanvas.height = photoHeight;
 const dataURL = fabricCanvas.toDataURL({ format: 'png', multiplier: 1 });
 const img = new Image();
 img.onload = () => {
 photoCtx.drawImage(img, 0, 0, photoWidth, photoHeight);
 for (let row = 0; row < layoutRows.value; row++) {
 for (let col = 0; col < layoutCols.value; col++) {
 const x = layoutGap.value + col * (photoWidth + layoutGap.value);
 const y = layoutGap.value + row * (photoHeight + layoutGap.value);
 ctx.drawImage(photoCanvas, x, y, photoWidth, photoHeight);
 }
 }
 const layoutDataURL = tempCanvas.toDataURL('image/png');
 FabricImage.fromURL(layoutDataURL).then((layoutImg) => {
 layoutImage = layoutImg;
 layoutPreview.value = true;
 showLayoutPreview(layoutImg, paperWidth, paperHeight);
 ElMessage.success('排版生成成功');
 });
 };
 img.src = dataURL;
}
function showLayoutPreview(img, width, height) {
 fabricCanvas.clear();
 fabricCanvas.setWidth(width);
 fabricCanvas.setHeight(height);
 img.set({
 left: width / 2,
 top: height / 2,
 originX: 'center',
 originY: 'center',
 selectable: false
 });
 fabricCanvas.add(img);
 fabricCanvas.renderAll();
}
function handleExport() {
 if (!fabricCanvas)
 return;
 const multiplier = exportScale.value;
 const format = exportFormat.value === 'jpg' ? 'jpeg' : 'png';
 const quality = exportFormat.value === 'jpg' ? exportQuality.value : 1;
 const bgSave = fabricCanvas.backgroundColor;
 if (exportFormat.value === 'png' && exportTransparent.value) {
 fabricCanvas.backgroundColor = 'transparent';
 }
 else if (exportFormat.value === 'jpg') {
 if (transparentBg.value || !bgSave || bgSave === 'transparent') {
 fabricCanvas.backgroundColor = '#ffffff';
 }
 }
 fabricCanvas.renderAll();
 const dataURL = fabricCanvas.toDataURL({
 format: format,
 quality: quality,
 multiplier: multiplier
 });
 fabricCanvas.backgroundColor = bgSave;
 fabricCanvas.renderAll();
 if (exportFormat.value === 'pdf') {
 exportPDF(dataURL);
 }
 else {
 const byteString = atob(dataURL.split(',')[1]);
 const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
 const ab = new ArrayBuffer(byteString.length);
 const ia = new Uint8Array(ab);
 for (let i = 0; i < byteString.length; i++) {
 ia[i] = byteString.charCodeAt(i);
 }
 const blob = new Blob([ab], { type: mimeString });
 saveAs(blob, `证件照.${exportFormat.value === 'jpg' ? 'jpg' : 'png'}`);
 ElMessage.success('导出成功');
 }
}
function exportPDF(imageDataURL) {
 const pdf = new jsPDF({
 orientation: fabricCanvas.width > fabricCanvas.height ? 'landscape' : 'portrait',
 unit: 'px',
 format: [fabricCanvas.width * exportScale.value, fabricCanvas.height * exportScale.value]
 });
 pdf.addImage(imageDataURL, 'PNG', 0, 0, fabricCanvas.width * exportScale.value, fabricCanvas.height * exportScale.value);
 const pdfBlob = pdf.output('blob');
 saveAs(pdfBlob, '证件照.pdf');
 ElMessage.success('PDF导出成功');
}
function exportLayout() {
 if (!layoutImage) {
 ElMessage.warning('请先生成排版');
 return;
 }
 const tempCanvas = document.createElement('canvas');
 const ctx = tempCanvas.getContext('2d');
 tempCanvas.width = layoutPaperWidth.value;
 tempCanvas.height = layoutPaperHeight.value;
 const dataURL = fabricCanvas.toDataURL({ format: 'png', multiplier: 1 });
 const img = new Image();
 img.onload = () => {
 ctx.drawImage(img, 0, 0, layoutPaperWidth.value, layoutPaperHeight.value);
 const layoutDataURL = tempCanvas.toDataURL('image/jpeg', 0.95);
 const byteString = atob(layoutDataURL.split(',')[1]);
 const ab = new ArrayBuffer(byteString.length);
 const ia = new Uint8Array(ab);
 for (let i = 0; i < byteString.length; i++) {
 ia[i] = byteString.charCodeAt(i);
 }
 const blob = new Blob([ab], { type: 'image/jpeg' });
 saveAs(blob, '排版打印.jpg');
 ElMessage.success('排版图片导出成功');
 };
 img.src = dataURL;
}
async function loadHistory() {
 try {
 const res = await api.getHistory();
 historyList.value = res.history || [];
 }
 catch (err) {
 console.error('加载历史记录失败', err);
 }
}
async function saveToHistory() {
 if (!hasImage.value) {
 ElMessage.warning('请先上传照片');
 return;
 }
 try {
 const thumbnail = fabricCanvas.toDataURL({
 format: 'jpeg',
 quality: 0.6,
 multiplier: 0.3
 });
 const name = `证件照_${new Date().toLocaleString()}`;
 const res = await api.saveHistory({
 name,
 thumbnail,
 timestamp: Date.now()
 });
 historyList.value.unshift(res.item);
 if (historyList.value.length > 10) {
 historyList.value = historyList.value.slice(0, 10);
 }
 ElMessage.success('已保存到历史记录');
 }
 catch (err) {
 ElMessage.error('保存失败');
 console.error(err);
 }
}
async function loadHistoryItem(item) {
 ElMessage.info('历史记录功能需配合完整的状态存储使用，当前版本保存缩略图预览');
}
async function removeHistory(id) {
 try {
 await api.deleteHistory(id);
 historyList.value = historyList.value.filter(item => item.id !== id);
 ElMessage.success('删除成功');
 }
 catch (err) {
 ElMessage.error('删除失败');
 console.error(err);
 }
}
async function clearAllHistory() {
 try {
 await ElMessageBox.confirm('确定要清空所有历史记录吗？', '提示', {
 confirmButtonText: '确定',
 cancelButtonText: '取消',
 type: 'warning'
 });
 await api.clearHistory();
 historyList.value = [];
 ElMessage.success('已清空历史记录');
 }
 catch (err) {
 if (err !== 'cancel') {
 console.error(err);
 }
 }
}
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background-color: #f5f7fa;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 24px;
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.app-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  width: 340px;
  background-color: #fff;
  border-right: 1px solid #e4e7ed;
  overflow-y: auto;
}

.sidebar-tabs {
  height: 100%;
}

.sidebar-tabs :deep(.el-tabs__header) {
  margin: 0;
  width: 80px;
  background-color: #fafafa;
  border-right: 1px solid #e4e7ed;
}

.sidebar-tabs :deep(.el-tabs__nav) {
  width: 100%;
  flex-direction: column;
}

.sidebar-tabs :deep(.el-tabs__item) {
  height: 56px;
  line-height: 56px;
  text-align: center;
  padding: 0;
  font-size: 13px;
}

.sidebar-tabs :deep(.el-tabs__content) {
  position: absolute;
  left: 80px;
  right: 0;
  top: 0;
  bottom: 0;
  padding: 16px;
  overflow-y: auto;
}

.panel-content {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-item label {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
}

.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 20px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  background-color: #fafafa;
}

.upload-area:hover,
.upload-area.drag-over {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.upload-icon {
  font-size: 48px;
  color: #409eff;
  margin-bottom: 10px;
}

.upload-text {
  font-size: 14px;
  color: #606266;
  margin-bottom: 4px;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
}

.size-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.size-item {
  padding: 10px 8px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s;
}

.size-item:hover {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.size-item.active {
  border-color: #409eff;
  background-color: #409eff;
  color: #fff;
}

.size-name {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 2px;
}

.size-desc {
  font-size: 11px;
  opacity: 0.9;
}

.size-mm {
  font-size: 10px;
  opacity: 0.8;
}

.custom-size {
  display: flex;
  align-items: center;
  gap: 8px;
}

.custom-size .x {
  color: #909399;
}

.crop-info {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #909399;
  padding: 8px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.color-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.color-item {
  padding: 8px;
  border: 2px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.color-item:hover {
  border-color: #dcdfe6;
}

.color-item.active {
  border-color: #409eff;
}

.color-preview {
  width: 100%;
  height: 30px;
  border-radius: 4px;
  margin-bottom: 6px;
  border: 1px solid #e4e7ed;
}

.color-name {
  font-size: 13px;
  font-weight: 500;
}

.color-purpose {
  font-size: 10px;
  color: #909399;
}

.tip {
  font-size: 12px;
  color: #909399;
  margin-top: 6px;
}

.value-display {
  text-align: center;
  font-size: 12px;
  color: #909399;
  margin-top: -4px;
}

.btn-group {
  display: flex;
  gap: 8px;
}

.btn-group .el-button {
  flex: 1;
}

.layout-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.layout-preset-item {
  padding: 8px 12px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.layout-preset-item:hover {
  border-color: #409eff;
  color: #409eff;
}

.layout-preset-item.active {
  background-color: #409eff;
  border-color: #409eff;
  color: #fff;
}

.layout-info {
  font-size: 12px;
  color: #606266;
  line-height: 1.8;
}

.export-preview {
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 6px;
}

.preview-label {
  font-size: 13px;
  font-weight: 500;
  color: #606266;
  margin-bottom: 8px;
}

.preview-info {
  font-size: 12px;
  color: #909399;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 400px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  gap: 10px;
  padding: 10px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  align-items: center;
}

.history-thumb {
  width: 50px;
  height: 60px;
  border-radius: 4px;
  overflow: hidden;
  background-color: #f0f2f5;
  cursor: pointer;
  flex-shrink: 0;
}

.history-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-thumb {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #c0c4cc;
}

.history-info {
  flex: 1;
  min-width: 0;
}

.history-name {
  font-size: 13px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-time {
  font-size: 11px;
  color: #909399;
  margin-top: 2px;
}

.history-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
}

.empty-history {
  padding: 20px 0;
}

.canvas-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30px;
  background-color: #f0f2f5;
  background-image:
    linear-gradient(45deg, #e4e7ed 25%, transparent 25%),
    linear-gradient(-45deg, #e4e7ed 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #e4e7ed 75%),
    linear-gradient(-45deg, transparent 75%, #e4e7ed 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
  overflow: auto;
  position: relative;
}

.canvas-wrapper {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  background-color: #fff;
}

#fabric-canvas {
  display: block;
}

.empty-canvas-tip {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #c0c4cc;
}

.empty-canvas-tip p {
  margin-top: 16px;
  font-size: 16px;
}
</style>
