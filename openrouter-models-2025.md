# OpenRouter 有效模型列表 (2025年7月)

## 支持视觉/图像识别的Gemini模型

### 推荐使用的模型：

1. **google/gemini-2.0-flash-001** ✅ 
   - 状态: 有效
   - 特点: 更快的响应时间，视觉功能正常
   - 建议用于: 图像识别、OCR任务

2. **google/gemini-2.0-flash-thinking-exp:free** ✅
   - 状态: 有效（免费）
   - 特点: 思考模式，免费使用
   - 需要: 可能需要通过Discord请求访问

3. **google/gemini-2.5-flash-preview:thinking** ✅
   - 状态: 有效
   - 特点: 高级推理、编码、数学和科学任务
   - 建议用于: 复杂图像分析

### 已过期/不推荐的模型：

❌ **google/gemini-2.5-flash-preview-04-17-thinking:free**
- 状态: 已过期（导致400错误）
- 替代: 使用 google/gemini-2.0-flash-001

❌ **google/gemini-2.5-pro-exp-03-25:free**
- 状态: 已弃用
- 替代: 使用 google/gemini-2.5-pro-preview

## 建议的配置更新

1. 将过期的模型ID更新为有效的模型
2. 优先使用 google/gemini-2.0-flash-001 进行图像识别
3. 备用选择: google/gemini-2.0-flash-thinking-exp:free

## 注意事项

- 模型可用性会频繁变化
- 建议定期检查 https://openrouter.ai/models 获取最新状态
- 某些免费模型可能需要通过Discord申请访问权限