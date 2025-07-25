/**
 * 应用程序常量配置
 * 集中管理所有硬编码的常量值
 */

import type { RecognitionType, AIProvider, ExportFormat } from '../types';

// ===================
// API配置常量
// ===================

export const API_CONFIG = {
  // 基础URL配置
  BASE_URL: import.meta.env.VITE_API_BASE_URL || getApiBaseUrl(),
  
  // API端点
  ENDPOINTS: {
    UPLOAD: '/api/upload',
    RECOGNITION: '/api/recognition', 
    MODELS: '/api/models',
    KEYS: '/api/keys',
  },
  
  // 请求配置
  TIMEOUT: 30000, // 30秒
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1秒
} as const;

// 动态获取API基础URL
function getApiBaseUrl(): string {
  if (typeof window === 'undefined') return 'http://localhost:3001';
  
  const { hostname, protocol } = window.location;
  
  // 生产环境
  if (hostname.includes('netlify.app') || hostname.includes('vercel.app')) {
    return `${protocol}//${hostname}`;
  }
  
  // 开发环境
  return `${protocol}//${hostname}:3001`;
}

// ===================
// 文件上传常量
// ===================

export const FILE_CONFIG = {
  // 支持的图片格式
  SUPPORTED_FORMATS: [
    'image/jpeg',
    'image/jpg',
    'image/png', 
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/tiff'
  ] as const,
  
  // 文件大小限制
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MIN_FILE_SIZE: 1024, // 1KB
  
  // 图片尺寸限制
  MAX_DIMENSIONS: {
    width: 4096,
    height: 4096
  },
  
  // 压缩配置
  COMPRESSION: {
    quality: 0.9,
    maxWidth: 2048,
    maxHeight: 2048,
    format: 'image/jpeg'
  }
} as const;

// ===================
// 识别类型配置
// ===================

export const RECOGNITION_CONFIG: Record<RecognitionType, {
  name: string;
  description: string;
  icon: string;
  prompt: string;
}> = {
  auto: {
    name: '智能识别',
    description: '自动检测内容类型并选择最佳识别方式',
    icon: '🤖',
    prompt: '请分析这张图片的内容类型并进行相应的文字识别。'
  },
  ancient: {
    name: '古籍文献',
    description: '识别古籍、文言文、繁体字等传统文献',
    icon: '📜',
    prompt: '请识别这张古籍或文献图片中的文字，保持原文格式。'
  },
  receipt: {
    name: '票据发票',
    description: '识别收据、发票、账单等财务票据',
    icon: '🧾',
    prompt: '请识别这张票据的详细信息，包括商家、金额、日期等。'
  },
  document: {
    name: '通用文档',
    description: '识别普通文档、书籍、报纸等印刷品',
    icon: '📄',
    prompt: '请识别这张文档图片中的所有文字内容。'
  },
  id: {
    name: '证件识别',
    description: '识别身份证、护照、驾照等证件信息',
    icon: '🪪',
    prompt: '请识别这张证件的关键信息，注意保护隐私。'
  },
  table: {
    name: '表格数据',
    description: '识别表格、图表、数据统计等结构化内容',
    icon: '📊',
    prompt: '请识别这张表格的结构和数据，保持表格格式。'
  },
  handwriting: {
    name: '手写文字',
    description: '识别手写笔记、签名等手写内容',
    icon: '✍️',
    prompt: '请识别这张图片中的手写文字内容。'
  },
  prompt: {
    name: '提示词生成',
    description: '为AI绘画生成详细的提示词描述',
    icon: '🎨',
    prompt: '请详细描述这张图片，生成适合AI绘画的提示词。'
  }
} as const;

// ===================
// AI提供商配置
// ===================

