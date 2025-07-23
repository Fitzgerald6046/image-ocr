# 🚨 快速终止参考卡

> 紧急情况下快速终止前后端程序的方法

## ⚡ 最快方法

```bash
# 1. 项目自带脚本（推荐）
./cleanup.ps1

# 2. 键盘快捷键（在运行的终端中）
Ctrl + C
```

## 🔥 紧急终止

### Windows 一键清理
```powershell
# 终止所有Node.js进程
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

# 清理特定端口
netstat -aon | findstr ":3000" | findstr LISTENING
netstat -aon | findstr ":3001" | findstr LISTENING
taskkill /PID <进程ID> /F
```

### Linux/Mac 一键清理
```bash
# 终止所有Node.js进程
pkill -f node

# 清理特定端口
kill -9 $(lsof -ti :3000)
kill -9 $(lsof -ti :3001)
```

## 📋 验证清理结果

```bash
# 检查端口是否释放
# Windows
netstat -aon | findstr ":3000"
netstat -aon | findstr ":3001"

# Linux/Mac  
lsof -i :3000
lsof -i :3001

# 检查进程是否终止
ps aux | grep node | grep -v grep
```

## 🛠 常用端口

- **前端**: 3000, 5173
- **后端**: 3001
- **开发服务器**: 8080, 9000

---

💡 **提示**: 推荐先尝试 `./cleanup.ps1`，失败时再使用手动方法