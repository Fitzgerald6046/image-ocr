# Fix WSL2 Port Forward Script
# Run as Administrator

Write-Host "Fixing WSL2 port forwarding..." -ForegroundColor Green

try {
    # Get WSL2 IP address (first one only)
    $wslOutput = (wsl hostname -I).Trim()
    $wslIP = $wslOutput.Split(' ')[0]
    Write-Host "Using WSL2 IP: $wslIP" -ForegroundColor Yellow
    
    # Get Windows host IP using different methods
    $windowsIP = $null
    try {
        # Try different interface names
        $interfaces = @("Wi-Fi", "WiFi", "无线网络连接", "WLAN", "以太网")
        foreach ($interface in $interfaces) {
            try {
                $ip = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias $interface -ErrorAction SilentlyContinue | Where-Object {$_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" -or $_.IPAddress -like "172.*"}).IPAddress
                if ($ip) {
                    $windowsIP = $ip
                    Write-Host "Found Windows IP via $interface`: $windowsIP" -ForegroundColor Yellow
                    break
                }
            } catch {
                continue
            }
        }
        
        # If still no IP, try ipconfig parsing
        if (-not $windowsIP) {
            $ipconfigOutput = ipconfig | Select-String "IPv4"
            foreach ($line in $ipconfigOutput) {
                if ($line -match "192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.\d+\.\d+\.\d+") {
                    $windowsIP = $matches[0]
                    Write-Host "Found Windows IP via ipconfig: $windowsIP" -ForegroundColor Yellow
                    break
                }
            }
        }
        
        if (-not $windowsIP) {
            Write-Host "Warning: Could not detect Windows IP automatically" -ForegroundColor Yellow
            Write-Host "Please run 'ipconfig' to find your IP address" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "Warning: Could not get Windows IP: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
    # Clean up existing port forwarding rules
    Write-Host "Cleaning up existing rules..." -ForegroundColor Gray
    netsh interface portproxy delete v4tov4 listenport=3000 2>$null
    netsh interface portproxy delete v4tov4 listenport=3001 2>$null
    
    # Add new port forwarding rules
    Write-Host "Adding port forwarding rules..." -ForegroundColor Gray
    netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=$wslIP
    netsh interface portproxy add v4tov4 listenport=3001 listenaddress=0.0.0.0 connectport=3001 connectaddress=$wslIP
    
    Write-Host "Port forwarding configured successfully" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "Configuration complete!" -ForegroundColor Green
    if ($windowsIP) {
        Write-Host "Your colleagues can access:" -ForegroundColor Cyan
        Write-Host "  Frontend: http://$windowsIP`:3000" -ForegroundColor White
        Write-Host "  Backend: http://$windowsIP`:3001" -ForegroundColor White
    } else {
        Write-Host "Please check your Windows IP address with 'ipconfig'" -ForegroundColor Yellow
        Write-Host "Then tell colleagues to use: http://YOUR_IP:3000" -ForegroundColor Cyan
    }
    
    Write-Host ""
    Write-Host "Port forwarding status:" -ForegroundColor Yellow
    netsh interface portproxy show v4tov4
    
} catch {
    Write-Host "Configuration failed: $($_.Exception.Message)" -ForegroundColor Red
}

Read-Host "Press any key to continue..."