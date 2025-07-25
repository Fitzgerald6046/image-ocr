import React from 'react';
import { Play, Loader, AlertCircle } from 'lucide-react';

interface RecognizeButtonProps {
  uploadedImage: any;
  selectedModel: string;
  isRecognizing: boolean;
  onRecognize: () => void;
}

const RecognizeButton: React.FC<RecognizeButtonProps> = ({
  uploadedImage,
  selectedModel,
  isRecognizing,
  onRecognize
}) => {
  const canRecognize = uploadedImage && selectedModel && !isRecognizing;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-blue-100">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-green-100 rounded flex items-center justify-center">
            <span className="text-green-600 text-xs">🚀</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-800">🚀 开始识别</h3>
        </div>
      </div>
      
      <div className="p-4">
        {/* 状态检查 */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <span className={uploadedImage ? "text-green-600" : "text-red-600"}>
              {uploadedImage ? "✅" : "❌"}
            </span>
            <span>图片已上传</span>
            {uploadedImage && (
              <span className="text-gray-500 text-xs">({uploadedImage.file?.name})</span>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <span className={selectedModel ? "text-green-600" : "text-red-600"}>
              {selectedModel ? "✅" : "❌"}
            </span>
            <span>AI模型已选择</span>
            {selectedModel && (
              <span className="text-gray-500 text-xs">({selectedModel})</span>
            )}
          </div>
        </div>

        {/* 识别按钮 */}
        <button
          onClick={() => {
            console.log('🚀 识别按钮点击 - 准备识别');
            console.log('图片:', uploadedImage);
            console.log('模型:', selectedModel);
            onRecognize();
          }}
          disabled={!canRecognize}
          className={`
            w-full px-6 py-4 rounded-lg font-bold text-lg transition-all duration-200 flex items-center justify-center gap-3
            ${canRecognize
              ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600 shadow-lg hover:shadow-xl transform hover:scale-105'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }
          `}
          style={{ minHeight: '56px' }}
        >
          {isRecognizing ? (
            <>
              <Loader className="w-6 h-6 animate-spin" />
              <span>识别中，请稍候...</span>
            </>
          ) : canRecognize ? (
            <>
              <Play className="w-6 h-6" />
              <span>🚀 开始识别</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-6 h-6" />
              <span>请先上传图片并选择模型</span>
            </>
          )}
        </button>

        {/* 提示信息 */}
        {!uploadedImage && (
          <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-700">
              📁 请先在上方上传一张图片
            </p>
          </div>
        )}

        {uploadedImage && !selectedModel && (
          <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-sm text-orange-700">
              🤖 请先选择一个AI模型
            </p>
          </div>
        )}

        {canRecognize && (
          <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-700">
              ✅ 一切准备就绪，点击按钮开始识别！
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecognizeButton; 