// API 配置
export const API_CONFIG = {
  // 根据环境自动选择API基础URL
  baseURL: (() => {
    // 生产环境：使用相对路径，通过netlify.toml重定向到Functions
    if (process.env.NODE_ENV === 'production') {
      return '';
    }
    
    // 开发环境：智能检测最佳连接方式
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const userAgent = navigator.userAgent || '';
      const isWindows = userAgent.includes('Windows');
      
      // Windows环境下强制使用127.0.0.1避免IPv6问题
      if (isWindows && (hostname === 'localhost' || hostname === '127.0.0.1')) {
        return 'http://127.0.0.1:3001';
      }
      
      // 如果访问地址是localhost，检测环境
      if (hostname === 'localhost') {
        // 在Windows PowerShell环境下，强制使用IPv4
        return 'http://127.0.0.1:3001';
      }
      
      // 如果是具体IP地址，使用相同的IP
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        return `http://${hostname}:3001`;
      }
      
      // 默认回退到127.0.0.1
      return 'http://127.0.0.1:3001';
    }
    
    // 服务端渲染或其他情况的回退
    return 'http://localhost:3001';
  })(),
  
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

// 调试信息：显示当前API配置
export const getDebugInfo = () => {
  if (typeof window !== 'undefined') {
    console.log('🔧 API配置调试信息:');
    console.log('   当前hostname:', window.location.hostname);
    console.log('   当前protocol:', window.location.protocol);
    console.log('   当前port:', window.location.port);
    console.log('   计算出的baseURL:', API_CONFIG.baseURL);
    console.log('   NODE_ENV:', process.env.NODE_ENV);
  }
};