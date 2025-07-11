# WSL2 Port Forward Setup Script
# Run as Administrator

Write-Host "Setting up WSL2 port forwarding..." -ForegroundColor Green

try {
    # Get WSL2 IP address
    $wslIP = (wsl hostname -I).Trim()
    Write-Host "WSL2 IP: $wslIP" -ForegroundColor Yellow
    
    # Get Windows host IP
    $windowsIP = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi*" | Where-Object {$_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" -or $_.IPAddress -like "172.*"}).IPAddress
    Write-Host "Windows IP: $windowsIP" -ForegroundColor Yellow
    
    # Remove existing port forwarding rules
    Write-Host "Removing existing rules..." -ForegroundColor Gray
    netsh interface portproxy delete v4tov4 listenport=3000 2>$null
    netsh interface portproxy delete v4tov4 listenport=3001 2>$null
    
    # Add port forwarding rules
    Write-Host "Adding port forwarding rules..." -ForegroundColor Gray
    netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=$wslIP
    netsh interface portproxy add v4tov4 listenport=3001 listenaddress=0.0.0.0 connectport=3001 connectaddress=$wslIP
    
    Write-Host "Port forwarding configured" -ForegroundColor Green
    
    # Configure firewall rules
    Write-Host "Configuring firewall..." -ForegroundColor Gray
    Remove-NetFirewallRule -DisplayName "WSL2 OCR Frontend" -ErrorAction SilentlyContinue
    Remove-NetFirewallRule -DisplayName "WSL2 OCR Backend" -ErrorAction SilentlyContinue
    New-NetFirewallRule -DisplayName "WSL2 OCR Frontend" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -Profile Any
    New-NetFirewallRule -DisplayName "WSL2 OCR Backend" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow -Profile Any
    
    Write-Host "Firewall configured" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "Configuration complete!" -ForegroundColor Green
    Write-Host "Your colleagues can access:" -ForegroundColor Cyan
    Write-Host "  Frontend: http://$windowsIP`:3000" -ForegroundColor White
    Write-Host "  Backend: http://$windowsIP`:3001" -ForegroundColor White
    
    Write-Host ""
    Write-Host "Port forwarding status:" -ForegroundColor Yellow
    netsh interface portproxy show v4tov4
    
} catch {
    Write-Host "Configuration failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please ensure:" -ForegroundColor Yellow
    Write-Host "1. Run as Administrator" -ForegroundColor White
    Write-Host "2. WSL2 is running" -ForegroundColor White
    Write-Host "3. Network is connected" -ForegroundColor White
}

Read-Host "Press any key to continue..."