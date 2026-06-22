#!/bin/bash

echo "========================================"
echo "  在线证件照制作工具 - 一键启动"
echo "========================================"
echo ""

BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$BASE_DIR/backend"
FRONTEND_DIR="$BASE_DIR/frontend"

echo "📁 项目目录: $BASE_DIR"
echo ""

cd "$BACKEND_DIR"
if [ ! -d "node_modules" ]; then
  echo "📦 正在安装后端依赖..."
  npm install
  echo "✅ 后端依赖安装完成"
else
  echo "✅ 后端依赖已安装"
fi

cd "$FRONTEND_DIR"
if [ ! -d "node_modules" ]; then
  echo "📦 正在安装前端依赖..."
  npm install
  echo "✅ 前端依赖安装完成"
else
  echo "✅ 前端依赖已安装"
fi

echo ""
echo "🚀 正在启动服务..."
echo ""

cd "$BACKEND_DIR"
npm start &
BACKEND_PID=$!

cd "$FRONTEND_DIR"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "========================================"
echo "  服务启动中..."
echo "  后端端口: 5100"
echo "  前端端口: 3100"
echo "========================================"
echo ""
echo "🌐 前端地址: http://localhost:3100"
echo "🔧 后端API:  http://localhost:5100"
echo ""
echo "按 Ctrl+C 停止所有服务"
echo ""

trap "echo ''; echo '🛑 正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; wait $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo '✅ 服务已停止'; exit" INT

wait
