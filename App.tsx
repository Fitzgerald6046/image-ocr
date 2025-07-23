import React, { useState, useEffect } from 'react';
import { Camera, Upload, ChevronDown, ChevronUp, ZoomIn, ZoomOut, RotateCw, X, History, FolderOpen, BarChart3 } from 'lucide-react';
import ImageUpload from './components/ImageUpload';
import ModelSelector from './components/ModelSelector';
import RecognizeButton from './components/RecognizeButton';
import EnhancedRecognitionResult from './components/EnhancedRecognitionResult';
import ModelSettings from './model-settings';
import DebugInfo from './components/DebugInfo';
import ErrorMessage from './components/ErrorMessage';
import UploadProgress from './components/UploadProgress';
import BatchUpload from './components/BatchUpload';
import BatchRecognition from './components/BatchRecognition';
import HistoryView from './components/HistoryView';
import ExportDialog from './components/ExportDialog';
import ThemeToggle from './components/ThemeToggle';
import ModelComparison from './components/ModelComparison';
// import UserGuide from './components/UserGuide';
import { ErrorHandler, ApiError } from './utils/errorHandler';
import { FileHandler } from './utils/fileHandler';
import { HistoryManager, HistoryItem } from './utils/historyManager';
import { ExportItem } from './utils/exportUtils';
import { getApiUrl, API_CONFIG } from './src/config';
import { ThemeManager } from './utils/themeManager';

interface UploadedImageInfo {
  file: File;
  fileId: string;
  url: string;
  metadata: any;
}

interface UploadStatus {
  isUploading: boolean;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: ApiError;
}

interface RecognitionResult {
  type: string;
  content: string;
  confidence: number;
  model: string;
  provider?: string;
  timestamp?: string;
  originalContent?: string;
  classification?: {
    detectedType: string;
    confidence: number;
    reasoning: string;
    suggestedOptions: Array<{
      key: string;
      label: string;
      default: boolean;
    }>;
  };
  specialAnalysis?: any;
}

// 图片预览组件（带放大功能）
const ImagePreviewWithZoom: React.FC<{ uploadedImage: UploadedImageInfo | null }> = ({ uploadedImage }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!uploadedImage) {
    return (
      <div className="w-full h-96 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📷</span>
          </div>
          <p className="text-lg">请选择图片进行识别</p>
          <p className="text-sm mt-2">图片上传后将在此处显示</p>
        </div>
      </div>
    );
  }

  const openModal = () => {
    setIsModalOpen(true);
    setZoom(1);
    setRotation(0);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.5, 5));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.5, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  return (
    <>
      <div className="space-y-4">
        {/* 可点击放大的图片预览 */}
        <div className="relative group cursor-pointer" onClick={openModal}>
          <img
            src={uploadedImage.url}
            alt="预览图片"
            className="w-full h-96 object-contain bg-gray-50 rounded-lg border border-gray-200 transition-all hover:shadow-lg"
          />
          {/* 放大提示 */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
            <div className="bg-white rounded-full p-2 shadow-lg">
              <ZoomIn className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>

        {/* 图片信息 */}
        <div className="text-sm text-gray-600 space-y-1">
          <p><span className="font-medium">文件名：</span>{uploadedImage.file.name}</p>
          <p><span className="font-medium">大小：</span>{(uploadedImage.file.size / 1024 / 1024).toFixed(2)} MB</p>
          <p><span className="font-medium">类型：</span>{uploadedImage.file.type}</p>
          {uploadedImage.metadata && (
            <p><span className="font-medium">尺寸：</span>{uploadedImage.metadata.width} × {uploadedImage.metadata.height}</p>
          )}
        </div>
      </div>

      {/* 图片放大模态框 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-full max-h-full">
            {/* 工具栏 */}
            <div className="absolute top-4 right-4 z-10 flex gap-2">
              <button
                onClick={handleZoomOut}
                className="bg-white bg-opacity-90 p-2 rounded-full hover:bg-opacity-100 transition-all"
                title="缩小"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <button
                onClick={handleZoomIn}
                className="bg-white bg-opacity-90 p-2 rounded-full hover:bg-opacity-100 transition-all"
                title="放大"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <button
                onClick={handleRotate}
                className="bg-white bg-opacity-90 p-2 rounded-full hover:bg-opacity-100 transition-all"
                title="旋转"
              >
                <RotateCw className="w-5 h-5" />
              </button>
              <button
                onClick={closeModal}
                className="bg-white bg-opacity-90 p-2 rounded-full hover:bg-opacity-100 transition-all"
                title="关闭"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 缩放信息 */}
            <div className="absolute top-4 left-4 z-10 bg-white bg-opacity-90 px-3 py-1 rounded-full text-sm">
              {Math.round(zoom * 100)}%
            </div>

            {/* 放大的图片 */}
            <img
              src={uploadedImage.url}
              alt="预览图片"
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                maxWidth: '90vw',
                maxHeight: '90vh'
              }}
            />
          </div>

          {/* 点击背景关闭 */}
          <div 
            className="absolute inset-0 -z-10" 
            onClick={closeModal}
          />
        </div>
      )}
    </>
  );
};

