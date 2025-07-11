// API 配置
export const API_CONFIG = {
  // 根据环境自动选择API基础URL
  baseURL: process.env.NODE_ENV === 'production' 
    ? '' // 生产环境使用相对路径，通过netlify.toml重定向到Functions
    : `${window.location.protocol}//${window.location.hostname}:3001`, // 开发环境使用本地后端
  
  // API 端点
  endpoints: {
    upload: '/api/upload',
    recognition: '/api/recognition',
    models: '/api/models',
    health: '/health'
  },
  
  // 文件上传配置
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    supportedFormats: ['image/jpeg', 'image/png', 'image/webp', 'image/tiff', 'image/bmp'],
    timeout: 30000 // 30秒
  },
  
  // 识别配置
  recognition: {
    timeout: 60000, // 60秒
    batchSize: 10, // 批量处理最大数量
    retryAttempts: 3
  }
};

// 获取完整的API URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.baseURL}${endpoint}`;
};

// 检查是否为生产环境
export const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production';
};

// 检查是否为开发环境
export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development';
};