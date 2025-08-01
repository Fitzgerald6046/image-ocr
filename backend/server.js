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
import keyRoutes from './routes/keys.js';
import healthRoutes from './routes/health.js';

// 导入安全中间件
import RateLimiter from './middleware/rateLimiter.js';
import InputValidator from './utils/inputValidator.js';
import monitor from './utils/monitoring.js';

// 配置路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 信任代理设置（用于正确获取客户端IP）
app.set('trust proxy', 1);

// CORS配置 - 基于环境的安全配置
const getAllowedOrigins = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    // 开发环境允许本地访问
    return [
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:5173'
    ];
  } else {
    // 生产环境只允许配置的域名
    const allowedOrigins = process.env.ALLOWED_ORIGINS;
    return allowedOrigins ? allowedOrigins.split(',') : [];
  }
};

app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();
    
    // 允许没有origin的请求（如移动应用、Postman等）
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`Blocked CORS request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200 // 支持旧版浏览器
}));

// 安全中间件 - 请求大小限制
const MAX_REQUEST_SIZE = process.env.MAX_REQUEST_SIZE || '10mb';
app.use(RateLimiter.requestSizeLimit(10 * 1024 * 1024)); // 10MB限制

// 通用速率限制
app.use(RateLimiter.createLimiter({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 200, // 每个IP每15分钟最多200个请求
  message: {
    error: 'Too many requests',
    message: '请求过于频繁，请稍后重试',
    retryAfter: 900
  }
}));

// 慢速攻击防护
app.use(RateLimiter.slowDown());

// 请求解析中间件
app.use(express.json({ 
  limit: MAX_REQUEST_SIZE,
  verify: (req, res, buf) => {
    // 验证请求体格式
    if (buf && buf.length === 0) {
      throw new Error('Empty request body');
    }
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: MAX_REQUEST_SIZE,
  parameterLimit: 100
}));

// 请求验证中间件
app.use((req, res, next) => {
  // 文件上传路径不要求JSON格式
  const isUploadRequest = req.path === '/api/upload';
  
  const validation = InputValidator.validateRequest(req, {
    checkOrigin: process.env.NODE_ENV === 'production',
    requireJson: req.method === 'POST' && req.path.startsWith('/api/') && !isUploadRequest,
    maxBodySize: 10 * 1024 * 1024
  });
  
  if (!validation.valid) {
    return res.status(400).json({
      error: 'Request validation failed',
      message: '请求验证失败',
      details: validation.errors
    });
  }
  
  // 记录警告但继续处理
  if (validation.warnings.length > 0) {
    console.warn('Request warnings:', validation.warnings);
  }
  
  next();
});

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

// 监控中间件 - 记录请求
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - start;
    monitor.recordRequest(req, res, responseTime);
  });
  
  next();
});

// 安全响应头中间件
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // 移除暴露服务器信息的头部
  res.removeHeader('X-Powered-By');
  
  next();
});

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

// 健康检查和监控路由
app.use('/health', healthRoutes);

// API路由with安全限制和监控
app.use('/api/upload', RateLimiter.uploadLimiter(), (req, res, next) => {
  // 记录上传监控数据的中间件将在upload路由中处理
  next();
}, uploadRoutes);

app.use('/api/recognition', RateLimiter.recognitionLimiter(), (req, res, next) => {
  // 记录识别监控数据的中间件将在recognition路由中处理
  next();
}, recognitionRoutes);

app.use('/api/models', modelRoutes);
app.use('/api/keys', RateLimiter.strictLimiter(), keyRoutes);

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    message: `Path ${req.originalUrl} does not exist`
  });
});

// 全局错误处理with监控
app.use((error, req, res, next) => {
  // 记录错误到监控系统
  monitor.recordError(error, {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.body,
    params: req.params,
    query: req.query
  });
  
  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  // 记录安全相关错误
  if (error.code === 'LIMIT_FILE_SIZE' || error.code === 'LIMIT_UNEXPECTED_FILE') {
    monitor.recordSecurityEvent('invalid_file', {
      error: error.message,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  }
  
  // 不同类型错误的特殊处理
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'File too large',
      message: '上传文件大小超出限制',
      code: 'FILE_TOO_LARGE'
    });
  }
  
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      error: 'Unexpected file field',
      message: '上传文件字段不正确',
      code: 'INVALID_FILE_FIELD'
    });
  }
  
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Invalid JSON',
      message: '请求数据格式错误',
      code: 'INVALID_JSON'
    });
  }
  
  // 生产环境不暴露详细错误信息
  const isDevelopment = process.env.NODE_ENV === 'development';
  res.status(error.status || 500).json({
    error: isDevelopment ? error.message : 'Internal server error',
    message: isDevelopment ? error.message : '服务器内部错误，请稍后重试',
    code: error.code || 'INTERNAL_ERROR',
    ...(isDevelopment && { 
      stack: error.stack,
      details: error.details 
    })
  });
});

// 优雅关闭处理
process.on('SIGINT', () => {
  console.log('\n🛑 接收到SIGINT信号，正在关闭服务器...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 接收到SIGTERM信号，正在关闭服务器...');
  process.exit(0);
});

// 未捕获异常处理
process.on('uncaughtException', (error) => {
  console.error('🚨 未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 未处理的Promise拒绝:', reason);
});

// 启动服务器
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 服务器启动成功!`);
  console.log(`   主要访问: http://127.0.0.1:${PORT}`);
  console.log(`   备用访问: http://localhost:${PORT}`);
  console.log(`📊 健康检查: http://127.0.0.1:${PORT}/health`);
  console.log(`📁 上传目录: ${uploadsDir}`);
  console.log(`💡 环境模式: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 安全特性: 速率限制、输入验证、错误处理`);
  console.log(`🔧 监听地址: 0.0.0.0:${PORT}`);
});

// 设置服务器超时
server.timeout = 120000; // 120秒超时（2分钟）