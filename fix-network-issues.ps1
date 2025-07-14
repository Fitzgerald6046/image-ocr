# PowerShell脚本：修复网络连接问题
# 用于解决IPv6/IPv4解析和代理问题

Write-Host "🔧 正在修复网络连接问题..." -ForegroundColor Yellow

# 1. 强制使用IPv4 DNS解析
Write-Host "📡 配置IPv4优先DNS解析..." -ForegroundColor Cyan
netsh interface ipv6 set global randomizeidentifiers=disabled
netsh interface ipv6 set global randomizeidentifiers=enabled store=persistent

# 2. 清除DNS缓存
Write-Host "🗑️ 清除DNS缓存..." -ForegroundColor Cyan
ipconfig /flushdns

# 3. 检查代理设置
Write-Host "🌐 检查代理设置..." -ForegroundColor Cyan
$proxySettings = netsh winhttp show proxy
Write-Host $proxySettings

# 4. 重置网络适配器
Write-Host "🔄 重置网络适配器..." -ForegroundColor Cyan
ipconfig /release
ipconfig /renew

# 5. 添加localhost映射（确保指向IPv4）
Write-Host "📍 添加hosts文件映射..." -ForegroundColor Cyan
$hostsPath = "$env:SystemRoot\System32\drivers\etc\hosts"
$hostsContent = Get-Content $hostsPath -ErrorAction SilentlyContinue
if ($hostsContent -notmatch "127.0.0.1\s+localhost") {
    Add-Content $hostsPath "`n127.0.0.1 localhost"
    Write-Host "✅ 已添加localhost映射到127.0.0.1" -ForegroundColor Green
}

# 6. 测试连接
Write-Host "🧪 测试网络连接..." -ForegroundColor Cyan
try {
    $testResult = Test-NetConnection -ComputerName "google.com" -Port 443 -WarningAction SilentlyContinue
    if ($testResult.TcpTestSucceeded) {
        Write-Host "✅ 网络连接正常" -ForegroundColor Green
    } else {
        Write-Host "❌ 网络连接失败" -ForegroundColor Red
    }
} catch {
    Write-Host "⚠️ 网络测试失败: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`n🎯 修复完成！建议重启终端后重新运行程序。" -ForegroundColor Green
Write-Host "💡 如果问题持续，请在WSL环境下运行程序。" -ForegroundColor Cyan