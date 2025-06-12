import React, { useState } from 'react';
import { Play, Loader, ZoomIn, ZoomOut, RotateCw, X } from 'lucide-react';

interface UploadedImageInfo {
  file: File;
  fileId: string;
  url: string;
  metadata: any;
}

interface SimpleImagePreviewProps {
  image: UploadedImageInfo | null;
  onRecognize: () => void;
  isRecognizing: boolean;
  selectedModel: string;
}

const SimpleImagePreview: React.FC<SimpleImagePreviewProps> = ({ 
  image, 
  onRecognize, 
  isRecognizing, 
  selectedModel 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!image) {
    return (
      <div className="w-full h-96 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium">等待图片上传</p>
          <p className="text-sm mt-2">请先上传要识别的图片</p>
        </div>
      </div>
    );
  }

  const openModal = () => {
    setIsModalOpen(true);
    setZoom(1);
    setRotation(0);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.5, 5));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.5, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  return (
    <>
      <div className="w-full space-y-4">
        {/* 图片预览 */}
        <div className="relative group">
          <img
            src={image.url}
            alt="预览图片"
            className="w-full h-64 object-contain bg-gray-50 rounded-lg border border-gray-200 cursor-pointer transition-all hover:shadow-lg"
            onClick={openModal}
          />
          {/* 放大提示 */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="bg-white rounded-full p-2 shadow-lg">
              <ZoomIn className="w-6 h-6 text-gray-600" />
            </div>
          </div>
          {/* 图片信息 */}
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
            {image.file.name} • {(image.file.size / 1024 / 1024).toFixed(1)} MB
          </div>
        </div>

        {/* 识别按钮 */}
        <button
          onClick={onRecognize}
          disabled={!selectedModel || isRecognizing}
          className={`w-full px-6 py-3 rounded-lg font-medium transition-all ${
            !selectedModel 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : isRecognizing
                ? 'bg-blue-100 text-blue-600 cursor-wait'
                : 'bg-blue-600 text-white hover:bg-blue-700 active:transform active:scale-95'
          }`}
        >
          {isRecognizing ? (
            <div className="flex items-center justify-center gap-2">
              <Loader className="w-5 h-5 animate-spin" />
              <span>识别中...</span>
            </div>
          ) : !selectedModel ? (
            <span>请先选择AI模型</span>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Play className="w-5 h-5" />
              <span>开始识别</span>
            </div>
          )}
        </button>
      </div>

      {/* 图片放大模态框 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-full max-h-full">
            {/* 工具栏 */}
            <div className="absolute top-4 right-4 z-10 flex gap-2">
              <button
                onClick={handleZoomOut}
                className="bg-white bg-opacity-90 p-2 rounded-full hover:bg-opacity-100 transition-all"
                title="缩小"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <button
                onClick={handleZoomIn}
                className="bg-white bg-opacity-90 p-2 rounded-full hover:bg-opacity-100 transition-all"
                title="放大"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <button
                onClick={handleRotate}
                className="bg-white bg-opacity-90 p-2 rounded-full hover:bg-opacity-100 transition-all"
                title="旋转"
              >
                <RotateCw className="w-5 h-5" />
              </button>
              <button
                onClick={closeModal}
                className="bg-white bg-opacity-90 p-2 rounded-full hover:bg-opacity-100 transition-all"
                title="关闭"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 缩放信息 */}
            <div className="absolute top-4 left-4 z-10 bg-white bg-opacity-90 px-3 py-1 rounded-full text-sm">
              {Math.round(zoom * 100)}%
            </div>

            {/* 放大的图片 */}
            <img
              src={image.url}
              alt="预览图片"
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                maxWidth: '90vw',
                maxHeight: '90vh'
              }}
            />
          </div>

          {/* 点击背景关闭 */}
          <div 
            className="absolute inset-0 -z-10" 
            onClick={closeModal}
          />
        </div>
      )}
    </>
  );
};

export default SimpleImagePreview; 