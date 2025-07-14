# WSL环境开发指南

## WSL环境优势

### 🔹 网络配置优势
- 独立的Linux网络栈
- 原生的IPv4/IPv6处理
- 不受Windows hosts文件影响
- 内置的localhost解析正确

### 🔹 开发环境优势
- 与生产环境(Netlify Linux)一致
- 避免跨平台兼容性问题
- 更好的包管理和依赖处理

## 当前WSL环境状态

```bash
# 检查网络配置
$ cat /etc/hosts
127.0.0.1	localhost  # ✅ 已正确配置

# 检查DNS解析
$ getent hosts localhost
127.0.0.1       localhost  # ✅ 解析正确
```

## 不需要运行的工具

### ❌ fix-network-issues.ps1
- 这是Windows PowerShell专用
- WSL有独立网络配置
- 运行会影响Windows系统，但不影响WSL

### ❌ network-diagnosis.js  
- WSL环境网络已经正常
- 不需要额外诊断
- 可能显示混合结果（WSL+Windows）

## 推荐的WSL开发流程

### 1. 检查当前配置
```bash
# 验证API配置正确指向localhost
node -e "console.log(require('./src/config.ts'))"
```

### 2. 启动开发环境
```bash
# 后端
cd backend && npm start

# 前端（新终端）
npm run dev
```

### 3. 测试连接
```bash
# 测试后端健康检查
curl http://localhost:3001/health

# 测试前端访问
curl http://localhost:3000
```

## 如果遇到问题

### WSL中的故障排除
```bash
# 检查端口占用
netstat -tlnp | grep :3001

# 检查防火墙（WSL一般不需要）
sudo ufw status

# 重启网络服务（如果需要）
sudo service networking restart
```

### 与Windows的交互
```bash
# 从WSL访问Windows服务
curl http://$(cat /proc/sys/net/ipv4/ip_forward):3001

# 查看WSL IP地址
ip addr show eth0
```

## 总结

在WSL环境下：
- ✅ 网络配置已优化
- ✅ 无需额外修复工具
- ✅ 独立于Windows网络问题
- ✅ 与生产环境一致