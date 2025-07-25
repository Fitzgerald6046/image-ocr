import React from 'react';
import { Camera, Upload, ChevronDown, ChevronUp, FolderOpen, BarChart3, History } from 'lucide-react';
import { useAppContext, appActions } from '../../contexts/AppContext';
import ImageUpload from '../forms/ImageUpload';
import ModelSelector from '../features/ModelSelector';
import RecognizeButton from '../features/RecognizeButton';
import EnhancedRecognitionResult from '../features/EnhancedRecognitionResult';
import ErrorMessage from '../common/ErrorMessage';
import UploadProgress from '../forms/UploadProgress';
import BatchUpload from '../features/BatchUpload';
import BatchRecognition from '../features/BatchRecognition';
import ThemeToggle from '../common/ThemeToggle';
import ImagePreviewWithZoom from '../layout/ImagePreviewWithZoom';
import ExportDialog from '../layout/ExportDialog';
import { ExportItem } from '../../utils/exportUtils';
import { useImageUpload } from '../../hooks/useImageUpload';
import { useRecognition } from '../../hooks/useRecognition';

const MainPage: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { handleImageUpload } = useImageUpload();
  const { handleRecognize } = useRecognition();

  const {
    uploadedImage,
    selectedModel,
    recognitionType,
    recognitionResult,
    isRecognizing,
    uploadStatus,
    error,
    batchFiles,
    showExportDialog,
    exportItems,
    showBatchSection
  } = state;

  // 处理导出
  const handleExport = (items: ExportItem[]) => {
    dispatch(appActions.setExportItems(items));
    dispatch(appActions.setShowExportDialog(true));
  };

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
                  if (!selectedModel) {
                    alert('请先选择AI模型后再使用批量处理功能');
                    return;
                  }
                  dispatch(appActions.setShowBatchSection(!showBatchSection));
                  if (!showBatchSection && recognitionResult) {
                    dispatch(appActions.setRecognitionResult(null));
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
                onClick={() => dispatch(appActions.setCurrentView('comparison'))}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                title="多模型对比分析"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden md:inline">模型对比</span>
              </button>
              
              <button
                onClick={() => dispatch(appActions.setCurrentView('history'))}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">历史记录</span>
              </button>
              
              <button
                onClick={() => dispatch(appActions.setCurrentView('settings'))}
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
                        dispatch(appActions.setError(null));
                        if (uploadedImage) {
                          handleImageUpload(uploadedImage.file);
                        }
                      } : undefined}
                      onDismiss={() => dispatch(appActions.setError(null))}
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
                    onChange={(e) => dispatch(appActions.setRecognitionType(e.target.value))}
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
              onModelChange={(model) => dispatch(appActions.setSelectedModel(model))}
              onConfigureModels={() => dispatch(appActions.setCurrentView('settings'))}
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
                <ImagePreviewWithZoom uploadedImage={uploadedImage} />
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
                  onClick={() => dispatch(appActions.setCurrentView('comparison'))}
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
                            dispatch(appActions.setBatchFiles([]));
                            dispatch(appActions.setExportItems([]));
                            dispatch(appActions.setShowExportDialog(false));
                          }}
                          className="px-3 py-1 text-sm bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                          title="清除所有文件"
                        >
                          清除
                        </button>
                      )}
                      <button
                        onClick={() => {
                          dispatch(appActions.setShowBatchSection(false));
                          if (recognitionResult) {
                            dispatch(appActions.setRecognitionResult(null));
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
                      onFilesUploaded={(files) => dispatch(appActions.setBatchFiles(files))}
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
      
      {/* 导出对话框 */}
      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => dispatch(appActions.setShowExportDialog(false))}
        items={exportItems}
        title="导出识别结果"
      />
    </div>
  );
};

export default MainPage;