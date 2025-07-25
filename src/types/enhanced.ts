// 增强的TypeScript类型定义

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
  timestamp?: string;
}

export interface FileUploadResponse {
  file: {
    id: string;
    fileName: string;
    originalName: string;
    size: number;
    type: string;
    url: string;
    metadata?: {
      width?: number;
      height?: number;
      format?: string;
      colorSpace?: string;
      hasAlpha?: boolean;
    };
  };
}

export interface RecognitionRequest {
  fileId: string;
  imageUrl: string;
  modelConfig: ModelConfig;
  recognitionType: RecognitionType;
  options?: RecognitionOptions;
}

export interface RecognitionResponse {
  recognition: {
    content: string;
    confidence: number;
    model: string;
    provider: string;
    timestamp: string;
    originalContent?: string;
    classification?: ContentClassification;
    specialAnalysis?: SpecialAnalysis;
    processingTime?: number;
    tokenUsage?: TokenUsage;
  };
}

export interface ModelConfig {
  model: string;
  apiKey: string;
  apiUrl: string;
  provider: string;
  isCustom: boolean;
  timeout?: number;
  maxTokens?: number;
  temperature?: number;
}

export interface RecognitionOptions {
  includeOriginal?: boolean;
  enableClassification?: boolean;
  enableSpecialAnalysis?: boolean;
  language?: string;
  outputFormat?: 'text' | 'markdown' | 'json';
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost?: number;
}

export interface ContentClassification {
  detectedType: string;
  confidence: number;
  reasoning: string;
  suggestedOptions: Array<{
    key: string;
    label: string;
    default: boolean;
    confidence?: number;
  }>;
  features?: string[];
}

export interface SpecialAnalysis {
  type: string;
  features: Record<string, any>;
  insights?: string[];
  suggestions?: string[];
  quality?: {
    score: number;
    factors: string[];
  };
}

export type RecognitionType = 
  | 'auto'
  | 'ancient'
  | 'receipt'
  | 'document' 
  | 'poetry'
  | 'shopping'
  | 'artwork'
  | 'id'
  | 'table'
  | 'handwriting'
  | 'prompt'
  | 'translate';

export interface Provider {
  id: string;
  name: string;
  type: 'official' | 'custom';
  apiKey: string;
  apiUrl: string;
  models: string[];
  customModels?: string[];
  selectedModels?: string[];
  isEnabled: boolean;
  rateLimit?: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
  features?: {
    supportsBatch: boolean;
    supportsStreaming: boolean;
    maxFileSize: number;
    supportedFormats: string[];
  };
}

export interface BatchProcessResult {
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'error';
  recognitionResult?: RecognitionResponse['recognition'];
  error?: string;
  startTime?: number;
  endTime?: number;
  progress?: number;
}

export interface ComparisonResult {
  modelId: string;
  modelName: string;
  provider: string;
  result?: RecognitionResponse['recognition'];
  error?: string;
  processingTime: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
  suggestions?: string[];
}

export interface SecurityConfig {
  allowedFileTypes: string[];
  maxFileSize: number;
  maxFilesPerBatch: number;
  enableVirusScanning: boolean;
  enableContentFiltering: boolean;
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
}

export interface PerformanceMetrics {
  uploadTime: number;
  processingTime: number;
  totalTime: number;
  fileSize: number;
  compressionRatio?: number;
  cacheHit?: boolean;
}

// 错误类型枚举
export enum ErrorCode {
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  RECOGNITION_FAILED = 'RECOGNITION_FAILED',
  MODEL_NOT_FOUND = 'MODEL_NOT_FOUND',
  API_KEY_INVALID = 'API_KEY_INVALID',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}

// 扩展的错误接口
export interface EnhancedApiError extends Error {
  code: ErrorCode;
  details?: Record<string, any>;
  retryable: boolean;
  retryAfter?: number;
  suggestion?: string;
  context?: {
    component: string;
    action: string;
    timestamp: number;
  };
}

// 用户偏好设置
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  defaultRecognitionType: RecognitionType;
  defaultModel?: string;
  autoSaveHistory: boolean;
  enableNotifications: boolean;
  compressionQuality: number;
  maxHistoryItems: number;
  features: {
    enableBatch: boolean;
    enableComparison: boolean;
    enableExport: boolean;
    enableDebug: boolean;
  };
}

// 系统状态
export interface SystemStatus {
  isOnline: boolean;
  serverStatus: 'healthy' | 'degraded' | 'down';
  lastHealthCheck: number;
  availableModels: number;
  activeConnections: number;
  memoryUsage?: {
    used: number;
    total: number;
    percentage: number;
  };
}