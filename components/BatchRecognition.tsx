import React, { useState } from 'react';
import { Play, Pause, RotateCcw, Download, Eye, Loader2 } from 'lucide-react';
import { ErrorHandler, ApiError } from '../utils/errorHandler';
import ErrorMessage from './ErrorMessage';
import BatchResultModal from './BatchResultModal';
import { HistoryManager } from '../utils/historyManager';
import { getApiUrl, API_CONFIG } from '../src/config';

interface BatchFileItem {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
  fileId?: string;
  url?: string;
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
  classification?: any;
  specialAnalysis?: any;
}

interface BatchRecognitionItem extends BatchFileItem {
  recognitionStatus: 'pending' | 'processing' | 'completed' | 'error';
  recognitionResult?: RecognitionResult;
  recognitionError?: ApiError;
}

interface BatchRecognitionProps {
  files: BatchFileItem[];
  selectedModel: string;
  recognitionType: string;
  onResults: (results: BatchRecognitionItem[]) => void;
}

const BatchRecognition: React.FC<BatchRecognitionProps> = ({
  files,
  selectedModel,
  recognitionType,
  onResults
}) => {
  const [recognitionItems, setRecognitionItems] = useState<BatchRecognitionItem[]>(() =>
    files.map(file => ({
      ...file,
      recognitionStatus: 'pending'
    }))
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedResult, setSelectedResult] = useState<{ result: RecognitionResult; fileName: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const recognizeFile = async (item: BatchRecognitionItem): Promise<BatchRecognitionItem> => {
    try {
      // 获取模型配置
      const savedProviders = localStorage.getItem('aiProviders');
      const providers = JSON.parse(savedProviders || '[]');
      
      const [targetProviderId, targetModelName] = selectedModel.includes('::') 
        ? selectedModel.split('::', 2)
        : ['', selectedModel];

      let modelConfig = null;
      for (const provider of providers) {
        if (targetProviderId && provider.id !== targetProviderId) continue;
        
        const allModels = [...(provider.models || []), ...(provider.customModels || [])];
        if (allModels.includes(targetModelName)) {
          modelConfig = {
            model: targetModelName,
            apiKey: provider.apiKey,
            apiUrl: provider.apiUrl,
            provider: provider.id,
            isCustom: provider.id.startsWith('custom-')
          };
          break;
        }
      }

      if (!modelConfig || !modelConfig.apiKey) {
        throw new Error('未找到模型配置或API密钥');
      }

      // 发送识别请求
      const requestData = {
        fileId: item.fileId,
        modelConfig,
        recognitionType
      };

      const response = await fetch(getApiUrl(API_CONFIG.endpoints.recognition), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw ErrorHandler.handleHttpError(response, errorText);
      }

      const result = await response.json();
      
      if (result.success) {
        return {
          ...item,
          recognitionStatus: 'completed',
          recognitionResult: {
            type: recognitionType,
            content: result.recognition.content,
            confidence: result.recognition.confidence,
            model: result.recognition.model,
            provider: result.recognition.provider,
            timestamp: result.recognition.timestamp,
            originalContent: result.recognition.originalContent,
            classification: result.recognition.classification,
            specialAnalysis: result.recognition.specialAnalysis
          }
        };
      } else {
        throw new Error(result.message || '识别失败');
      }
    } catch (error) {
      let apiError: ApiError;
      if (error instanceof ApiError) {
        apiError = error;
      } else {
        apiError = ErrorHandler.handle(error, 'recognition');
      }

      return {
        ...item,
        recognitionStatus: 'error',
        recognitionError: apiError
      };
    }
  };

  const startBatchRecognition = async () => {
    if (!selectedModel) {
      alert('请先选择AI模型');
      return;
    }

    const completedFiles = files.filter(f => f.status === 'completed');
    if (completedFiles.length === 0) {
      alert('没有可识别的文件');
      return;
    }

    setIsProcessing(true);
    setIsPaused(false);
    setCurrentIndex(0);

    const items = completedFiles.map(file => ({
      ...file,
      recognitionStatus: 'pending' as const
    }));
    
    setRecognitionItems(items);

    try {
      const results: BatchRecognitionItem[] = [];
      
      for (let i = 0; i < items.length; i++) {
        if (isPaused) break;
        
        setCurrentIndex(i);
        const item = items[i];
        
        // 更新状态为处理中
        setRecognitionItems(prev => prev.map(r => 
          r.id === item.id 
            ? { ...r, recognitionStatus: 'processing' }
            : r
        ));

        // 处理识别
        const result = await recognizeFile(item);
        results.push(result);
        
        // 如果识别成功，保存到历史记录
        if (result.recognitionStatus === 'completed' && result.recognitionResult) {
          try {
            HistoryManager.saveRecord({
              fileName: result.file.name,
              fileSize: result.file.size,
              fileType: result.file.type,
              recognitionType: result.recognitionResult.type,
              model: result.recognitionResult.model,
              provider: result.recognitionResult.provider || 'unknown',
              result: {
                content: result.recognitionResult.content,
                confidence: result.recognitionResult.confidence,
                originalContent: result.recognitionResult.originalContent,
                classification: result.recognitionResult.classification,
                specialAnalysis: result.recognitionResult.specialAnalysis
              },
              previewUrl: result.url,
              tags: ['批量处理']
            });
          } catch (error) {
            console.error('Failed to save batch recognition result to history:', error);
          }
        }
        
        // 更新结果
        setRecognitionItems(prev => prev.map(r => 
          r.id === item.id ? result : r
        ));

        // 短暂延迟避免API限制
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      onResults(results);
    } finally {
      setIsProcessing(false);
      setIsPaused(false);
    }
  };

  const pauseRecognition = () => {
    setIsPaused(true);
  };

  const resumeRecognition = () => {
    setIsPaused(false);
    // 继续从当前位置开始
    // 这里需要重新实现继续逻辑，暂时简化
  };

  const resetRecognition = () => {
    setRecognitionItems(prev => prev.map(item => ({
      ...item,
      recognitionStatus: 'pending',
      recognitionResult: undefined,
      recognitionError: undefined
    })));
    setCurrentIndex(0);
    setIsProcessing(false);
    setIsPaused(false);
  };

  const handleViewResult = (item: BatchRecognitionItem) => {
    if (item.recognitionResult) {
      setSelectedResult({
        result: item.recognitionResult,
        fileName: item.file.name
      });
      setIsModalOpen(true);
    }
  };

  const handleDownloadResult = (item: BatchRecognitionItem) => {
    if (item.recognitionResult) {
      // 生成文件名（移除原文件扩展名，添加时间戳）
      const originalName = item.file.name.replace(/\.[^/.]+$/, '');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const fileName = `${originalName}_识别结果_${timestamp}.txt`;
      
      // 准备下载内容
      const content = [
        `=== 图像识别结果 ===`,
        `文件名: ${item.file.name}`,
        `识别类型: ${item.recognitionResult.type}`,
        `置信度: ${(item.recognitionResult.confidence * 100).toFixed(1)}%`,
        `使用模型: ${item.recognitionResult.model}`,
        `提供商: ${item.recognitionResult.provider || 'N/A'}`,
        `识别时间: ${item.recognitionResult.timestamp ? new Date(item.recognitionResult.timestamp).toLocaleString() : 'N/A'}`,
        ``,
        `=== 识别内容 ===`,
        item.recognitionResult.content,
        ``,
        `=== 生成时间 ===`,
        new Date().toLocaleString()
      ].join('\n');
      
      // 创建并下载文件
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedResult(null);
  };

  const handleDownloadAllResults = () => {
    const completedItems = recognitionItems.filter(item => 
      item.recognitionStatus === 'completed' && item.recognitionResult
    );
    
    if (completedItems.length === 0) {
      alert('没有可下载的结果');
      return;
    }
    
    // 生成所有结果的综合文件
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `批量识别结果_${timestamp}.txt`;
    
    const content = [
      `=== 批量识别结果总结 ===`,
      `生成时间: ${new Date().toLocaleString()}`,
      `总文件数: ${recognitionItems.length}`,
      `成功识别: ${completedItems.length}`,
      `识别类型: ${recognitionType}`,
      `使用模型: ${selectedModel}`,
      ``,
      `=== 识别结果明细 ===`,
      ...completedItems.map((item, index) => [
        ``,
        `--- 第${index + 1}个文件 ---`,
        `文件名: ${item.file.name}`,
        `文件大小: ${(item.file.size / 1024).toFixed(1)} KB`,
        `识别类型: ${item.recognitionResult!.type}`,
        `置信度: ${(item.recognitionResult!.confidence * 100).toFixed(1)}%`,
        `使用模型: ${item.recognitionResult!.model}`,
        `识别时间: ${item.recognitionResult!.timestamp ? new Date(item.recognitionResult!.timestamp).toLocaleString() : 'N/A'}`,
        ``,
        `识别内容:`,
        item.recognitionResult!.content,
        ``,
        `${'='.repeat(50)}`
      ]).flat()
    ].join('\n');
    
    // 创建并下载文件
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: BatchRecognitionItem['recognitionStatus']) => {
    switch (status) {
      case 'pending':
        return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <div className="w-4 h-4 bg-green-500 rounded-full" />;
      case 'error':
        return <div className="w-4 h-4 bg-red-500 rounded-full" />;
      default:
        return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
    }
  };

  const getStatusText = (status: BatchRecognitionItem['recognitionStatus']) => {
    switch (status) {
      case 'pending':
        return '等待识别';
      case 'processing':
        return '识别中...';
      case 'completed':
        return '识别完成';
      case 'error':
        return '识别失败';
      default:
        return '未知状态';
    }
  };

  const getTypeDisplayName = (type: string) => {
    const typeMap: Record<string, string> = {
      'auto': '智能识别',
      'ancient': '古籍文献',
      'receipt': '票据识别',
      'document': '文档识别',
      'id': '证件识别',
      'table': '表格识别',
      'handwriting': '手写识别',
      'prompt': 'AI绘图',
      'translate': '翻译识别'
    };
    return typeMap[type] || type;
  };

  const completedCount = recognitionItems.filter(item => item.recognitionStatus === 'completed').length;
  const errorCount = recognitionItems.filter(item => item.recognitionStatus === 'error').length;
  const totalCount = recognitionItems.length;

  return (
    <div className="space-y-4">
      {/* 批量识别控制栏 */}
      <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-medium text-gray-900">
            批量识别
          </h3>
          <div className="text-sm text-gray-500">
            {totalCount > 0 && (
              <span>
                完成: {completedCount} / {totalCount}
                {errorCount > 0 && ` (失败: ${errorCount})`}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* 批量下载按钮 */}
          {completedCount > 0 && (
            <button
              onClick={handleDownloadAllResults}
              className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              title="下载所有结果"
            >
              <Download className="w-4 h-4" />
              下载全部
            </button>
          )}
          
          {!isProcessing ? (
            <button
              onClick={startBatchRecognition}
              disabled={files.filter(f => f.status === 'completed').length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Play className="w-4 h-4" />
              开始识别
            </button>
          ) : (
            <div className="flex items-center gap-2">
              {!isPaused ? (
                <button
                  onClick={pauseRecognition}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  <Pause className="w-4 h-4" />
                  暂停
                </button>
              ) : (
                <button
                  onClick={resumeRecognition}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  继续
                </button>
              )}
              <button
                onClick={resetRecognition}
                className="flex items-center gap-2 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                重置
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 识别进度 */}
      {totalCount > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>识别进度</span>
            <span>{Math.round((completedCount / totalCount) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* 识别结果列表 */}
      {recognitionItems.length > 0 && (
        <div className="space-y-2">
          {recognitionItems.map((item, index) => (
            <div
              key={item.id}
              className={`p-4 rounded-lg border transition-all ${
                index === currentIndex && isProcessing
                  ? 'border-blue-300 bg-blue-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {getStatusIcon(item.recognitionStatus)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getStatusText(item.recognitionStatus)}
                        {item.recognitionResult && (
                          <span className="ml-2">
                            置信度: {Math.round(item.recognitionResult.confidence * 100)}%
                          </span>
                        )}
                      </p>
                    </div>
                    
                    {item.recognitionStatus === 'completed' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewResult(item)}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                          title="查看结果"
                        >
                          <Eye className="w-3 h-3" />
                          查看
                        </button>
                        <button
                          onClick={() => handleDownloadResult(item)}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
                          title="下载结果"
                        >
                          <Download className="w-3 h-3" />
                          下载
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {item.recognitionResult && (
                    <div className="mt-2 p-3 bg-gray-50 rounded border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                            {getTypeDisplayName(item.recognitionResult.type)}
                          </span>
                          <span>模型: {item.recognitionResult.model}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.recognitionResult.timestamp && 
                            new Date(item.recognitionResult.timestamp).toLocaleString()
                          }
                        </div>
                      </div>
                      <div className="text-xs text-gray-700 leading-relaxed">
                        <p className="line-clamp-3">
                          {item.recognitionResult.content.length > 150 
                            ? item.recognitionResult.content.substring(0, 150) + '...' 
                            : item.recognitionResult.content
                          }
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {item.recognitionError && (
                    <div className="mt-2">
                      <ErrorMessage
                        error={item.recognitionError}
                        className="text-xs"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Result Modal */}
      {selectedResult && (
        <BatchResultModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          result={selectedResult.result}
          fileName={selectedResult.fileName}
        />
      )}
    </div>
  );
};

export default BatchRecognition;