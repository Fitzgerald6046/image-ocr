# 检查WSL2端口转发状态

Write-Host "检查WSL2端口转发状态..." -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Gray

# 检查WSL2状态
try {
    $wslIP = (wsl hostname -I).Trim()
    Write-Host "✓ WSL2 IP地址: $wslIP" -ForegroundColor Green
} catch {
    Write-Host "✗ WSL2未运行或无法访问" -ForegroundColor Red
}

# 检查Windows IP
try {
    $windowsIP = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi*" | Where-Object {$_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" -or $_.IPAddress -like "172.*"}).IPAddress
    Write-Host "✓ Windows主机IP: $windowsIP" -ForegroundColor Green
} catch {
    Write-Host "✗ 无法获取Windows IP地址" -ForegroundColor Red
}

# 检查端口转发规则
Write-Host "`n端口转发规则:" -ForegroundColor Yellow
try {
    $portForwards = netsh interface portproxy show v4tov4
    if ($portForwards -match "3000|3001") {
        Write-Host "$portForwards" -ForegroundColor Green
    } else {
        Write-Host "✗ 未找到端口转发规则" -ForegroundColor Red
        Write-Host "请运行 setup-wsl-port-forward.ps1 进行配置" -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ 无法检查端口转发规则" -ForegroundColor Red
}

# 检查防火墙规则
Write-Host "`n防火墙规则:" -ForegroundColor Yellow
try {
    $firewallRules = Get-NetFirewallRule -DisplayName "*WSL2 OCR*" -ErrorAction SilentlyContinue
    if ($firewallRules) {
        foreach ($rule in $firewallRules) {
            Write-Host "✓ $($rule.DisplayName)" -ForegroundColor Green
        }
    } else {
        Write-Host "✗ 未找到防火墙规则" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ 无法检查防火墙规则" -ForegroundColor Red
}

# 显示访问地址
Write-Host "`n访问地址:" -ForegroundColor Cyan
Write-Host "前端: http://$windowsIP`:3000" -ForegroundColor White
Write-Host "后端: http://$windowsIP`:3001" -ForegroundColor White

Write-Host "`n测试连接:" -ForegroundColor Yellow
Write-Host "1. 在WSL2中启动服务" -ForegroundColor White
Write-Host "2. 在浏览器中访问 http://$windowsIP`:3000" -ForegroundColor White
Write-Host "3. 如果无法访问，请检查上述配置" -ForegroundColor White

Read-Host "`n按任意键继续..."