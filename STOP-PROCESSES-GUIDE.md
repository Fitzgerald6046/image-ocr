# 前端后端程序终止指南

> 📋 本文档提供了终止前端和后端程序运行的完整指南，适用于各种操作系统和场景。

## 🚀 快速终止方法

### 方法1：使用项目自带脚本（推荐）

```bash
# PowerShell脚本（推荐）
./cleanup.ps1

# 如果需要重启
./restart.ps1
```

### 方法2：键盘快捷键（在运行的终端中）

```bash
# 在运行前端/后端的终端窗口中按下：
Ctrl + C        # Linux/Mac/Windows通用
```

---

## 📋 详细终止方法

### 🔥 紧急终止方法

#### Windows系统

**1. PowerShell命令行终止**
```powershell
# 终止所有Node.js进程
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

# 终止特定端口占用的进程
netstat -aon | findstr ":3000" | findstr LISTENING
netstat -aon | findstr ":3001" | findstr LISTENING
# 找到PID后执行：
taskkill /PID <进程ID> /F
```

**2. 使用任务管理器**
```
1. 按 Ctrl + Shift + Esc 打开任务管理器
2. 在"进程"标签页中找到 "Node.js JavaScript Runtime"
3. 选中并点击"结束任务"
4. 重复直到所有相关进程终止
```

#### Linux/Mac系统

**1. 使用命令行**
```bash
# 查找并终止Node.js进程
pkill -f node
pkill -f npm

# 或者更精确的查找
ps aux | grep node | grep -v grep
kill -9 <进程ID>

# 终止特定端口的进程
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

**2. 使用系统监视器**
```
1. 打开系统监视器（Activity Monitor on Mac）
2. 搜索 "node" 或 "npm"
3. 选中进程并点击"强制退出"
```

### 🎯 按端口终止

#### 查找并终止特定端口的进程

**Windows:**
```powershell
# 查找占用端口的进程
netstat -aon | findstr ":3000"
netstat -aon | findstr ":3001"
netstat -aon | findstr ":5173"

# 终止进程（替换<PID>为实际进程ID）
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
# 查找占用端口的进程
lsof -i :3000
lsof -i :3001
lsof -i :5173

# 终止进程
kill -9 $(lsof -ti :3000)
kill -9 $(lsof -ti :3001)
kill -9 $(lsof -ti :5173)
```

### 🔍 按进程名称终止

#### 精确查找项目相关进程

```bash
# 查找项目相关进程
ps aux | grep -E "onebyone-ocr|backend" | grep -v grep

# Linux/Mac终止
pkill -f "onebyone-ocr"
pkill -f "npm run dev"
pkill -f "npm start"

# Windows终止
taskkill /IM "node.exe" /F
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force
```

---

## 📝 终止流程检查清单

### ✅ 终止前检查

- [ ] 保存所有未保存的工作
- [ ] 记录当前运行的服务端口
- [ ] 确认没有重要的上传/下载任务进行中

### ✅ 终止后验证

```bash
# 验证端口已释放
# Windows
netstat -aon | findstr ":3000"
netstat -aon | findstr ":3001"

# Linux/Mac
lsof -i :3000
lsof -i :3001

# 验证进程已终止
ps aux | grep node | grep -v grep
```

### ✅ 清理工作

- [ ] 清理临时文件（如需要）
- [ ] 检查日志文件大小
- [ ] 重置开发环境（如需要）

---

## 🛠 自动化脚本

### Windows PowerShell脚本 (cleanup.ps1)

```powershell
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
$ports = @(3000, 3001, 5173)
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

Write-Host "🎉 端口清理完成！" -ForegroundColor Green
```

### Linux/Mac Shell脚本 (cleanup.sh)

```bash
#!/bin/bash

echo "🧹 正在清理端口占用..."

# 停止所有Node.js进程
pkill -f node && echo "✅ 已停止所有Node.js进程" || echo "⚠️ 没有找到Node.js进程或已停止"

# 清理特定端口占用
ports=(3000 3001 5173)
for port in "${ports[@]}"; do
    pid=$(lsof -ti :$port)
    if [[ -n $pid ]]; then
        kill -9 $pid && echo "✅ 已停止占用端口 $port 的进程 PID: $pid"
    else
        echo "✅ 端口 $port 未被占用"
    fi
done

echo "🎉 端口清理完成！"
```

---

## 🚨 故障排除

### 常见问题及解决方案

#### 1. 进程无法终止
```bash
# 使用强制终止
# Windows
taskkill /PID <PID> /F /T

# Linux/Mac
sudo kill -9 <PID>
```

#### 2. 端口仍被占用
```bash
# 等待几秒后重试
sleep 5

# 检查是否有隐藏进程
# Windows
wmic process where "commandline like '%node%'" get processid,commandline

# Linux/Mac
ps -ef | grep node
```

#### 3. 权限不足
```bash
# Windows（以管理员身份运行PowerShell）
# Linux/Mac
sudo pkill -f node
```

#### 4. 多个Node.js版本
```bash
# 查看所有Node.js相关进程
# Windows
wmic process where "name='node.exe'" get processid,commandline

# Linux/Mac
ps aux | grep node | grep -v grep
```

---

## 📚 相关文件和脚本

### 项目中的相关脚本

| 文件名 | 用途 | 使用方法 |
|--------|------|----------|
| `cleanup.ps1` | 清理所有进程和端口 | `./cleanup.ps1` |
| `start.ps1` | 启动前后端服务 | `./start.ps1` |
| `restart.ps1` | 重启服务 | `./restart.ps1` |

### 手动启动命令

```bash
# 启动前端 (端口 3000 或 5173)
npm run dev

# 启动后端 (端口 3001)
cd backend
npm run dev
# 或
npm start
```

---

## 💡 最佳实践建议

### 🎯 推荐的终止顺序

1. **优雅终止**：先尝试 `Ctrl+C`
2. **脚本终止**：使用 `./cleanup.ps1`
3. **手动终止**：使用任务管理器或命令行
4. **强制终止**：使用 `kill -9` 或 `taskkill /F`

### 🔧 预防措施

- 定期清理日志文件
- 避免在多个终端中启动相同服务
- 使用端口管理工具监控端口使用情况
- 设置开发环境的自动清理定时任务

### 📋 日常维护

- 每日开发结束后运行清理脚本
- 定期检查系统资源使用情况
- 保持开发环境的整洁

---

## 🔗 相关资源

- [Node.js进程管理最佳实践](https://nodejs.org/en/docs/guides/simple-profiling/)
- [PM2进程管理器](https://pm2.keymetrics.io/)
- [端口管理工具推荐](https://github.com/nodejs/node/wiki)

---

**最后更新时间**：2025年1月23日  
**适用系统**：Windows 10/11, macOS, Ubuntu/Linux  
**测试环境**：Node.js v18+, npm v8+