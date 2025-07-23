# Netlify部署验证清单

## 1. 部署前检查

### ✅ 代码配置检查
- [x] 生产环境API配置使用相对路径
- [x] netlify.toml重定向配置正确
- [x] Netlify Functions优化网络处理
- [x] 环境变量设置正确

### ✅ 本地测试
```bash
# 构建测试
npm run build

# 检查构建产物
ls -la dist/
```

## 2. 部署后验证

### 在浏览器开发者工具中检查

1. **网络面板检查API调用**
   ```
   预期: /api/models/test
   不应该: http://127.0.0.1:3001/api/models/test
   ```

2. **控制台检查配置**
   ```javascript
   // 在浏览器控制台运行
   console.log(window.location.hostname); // 应该是你的netlify域名
   // 检查API配置（如果有getDebugInfo函数）
   ```

3. **Functions日志检查**
   - 在Netlify Dashboard → Functions → View logs
   - 查看是否有网络连接错误

## 3. 常见问题排查

### 如果仍有127.0.0.1调用
```javascript
// 检查NODE_ENV是否正确设置
console.log('Environment:', process.env.NODE_ENV);

// 检查baseURL
console.log('API Base:', API_CONFIG.baseURL);
```

### 如果Functions超时
- 检查网络重试机制是否生效
- 查看Functions日志中的错误信息
- 验证API密钥是否正确设置

## 4. 成功部署的标志

- ✅ 前端正常加载
- ✅ API调用使用相对路径
- ✅ Functions正常响应
- ✅ AI模型测试成功
- ✅ 无127.0.0.1相关错误

## 5. 如果部署失败

### 检查构建日志
```bash
# 查看Netlify构建日志
# 确认没有构建错误
```

### 回滚选项
```bash
# 如果需要回滚到之前版本
git revert HEAD
git push origin main
```
 ✅ 修复已提交并推送！

  主要修复内容：

  1. 环境检测修复：使用hostname而不是process.env.NODE_ENV来检测生产环境     
  2. 调试功能增强：添加了全局调试函数，可以在浏览器控制台使用
  3. 控制台日志：添加了环境检测的控制台输出

  📋 新的测试步骤

  等Netlify重新部署后（约1-2分钟），请在浏览器控制台测试：

  1. 检查配置

  getDebugInfo()

  2. 检查API配置

  console.log('API Base URL:', API_CONFIG.baseURL);
  console.log('Test API URL:', getApiUrl('/api/models/test'));

  3. 验证环境检测

  console.log('Hostname:', window.location.hostname);
  console.log('Should be production:',
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  );

  期望结果：
  - API_CONFIG.baseURL 应该是空字符串 ""
  - API调用应该使用相对路径 /api/models/test
  - 不应该再看到 127.0.0.1:7890

  如果测试后仍有问题，请提供控制台的调试输出信息！