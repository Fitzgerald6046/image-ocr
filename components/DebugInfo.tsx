import React from 'react';

interface DebugInfoProps {
  uploadedImage: any;
  selectedModel: string;
  isRecognizing: boolean;
}

const DebugInfo: React.FC<DebugInfoProps> = ({ uploadedImage, selectedModel, isRecognizing }) => {
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-sm max-w-md">
      <h3 className="font-bold mb-2">调试信息</h3>
      <div className="space-y-1">
        <p><strong>图片已上传:</strong> {uploadedImage ? '✅ 是' : '❌ 否'}</p>
        {uploadedImage && (
          <>
            <p><strong>文件ID:</strong> {uploadedImage.fileId}</p>
            <p><strong>文件名:</strong> {uploadedImage.file?.name}</p>
          </>
        )}
        <p><strong>选择的模型:</strong> {selectedModel || '❌ 未选择'}</p>
        <p><strong>正在识别:</strong> {isRecognizing ? '✅ 是' : '❌ 否'}</p>
        <p><strong>识别按钮应显示:</strong> {uploadedImage && selectedModel ? '✅ 是' : '❌ 否'}</p>
      </div>
    </div>
  );
};

export default DebugInfo; 