import React, { useState } from 'react';
import { Settings, Camera, Upload, ChevronDown, ZoomIn, ZoomOut, RotateCw, X } from 'lucide-react';
import ImageUpload from './components/ImageUpload';
import SimpleImagePreview from './components/SimpleImagePreview';
import ModelSelector from './components/ModelSelector';
import RecognizeButton from './components/RecognizeButton';
import EnhancedRecognitionResult from './components/EnhancedRecognitionResult';
import ModelSettings from './model-settings';
import DebugInfo from './components/DebugInfo';

interface UploadedImageInfo {
  file: File;
  fileId: string;
  url: string;
  metadata: any;
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
  const [currentView, setCurrentView] = useState('main'); // 'main' 或 'settings'
  const [uploadedImage, setUploadedImage] = useState<UploadedImageInfo | null>(null);
  const [selectedModel, setSelectedModel] = useState('');
  const [recognitionType, setRecognitionType] = useState('auto');
  const [recognitionResult, setRecognitionResult] = useState<RecognitionResult | null>(null);
  const [isRecognizing, setIsRecognizing] = useState(false);

  const handleImageUpload = async (file: File) => {
    try {
      setIsRecognizing(true);
      
      // 上传图片到后端
      const formData = new FormData();
      formData.append('image', file);
      
      console.log('🚀 开始上传图片:', file.name);
      
      const response = await fetch('http://localhost:3001/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`上传失败: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('📦 后端返回结果:', result);
      
      if (result.success) {
        const imageInfo = {
          file,
          fileId: result.file.id,
          url: `http://localhost:3001${result.file.url}`,
          metadata: result.file.metadata
        };
        
        console.log('✅ 设置uploadedImage状态:', imageInfo);
        setUploadedImage(imageInfo);
        setRecognitionResult(null); // 清除之前的识别结果
        console.log('✅ 图片上传成功:', result.file.fileName);
      } else {
        throw new Error(result.message || '上传失败');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('图片上传失败：' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setIsRecognizing(false);
    }
  };

  const handleRecognize = async () => {
    console.log('🔍 开始识别流程...');
    console.log('uploadedImage:', uploadedImage);
    console.log('selectedModel:', selectedModel);

    if (!uploadedImage || !selectedModel) {
      const errorMsg = '请确保已上传图片并选择AI模型';
      console.error('❌ 前置条件检查失败:', errorMsg);
      alert(errorMsg);
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
      
      const allModels = [...(provider.models || []), ...(provider.customModels || [])];
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
        modelConfig,
        recognitionType
      };
      console.log('请求数据:', requestData);

      const response = await fetch('http://localhost:3001/api/recognition', {
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
        setRecognitionResult({
          type: recognitionType,
          content: result.recognition.content,
          confidence: result.recognition.confidence,
          model: result.recognition.model,
          provider: result.recognition.provider,
          timestamp: result.recognition.timestamp,
          originalContent: result.recognition.originalContent,
          classification: result.recognition.classification,
          specialAnalysis: result.recognition.specialAnalysis
        });
        console.log('✅ 图片识别完成');
      } else {
        throw new Error(result.message || '识别失败');
      }
    } catch (error) {
      console.error('❌ 识别过程出错:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      
      // 检查是否为token限制问题
      if (errorMessage.includes('token限制') || errorMessage.includes('被截断')) {
        alert(`识别失败：${errorMessage}\n\n💡 解决建议：\n1. 尝试使用更简单的识别类型（如"智能识别"）\n2. 压缩图片大小后重试\n3. 如果是文档，尝试分页识别\n4. 使用其他AI模型（如DeepSeek或OpenAI）`);
      } else {
        alert('识别失败：' + errorMessage);
      }
    } finally {
      setIsRecognizing(false);
    }
  };

  if (currentView === 'settings') {
    return <ModelSettings onBack={() => setCurrentView('main')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* 顶部标题栏 */}
      <header className="bg-white shadow-sm border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Camera className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-800">智能图片识别系统</h1>
                <p className="text-gray-600 text-sm">支持多种AI模型，智能识别图片内容，提供专业的分析与处理服务</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左侧：图片上传与配置 */}
          <div className="space-y-6">
            {/* 图片上传 */}
            <div className="bg-white rounded-lg shadow-sm border border-blue-100">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-800">图片上传与配置</h2>
                </div>
              </div>
              <div className="p-6">
                <ImageUpload onImageUpload={handleImageUpload} />
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
    </div>
  );
}

export default App; 