export const AI_PROVIDERS_CONFIG: Record<AIProvider, {
  name: string;
  description: string;
  icon: string;
  supportedModels: string[];
  apiKeyFormat?: RegExp;
  defaultUrl?: string;
}> = {
  openai: {
    name: 'OpenAI',
    description: 'GPT-4V 等视觉模型',
    icon: '🤖',
    supportedModels: ['gpt-4-vision-preview', 'gpt-4o', 'gpt-4o-mini'],
    apiKeyFormat: /^sk-[a-zA-Z0-9]{48,}$/,
    defaultUrl: 'https://api.openai.com/v1'
  },
  gemini: {
    name: 'Google Gemini',
    description: 'Google 的多模态AI模型',
    icon: '💎',
    supportedModels: ['gemini-pro-vision', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    apiKeyFormat: /^AIza[a-zA-Z0-9_-]{35}$/,
    defaultUrl: 'https://generativelanguage.googleapis.com/v1beta'
  },
  deepseek: {
    name: 'DeepSeek',
    description: '深度求索的视觉理解模型',
    icon: '🔍',
    supportedModels: ['deepseek-vl-chat', 'deepseek-vl-7b-chat'],
    apiKeyFormat: /^sk-[a-zA-Z0-9]{32,}$/,
    defaultUrl: 'https://api.deepseek.com/v1'
  },
  zhipu: {
    name: '智谱清言',
    description: '智谱AI的多模态模型',
    icon: '🧠',
    supportedModels: ['glm-4v-plus', 'glm-4v'],
    apiKeyFormat: /^[a-f0-9]{32}\.[a-zA-Z0-9]{6}$/,
    defaultUrl: 'https://open.bigmodel.cn/api/paas/v4'
  },
  claude: {
    name: 'Anthropic Claude',
    description: 'Claude 3 系列视觉模型',
    icon: '🎭',
    supportedModels: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
    apiKeyFormat: /^sk-ant-api[a-zA-Z0-9_-]{50,}$/,
    defaultUrl: 'https://api.anthropic.com/v1'
  },
  custom: {
    name: '自定义',
    description: '自定义API端点',
    icon: '⚙️',
    supportedModels: ['custom-model'],
    defaultUrl: ''
  }
} as const;

// ===================
// UI配置常量
// ===================

export const UI_CONFIG = {
  // 主题配置
  THEMES: ['light', 'dark', 'auto'] as const,
  
  // 动画配置
  ANIMATION: {
    duration: 300,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
  },
  
  // 布局配置
  LAYOUT: {
    maxWidth: 1200,
    sidebarWidth: 280,
    headerHeight: 64
  },
  
  // 分页配置
  PAGINATION: {
    defaultPageSize: 20,
    pageSizeOptions: [10, 20, 50, 100]
  }
} as const;

// ===================
// 存储配置常量
// ===================

export const STORAGE_CONFIG = {
  // localStorage键名
  KEYS: {
    THEME: 'ocr-theme',
    MODELS: 'ocr-models',
    HISTORY: 'ocr-history',
    SETTINGS: 'ocr-settings',
    CACHE: 'ocr-cache'
  },
  
  // 缓存配置
  CACHE: {
    MAX_SIZE: 50 * 1024 * 1024, // 50MB
    MAX_AGE: 24 * 60 * 60 * 1000, // 24小时
    CLEANUP_INTERVAL: 60 * 60 * 1000 // 1小时清理一次
  },
  
  // 历史记录配置
  HISTORY: {
    MAX_ITEMS: 1000,
    AUTO_CLEANUP_DAYS: 30
  }
} as const;

// ===================
// 导出格式配置
// ===================

export const EXPORT_CONFIG: Record<ExportFormat, {
  name: string;
  extension: string;
  mimeType: string;
  description: string;
}> = {
  json: {
    name: 'JSON',
    extension: '.json',
    mimeType: 'application/json',
    description: '结构化数据格式'
  },
  csv: {
    name: 'CSV',
    extension: '.csv', 
    mimeType: 'text/csv',
    description: '表格数据格式'
  },
  txt: {
    name: 'TXT',
    extension: '.txt',
    mimeType: 'text/plain',
    description: '纯文本格式'
  },
  pdf: {
    name: 'PDF',
    extension: '.pdf',
    mimeType: 'application/pdf',
    description: 'PDF文档格式'
  },
  docx: {
    name: 'DOCX',
    extension: '.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    description: 'Word文档格式'
  }
} as const;

// ===================
// 错误配置常量
// ===================

export const ERROR_CONFIG = {
  // 错误类型
  TYPES: {
    NETWORK: 'NETWORK_ERROR',
    FILE: 'FILE_ERROR', 
    API: 'API_ERROR',
    VALIDATION: 'VALIDATION_ERROR',
    AUTH: 'AUTH_ERROR',
    RATE_LIMIT: 'RATE_LIMIT_ERROR'
  },
  
  // 重试配置
  RETRY: {
    MAX_ATTEMPTS: 3,
    BASE_DELAY: 1000,
    MAX_DELAY: 10000,
    BACKOFF_FACTOR: 2
  }
} as const;

// ===================
// 性能配置常量
// ===================

export const PERFORMANCE_CONFIG = {
  // 批处理配置
  BATCH: {
    MAX_CONCURRENT: 3,
    CHUNK_SIZE: 5,
    PROGRESS_UPDATE_INTERVAL: 100
  },
  
  // 图片处理配置
  IMAGE: {
    COMPRESSION_QUALITY: 0.9,
    THUMBNAIL_SIZE: 200,
    PREVIEW_MAX_SIZE: 800
  },
  
  // 内存管理配置
  MEMORY: {
    MAX_CACHE_SIZE: 100 * 1024 * 1024, // 100MB
    CLEANUP_THRESHOLD: 0.8, // 80%使用率时清理
    GC_INTERVAL: 5 * 60 * 1000 // 5分钟GC间隔
  }
} as const;

// ===================
// 开发配置常量
// ===================

export const DEV_CONFIG = {
  // 调试开关
  DEBUG: import.meta.env.DEV,
  
  // 日志级别
  LOG_LEVEL: import.meta.env.VITE_LOG_LEVEL || 'info',
  
  // 模拟延迟（开发环境）
  MOCK_DELAY: import.meta.env.VITE_MOCK_DELAY ? parseInt(import.meta.env.VITE_MOCK_DELAY) : 0,
  
  // 测试配置
  TEST: {
    TIMEOUT: 10000,
    RETRY_ATTEMPTS: 2
  }
} as const;