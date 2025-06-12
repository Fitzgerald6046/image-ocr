# 智能图片识别系统

这是一个基于React + TypeScript构建的智能图片识别Web应用，支持多种AI模型，能够智能识别图片内容，提供专业的分析与处理服务。

## 功能特点

### 阶段一：核心界面与基本功能 ✅

- **图片上传功能**：支持拖拽和点击上传，支持JPG、PNG、GIF、WebP格式，最大10MB
- **AI模型选择**：从配置的AI模型中选择，支持Gemini、DeepSeek、OpenAI等
- **配置AI模型**：提供专门的模型配置界面，可以设置API密钥和测试连接
- **识别结果显示**：在图片预览下方显示识别结果，支持复制和下载
- **高级选项**：繁体转简体、小字金额校验、生成AI绘图提示词等

## 技术栈

- **前端框架**：React 18 + TypeScript
- **构建工具**：Vite
- **样式框架**：Tailwind CSS
- **图标库**：Lucide React
- **开发语言**：TypeScript

## 项目结构

```
onebyone-ocr/
├── components/           # React组件
│   ├── ImageUpload.tsx  # 图片上传组件
│   ├── ImagePreview.tsx # 图片预览组件
│   ├── ModelSelector.tsx # AI模型选择组件
│   └── RecognitionResult.tsx # 识别结果组件
├── App.tsx              # 主应用组件
├── main.tsx             # 应用入口
├── model-settings.tsx   # AI模型配置组件
├── index.html           # HTML模板
├── index.css            # 样式文件
├── package.json         # 项目依赖
├── vite.config.ts       # Vite配置
├── tsconfig.json        # TypeScript配置
├── tailwind.config.js   # Tailwind配置
└── README.md           # 项目说明
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

应用将在 http://localhost:3000 启动

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 使用说明

1. **配置AI模型**：首次使用需要点击"配置"按钮，设置AI模型的API密钥
2. **上传图片**：支持拖拽或点击上传图片
3. **选择识别类型**：可以选择智能识别、文字识别、文档识别、票据识别等
4. **选择AI模型**：从配置好的模型中选择一个进行识别
5. **开始识别**：点击"开始识别"按钮，等待AI处理结果
6. **查看结果**：识别完成后可以复制或下载结果

## 开发计划

- [x] 阶段一：核心界面与基本功能
- [ ] 阶段二：后端API集成与图片识别
- [ ] 阶段三：功能扩展与用户体验优化
- [ ] 阶段四：部署与维护

## 贡献

欢迎提交问题和拉取请求来改进这个项目。 