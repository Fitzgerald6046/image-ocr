import React from 'react';
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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
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
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <EnhancedRecognitionResult
            result={result}
            isRecognizing={false}
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchResultModal;