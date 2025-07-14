# 检查hosts文件修改对系统的影响

Write-Host "🔍 检查hosts文件修改对系统的影响..." -ForegroundColor Yellow

# 1. 检查当前hosts文件内容
Write-Host "`n📄 当前hosts文件中的localhost条目:" -ForegroundColor Cyan
$hostsPath = "$env:SystemRoot\System32\drivers\etc\hosts"
Get-Content $hostsPath | Where-Object { $_ -match "localhost" }

# 2. 检查当前使用localhost的网络连接
Write-Host "`n🌐 当前使用localhost的网络连接:" -ForegroundColor Cyan
netstat -an | findstr "127.0.0.1\|::1" | Select-Object -First 10

# 3. 检查正在运行的本地服务
Write-Host "`n🔧 检查常见本地服务端口:" -ForegroundColor Cyan
$commonPorts = @(80, 443, 3000, 3001, 5000, 8080, 8000, 9000)
foreach ($port in $commonPorts) {
    $connection = netstat -an | findstr ":$port "
    if ($connection) {
        Write-Host "   端口 $port`: $($connection.Count) 个连接" -ForegroundColor Green
    }
}

# 4. 测试localhost解析
Write-Host "`n🧪 测试localhost解析:" -ForegroundColor Cyan
try {
    $result = Resolve-DnsName -Name "localhost" -ErrorAction SilentlyContinue
    if ($result) {
        foreach ($record in $result) {
            Write-Host "   $($record.Type): $($record.IPAddress)" -ForegroundColor Green
        }
    } else {
        Write-Host "   localhost解析失败" -ForegroundColor Red
    }
} catch {
    Write-Host "   DNS解析测试失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. 检查可能受影响的程序
Write-Host "`n⚠️  可能受影响的程序类型:" -ForegroundColor Yellow
Write-Host "   - Web开发服务器 (如webpack-dev-server)"
Write-Host "   - 数据库管理工具"
Write-Host "   - API测试工具 (如Postman localhost请求)"
Write-Host "   - 本地代理服务"

# 6. 提供回滚选项
Write-Host "`n🔄 如需回滚hosts修改:" -ForegroundColor Cyan
Write-Host "   1. 以管理员身份打开: $hostsPath"
Write-Host "   2. 删除行: 127.0.0.1 localhost"
Write-Host "   3. 或运行: ./rollback-hosts.ps1"

Write-Host "`n💡 建议: 如果在WSL中开发，无需修改Windows hosts文件" -ForegroundColor Green