import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Download, Eye, Loader2, Clock, Award, TrendingUp, AlertCircle, Upload } from 'lucide-react';
import { ErrorHandler, ApiError } from '../../utils/errorHandler';
import ErrorMessage from '../common/ErrorMessage';
import MultiModelSelector from './MultiModelSelector';
import ImageUpload from '../forms/ImageUpload';
import { getApiUrl, API_CONFIG } from '../../config';

interface ModelComparisonProps {
  uploadedImage: {
    file: File;
    fileId: string;
    url: string;
    metadata?: any;
  } | null;
  recognitionType: string;
  onConfigureModels: () => void;
  onImageUpload?: (file: File) => void; // 添加图片上传回调
}

interface ComparisonResult {
  modelValue: string;
  modelName: string;
  providerName: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  startTime?: number;
  endTime?: number;
  duration?: number;
  result?: {
    content: string;
    confidence: number;
    originalContent?: string;
    classification?: any;
    specialAnalysis?: any;
  };
  error?: string;
}

interface PerformanceStats {
  totalModels: number;
  completedModels: number;
  averageDuration: number;
  fastestModel: string;
  mostAccurateModel: string;
  recommendedModel: string;
}

const ModelComparison: React.FC<ModelComparisonProps> = ({
  uploadedImage,
  recognitionType,
  onConfigureModels,
  onImageUpload
}) => {
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [isComparing, setIsComparing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [results, setResults] = useState<ComparisonResult[]>([]);
  const [currentModelIndex, setCurrentModelIndex] = useState(0);
  const [error, setError] = useState<ApiError | null>(null);
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats | null>(null);
  const [showDetailedResults, setShowDetailedResults] = useState(false);

  // 重置状态
  const resetComparison = () => {
    setResults([]);
    setCurrentModelIndex(0);
    setIsComparing(false);
    setIsPaused(false);
    setError(null);
    setPerformanceStats(null);
    setShowDetailedResults(false);
  };

  // 当选择的模型改变时重置状态
  useEffect(() => {
    resetComparison();
  }, [selectedModels]);

  // 获取模型配置
  const getModelConfig = (modelValue: string) => {
    try {
      const [providerId, modelName] = modelValue.split('::');
      const savedProviders = localStorage.getItem('aiProviders');
      if (savedProviders) {
        const providers = JSON.parse(savedProviders);
        const provider = providers.find((p: any) => p.id === providerId);
        if (provider && provider.apiKey) {
          return {
            model: modelName,
            apiKey: provider.apiKey,
            apiUrl: provider.apiUrl,
            provider: providerId,
            isCustom: provider.id.startsWith('custom-')
          };
        }
      }
    } catch (error) {
      console.error('Error parsing model config:', error);
    }
    return null;
  };

  // 单个模型识别
  const recognizeWithModel = async (modelValue: string): Promise<ComparisonResult> => {
    const modelParts = modelValue.split('::');
    const providerName = modelParts[0];
    const modelName = modelParts[1];
    
    const result: ComparisonResult = {
      modelValue,
      modelName,
      providerName,
      status: 'processing',
      startTime: Date.now()
    };

    try {
      const modelConfig = getModelConfig(modelValue);
      if (!modelConfig) {
        throw new Error('模型配置无效');
      }

      console.log(`🚀 开始使用 ${modelName} 进行识别`);

      const response = await fetch(getApiUrl(API_CONFIG.endpoints.recognition), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileId: uploadedImage?.fileId,
          modelConfig,
          recognitionType
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP错误: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || '识别失败');
      }

      result.endTime = Date.now();
      result.duration = result.endTime - result.startTime!;
      result.status = 'completed';
      result.result = data.recognition;

      console.log(`✅ ${modelName} 识别完成，耗时 ${result.duration}ms`);
      return result;

    } catch (error) {
      result.endTime = Date.now();
      result.duration = result.endTime - result.startTime!;
      result.status = 'error';
      result.error = error instanceof Error ? error.message : '未知错误';
      
      console.error(`❌ ${modelName} 识别失败:`, error);
      return result;
    }
  };

  // 开始对比
  const startComparison = async () => {
    if (!uploadedImage || selectedModels.length === 0) {
      setError(new ApiError({
        code: 'VALIDATION_ERROR',
        message: '请先上传图片并选择至少一个模型',
        userMessage: '请先上传图片并选择至少一个模型',
        retryable: false
      }));
      return;
    }

    setIsComparing(true);
    setIsPaused(false);
    setError(null);
    setResults([]);
    setCurrentModelIndex(0);

    // 初始化结果数组
    const initialResults: ComparisonResult[] = selectedModels.map(modelValue => {
      const modelParts = modelValue.split('::');
      return {
        modelValue,
        modelName: modelParts[1],
        providerName: modelParts[0],
        status: 'pending'
      };
    });
    setResults(initialResults);

    try {
      // 串行处理避免API限制
      for (let i = 0; i < selectedModels.length; i++) {
        if (isPaused) {
          console.log('🔄 对比已暂停');
          break;
        }

        setCurrentModelIndex(i);
        const modelValue = selectedModels[i];
        
        // 更新当前模型状态为处理中
        setResults(prev => prev.map((r, index) => 
          index === i ? { ...r, status: 'processing' as const } : r
        ));

        const result = await recognizeWithModel(modelValue);
        
        // 更新结果
        setResults(prev => prev.map((r, index) => 
          index === i ? result : r
        ));

        // 延迟避免API限制
        if (i < selectedModels.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // 计算性能统计
      const completedResults = initialResults.filter(r => r.status === 'completed');
      if (completedResults.length > 0) {
        const stats = calculatePerformanceStats(completedResults);
        setPerformanceStats(stats);
      }

    } catch (error) {
      const apiError = new ApiError({
        code: 'COMPARISON_ERROR',
        message: error instanceof Error ? error.message : '对比过程中发生错误',
        userMessage: '对比过程中发生错误，请重试',
        retryable: true
      });
      setError(apiError);
    } finally {
      setIsComparing(false);
      setCurrentModelIndex(0);
    }
  };

  // 计算性能统计
  const calculatePerformanceStats = (completedResults: ComparisonResult[]): PerformanceStats => {
    const totalDuration = completedResults.reduce((sum, r) => sum + (r.duration || 0), 0);
    const averageDuration = totalDuration / completedResults.length;
    
    const fastestResult = completedResults.reduce((fastest, current) => 
      (current.duration || Infinity) < (fastest.duration || Infinity) ? current : fastest
    );
    
    const mostAccurateResult = completedResults.reduce((accurate, current) => 
      (current.result?.confidence || 0) > (accurate.result?.confidence || 0) ? current : accurate
    );

    // 综合推荐算法：速度和准确率权衡
    const recommendedResult = completedResults.reduce((recommended, current) => {
      const currentScore = (current.result?.confidence || 0) * 0.7 + 
                          (1 - (current.duration || Infinity) / Math.max(...completedResults.map(r => r.duration || 0))) * 0.3;
      const recommendedScore = (recommended.result?.confidence || 0) * 0.7 + 
                              (1 - (recommended.duration || Infinity) / Math.max(...completedResults.map(r => r.duration || 0))) * 0.3;
      return currentScore > recommendedScore ? current : recommended;
    });

    return {
      totalModels: selectedModels.length,
      completedModels: completedResults.length,
      averageDuration,
      fastestModel: fastestResult.modelName,
      mostAccurateModel: mostAccurateResult.modelName,
      recommendedModel: recommendedResult.modelName
    };
  };

  // 暂停/恢复
  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  // 导出对比结果
  const exportResults = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      image: uploadedImage?.file.name,
      recognitionType,
      models: selectedModels.length,
      results: results.map(r => ({
        model: r.modelName,
        provider: r.providerName,
        status: r.status,
        duration: r.duration,
        confidence: r.result?.confidence,
        content: r.result?.content,
        error: r.error
      })),
      performanceStats
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `model-comparison-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* 使用说明 */}
      {(!uploadedImage || selectedModels.length === 0) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">
            📊 多模型对比分析使用指南
          </h3>
          <div className="space-y-2 text-sm text-blue-700">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <span>上传要识别的图片</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <span>选择2-5个不同的AI模型进行对比</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <span>点击"开始对比"按钮执行批量识别</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
              <span>查看不同模型的识别结果、速度和准确率对比</span>
            </div>
          </div>
        </div>
      )}

      {/* 图片上传区域 */}
      {!uploadedImage && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">上传图片</h3>
            </div>
          </div>
          <div className="p-6">
            {onImageUpload ? (
              <ImageUpload onImageUpload={onImageUpload} />
            ) : (
              <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500 mb-2">请先返回主页上传图片</p>
                <p className="text-sm text-gray-400">或在设置中启用直接上传功能</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 已上传图片的预览 */}
      {uploadedImage && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-green-100 rounded flex items-center justify-center">
                  <span className="text-green-600 text-xs">🖼️</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">已上传图片</h3>
              </div>
              {onImageUpload && (
                <button
                  onClick={() => {
                    // 重新上传
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        onImageUpload(file);
                      }
                    };
                    input.click();
                  }}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                >
                  重新上传
                </button>
              )}
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-4">
              <img
                src={uploadedImage.url}
                alt="预览图片"
                className="w-20 h-20 object-cover rounded-lg border border-gray-200"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-800">{uploadedImage.file.name}</p>
                <p className="text-sm text-gray-500">
                  {(uploadedImage.file.size / 1024 / 1024).toFixed(2)} MB · {uploadedImage.file.type}
                </p>
                {uploadedImage.metadata && (
                  <p className="text-sm text-gray-500">
                    {uploadedImage.metadata.width} × {uploadedImage.metadata.height} 像素
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 模型选择器 */}
      <MultiModelSelector
        selectedModels={selectedModels}
        onModelSelectionChange={setSelectedModels}
        onConfigureModels={onConfigureModels}
        maxModels={5}
        comparisonMode={true}
      />

      {/* 调试信息 - 显示识别按钮状态 */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
        <h4 className="text-sm font-medium text-gray-600 mb-2">🔍 调试信息</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">已选择模型数量: </span>
            <span className={selectedModels.length > 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
              {selectedModels.length}
            </span>
          </div>
          <div>
            <span className="text-gray-600">图片已上传: </span>
            <span className={uploadedImage ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
              {uploadedImage ? '是' : '否'}
            </span>
          </div>
          <div className="col-span-2">
            <span className="text-gray-600">识别按钮状态: </span>
            <span className={(selectedModels.length > 0 && uploadedImage) ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
              {(selectedModels.length > 0 && uploadedImage) ? '✅ 应该显示' : '❌ 未满足显示条件'}
            </span>
          </div>
        </div>
        {selectedModels.length > 0 && (
          <div className="mt-2">
            <span className="text-gray-600 text-xs">已选择的模型: </span>
            <span className="text-blue-600 text-xs">{selectedModels.join(', ')}</span>
          </div>
        )}
      </div>

      {/* 控制按钮 */}
      {selectedModels.length > 0 && uploadedImage && (
        <div className="flex items-center gap-3">
          <button
            onClick={startComparison}
            disabled={isComparing}
            className="flex items-center gap-2 px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
            style={{ 
              backgroundColor: '#2563eb', 
              color: '#ffffff',
              border: '2px solid #1d4ed8'
            }}
          >
            {isComparing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
            {isComparing ? '对比进行中...' : '🚀 开始对比'}
          </button>

          {isComparing && (
            <button
              onClick={togglePause}
              className="flex items-center gap-2 px-4 py-3 rounded-lg transition-colors"
              style={{ 
                backgroundColor: '#d97706', 
                color: '#ffffff',
                border: '2px solid #b45309'
              }}
            >
              {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              {isPaused ? '继续' : '暂停'}
            </button>
          )}

          <button
            onClick={resetComparison}
            className="flex items-center gap-2 px-4 py-3 rounded-lg transition-colors"
            style={{ 
              backgroundColor: '#4b5563', 
              color: '#ffffff',
              border: '2px solid #374151'
            }}
          >
            <RotateCcw className="w-5 h-5" />
            重置
          </button>

          {results.some(r => r.status === 'completed') && (
            <button
              onClick={exportResults}
              className="flex items-center gap-2 px-4 py-3 rounded-lg transition-colors"
              style={{ 
                backgroundColor: '#059669', 
                color: '#ffffff',
                border: '2px solid #047857'
              }}
            >
              <Download className="w-5 h-5" />
              导出结果
            </button>
          )}
        </div>
      )}



      {/* 错误信息 */}
      {error && (
        <ErrorMessage 
          error={error} 
          onDismiss={() => setError(null)} 
        />
      )}

      {/* 进度显示 */}
      {isComparing && (
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-800">
              对比进度: {currentModelIndex + 1}/{selectedModels.length}
            </span>
            <span className="text-sm text-blue-600">
              {Math.round(((currentModelIndex + 1) / selectedModels.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentModelIndex + 1) / selectedModels.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* 性能统计 */}
      {performanceStats && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            对比统计
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-800">{performanceStats.completedModels}</div>
              <div className="text-sm text-gray-600">成功完成</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-800">{(performanceStats.averageDuration / 1000).toFixed(1)}s</div>
              <div className="text-sm text-blue-600">平均耗时</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-800 flex items-center justify-center gap-1">
                <Clock className="w-4 h-4" />
                {performanceStats.fastestModel}
              </div>
              <div className="text-sm text-green-600">最快模型</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-lg font-bold text-purple-800 flex items-center justify-center gap-1">
                <Award className="w-4 h-4" />
                {performanceStats.recommendedModel}
              </div>
              <div className="text-sm text-purple-600">推荐模型</div>
            </div>
          </div>
        </div>
      )}

      {/* 结果列表 */}
      {results.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">对比结果</h3>
            <button
              onClick={() => setShowDetailedResults(!showDetailedResults)}
              className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
            >
              <Eye className="w-4 h-4" />
              {showDetailedResults ? '隐藏详情' : '显示详情'}
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">模型</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">耗时</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">置信度</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">预览</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((result, index) => (
                  <React.Fragment key={result.modelValue}>
                    <tr className={`${result.status === 'processing' ? 'bg-blue-50' : ''}`}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{result.modelName}</div>
                          <div className="text-sm text-gray-500">{result.providerName}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          result.status === 'completed' ? 'bg-green-100 text-green-800' :
                          result.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                          result.status === 'error' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {result.status === 'processing' && <Loader2 className="w-3 h-3 animate-spin" />}
                          {result.status === 'error' && <AlertCircle className="w-3 h-3" />}
                          {result.status === 'completed' && '✓'}
                          {result.status === 'pending' && '○'}
                          {result.status === 'completed' ? '完成' :
                           result.status === 'processing' ? '处理中' :
                           result.status === 'error' ? '失败' : '等待'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {result.duration ? `${(result.duration / 1000).toFixed(1)}s` : '-'}
                        {result.duration && performanceStats?.fastestModel === result.modelName && (
                          <span className="ml-1 text-green-600">⚡</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {result.result?.confidence ? `${Math.round(result.result.confidence * 100)}%` : '-'}
                        {result.result?.confidence && performanceStats?.mostAccurateModel === result.modelName && (
                          <span className="ml-1 text-purple-600">🎯</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.result?.content ? 
                          `${result.result.content.substring(0, 30)}${result.result.content.length > 30 ? '...' : ''}` : 
                          result.error || '-'
                        }
                      </td>
                    </tr>
                    
                    {/* 详细结果展开行 */}
                    {showDetailedResults && result.result && (
                      <tr className="bg-gray-50">
                        <td colSpan={5} className="px-4 py-4">
                          <div className="text-sm">
                            <div className="font-medium text-gray-700 mb-2">识别内容：</div>
                            <div className="bg-white p-3 rounded border text-gray-800 whitespace-pre-wrap">
                              {result.result.content}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelComparison;