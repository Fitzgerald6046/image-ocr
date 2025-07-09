import React from 'react';
import { Upload, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface UploadProgressProps {
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  fileName?: string;
  error?: string;
  onCancel?: () => void;
}

const UploadProgress: React.FC<UploadProgressProps> = ({
  progress,
  status,
  fileName = '',
  error = '',
  onCancel
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'uploading':
        return <Upload className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'processing':
        return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'uploading':
        return `上传中... ${progress}%`;
      case 'processing':
        return '处理中...';
      case 'completed':
        return '上传完成';
      case 'error':
        return '上传失败';
      default:
        return '准备上传';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return 'border-blue-200 bg-blue-50';
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getStatusColor()}`}>
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          {getStatusIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {fileName}
              </p>
              <p className="text-xs text-gray-500">
                {getStatusText()}
              </p>
            </div>
            
            {onCancel && (status === 'uploading' || status === 'processing') && (
              <button
                onClick={onCancel}
                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
            )}
          </div>
          
          {/* 进度条 */}
          {(status === 'uploading' || status === 'processing') && (
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    status === 'uploading' ? 'bg-blue-500' : 'bg-blue-500 animate-pulse'
                  }`}
                  style={{ width: `${status === 'uploading' ? progress : 100}%` }}
                />
              </div>
            </div>
          )}
          
          {/* 错误信息 */}
          {status === 'error' && error && (
            <div className="mt-2 text-xs text-red-600">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadProgress;