# 配置防火墙允许端口5173和3001
# 需要以管理员身份运行

Write-Host "正在配置防火墙规则..." -ForegroundColor Green

try {
    # 允许入站连接到端口5173 (前端)
    New-NetFirewallRule -DisplayName "OCR App Frontend" -Direction Inbound -Protocol TCP -LocalPort 5173 -Action Allow -Profile Any
    Write-Host "✓ 已允许端口5173 (前端)" -ForegroundColor Green
    
    # 允许入站连接到端口3001 (后端)
    New-NetFirewallRule -DisplayName "OCR App Backend" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow -Profile Any
    Write-Host "✓ 已允许端口3001 (后端)" -ForegroundColor Green
    
    Write-Host "防火墙配置完成！" -ForegroundColor Green
    Write-Host "现在局域网中的其他设备可以访问你的应用了。" -ForegroundColor Yellow
    
} catch {
    Write-Host "防火墙配置失败: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "请以管理员身份运行此脚本。" -ForegroundColor Yellow
}

Read-Host "按任意键继续..."