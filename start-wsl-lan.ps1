# WSL2局域网共享启动脚本
# 需要以管理员身份运行

Write-Host "正在启动WSL2局域网共享模式..." -ForegroundColor Green

# 检查是否以管理员身份运行
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "请以管理员身份运行此脚本！" -ForegroundColor Red
    Write-Host "右键点击PowerShell，选择'以管理员身份运行'" -ForegroundColor Yellow
    Read-Host "按任意键退出..."
    exit
}

# 获取WSL2的IP地址
try {
    $wslIP = (wsl hostname -I).Trim()
    Write-Host "WSL2 IP地址: $wslIP" -ForegroundColor Yellow
    
    # 获取Windows主机IP
    $windowsIP = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi*" | Where-Object {$_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" -or $_.IPAddress -like "172.*"}).IPAddress
    Write-Host "Windows主机IP: $windowsIP" -ForegroundColor Yellow
    
    # 配置端口转发
    Write-Host "配置端口转发..." -ForegroundColor Gray
    
    # 清理现有规则
    netsh interface portproxy delete v4tov4 listenport=3000 2>$null
    netsh interface portproxy delete v4tov4 listenport=3001 2>$null
    
    # 添加端口转发
    netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=$wslIP
    netsh interface portproxy add v4tov4 listenport=3001 listenaddress=0.0.0.0 connectport=3001 connectaddress=$wslIP
    
    # 配置防火墙
    Write-Host "配置防火墙..." -ForegroundColor Gray
    Remove-NetFirewallRule -DisplayName "WSL2 OCR Frontend" -ErrorAction SilentlyContinue
    Remove-NetFirewallRule -DisplayName "WSL2 OCR Backend" -ErrorAction SilentlyContinue
    New-NetFirewallRule -DisplayName "WSL2 OCR Frontend" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -Profile Any
    New-NetFirewallRule -DisplayName "WSL2 OCR Backend" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow -Profile Any
    
    Write-Host "✓ 网络配置完成" -ForegroundColor Green
    
    Write-Host "`n同事可以通过以下地址访问：" -ForegroundColor Cyan
    Write-Host "  前端: http://$windowsIP`:3000" -ForegroundColor White
    Write-Host "  后端: http://$windowsIP`:3001" -ForegroundColor White
    Write-Host ""
    
    Write-Host "现在启动WSL2中的服务..." -ForegroundColor Green
    
    # 启动后端服务
    Write-Host "启动后端服务..." -ForegroundColor Gray
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "wsl -d Ubuntu -- bash -c 'cd /mnt/d/runprogram/Programming\\ Individuals/onebyone-ocr/backend && npm run dev'"
    
    # 等待后端启动
    Start-Sleep 3
    
    # 启动前端服务
    Write-Host "启动前端服务..." -ForegroundColor Gray
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "wsl -d Ubuntu -- bash -c 'cd /mnt/d/runprogram/Programming\\ Individuals/onebyone-ocr && npm run dev -- --host'"
    
    Write-Host "`n服务启动完成！" -ForegroundColor Green
    Write-Host "如果遇到问题，请检查WSL2中的服务是否正常运行。" -ForegroundColor Yellow
    
} catch {
    Write-Host "启动失败: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "请确保WSL2正在运行并且路径正确。" -ForegroundColor Yellow
}

Read-Host "`n按任意键关闭..."