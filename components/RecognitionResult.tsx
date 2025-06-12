import React from 'react';
import { CheckCircle, Copy, Download, Loader } from 'lucide-react';

interface RecognitionResultProps {
  result: {
    type: string;
    content: string;
    confidence: number;
    model: string;
  } | null;
  isRecognizing: boolean;
}

const RecognitionResult: React.FC<RecognitionResultProps> = ({
  result,
  isRecognizing
}) => {
  const copyToClipboard = () => {
    if (result?.content) {
      navigator.clipboard.writeText(result.content);
      alert('已复制到剪贴板');
    }
  };

  const downloadResult = () => {
    if (result?.content) {
      const blob = new Blob([result.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `识别结果_${new Date().toLocaleString()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const getTypeDisplayName = (type: string) => {
    const typeMap: Record<string, string> = {
      'auto': '智能识别',
      'ancient': '古籍文献识别',
      'receipt': '票据类识别',
      'document': '文档识别',
      'poetry': '诗歌文学识别',
      'shopping': '购物小票识别',
      'artwork': '艺术图画分析',
      'id': '证件识别',
      'table': '表格图表识别',
      'handwriting': '手写内容识别',
      'prompt': 'AI绘图Prompt生成',
      'translate': '多语言翻译识别'
    };
    return typeMap[type] || type;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-blue-100">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-green-100 rounded flex items-center justify-center">
            <span className="text-green-600 text-xs">📋</span>
          </div>
          <h2 className="text-lg font-semibold text-gray-800">识别结果</h2>
        </div>
      </div>

      <div className="p-6">
        {isRecognizing ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">AI正在分析图片内容，请稍候...</p>
            </div>
          </div>
        ) : result ? (
          <div className="space-y-4">
            {/* 识别信息 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>识别类型：<span className="font-medium">{getTypeDisplayName(result.type)}</span></span>
                <span>置信度：<span className="font-medium text-green-600">{(result.confidence * 100).toFixed(1)}%</span></span>
                <span>使用模型：<span className="font-medium">{result.model}</span></span>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={copyToClipboard}
                  className="px-3 py-1 text-sm border border-blue-200 text-blue-600 rounded hover:bg-blue-50 flex items-center gap-1"
                >
                  <Copy className="w-4 h-4" />
                  复制
                </button>
                <button
                  onClick={downloadResult}
                  className="px-3 py-1 text-sm border border-green-200 text-green-600 rounded hover:bg-green-50 flex items-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  下载
                </button>
              </div>
            </div>

            {/* 识别内容 */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <pre className="whitespace-pre-wrap text-gray-800 font-sans">
                {result.content}
              </pre>
            </div>

            {/* 成功指示 */}
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">识别完成</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">📝</div>
            <p className="text-lg">识别结果将显示在此处</p>
            <p className="text-sm mt-2">上传图片并选择AI模型后开始识别</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecognitionResult; 