// API 配置
export const API_CONFIG = {
  // 根据环境自动选择API基础URL
  baseURL: (() => {
    try {
      // 检测是否在浏览器环境中
      if (typeof window !== 'undefined' && window.location) {
        const hostname = window.location.hostname;
        
        // 生产环境检测：检查是否为Netlify域名
        if (hostname && (hostname.includes('.netlify.app') || hostname.includes('.netlify.com') || 
            (!hostname.includes('localhost') && !hostname.includes('127.0.0.1') && 
             !hostname.includes('192.168') && !hostname.includes('10.') && !hostname.includes('172.')))) {
          console.log('🚀 检测到生产环境，使用相对路径API');
          return ''; // 生产环境使用相对路径
        }
        
        // 开发环境：本地开发
        console.log('🔧 检测到开发环境，使用本地API');
        
        // 简化开发环境逻辑
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          return 'http://127.0.0.1:3001';
        }
        
        // 其他本地IP
        return `http://${hostname}:3001`;
      }
      
      // 服务端渲染环境或window未定义 - 默认生产环境
      return '';
    } catch (error) {
      console.warn('Error in baseURL detection:', error);
      // 出错时默认使用生产环境配置
      return '';
    }
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
    console.log('   当前完整URL:', window.location.href);
    console.log('   计算出的baseURL:', API_CONFIG.baseURL);
    console.log('   用户代理:', navigator.userAgent);
    console.log('   完整API URL示例:', getApiUrl('/api/models/test'));
    
    // 环境判断逻辑
    const hostname = window.location.hostname;
    const isProduction = hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.includes('192.168') && !hostname.includes('10.') && !hostname.includes('172.');
    console.log('   环境判断:', isProduction ? '生产环境' : '开发环境');
  }
  return API_CONFIG;
};

// 将调试函数挂载到全局，方便在浏览器控制台调用
if (typeof window !== 'undefined') {
  try {
    (window as any).getDebugInfo = getDebugInfo;
    (window as any).API_CONFIG = API_CONFIG;
    (window as any).getApiUrl = getApiUrl;
  } catch (error) {
    console.warn('Failed to mount debug functions:', error);
  }
}