function App() {
  const [currentView, setCurrentView] = useState('main'); // 'main', 'comparison', 'settings', 'history', 'guide'
  const [uploadedImage, setUploadedImage] = useState<UploadedImageInfo | null>(null);
  const [selectedModel, setSelectedModel] = useState('');
  const [recognitionType, setRecognitionType] = useState('auto');
  const [recognitionResult, setRecognitionResult] = useState<RecognitionResult | null>(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    isUploading: false,
    progress: 0,
    status: 'completed'
  });
  const [error, setError] = useState<ApiError | null>(null);
  const [batchFiles, setBatchFiles] = useState<any[]>([]);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportItems, setExportItems] = useState<ExportItem[]>([]);
  const [showBatchSection, setShowBatchSection] = useState(false);

  // 初始化主题
  useEffect(() => {
    ThemeManager.init();
  }, []);

  const handleImageUpload = async (file: File) => {
    // 清除之前的错误
    setError(null);
    
    try {
      // 1. 文件验证
      const validation = FileHandler.validateFile(file);
      if (!validation.isValid) {
        throw ErrorHandler.handle(new Error(validation.error!), 'file');
      }

      // 2. 开始上传流程
      setUploadStatus({
        isUploading: true,
        progress: 0,
        status: 'uploading'
      });

      // 3. 检查是否需要压缩
      let uploadFile = file;
      if (FileHandler.shouldCompress(file)) {
        setUploadStatus(prev => ({
          ...prev,
          status: 'processing',
          progress: 20
        }));

        try {
          const compressed = await FileHandler.compressImage(file, {
            maxWidth: 1920,
            maxHeight: 1080,
            quality: 0.8
          });
          uploadFile = compressed.file;
          console.log(`📦 图片压缩完成: ${compressed.compressionRatio}% 压缩率`);
        } catch (compressionError) {
          console.warn('图片压缩失败，使用原图:', compressionError);
        }
      }

      // 4. 创建FormData
      const formData = new FormData();
      formData.append('image', uploadFile);
      
      console.log('🚀 开始上传图片:', file.name);
      
      // 5. 上传到后端
      setUploadStatus(prev => ({
        ...prev,
        status: 'uploading',
        progress: 50
      }));

      const response = await fetch(getApiUrl(API_CONFIG.endpoints.upload), {
        method: 'POST',
        body: formData
      });
      
      // 6. 处理HTTP错误
      if (!response.ok) {
        const errorText = await response.text();
        throw ErrorHandler.handleHttpError(response, errorText);
      }
      
      // 7. 解析响应
      setUploadStatus(prev => ({
        ...prev,
        progress: 80
      }));

      const result = await response.json();
      console.log('📦 后端返回结果:', result);
      
      if (result.success) {
        const imageInfo: UploadedImageInfo = {
          file,
          fileId: result.file.id,
          url: result.file.url.startsWith('http') ? result.file.url : `${API_CONFIG.baseURL}${result.file.url}`,
          metadata: result.file.metadata
        };
        
        // 8. 完成上传
        setUploadStatus({
          isUploading: false,
          progress: 100,
          status: 'completed'
        });

        setUploadedImage(imageInfo);
        setRecognitionResult(null); // 清除之前的识别结果
        // 如果正在显示批量处理，收起它
        if (showBatchSection) {
          setShowBatchSection(false);
        }
        console.log('✅ 图片上传成功:', result.file.fileName);
      } else {
        throw new Error(result.message || '上传失败');
      }
    } catch (error) {
      console.error('Upload error:', error);
      
      let apiError: ApiError;
      if (error instanceof ApiError) {
        apiError = error;
      } else {
        apiError = ErrorHandler.handle(error, 'network');
      }
      
      setError(apiError);
      setUploadStatus({
        isUploading: false,
        progress: 0,
        status: 'error',
        error: apiError
      });
    }
  };

  const handleRecognize = async () => {
    console.log('🔍 开始识别流程...');
    console.log('uploadedImage:', uploadedImage);
    console.log('selectedModel:', selectedModel);
    console.log('isRecognizing:', isRecognizing);

    if (!uploadedImage || !selectedModel) {
      const errorMsg = '请确保已上传图片并选择AI模型';
      console.error('❌ 前置条件检查失败:', errorMsg);
      alert(errorMsg);
      return;
    }

    if (isRecognizing) {
      console.log('❌ 正在识别中，跳过重复请求');
      return;
    }

    // 从localStorage获取模型配置
    console.log('📋 获取模型配置...');
    let providers;
    try {
      const savedProviders = localStorage.getItem('aiProviders');
      console.log('localStorage aiProviders:', savedProviders);
      providers = JSON.parse(savedProviders || '[]');
    } catch (error) {
      console.error('❌ 解析localStorage失败:', error);
      alert('配置数据解析失败，请重新配置AI模型');
      return;
    }

    let modelConfig = null;
    
    // 查找选中模型的配置
    console.log('🔍 查找模型配置...');
    
    // 解析选中的模型格式：providerId::modelName
    let targetProviderId: string;
    let targetModelName: string;
    
    if (selectedModel.includes('::')) {
      [targetProviderId, targetModelName] = selectedModel.split('::', 2);
    } else {
      // 兼容旧格式，直接是模型名称
      targetModelName = selectedModel;
      targetProviderId = '';
    }
    
    console.log('目标提供商ID:', targetProviderId, '目标模型名称:', targetModelName);
    
    for (const provider of providers) {
      console.log('检查提供商:', provider.name, provider);
      
      // 如果指定了提供商ID，只检查对应的提供商
      if (targetProviderId && provider.id !== targetProviderId) {
        continue;
      }
      
      const allModels = [...(provider.models || []), ...(provider.customModels || []), ...(provider.selectedModels || [])];
      console.log('提供商模型列表:', allModels);
      
      if (allModels.includes(targetModelName)) {
        modelConfig = {
          model: targetModelName, // 使用实际的模型名称，不包含提供商前缀
          apiKey: provider.apiKey,
          apiUrl: provider.apiUrl,
          provider: provider.id, // 添加提供商信息
          isCustom: provider.id.startsWith('custom-') // 标记是否为自定义提供商
        };
        console.log('✅ 找到模型配置:', modelConfig);
        break;
      }
    }
    
    if (!modelConfig || !modelConfig.apiKey) {
      const errorMsg = '未找到所选模型的API密钥配置，请先在设置中配置';
      console.error('❌ 模型配置检查失败:', errorMsg);
      console.log('可用提供商:', providers);
      alert(errorMsg);
      return;
    }

    setIsRecognizing(true);
    try {
      console.log('🚀 发送识别请求...');
      const requestData = {
        fileId: uploadedImage.fileId,
        imageUrl: uploadedImage.url,
        modelConfig,
        recognitionType
      };
      console.log('请求数据:', requestData);

      const response = await fetch(getApiUrl(API_CONFIG.endpoints.recognition), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      console.log('响应状态:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP错误响应:', errorText);
        throw new Error(`识别失败: ${response.status} ${response.statusText}\n${errorText}`);
      }
      
      const result = await response.json();
      console.log('✅ 后端响应:', result);
      
      if (result.success) {
        const recognitionData = {
          type: recognitionType,
          content: result.recognition.content,
          confidence: result.recognition.confidence,
          model: result.recognition.model,
          provider: result.recognition.provider,
          timestamp: result.recognition.timestamp,
          originalContent: result.recognition.originalContent,
          classification: result.recognition.classification,
          specialAnalysis: result.recognition.specialAnalysis
        };
        
        setRecognitionResult(recognitionData);
        
        // 保存到历史记录
        if (uploadedImage) {
          HistoryManager.saveRecord({
            fileName: uploadedImage.file.name,
            fileSize: uploadedImage.file.size,
            fileType: uploadedImage.file.type,
            recognitionType: recognitionType,
            model: recognitionData.model,
            provider: recognitionData.provider || 'unknown',
            result: {
              content: recognitionData.content,
              confidence: recognitionData.confidence,
              originalContent: recognitionData.originalContent,
              classification: recognitionData.classification,
              specialAnalysis: recognitionData.specialAnalysis
            },
            previewUrl: uploadedImage.url
          });
        }
        
        console.log('✅ 图片识别完成');
      } else {
        throw new Error(result.message || '识别失败');
      }
    } catch (error) {
      console.error('❌ 识别过程出错:', error);
      
      let apiError: ApiError;
      if (error instanceof ApiError) {
        apiError = error;
      } else {
        apiError = ErrorHandler.handle(error, 'recognition');
      }
      
      setError(apiError);
    } finally {
      setIsRecognizing(false);
    }
  };

  // 处理历史记录查看
  const handleViewHistoryResult = (item: HistoryItem) => {
    setRecognitionResult({
      type: item.recognitionType,
      content: item.result.content,
      confidence: item.result.confidence,
      model: item.model,
      provider: item.provider,
      timestamp: new Date(item.timestamp).toISOString(),
      originalContent: item.result.originalContent,
      classification: item.result.classification,
      specialAnalysis: item.result.specialAnalysis
    });
    setCurrentView('main');
  };

  // 处理导出
  const handleExport = (items: ExportItem[]) => {
    setExportItems(items);
    setShowExportDialog(true);
  };

  // 不同视图的渲染
  if (currentView === 'settings') {
    return <ModelSettings onBack={() => setCurrentView('main')} />;
  }

  if (currentView === 'history') {
    return (
      <HistoryView
        onBack={() => setCurrentView('main')}
        onViewResult={handleViewHistoryResult}
      />
    );
  }

  if (currentView === 'comparison') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        {/* 顶部标题栏 */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-blue-100 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h1 className="text-lg md:text-2xl font-bold text-gray-800 dark:text-white">多模型对比分析</h1>
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">同时使用多个AI模型进行识别对比</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentView('main')}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <span>返回主页</span>
                </button>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

        {/* 主要内容区域 */}
        <main className="max-w-7xl mx-auto px-4 py-4 md:py-8">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-8">
            {/* 左侧：图片上传 */}
            <div className="xl:col-span-1 space-y-4">
              <div className="bg-white rounded-lg shadow-sm border border-purple-100">
                <div className="p-3 md:p-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
                    <h2 className="text-base md:text-lg font-semibold text-gray-800">图片上传</h2>
                  </div>
                </div>
                <div className="p-4 md:p-6">
                  <ImageUpload onImageUpload={handleImageUpload} />
                  
                  {/* 上传进度显示 */}
                  {uploadStatus.isUploading && (
                    <div className="mt-4">
                      <UploadProgress
                        progress={uploadStatus.progress}
                        status={uploadStatus.status}
                        fileName={uploadedImage?.file.name || ''}
                      />
                    </div>
                  )}
                  
                  {/* 错误信息显示 */}
                  {error && (
                    <div className="mt-4">
                      <ErrorMessage
                        error={error}
                        onRetry={error.retryable ? () => {
                          setError(null);
                          if (uploadedImage) {
                            handleImageUpload(uploadedImage.file);
                          }
                        } : undefined}
                        onDismiss={() => setError(null)}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* 图片预览 */}
              {uploadedImage && (
                <div className="bg-white rounded-lg shadow-sm border border-purple-100">
                  <div className="p-3 md:p-4 border-b border-gray-100">
                    <h3 className="text-base font-semibold text-gray-800">图片预览</h3>
                  </div>
                  <div className="p-4">
                    <ImagePreviewWithZoom uploadedImage={uploadedImage} />
                  </div>
                </div>
              )}

              {/* 识别类型选择 */}
              <div className="bg-white rounded-lg shadow-sm border border-purple-100">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-orange-100 rounded flex items-center justify-center">
                      <span className="text-orange-600 text-xs">📋</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">识别类型选择</h3>
                  </div>
                </div>
                <div className="p-4">
                  <div className="space-y-2">
                    {[
                      { value: 'auto', label: '🤖 智能检测', desc: '自动判断内容类型' },
                      { value: 'ancient', label: '📜 古籍文献', desc: '古代文字、书法作品' },
                      { value: 'receipt', label: '🧾 票据发票', desc: '收据、发票、账单' },
                      { value: 'document', label: '📄 文档资料', desc: '通用文字识别' },
                      { value: 'id', label: '🆔 证件识别', desc: '身份证、护照等' },
                      { value: 'table', label: '📊 表格图表', desc: '表格、图表数据' },
                      { value: 'handwriting', label: '✍️ 手写文字', desc: '手写笔记、签名' },
                      { value: 'prompt', label: '🎨 AI提示词', desc: '生成AI绘画提示' }
                    ].map((type) => (
                      <label key={type.value} className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                        <input
                          type="radio"
                          name="recognitionType"
                          value={type.value}
                          checked={recognitionType === type.value}
                          onChange={(e) => setRecognitionType(e.target.value)}
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <div className="ml-3 flex-1">
                          <div className="text-sm font-medium text-gray-900">{type.label}</div>
                          <div className="text-xs text-gray-500">{type.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 右侧：多模型对比 */}
            <div className="xl:col-span-2">
              <ModelComparison
                uploadedImage={uploadedImage}
                recognitionType={recognitionType}
                onConfigureModels={() => setCurrentView('settings')}
                onImageUpload={handleImageUpload}
              />
            </div>
          </div>
        </main>

        {/* 导出对话框 */}
        {showExportDialog && (
          <ExportDialog
            isOpen={showExportDialog}
            onClose={() => setShowExportDialog(false)}
            items={exportItems}
          />
        )}
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* 顶部标题栏 */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-blue-100 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Camera className="w-5 h-5 md:w-6 md:h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-lg md:text-2xl font-bold text-gray-800 dark:text-white">智能图片识别系统</h1>
                <p className="text-gray-600 dark:text-gray-300 text-xs md:text-sm hidden sm:block">支持多种AI模型，智能识别图片内容，提供专业的分析与处理服务</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  // 检查是否已选择AI模型
                  if (!selectedModel) {
                    alert('请先选择AI模型后再使用批量处理功能');
                    return;
                  }
                  setShowBatchSection(!showBatchSection);
                  // 如果展开批量处理，清除单张图片的识别结果
                  if (!showBatchSection && recognitionResult) {
                    setRecognitionResult(null);
                  }
                }}
                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                  showBatchSection 
                    ? 'bg-green-600 text-white' 
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                <FolderOpen className="w-4 h-4" />
                <span className="hidden sm:inline">批量处理</span>
              </button>
              
              <button
                onClick={() => setCurrentView('comparison')}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                title="多模型对比分析"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden md:inline">模型对比</span>
              </button>
              
              <button
                onClick={() => setCurrentView('history')}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">历史记录</span>
              </button>
              
              <button
                onClick={() => setCurrentView('settings')}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                <span className="hidden sm:inline">设置</span>
                <span className="sm:hidden">⚙️</span>
              </button>
              
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="max-w-7xl mx-auto px-4 py-4 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
          {/* 左侧：图片上传与配置 */}
          <div className="space-y-4 md:space-y-6">
            {/* 图片上传 */}
            <div className="bg-white rounded-lg shadow-sm border border-blue-100">
              <div className="p-3 md:p-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                  <h2 className="text-base md:text-lg font-semibold text-gray-800">图片上传与配置</h2>
                </div>
              </div>
              <div className="p-4 md:p-6">
                <ImageUpload onImageUpload={handleImageUpload} />
                
                {/* 上传进度显示 */}
                {uploadStatus.isUploading && (
                  <div className="mt-4">
                    <UploadProgress
                      progress={uploadStatus.progress}
                      status={uploadStatus.status}
                      fileName={uploadedImage?.file.name || ''}
                    />
                  </div>
                )}
                
                {/* 错误信息显示 */}
                {error && (
                  <div className="mt-4">
                    <ErrorMessage
                      error={error}
                      onRetry={error.retryable ? () => {
                        setError(null);
                        if (uploadedImage) {
                          handleImageUpload(uploadedImage.file);
                        }
                      } : undefined}
                      onDismiss={() => setError(null)}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 识别类型选择 */}
            <div className="bg-white rounded-lg shadow-sm border border-blue-100">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-orange-100 rounded flex items-center justify-center">
                    <span className="text-orange-600 text-xs">📋</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">识别类型</h3>
                </div>
              </div>
              <div className="p-4">
                <div className="relative">
                  <select
                    value={recognitionType}
                    onChange={(e) => setRecognitionType(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="auto">🔍 智能识别 (自动判断类型)</option>
                    <option value="ancient">📜 古籍文献识别</option>
                    <option value="receipt">🧾 票据类识别</option>
                    <option value="document">📄 文档识别</option>
                    <option value="poetry">🎭 诗歌文学识别</option>
                    <option value="shopping">🛒 购物小票识别</option>
                    <option value="artwork">🎨 艺术图画分析</option>
                    <option value="id">🆔 证件识别</option>
                    <option value="table">📊 表格图表识别</option>
                    <option value="handwriting">✍️ 手写内容识别</option>
                    <option value="prompt">🎯 AI绘图Prompt生成</option>
                    <option value="translate">🌐 多语言翻译识别</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* AI模型选择 */}
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              onConfigureModels={() => setCurrentView('settings')}
            />

            {/* 识别按钮 */}
            <RecognizeButton
              uploadedImage={uploadedImage}
              selectedModel={selectedModel}
              isRecognizing={isRecognizing}
              onRecognize={handleRecognize}
            />
          </div>

          {/* 右侧：图片预览 */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-blue-100">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-100 rounded flex items-center justify-center">
                    <span className="text-green-600 text-xs">🖼️</span>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-800">图片预览</h2>
                </div>
              </div>
              <div className="p-6">
                {uploadedImage ? (
                  <ImagePreviewWithZoom uploadedImage={uploadedImage} />
                ) : (
                  <div className="w-full h-96 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">📷</span>
                      </div>
                      <p className="text-lg">请选择图片进行识别</p>
                      <p className="text-sm mt-2">图片上传后将在此处显示</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 功能介绍卡片 */}
            {!showBatchSection && (
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border border-indigo-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-indigo-800">多模型对比分析</h3>
                </div>
                <p className="text-indigo-700 mb-4">
                  同时使用多个AI模型识别图片，比较不同模型的准确率、速度和识别结果，帮助您选择最适合的模型。
                </p>
                <div className="flex flex-col gap-2 mb-4 text-sm text-indigo-600">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
                    <span>支持同时对比2-5个模型</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
                    <span>实时显示速度和准确率统计</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
                    <span>智能推荐最佳模型</span>
                  </div>
                </div>
                <button
                  onClick={() => setCurrentView('comparison')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  <BarChart3 className="w-4 h-4" />
                  开始多模型对比分析
                </button>
              </div>
            )}
            
            {/* 批量处理区域 */}
            {showBatchSection && (
              <div className="bg-white rounded-lg shadow-sm border border-green-100">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-green-100 rounded flex items-center justify-center">
                        <span className="text-green-600 text-xs">📁</span>
                      </div>
                      <h2 className="text-lg font-semibold text-gray-800">批量处理</h2>
                    </div>
                    <div className="flex items-center gap-2">
                      {batchFiles.length > 0 && (
                        <button
                          onClick={() => {
                            setBatchFiles([]);
                            setExportItems([]);
                            setShowExportDialog(false);
                          }}
                          className="px-3 py-1 text-sm bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                          title="清除所有文件"
                        >
                          清除
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setShowBatchSection(false);
                          // 清除单张图片的识别结果，避免界面混乱
                          if (recognitionResult) {
                            setRecognitionResult(null);
                          }
                        }}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        title="收起"
                      >
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {/* 批量上传 */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">选择图片文件</h3>
                    <BatchUpload
                      onFilesUploaded={setBatchFiles}
                      maxFiles={20}
                    />
                  </div>
                  
                  {/* 批量识别 */}
                  {batchFiles.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-3">批量识别处理</h3>
                      <BatchRecognition
                        files={batchFiles}
                        selectedModel={selectedModel}
                        recognitionType={recognitionType}
                        onResults={(results) => {
                          // 处理批量识别结果
                          const exportItems: ExportItem[] = results.map(item => ({
                            fileName: item.file.name,
                            recognitionType: recognitionType,
                            model: selectedModel,
                            provider: 'unknown',
                            confidence: item.recognitionResult?.confidence || 0,
                            timestamp: Date.now(),
                            content: item.recognitionResult?.content || '',
                            originalContent: item.recognitionResult?.originalContent,
                            metadata: item.recognitionResult
                          }));
                          handleExport(exportItems);
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 底部：识别结果 */}
        {(recognitionResult || isRecognizing) && (
          <div className="mt-8">
            <EnhancedRecognitionResult 
              result={recognitionResult}
              isRecognizing={isRecognizing}
            />
          </div>
        )}
      </main>
      
      {/* 调试信息 */}
      <DebugInfo 
        uploadedImage={uploadedImage}
        selectedModel={selectedModel}
        isRecognizing={isRecognizing}
      />
      
      {/* 导出对话框 */}
      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        items={exportItems}
        title="导出识别结果"
      />
    </div>
  );
}

export default App; 