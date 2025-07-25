/**
 * 全局类型定义
 * 包含应用程序中使用的所有TypeScript接口和类型
 */

// ===================
// 文件上传相关类型
// ===================

export interface UploadedImageInfo {
  file: File;
  url: string;
  backendUrl?: string;
  previewUrl?: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadTime: Date;
}

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fileInfo?: {
    name: string;
    size: number;
    type: string;
    dimensions?: { width: number; height: number };
  };
}

// ===================
// AI模型配置类型
// ===================

export interface ModelConfig {
  provider: AIProvider;
  model: string;
  apiKey: string;
  apiUrl: string;
  name?: string;
  description?: string;
  maxTokens?: number;
  temperature?: number;
}

export type AIProvider = 
  | 'openai' 
  | 'gemini' 
  | 'deepseek' 
  | 'zhipu' 
  | 'claude' 
  | 'custom';

export interface ModelTestResult {
  success: boolean;
  message: string;
  responseTime?: number;
  error?: string;
  details?: any;
}

// ===================
// 识别结果类型
// ===================

export interface RecognitionResult {
  success: boolean;
  content: string;
  confidence?: number;
  processingTime: number;
  model: {
    provider: string;
    name: string;
  };
  metadata?: {
    imageSize?: number;
    dimensions?: { width: number; height: number };
    recognitionType: RecognitionType;
    language?: string;
    wordCount?: number;
  };
  timestamp: string;
  error?: string;
}

export type RecognitionType = 
  | 'auto'
  | 'ancient'
  | 'receipt' 
  | 'document'
  | 'id'
  | 'table'
  | 'handwriting'
  | 'prompt';

// ===================
// 批处理类型
// ===================

export interface BatchUploadItem {
  id: string;
  file: File;
  status: BatchItemStatus;
  progress: number;
  result?: RecognitionResult;
  error?: string;
  uploadTime?: Date;
  completionTime?: Date;
}

export type BatchItemStatus = 
  | 'pending'
  | 'uploading'
  | 'processing'
  | 'completed'
  | 'error';

export interface BatchProgress {
  total: number;
  completed: number;
  failed: number;
  inProgress: number;
  overallProgress: number;
}

// ===================
// API响应类型
// ===================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

export interface ApiError {
  code: string;
  message: string;
  userMessage: string;
  suggestions: string[];
  retryable: boolean;
  timestamp: string;
}

// ===================
// 历史记录类型
// ===================

export interface HistoryItem {
  id: string;
  imageInfo: UploadedImageInfo;
  recognitionResult: RecognitionResult;
  modelConfig: ModelConfig;
  recognitionType: RecognitionType;
  timestamp: string;
  tags?: string[];
  favorite?: boolean;
}

export interface HistoryFilter {
  dateRange?: {
    start: Date;
    end: Date;
  };
  provider?: AIProvider;
  recognitionType?: RecognitionType;
  searchText?: string;
  favoritesOnly?: boolean;
}

// ===================
// 导出类型
// ===================

export interface ExportOptions {
  format: ExportFormat;
  includeMetadata: boolean;
  includeImages: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  selectedItems?: string[];
}

export type ExportFormat = 
  | 'json'
  | 'csv'
  | 'txt'
  | 'pdf'
  | 'docx';

// ===================
// 主题类型
// ===================

export type Theme = 'light' | 'dark' | 'auto';

export interface ThemeConfig {
  theme: Theme;
  primaryColor?: string;
  fontSize?: 'small' | 'medium' | 'large';
  compactMode?: boolean;
}

// ===================
// 应用状态类型
// ===================

export interface AppState {
  // 上传状态
  uploadedImage: UploadedImageInfo | null;
  isUploading: boolean;
  uploadProgress: number;

  // 识别状态
  recognitionResult: RecognitionResult | null;
  isRecognizing: boolean;
  recognitionProgress: number;

