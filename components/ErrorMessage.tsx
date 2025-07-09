import React from 'react';
import { AlertCircle, RefreshCw, X, Lightbulb } from 'lucide-react';
import { ApiError } from '../utils/errorHandler';

interface ErrorMessageProps {
  error: ApiError | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  onRetry,
  onDismiss,
  className = ''
}) => {
  if (!error) return null;

  const getErrorIcon = () => {
    switch (error.code) {
      case 'NETWORK_ERROR':
      case 'SERVER_UNAVAILABLE':
        return <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
          <span className="text-red-600 text-xs">🌐</span>
        </div>;
      case 'FILE_TOO_LARGE':
      case 'UNSUPPORTED_FORMAT':
        return <div className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center">
          <span className="text-orange-600 text-xs">📁</span>
        </div>;
      case 'API_KEY_ERROR':
      case 'UNAUTHORIZED':
        return <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center">
          <span className="text-purple-600 text-xs">🔑</span>
        </div>;
      case 'RATE_LIMITED':
        return <div className="w-5 h-5 bg-yellow-100 rounded-full flex items-center justify-center">
          <span className="text-yellow-600 text-xs">⏱️</span>
        </div>;
      default:
        return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getErrorColor = () => {
    switch (error.code) {
      case 'NETWORK_ERROR':
      case 'SERVER_ERROR':
        return 'border-red-200 bg-red-50';
      case 'FILE_TOO_LARGE':
      case 'UNSUPPORTED_FORMAT':
        return 'border-orange-200 bg-orange-50';
      case 'API_KEY_ERROR':
      case 'UNAUTHORIZED':
        return 'border-purple-200 bg-purple-50';
      case 'RATE_LIMITED':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-red-200 bg-red-50';
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getErrorColor()} ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getErrorIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">
              {error.userMessage}
            </h4>
            
            <div className="flex items-center gap-2">
              {error.retryable && onRetry && (
                <button
                  onClick={onRetry}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  重试
                </button>
              )}
              
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          
          {error.suggestions && error.suggestions.length > 0 && (
            <div className="mt-2">
              <div className="flex items-center gap-1 mb-1">
                <Lightbulb className="w-3 h-3 text-amber-500" />
                <span className="text-xs font-medium text-gray-700">解决建议：</span>
              </div>
              <ul className="text-xs text-gray-600 space-y-1">
                {error.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span className="text-gray-400 mt-0.5">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;