import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCw, X } from 'lucide-react';
import { UploadedImageInfo } from '../../contexts/AppContext';

interface ImagePreviewWithZoomProps {
  uploadedImage: UploadedImageInfo | null;
}

const ImagePreviewWithZoom: React.FC<ImagePreviewWithZoomProps> = ({ uploadedImage }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!uploadedImage) {
    return (
      <div className="w-full h-96 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📷</span>
          </div>
          <p className="text-lg">请选择图片进行识别</p>
          <p className="text-sm mt-2">图片上传后将在此处显示</p>
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
      <div className="space-y-4">
        {/* 可点击放大的图片预览 */}
        <div className="relative group cursor-pointer" onClick={openModal}>
          <img
            src={uploadedImage.url}
            alt="预览图片"
            className="w-full h-96 object-contain bg-gray-50 rounded-lg border border-gray-200 transition-all hover:shadow-lg"
          />
          {/* 放大提示 */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
            <div className="bg-white rounded-full p-2 shadow-lg">
              <ZoomIn className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>

        {/* 图片信息 */}
        <div className="text-sm text-gray-600 space-y-1">
          <p><span className="font-medium">文件名：</span>{uploadedImage.file.name}</p>
          <p><span className="font-medium">大小：</span>{(uploadedImage.file.size / 1024 / 1024).toFixed(2)} MB</p>
          <p><span className="font-medium">类型：</span>{uploadedImage.file.type}</p>
          {uploadedImage.metadata && (
            <p><span className="font-medium">尺寸：</span>{uploadedImage.metadata.width} × {uploadedImage.metadata.height}</p>
          )}
        </div>
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
              src={uploadedImage.url}
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

export default ImagePreviewWithZoom;