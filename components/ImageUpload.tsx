import React, { useCallback, useState } from 'react';
import { Upload, Camera } from 'lucide-react';

interface ImageUploadProps {
  onImageUpload: (file: File) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageUpload }) => {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleFileSelect = (file: File) => {
    // 检查文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('请选择JPG、PNG、GIF或WebP格式的图片');
      return;
    }

    // 检查文件大小（10MB = 10 * 1024 * 1024 bytes）
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('图片大小不能超过10MB');
      return;
    }

    onImageUpload(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleClick = () => {
    const input = document.getElementById('image-upload-input') as HTMLInputElement;
    input.click();
  };

  return (
    <div className="w-full">
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
          ${dragOver 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-blue-200 hover:border-blue-300 hover:bg-blue-25'
          }
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <Camera className="w-8 h-8 text-gray-400" />
          </div>
          
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-700">
              点击上传图片或拖拽到此处
            </p>
            <p className="text-sm text-gray-500">
              支持 JPG、PNG、GIF、WebP 格式，最大 10MB
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Upload className="w-4 h-4" />
            <span>选择文件</span>
          </div>
        </div>
      </div>

      <input
        id="image-upload-input"
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
};

export default ImageUpload; 