  // 模型配置
  selectedModel: ModelConfig | null;
  availableModels: ModelConfig[];
  
  // UI状态
  currentView: AppView;
  theme: Theme;
  
  // 错误状态
  error: ApiError | null;
  
  // 批处理状态
  batchItems: BatchUploadItem[];
  batchProgress: BatchProgress | null;
  
  // 历史记录
  history: HistoryItem[];
  
  // 设置
  settings: AppSettings;
}

export type AppView = 
  | 'main'
  | 'settings'
  | 'history'
  | 'batch'
  | 'comparison'
  | 'help';

export interface AppSettings {
  // 识别设置
  defaultRecognitionType: RecognitionType;
  autoSaveResults: boolean;
  maxHistoryItems: number;
  
  // UI设置
  theme: ThemeConfig;
  showDebugInfo: boolean;
  enableNotifications: boolean;
  
  // 性能设置
  maxConcurrentUploads: number;
  imageCompressionQuality: number;
  enableCaching: boolean;
  
  // 安全设置
  secureKeyStorage: boolean;
  enableTelemetry: boolean;
}

// ===================
// 组件Props类型
// ===================

export interface BaseComponentProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export interface ImageUploadProps extends BaseComponentProps {
  onImageUpload: (file: File) => void;
  onImageSelect?: (file: File) => void;
  accept?: string;
  maxSize?: number;
  disabled?: boolean;
  multiple?: boolean;
}

export interface RecognitionResultProps extends BaseComponentProps {
  result: RecognitionResult;
  onExport?: (format: ExportFormat) => void;
  onRetry?: () => void;
  onSave?: () => void;
  showMetadata?: boolean;
}

export interface ModelSelectorProps extends BaseComponentProps {
  models: ModelConfig[];
  selectedModel: ModelConfig | null;
  onModelSelect: (model: ModelConfig) => void;
  onModelTest?: (model: ModelConfig) => Promise<ModelTestResult>;
  disabled?: boolean;
}

// ===================
// 钩子类型
// ===================

export interface UseImageUpload {
  uploadedImage: UploadedImageInfo | null;
  isUploading: boolean;
  uploadProgress: number;
  error: ApiError | null;
  uploadImage: (file: File) => Promise<void>;
  clearImage: () => void;
  resetError: () => void;
}

export interface UseRecognition {
  result: RecognitionResult | null;
  isRecognizing: boolean;
  progress: number;
  error: ApiError | null;
  recognize: (
    image: UploadedImageInfo,
    model: ModelConfig,
    type: RecognitionType
  ) => Promise<void>;
  clearResult: () => void;
  resetError: () => void;
}

// ===================
// 工具类型
// ===================

export interface StorageAdapter {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  clear(): void;
}

export interface Logger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, error?: Error, ...args: any[]): void;
}

// ===================
// 事件类型
// ===================

export type AppEvent = 
  | 'imageUploaded'
  | 'recognitionStarted'
  | 'recognitionCompleted'
  | 'modelChanged'
  | 'errorOccurred'
  | 'batchStarted'
  | 'batchCompleted';

export interface EventPayload {
  imageUploaded: { image: UploadedImageInfo };
  recognitionStarted: { image: UploadedImageInfo; model: ModelConfig };
  recognitionCompleted: { result: RecognitionResult };
  modelChanged: { model: ModelConfig };
  errorOccurred: { error: ApiError };
  batchStarted: { items: BatchUploadItem[] };
  batchCompleted: { results: RecognitionResult[] };
}

// ===================
// 常量类型
// ===================

export const SUPPORTED_IMAGE_FORMATS = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/tiff'
] as const;

export const RECOGNITION_TYPES = [
  'auto',
  'ancient',
  'receipt',
  'document', 
  'id',
  'table',
  'handwriting',
  'prompt'
] as const;

export const AI_PROVIDERS = [
  'openai',
  'gemini', 
  'deepseek',
  'zhipu',
  'claude',
  'custom'
] as const;