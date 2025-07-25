import React, { useState, useCallback } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Loader2, FolderOpen, Trash2 } from 'lucide-react';
import { FileHandler } from '../../utils/fileHandler';
import { ErrorHandler, ApiError } from '../../utils/errorHandler';
import UploadProgress from '../forms/UploadProgress';
import ErrorMessage from '../common/ErrorMessage';
import { getApiUrl, API_CONFIG } from '../../config';

interface BatchFileItem {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
  fileId?: string;
  url?: string;
  error?: ApiError;
}

interface BatchUploadProps {
  onFilesUploaded: (files: BatchFileItem[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

const BatchUpload: React.FC<BatchUploadProps> = ({
  onFilesUploaded,
  maxFiles = 10,
  disabled = false
}) => {
  const [files, setFiles] = useState<BatchFileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const generateFileId = () => {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleFileSelect = useCallback((selectedFiles: FileList) => {
    const fileArray = Array.from(selectedFiles);
    const totalFiles = files.length + fileArray.length;
    
    if (totalFiles > maxFiles) {
      alert(`最多只能上传 ${maxFiles} 个文件`);
      return;
    }

    const newFiles: BatchFileItem[] = fileArray.map(file => {
      const validation = FileHandler.validateFile(file);
      return {
        id: generateFileId(),
        file,
        status: validation.isValid ? 'pending' : 'error',
        progress: 0,
        error: validation.isValid ? undefined : ErrorHandler.handle(new Error(validation.error!), 'file')
      };
    });

    setFiles(prev => [...prev, ...newFiles]);
  }, [files.length, maxFiles]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;
    
    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles);
  }, [disabled, handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      handleFileSelect(selectedFiles);
    }
    // 清空input值以允许重复选择相同文件
    e.target.value = '';
  }, [handleFileSelect]);

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const clearAll = () => {
    if (isUploading) return;
    setFiles([]);
  };

  const uploadFile = async (fileItem: BatchFileItem): Promise<BatchFileItem> => {
    try {
      // 更新状态为上传中
      setFiles(prev => prev.map(f => 
        f.id === fileItem.id 
          ? { ...f, status: 'uploading', progress: 0 }
          : f
      ));

      // 检查是否需要压缩
      let uploadFile = fileItem.file;
      if (FileHandler.shouldCompress(fileItem.file)) {
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id 
            ? { ...f, progress: 20 }
            : f
        ));

        try {
          const compressed = await FileHandler.compressImage(fileItem.file);
          uploadFile = compressed.file;
        } catch (compressionError) {
          console.warn('压缩失败，使用原图:', compressionError);
        }
      }

      // 上传文件
      const formData = new FormData();
      formData.append('image', uploadFile);

      setFiles(prev => prev.map(f => 
        f.id === fileItem.id 
          ? { ...f, progress: 50 }
          : f
      ));

      const response = await fetch(getApiUrl(API_CONFIG.endpoints.upload), {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw ErrorHandler.handleHttpError(response, errorText);
      }

      const result = await response.json();
      
      if (result.success) {
        return {
          ...fileItem,
          status: 'completed',
          progress: 100,
          fileId: result.file.id,
          url: result.file.url.startsWith('http') ? result.file.url : `${API_CONFIG.baseURL}${result.file.url}`
        };
      } else {
        throw new Error(result.message || '上传失败');
      }
    } catch (error) {
      let apiError: ApiError;
      if (error instanceof ApiError) {
        apiError = error;
      } else {
        apiError = ErrorHandler.handle(error, 'network');
      }

      return {
        ...fileItem,
        status: 'error',
        progress: 0,
        error: apiError
      };
    }
  };

  const uploadAllFiles = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    setIsUploading(true);

    try {
      // 并发上传文件（限制并发数）
      const CONCURRENT_LIMIT = 3;
      const results: BatchFileItem[] = [];
      
      for (let i = 0; i < pendingFiles.length; i += CONCURRENT_LIMIT) {
        const batch = pendingFiles.slice(i, i + CONCURRENT_LIMIT);
        const batchPromises = batch.map(file => uploadFile(file));
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        // 更新状态
        setFiles(prev => prev.map(f => {
          const result = results.find(r => r.id === f.id);
          return result || f;
        }));
      }

      // 通知父组件上传完成
      onFilesUploaded(results);
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusIcon = (status: BatchFileItem['status']) => {
    switch (status) {
      case 'pending':
        return <Upload className="w-4 h-4 text-gray-400" />;
      case 'uploading':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Upload className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: BatchFileItem['status']) => {
    switch (status) {
      case 'pending':
        return '等待上传';
      case 'uploading':
        return '上传中...';
      case 'completed':
        return '上传完成';
      case 'error':
        return '上传失败';
      default:
        return '未知状态';
    }
  };

  const canUpload = files.some(f => f.status === 'pending') && !isUploading;

  return (
    <div className="space-y-4">
      {/* 批量上传区域 */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-4 md:p-6 text-center cursor-pointer transition-all duration-200
          ${isDragging 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && document.getElementById('batch-file-input')?.click()}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
            <FolderOpen className="w-6 h-6 text-gray-400" />
          </div>
          
          <div className="space-y-1">
            <p className="text-lg font-medium text-gray-700">
              批量上传图片
            </p>
            <p className="text-sm text-gray-500">
              拖拽多个文件到此处或点击选择（最多 {maxFiles} 个文件）
            </p>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Upload className="w-4 h-4" />
            <span>选择多个文件</span>
          </div>
        </div>
      </div>

      <input
        id="batch-file-input"
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* 文件列表 */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              待上传文件 ({files.length})
            </h3>
            <div className="flex items-center gap-2">
              {canUpload && (
                <button
                  onClick={uploadAllFiles}
                  disabled={isUploading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isUploading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      上传中...
                    </div>
                  ) : (
                    '开始上传'
                  )}
                </button>
              )}
              <button
                onClick={clearAll}
                disabled={isUploading}
                className="px-3 py-2 text-gray-500 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="清空所有文件"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {files.map((fileItem) => (
              <div
                key={fileItem.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex-shrink-0">
                  {getStatusIcon(fileItem.status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {fileItem.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {FileHandler.formatFileSize(fileItem.file.size)} • {getStatusText(fileItem.status)}
                      </p>
                    </div>
                    
                    {fileItem.status !== 'uploading' && (
                      <button
                        onClick={() => removeFile(fileItem.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title="移除文件"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  {fileItem.status === 'uploading' && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${fileItem.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {fileItem.status === 'error' && fileItem.error && (
                    <div className="mt-2">
                      <ErrorMessage
                        error={fileItem.error}
                        onRetry={fileItem.error.retryable ? () => uploadFile(fileItem) : undefined}
                        className="text-xs"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchUpload;