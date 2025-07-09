#!/usr/bin/env pwsh

Write-Host "🔄 智能图片识别系统 - 重启脚本" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# 1. 停止所有相关进程
Write-Host "📛 正在停止所有相关进程..." -ForegroundColor Yellow

# 停止所有Node.js进程
try {
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    Write-Host "✅ 已停止所有Node.js进程" -ForegroundColor Green
} catch {
    Write-Host "⚠️ 没有找到Node.js进程或已停止" -ForegroundColor Yellow
}

# 停止所有可能的端口占用
$ports = @(3000, 3001)
foreach ($port in $ports) {
    try {
        $connections = netstat -aon | Select-String ":$port "
        if ($connections) {
            $pids = $connections | ForEach-Object { 
                ($_.ToString() -split '\s+')[-1] 
            } | Where-Object { $_ -match '^\d+$' } | Sort-Object -Unique
            
            foreach ($pid in $pids) {
                if ($pid -ne "0") {
                    try {
                        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                        Write-Host "✅ 已停止占用端口 $port 的进程 PID: $pid" -ForegroundColor Green
                    } catch {
                        Write-Host "⚠️ 无法停止进程 PID: $pid" -ForegroundColor Yellow
                    }
                }
            }
        }
    } catch {
        Write-Host "⚠️ 检查端口 $port 时出错" -ForegroundColor Yellow
    }
}

# 2. 等待端口释放
Write-Host "⏳ 等待端口释放..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# 3. 验证端口已释放
Write-Host "🔍 验证端口状态..." -ForegroundColor Cyan
$port3000 = netstat -aon | Select-String ":3000 "
$port3001 = netstat -aon | Select-String ":3001 "

if ($port3000) {
    Write-Host "⚠️ 端口 3000 仍被占用" -ForegroundColor Red
} else {
    Write-Host "✅ 端口 3000 已释放" -ForegroundColor Green
}

if ($port3001) {
    Write-Host "⚠️ 端口 3001 仍被占用" -ForegroundColor Red
} else {
    Write-Host "✅ 端口 3001 已释放" -ForegroundColor Green
}

# 4. 启动后端服务
Write-Host "🚀 启动后端服务..." -ForegroundColor Cyan
Push-Location backend
try {
    # 在新的进程中启动后端
    $backendJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        node server.js
    }
    
    Write-Host "⏳ 等待后端启动..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    # 检查后端是否启动成功
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -TimeoutSec 5 -ErrorAction Stop
        Write-Host "✅ 后端服务启动成功" -ForegroundColor Green
    } catch {
        Write-Host "❌ 后端服务启动失败，请检查日志" -ForegroundColor Red
        Write-Host "错误信息: $($_.Exception.Message)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ 启动后端时出错: $($_.Exception.Message)" -ForegroundColor Red
}
Pop-Location

# 5. 启动前端服务
Write-Host "🎨 启动前端服务..." -ForegroundColor Cyan
try {
    # 在新的进程中启动前端
    $frontendJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        npm run dev
    }
    
    Write-Host "⏳ 等待前端启动..." -ForegroundColor Yellow
    Start-Sleep -Seconds 8
    
    # 检查前端是否启动成功
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -ErrorAction Stop
        Write-Host "✅ 前端服务启动成功" -ForegroundColor Green
    } catch {
        Write-Host "❌ 前端服务启动失败，请检查日志" -ForegroundColor Red
        Write-Host "错误信息: $($_.Exception.Message)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ 启动前端时出错: $($_.Exception.Message)" -ForegroundColor Red
}

# 6. 显示最终状态
Write-Host "📊 最终服务状态:" -ForegroundColor Cyan
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
Write-Host "🎉 重启完成！请访问 http://localhost:3000" -ForegroundColor Green
Write-Host "📝 如果仍有问题，请手动检查服务日志" -ForegroundColor Yellow

Write-Host "程序重启完成，现在可以测试表格识别CSV导出功能了！" -ForegroundColor Magenta

# 保持脚本窗口打开
Write-Host "按任意键退出..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 