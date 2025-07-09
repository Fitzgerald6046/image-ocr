#!/bin/bash

echo "🚀 启动智能图片识别系统..."

# 停止现有进程
echo "🔧 清理现有进程..."
pkill -f "node.*server.js" 2>/dev/null || true
pkill -f "npm.*dev" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

# 启动后端
echo "🔧 启动后端服务..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# 等待后端启动
echo "⏳ 等待后端启动..."
sleep 5

# 启动前端
echo "🎨 启动前端服务..."
npm run dev &
FRONTEND_PID=$!

# 等待前端启动
sleep 8

echo "📊 服务状态:"
echo "================================"
echo "✅ 后端服务: http://localhost:3001"
echo "✅ 前端服务: http://localhost:3000"
echo "================================"
echo "🎉 启动完成！请访问 http://localhost:3000"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
wait
