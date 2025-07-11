# 启动局域网共享模式
Write-Host "正在启动局域网共享模式..." -ForegroundColor Green

# 获取本机IP地址
$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi*" | Where-Object {$_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" -or $_.IPAddress -like "172.*"}).IPAddress

if ($ipAddress) {
    Write-Host "检测到本机IP地址: $ipAddress" -ForegroundColor Yellow
    Write-Host "同事可以通过以下地址访问:" -ForegroundColor Cyan
    Write-Host "  前端: http://$ipAddress:5173" -ForegroundColor White
    Write-Host "  后端: http://$ipAddress:3001" -ForegroundColor White
    Write-Host ""
    Write-Host "请确保:" -ForegroundColor Red
    Write-Host "  1. 防火墙允许端口5173和3001" -ForegroundColor White
    Write-Host "  2. 所有设备在同一WiFi网络中" -ForegroundColor White
    Write-Host "  3. 先启动后端服务器" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "未检测到有效的IP地址，请检查WiFi连接" -ForegroundColor Red
}

# 创建两个窗口分别启动前端和后端
Write-Host "正在启动服务..." -ForegroundColor Green

# 启动后端 (在新窗口中)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; npm run dev; Read-Host 'Press Enter to close'"

# 等待2秒让后端启动
Start-Sleep 2

# 启动前端 (在新窗口中)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev -- --host; Read-Host 'Press Enter to close'"

Write-Host "服务启动完成！" -ForegroundColor Green
Write-Host "按任意键关闭此窗口..." -ForegroundColor Gray
Read-Host