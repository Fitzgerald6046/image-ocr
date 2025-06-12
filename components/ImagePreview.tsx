import React, { useState } from 'react';
import { Camera, Play, Loader, ZoomIn, X } from 'lucide-react';

interface UploadedImageInfo {
  file: File;
  fileId: string;
  url: string;
  metadata: any;
}

interface ImagePreviewProps {
  image: UploadedImageInfo | null;
  onRecognize: () => void;
  isRecognizing: boolean;
  selectedModel: string;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ 
  image, 
  onRecognize, 
  isRecognizing, 
  selectedModel 
}) => {
  const imageUrl = image ? image.url : null;
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  if (!image) {
    return (
      <div className="w-full h-96 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-500">
          <Camera className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg">请选择图片进行识别</p>
          <p className="text-sm mt-2">支持单张或批量上传</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* 图片显示区域 */}
      <div className="relative group">
        <img
          src={imageUrl!}
          alt="预览图片"
          className="w-full h-96 object-contain bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:border-blue-300 transition-colors"
          onClick={() => setIsImageModalOpen(true)}
        />
        {/* 放大图标 */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-black bg-opacity-70 text-white p-2 rounded-lg flex items-center gap-1 text-sm">
            <ZoomIn className="w-4 h-4" />
            <span>点击放大</span>
          </div>
        </div>
        {isRecognizing && (
          <div className="absolute inset-0 bg-black bg-opacity-30 rounded-lg flex items-center justify-center">
            <div className="bg-white rounded-lg p-4 flex items-center gap-3">
              <Loader className="w-5 h-5 animate-spin text-blue-600" />
              <span className="text-gray-700">正在识别中...</span>
            </div>
          </div>
        )}
      </div>

      {/* 图片放大模态框 */}
      {isImageModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div className="relative max-w-full max-h-full">
            <img
              src={imageUrl!}
              alt="放大预览"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setIsImageModalOpen(false)}
              className="absolute top-4 right-4 bg-white bg-opacity-90 text-gray-800 p-2 rounded-full hover:bg-opacity-100 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* 图片信息 */}
      <div className="text-sm text-gray-600 space-y-1">
        <p><span className="font-medium">文件名：</span>{image.file.name}</p>
        <p><span className="font-medium">大小：</span>{(image.file.size / 1024 / 1024).toFixed(2)} MB</p>
        <p><span className="font-medium">类型：</span>{image.file.type}</p>
        {image.metadata && (
          <p><span className="font-medium">尺寸：</span>{image.metadata.width} × {image.metadata.height}</p>
        )}
      </div>

      {/* 识别按钮 */}
      <div className="space-y-2">
        {/* 调试信息 */}
        <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
          调试: isRecognizing={isRecognizing ? 'true' : 'false'}, selectedModel="{selectedModel}", 
          按钮应启用: {(!isRecognizing && selectedModel) ? 'true' : 'false'}
        </div>
        
        <button
          onClick={onRecognize}
          disabled={isRecognizing || !selectedModel}
          className={`
            w-full px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2
            ${isRecognizing || !selectedModel
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed border-2 border-gray-400'
              : 'bg-orange-500 text-white hover:bg-orange-600 shadow-sm hover:shadow-md border-2 border-orange-600'
            }
          `}
          style={{
            minHeight: '48px',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {isRecognizing ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              识别中...
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              {selectedModel ? '🚀 开始识别' : '⚠️ 请先选择AI模型'}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ImagePreview; 