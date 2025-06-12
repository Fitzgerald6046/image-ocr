#!/usr/bin/env pwsh

Write-Host "🚀 启动智能图片识别系统..." -ForegroundColor Green

# 1. 清理环境
& .\cleanup.ps1

# 2. 启动后端 (先启动，确保3001端口被占用)
Write-Host "🔧 启动后端服务..." -ForegroundColor Cyan
Push-Location backend
Start-Process PowerShell.exe -ArgumentList "-NoExit", "-Command", "node server.js"
Pop-Location

# 3. 等待后端完全启动
Write-Host "⏳ 等待后端启动..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# 4. 验证后端
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ 后端服务启动成功" -ForegroundColor Green
} catch {
    Write-Host "❌ 后端服务启动失败" -ForegroundColor Red
    Write-Host "错误信息: $($_.Exception.Message)" -ForegroundColor Red
    return
}

# 5. 启动前端 (后启动，使用3000端口)
Write-Host "🎨 启动前端服务..." -ForegroundColor Cyan
Start-Process PowerShell.exe -ArgumentList "-NoExit", "-Command", "npm run dev"

# 6. 等待前端启动
Start-Sleep -Seconds 8

# 7. 验证前端
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ 前端服务启动成功" -ForegroundColor Green
} catch {
    Write-Host "❌ 前端服务启动失败" -ForegroundColor Red
    Write-Host "错误信息: $($_.Exception.Message)" -ForegroundColor Red
}

# 8. 显示最终状态
Write-Host "📊 服务状态:" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Green

$port3000Final = netstat -aon | Select-String ":3000.*LISTENING"
$port3001Final = netstat -aon | Select-String ":3001.*LISTENING"

if ($port3001Final) {
    Write-Host "✅ 后端服务: http://localhost:3001 (运行中)" -ForegroundColor Green
} else {
    Write-Host "❌ 后端服务: 未运行" -ForegroundColor Red
}

if ($port3000Final) {
    Write-Host "✅ 前端服务: http://localhost:3000 (运行中)" -ForegroundColor Green
} else {
    Write-Host "❌ 前端服务: 未运行" -ForegroundColor Red
}

Write-Host "================================" -ForegroundColor Green
Write-Host "🎉 启动完成！请访问 http://localhost:3000" -ForegroundColor Green 