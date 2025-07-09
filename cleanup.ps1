#!/usr/bin/env pwsh

Write-Host "🧹 正在清理端口占用..." -ForegroundColor Yellow

# 停止所有Node.js进程
try {
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    Write-Host "✅ 已停止所有Node.js进程" -ForegroundColor Green
} catch {
    Write-Host "⚠️ 没有找到Node.js进程或已停止" -ForegroundColor Yellow
}

# 清理特定端口占用
$ports = @(3000, 3001)
foreach ($port in $ports) {
    try {
        $connections = netstat -aon | Select-String ":$port "
        if ($connections) {
            $pids = $connections | ForEach-Object { 
                ($_.ToString() -split '\s+')[-1] 
            } | Where-Object { $_ -match '^\d+$' -and $_ -ne "0" } | Sort-Object -Unique
            
            foreach ($pid in $pids) {
                try {
                    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                    Write-Host "✅ 已停止占用端口 $port 的进程 PID: $pid" -ForegroundColor Green
                } catch {
                    Write-Host "⚠️ 无法停止进程 PID: $pid" -ForegroundColor Yellow
                }
            }
        }
    } catch {
        Write-Host "⚠️ 检查端口 $port 时出错" -ForegroundColor Yellow
    }
}

# 验证端口释放
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

Write-Host "🎉 端口清理完成！" -ForegroundColor Green 