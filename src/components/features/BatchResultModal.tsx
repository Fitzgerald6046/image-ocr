import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import EnhancedRecognitionResult from './EnhancedRecognitionResult';

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

interface BatchResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: RecognitionResult;
  fileName: string;
}

const BatchResultModal: React.FC<BatchResultModalProps> = ({
  isOpen,
  onClose,
  result,
  fileName
}) => {
  // 防止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  
  // ESC键关闭
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-sm">📄</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">识别结果详情</h3>
              <p className="text-sm text-gray-500 truncate max-w-md">{fileName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="关闭 (ESC)"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6" style={{ maxHeight: 'calc(95vh - 160px)' }}>
          <EnhancedRecognitionResult
            result={result}
            isRecognizing={false}
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchResultModal;