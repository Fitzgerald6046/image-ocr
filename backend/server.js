import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

// 导入路由
import uploadRoutes from './routes/upload.js';
import recognitionRoutes from './routes/recognition.js';
import modelRoutes from './routes/models.js';

// 配置路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件配置
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'], // Vite默认端口
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 创建上传目录
const uploadsDir = path.join(__dirname, 'uploads');

// 异步创建上传目录
(async () => {
  try {
    await fs.access(uploadsDir);
  } catch {
    await fs.mkdir(uploadsDir, { recursive: true });
    console.log('Created uploads directory');
  }
})();

// 静态文件服务
app.use('/uploads', express.static(uploadsDir));

// 根路径 - API信息
app.get('/', (req, res) => {
  res.json({
    name: '智能图片识别系统 API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      upload: '/api/upload',
      recognition: '/api/recognition',
      models: '/api/models'
    },
    frontend: 'http://localhost:3000',
    message: '请访问 http://localhost:3000 使用前端应用'
  });
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'onebyone-ocr-backend'
  });
});

// API路由
app.use('/api/upload', uploadRoutes);
app.use('/api/recognition', recognitionRoutes);
app.use('/api/models', modelRoutes);

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    message: `Path ${req.originalUrl} does not exist`
  });
});

// 全局错误处理
app.use((error, req, res, next) => {
  console.error('Error:', error);
  
  res.status(error.status || 500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
  console.log(`📊 健康检查: http://localhost:${PORT}/health`);
  console.log(`📁 上传目录: ${uploadsDir}`);
}); 