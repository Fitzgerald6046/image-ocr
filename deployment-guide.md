# 部署指南

## 环境说明

### 1. 开发环境
- **WSL** ✅ 推荐：网络配置最稳定
- **PowerShell** ⚠️ 需要修复：可能有IPv6/代理问题

### 2. 生产环境
- **Netlify** 🌐 云端：Linux环境，不使用PowerShell

## 问题诊断和修复流程

### Step 1: 诊断当前环境
```bash
node network-diagnosis.js
```

### Step 2: 修复PowerShell环境（如果需要）
```powershell
# 以管理员身份运行
./fix-network-issues.ps1
```

### Step 3: 验证修复效果
```bash
# 重启程序，测试API连接
npm run dev
cd backend && npm start
```

## 部署到Netlify

### 方法1: Git自动部署（推荐）
```bash
# 1. 确保代码已提交
git add .
git commit -m "Fix network issues"
git push origin main

# 2. Netlify自动检测并部署
# 无需PowerShell，在云端Linux环境构建
```

### 方法2: 手动部署
```bash
# 1. 本地构建
npm run build

# 2. 上传到Netlify Dashboard
# 拖拽dist文件夹到netlify.com
```

## 网络问题的根本解决

### 本地开发
- WSL环境：无需修复，直接使用
- PowerShell环境：运行fix-network-issues.ps1

### 生产部署  
- Netlify Functions已优化网络处理
- 添加了重试机制和超时控制
- 使用Linux环境，避免Windows网络问题

## 故障排除

### 如果本地PowerShell仍有问题
1. 使用WSL环境开发
2. 仅用PowerShell推送代码：
   ```powershell
   git add .
   git commit -m "Update"
   git push
   ```

### 如果Netlify部署失败
1. 检查构建日志
2. 验证环境变量设置
3. 测试Netlify Functions