import React from 'react';
import { BarChart3, Upload } from 'lucide-react';
import { useAppContext, appActions } from '../../contexts/AppContext';
import ImageUpload from '../forms/ImageUpload';
import ErrorMessage from '../common/ErrorMessage';
import UploadProgress from '../forms/UploadProgress';
import ThemeToggle from '../common/ThemeToggle';
import ModelComparison from '../features/ModelComparison';
import ExportDialog from '../layout/ExportDialog';
import ImagePreviewWithZoom from '../layout/ImagePreviewWithZoom';
import { useImageUpload } from '../../hooks/useImageUpload';

const ComparisonPage: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { handleImageUpload } = useImageUpload();

  const {
    uploadedImage,
    recognitionType,
    uploadStatus,
    error,
    showExportDialog,
    exportItems
  } = state;

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
                onClick={() => dispatch(appActions.setCurrentView('main'))}
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
                        onChange={(e) => dispatch(appActions.setRecognitionType(e.target.value))}
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
              onConfigureModels={() => dispatch(appActions.setCurrentView('settings'))}
              onImageUpload={handleImageUpload}
            />
          </div>
        </div>
      </main>

      {/* 导出对话框 */}
      {showExportDialog && (
        <ExportDialog
          isOpen={showExportDialog}
          onClose={() => dispatch(appActions.setShowExportDialog(false))}
          items={exportItems}
        />
      )}
    </div>
  );
};

export default ComparisonPage;