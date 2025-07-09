#!/bin/bash

echo "🚀 启动智能图片识别系统..."

# 停止现有进程
echo "🔧 清理现有进程..."
pkill -f "node.*server.js" 2>/dev/null || true
pkill -f "npm.*dev" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
sleep 1

# 启动后端
echo "🔧 启动后端服务..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..
echo "后端 PID: $BACKEND_PID"

# 等待后端启动
echo "⏳ 等待后端启动..."
sleep 5

# 启动前端
echo "🎨 启动前端服务..."
npm run dev &
FRONTEND_PID=$!
echo "前端 PID: $FRONTEND_PID"

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

# 捕获退出信号并清理进程
trap 'echo "\n🛑 正在停止服务..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo "✅ 服务已停止"; exit 0' INT TERM

# 等待用户中断
wait