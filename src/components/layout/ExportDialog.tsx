import React, { useState } from 'react';
import { X, Download, FileText, FileCode, Table, Hash, FileImage, Eye } from 'lucide-react';
import { ExportUtils, ExportItem, ExportOptions } from '../../utils/exportUtils';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  items: ExportItem[];
  title?: string;
}

const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  items,
  title = '导出识别结果'
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportOptions['format']>('txt');
  const [includeMetadata, setIncludeMetadata] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [preview, setPreview] = useState('');

  const formatOptions = [
    {
      value: 'txt' as const,
      label: '纯文本 (.txt)',
      icon: FileText,
      description: '简单的文本格式，易于阅读'
    },
    {
      value: 'json' as const,
      label: 'JSON (.json)',
      icon: FileCode,
      description: '结构化数据格式，包含完整信息'
    },
    {
      value: 'csv' as const,
      label: 'CSV (.csv)',
      icon: Table,
      description: 'Excel兼容格式，适合数据分析'
    },
    {
      value: 'markdown' as const,
      label: 'Markdown (.md)',
      icon: Hash,
      description: '文档格式，支持富文本显示'
    },
    {
      value: 'pdf' as const,
      label: 'PDF (.pdf)',
      icon: FileImage,
      description: '便携式文档格式（暂用HTML代替）'
    }
  ];

  const handleExport = async () => {
    if (items.length === 0) {
      alert('没有可导出的数据');
      return;
    }

    const validation = ExportUtils.validateExportData(items);
    if (!validation.isValid) {
      alert('导出数据验证失败：\n' + validation.errors.join('\n'));
      return;
    }

    setIsExporting(true);
    try {
      const options: ExportOptions = {
        format: selectedFormat,
        includeMetadata
      };

      await ExportUtils.exportItems(items, options);
      alert('导出成功！');
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      alert('导出失败：' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setIsExporting(false);
    }
  };

  const handlePreview = () => {
    try {
      const previewContent = ExportUtils.createPreview(items, selectedFormat);
      setPreview(previewContent);
      setShowPreview(true);
    } catch (error) {
      console.error('Preview failed:', error);
      alert('预览失败：' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  const handleBatchExport = async () => {
    if (items.length === 0) {
      alert('没有可导出的数据');
      return;
    }

    const selectedFormats = formatOptions.map(format => ({
      format: format.value,
      includeMetadata
    }));

    setIsExporting(true);
    try {
      await ExportUtils.batchExport(items, selectedFormats);
      alert('批量导出成功！');
      onClose();
    } catch (error) {
      console.error('Batch export failed:', error);
      alert('批量导出失败：' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex h-full max-h-[calc(90vh-80px)]">
          {/* 左侧：导出选项 */}
          <div className="w-1/2 p-6 border-r border-gray-200 overflow-y-auto">
            <div className="space-y-6">
              {/* 数据概览 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">数据概览</h3>
                <div className="text-sm text-gray-600">
                  <p>文件数量: {items.length}</p>
                  <p>总字符数: {items.reduce((sum, item) => sum + item.content.length, 0).toLocaleString()}</p>
                </div>
              </div>

              {/* 格式选择 */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">选择导出格式</h3>
                <div className="space-y-2">
                  {formatOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <label
                        key={option.value}
                        className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedFormat === option.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="format"
                          value={option.value}
                          checked={selectedFormat === option.value}
                          onChange={(e) => setSelectedFormat(e.target.value as ExportOptions['format'])}
                          className="sr-only"
                        />
                        <Icon className="w-5 h-5 text-gray-400 mr-3" />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{option.label}</div>
                          <div className="text-sm text-gray-500">{option.description}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 导出选项 */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">导出选项</h3>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={includeMetadata}
                      onChange={(e) => setIncludeMetadata(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">包含元数据信息</span>
                  </label>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex flex-col gap-3 pt-4">
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Download className="w-4 h-4" />
                  {isExporting ? '导出中...' : '导出选定格式'}
                </button>
                
                <button
                  onClick={handlePreview}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  预览
                </button>
                
                <button
                  onClick={handleBatchExport}
                  disabled={isExporting}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Download className="w-4 h-4" />
                  {isExporting ? '导出中...' : '导出所有格式'}
                </button>
                
                <button
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors mt-2"
                >
                  <X className="w-4 h-4" />
                  取消
                </button>
              </div>
            </div>
          </div>

          {/* 右侧：预览区域 */}
          <div className="w-1/2 flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">导出预览</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {showPreview ? `${selectedFormat.toUpperCase()} 格式预览` : '点击预览按钮查看导出格式'}
                  </p>
                </div>
                {showPreview && (
                  <button
                    onClick={() => setShowPreview(false)}
                    className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                  >
                    取消预览
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {showPreview ? (
                <div className="bg-gray-50 rounded-lg p-4 min-h-full">
                  <div className="max-h-full overflow-y-auto">
                    <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono break-words">
                      {preview}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <Eye className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>点击预览按钮查看导出内容</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportDialog;