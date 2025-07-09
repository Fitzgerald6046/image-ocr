import React, { useState } from 'react';
import { CheckCircle, Copy, Download, Loader, ChevronDown, ChevronUp, Star, ShoppingCart, Palette, Brain, AlertTriangle, TrendingUp } from 'lucide-react';

interface ClassificationResult {
  detectedType: string;
  confidence: number;
  reasoning: string;
  suggestedOptions: Array<{
    key: string;
    label: string;
    default: boolean;
  }>;
}

interface ReceiptAnalysis {
  success: boolean;
  analysis?: {
    extractedData: any;
    validation: any;
    categoryAnalysis: any;
    insights: Array<{
      type: string;
      title: string;
      content: string;
    }>;
    nutritionAnalysis: any;
    summary: any;
  };
  error?: string;
}

interface PromptAnalysis {
  success: boolean;
  prompts?: {
    midjourney: any;
    dalleE: any;
    stableDiffusion: any;
    general: any;
  };
  technicalParams?: any;
  visualElements?: any;
  styleAnalysis?: any;
  recommendations?: Array<{
    title: string;
    content: string;
  }>;
  error?: string;
}

interface IdCardAnalysis {
  success: boolean;
  analysis?: {
    cardType: string;
    extractedData: any;
    validation: any;
    securityAssessment: any;
    summary: any;
  };
  error?: string;
}

interface TableAnalysis {
  success: boolean;
  analysis?: {
    tableType: string;
    structure: any;
    dataTypes: any;
    qualityCheck: any;
    statistics: any;
    csvData: any;
    insights: Array<{
      type: string;
      title: string;
      content: string;
    }>;
    summary: any;
  };
  error?: string;
}

interface AncientTextAnalysis {
  success: boolean;
  analysis?: {
    dynasty: any;
    textType: any;
    annotations: any;
    modernTranslation: any;
    grammarAnalysis: any;
    literaryAnalysis: any;
    studyGuide: any;
    summary: any;
  };
  error?: string;
}

interface EnhancedRecognitionResultProps {
  result: {
    type: string;
    content: string;
    confidence: number;
    model: string;
    provider?: string;
    timestamp?: string;
    originalContent?: string;
    classification?: ClassificationResult;
    specialAnalysis?: ReceiptAnalysis | PromptAnalysis | IdCardAnalysis | TableAnalysis | AncientTextAnalysis;
  } | null;
  isRecognizing: boolean;
}

const EnhancedRecognitionResult: React.FC<EnhancedRecognitionResultProps> = ({
  result,
  isRecognizing
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['main']));
  const [activeTab, setActiveTab] = useState('content');

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const copyToClipboard = (text: string, label?: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label || '内容'}已复制到剪贴板`);
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'shopping': return <ShoppingCart className="w-4 h-4" />;
      case 'artwork': case 'prompt': return <Palette className="w-4 h-4" />;
      case 'id': return <span className="w-4 h-4 flex items-center justify-center text-xs">🆔</span>;
      case 'table': return <span className="w-4 h-4 flex items-center justify-center text-xs">📊</span>;
      case 'ancient': return <span className="w-4 h-4 flex items-center justify-center text-xs">📜</span>;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const renderClassificationInfo = () => {
    if (!result?.classification) return null;

    const { detectedType, confidence, reasoning } = result.classification;

    return (
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleSection('classification')}
        >
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-800">智能分类结果</h3>
          </div>
          {expandedSections.has('classification') ? 
            <ChevronUp className="w-5 h-5 text-blue-600" /> : 
            <ChevronDown className="w-5 h-5 text-blue-600" />
          }
        </div>

        {expandedSections.has('classification') && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-4">
              <span className="text-sm">
                检测类型：<span className="font-medium text-blue-700">{getTypeDisplayName(detectedType)}</span>
              </span>
              <span className="text-sm">
                置信度：<span className="font-medium text-blue-700">{confidence}%</span>
              </span>
            </div>
            <p className="text-sm text-blue-600">判断依据：{reasoning}</p>
          </div>
        )}
      </div>
    );
  };

  const renderReceiptAnalysis = () => {
    const analysis = result?.specialAnalysis as ReceiptAnalysis;
    if (!analysis || !analysis.success) return null;

    const { summary } = analysis.analysis!;

    return (
      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleSection('receipt')}
        >
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-green-800">购物小票智能分析</h3>
          </div>
          {expandedSections.has('receipt') ? 
            <ChevronUp className="w-5 h-5 text-green-600" /> : 
            <ChevronDown className="w-5 h-5 text-green-600" />
          }
        </div>

        {expandedSections.has('receipt') && (
          <div className="mt-4 space-y-4">
            {/* 快速摘要 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-white rounded border">
                <div className="text-lg font-bold text-green-600">{summary.totalItems}</div>
                <div className="text-xs text-gray-600">商品数量</div>
              </div>
              <div className="text-center p-3 bg-white rounded border">
                <div className="text-lg font-bold text-green-600">¥{summary.totalAmount}</div>
                <div className="text-xs text-gray-600">总金额</div>
              </div>
              <div className="text-center p-3 bg-white rounded border">
                <div className="text-lg font-bold text-green-600">{summary.validationStatus}</div>
                <div className="text-xs text-gray-600">校验状态</div>
              </div>
              <div className="text-center p-3 bg-white rounded border">
                <div className="text-lg font-bold text-green-600">{summary.healthScore}分</div>
                <div className="text-xs text-gray-600">健康评分</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPromptAnalysis = () => {
    const analysis = result?.specialAnalysis as PromptAnalysis;
    if (!analysis || !analysis.success) return null;

    const { prompts, styleAnalysis } = analysis;

    return (
      <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleSection('prompt')}
        >
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-purple-800">AI绘图Prompt生成</h3>
          </div>
          {expandedSections.has('prompt') ? 
            <ChevronUp className="w-5 h-5 text-purple-600" /> : 
            <ChevronDown className="w-5 h-5 text-purple-600" />
          }
        </div>

        {expandedSections.has('prompt') && (
          <div className="mt-4 space-y-4">
            {/* 风格分析 */}
            <div className="bg-white rounded p-3 border">
              <h4 className="font-medium text-gray-800 mb-2">风格分析</h4>
              <div className="flex items-center gap-4 text-sm">
                <span>主要风格：<span className="font-medium text-purple-600">{styleAnalysis?.dominantStyle}</span></span>
                <span>置信度：<span className="font-medium text-purple-600">{styleAnalysis?.confidence}</span></span>
              </div>
            </div>

            {/* Midjourney Prompt */}
            {prompts?.midjourney && (
              <div className="bg-white rounded p-4 border">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700">Midjourney Prompt</label>
                  <button
                    onClick={() => copyToClipboard(prompts.midjourney.full || prompts.midjourney.main, 'Midjourney Prompt')}
                    className="text-xs px-2 py-1 bg-purple-100 text-purple-600 rounded hover:bg-purple-200"
                  >
                    复制
                  </button>
                </div>
                <div className="bg-gray-50 p-3 rounded text-sm font-mono">
                  {prompts.midjourney.full || prompts.midjourney.main}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderIdCardAnalysis = () => {
    const analysis = result?.specialAnalysis as IdCardAnalysis;
    if (!analysis || !analysis.success) return null;

    const { summary, securityAssessment } = analysis.analysis!;

    return (
      <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleSection('idcard')}
        >
          <div className="flex items-center gap-2">
            <span className="text-orange-600 text-lg">🆔</span>
            <h3 className="font-semibold text-orange-800">证件识别与验证</h3>
          </div>
          {expandedSections.has('idcard') ? 
            <ChevronUp className="w-5 h-5 text-orange-600" /> : 
            <ChevronDown className="w-5 h-5 text-orange-600" />
          }
        </div>

        {expandedSections.has('idcard') && (
          <div className="mt-4 space-y-4">
            {/* 基础信息 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-white rounded border">
                <div className="text-lg font-bold text-orange-600">{summary?.cardTypeName}</div>
                <div className="text-xs text-gray-600">证件类型</div>
              </div>
              <div className="text-center p-3 bg-white rounded border">
                <div className="text-lg font-bold text-orange-600">{summary?.isValid ? '✅' : '❌'}</div>
                <div className="text-xs text-gray-600">验证状态</div>
              </div>
              <div className="text-center p-3 bg-white rounded border">
                <div className="text-lg font-bold text-orange-600">{securityAssessment?.riskLevel}</div>
                <div className="text-xs text-gray-600">风险等级</div>
              </div>
              <div className="text-center p-3 bg-white rounded border">
                <div className="text-lg font-bold text-orange-600">{summary?.extractedFields}</div>
                <div className="text-xs text-gray-600">提取字段</div>
              </div>
            </div>

            {/* 安全建议 */}
            {securityAssessment?.recommendations && (
              <div className="bg-white rounded p-3 border">
                <h4 className="font-medium text-gray-800 mb-2">安全建议</h4>
                <ul className="text-sm space-y-1">
                  {securityAssessment.recommendations.map((rec: string, idx: number) => (
                    <li key={idx} className="text-orange-600">• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderTableAnalysis = () => {
    const analysis = result?.specialAnalysis as TableAnalysis;
    if (!analysis || !analysis.success) return null;

    const { summary, structure, qualityCheck, csvData } = analysis.analysis!;

    const downloadCSV = () => {
      if (csvData) {
        // 添加UTF-8 BOM头以确保Excel正确识别中文字符
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvData.content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = csvData.filename || `表格数据_${new Date().toLocaleDateString()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (result?.content) {
        // 如果没有csvData，尝试将原始内容转换为CSV
        const lines = result.content.split('\n').filter(line => line.trim());
        const csvContent = lines.map(line => {
          const separators = ['\t', '|', '  ', ' '];
          for (const sep of separators) {
            if (line.includes(sep)) {
              return line.split(sep).map(cell => `"${cell.trim()}"`).join(',');
            }
          }
          return `"${line.trim()}"`;
        }).join('\n');
        
        // 添加UTF-8 BOM头以确保Excel正确识别中文字符
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `表格数据_${new Date().toLocaleDateString()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    };

    const downloadJSON = () => {
      if (analysis.analysis) {
        const jsonData = JSON.stringify(analysis.analysis, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `表格分析_${new Date().toLocaleDateString()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    };

    return (
      <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleSection('table')}
        >
          <div className="flex items-center gap-2">
            <span className="text-indigo-600 text-lg">📊</span>
            <h3 className="font-semibold text-indigo-800">表格数据分析</h3>
          </div>
          {expandedSections.has('table') ? 
            <ChevronUp className="w-5 h-5 text-indigo-600" /> : 
            <ChevronDown className="w-5 h-5 text-indigo-600" />
          }
        </div>

        {expandedSections.has('table') && (
          <div className="mt-4 space-y-4">
            {/* CSV导出区域 - 始终显示 */}
            <div className="bg-white rounded-lg p-4 border-2 border-green-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-green-600 text-lg">📁</span>
                  <h4 className="font-medium text-gray-800">数据导出</h4>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={downloadCSV}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 font-medium transition-all"
                  >
                    <Download className="w-4 h-4" />
                    下载 CSV
                  </button>
                  {analysis.analysis && (
                    <button
                      onClick={downloadJSON}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm transition-all"
                    >
                      <Download className="w-4 h-4" />
                      JSON
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">文件名：</span>
                  <span className="font-medium">
                    {csvData?.filename || `表格数据_${new Date().toLocaleDateString()}.csv`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">大小：</span>
                  <span className="font-medium">
                    {csvData ? `${(csvData.size / 1024).toFixed(1)} KB` : '估算中...'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">行数：</span>
                  <span className="font-medium">
                    {csvData?.rows || structure?.rows || result?.content.split('\n').length || 0} 行
                  </span>
                </div>
              </div>
            </div>

            {/* 表格信息 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-white rounded border">
                <div className="text-lg font-bold text-indigo-600">{structure?.rows || 0}</div>
                <div className="text-xs text-gray-600">数据行数</div>
              </div>
              <div className="text-center p-3 bg-white rounded border">
                <div className="text-lg font-bold text-indigo-600">{structure?.columns || 0}</div>
                <div className="text-xs text-gray-600">列数</div>
              </div>
              <div className="text-center p-3 bg-white rounded border">
                <div className="text-lg font-bold text-indigo-600">{qualityCheck?.overallScore || 0}%</div>
                <div className="text-xs text-gray-600">数据质量</div>
              </div>
              <div className="text-center p-3 bg-white rounded border">
                <div className="text-lg font-bold text-indigo-600">{summary?.hasNumericData ? '✅' : '❌'}</div>
                <div className="text-xs text-gray-600">数值数据</div>
              </div>
            </div>

            {/* 表格预览 */}
            {csvData && csvData.preview && (
              <div className="bg-white rounded p-4 border">
                <h4 className="font-medium text-gray-800 mb-3">数据预览</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        {csvData.preview.headers?.map((header: string, idx: number) => (
                          <th key={idx} className="border border-gray-300 px-2 py-1 text-left font-medium">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.preview.rows?.slice(0, 5).map((row: string[], idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          {row.map((cell: string, cellIdx: number) => (
                            <td key={cellIdx} className="border border-gray-300 px-2 py-1 text-gray-800">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {csvData.preview.rows?.length > 5 && (
                    <p className="text-xs text-gray-500 mt-2">
                      仅显示前5行，共 {csvData.rows} 行数据
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 如果没有预览数据，显示原始内容的简化表格视图 */}
            {!csvData?.preview && result?.content && (
              <div className="bg-white rounded p-4 border">
                <h4 className="font-medium text-gray-800 mb-3">识别内容预览</h4>
                <div className="bg-gray-50 p-3 rounded border max-h-64 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-gray-800 font-mono text-xs leading-relaxed">
                    {result.content.split('\n').slice(0, 10).join('\n')}
                    {result.content.split('\n').length > 10 && '\n... (更多内容)'}
                  </pre>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  显示识别的原始内容，点击"下载 CSV"可导出为表格格式
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderAncientTextAnalysis = () => {
    const analysis = result?.specialAnalysis as AncientTextAnalysis;
    if (!analysis || !analysis.success) return null;

    const { summary, modernTranslation, studyGuide } = analysis.analysis!;

    return (
      <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleSection('ancient')}
        >
          <div className="flex items-center gap-2">
            <span className="text-amber-600 text-lg">📜</span>
            <h3 className="font-semibold text-amber-800">古籍文献处理</h3>
          </div>
          {expandedSections.has('ancient') ? 
            <ChevronUp className="w-5 h-5 text-amber-600" /> : 
            <ChevronDown className="w-5 h-5 text-amber-600" />
          }
        </div>

        {expandedSections.has('ancient') && (
          <div className="mt-4 space-y-4">
            {/* 基础信息 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-white rounded border">
                <div className="text-lg font-bold text-amber-600">{summary?.period}</div>
                <div className="text-xs text-gray-600">时期</div>
              </div>
              <div className="text-center p-3 bg-white rounded border">
                <div className="text-lg font-bold text-amber-600">{summary?.genre}</div>
                <div className="text-xs text-gray-600">文体</div>
              </div>
              <div className="text-center p-3 bg-white rounded border">
                <div className="text-lg font-bold text-amber-600">{summary?.difficulty}</div>
                <div className="text-xs text-gray-600">难度</div>
              </div>
              <div className="text-center p-3 bg-white rounded border">
                <div className="text-lg font-bold text-amber-600">{summary?.recommendedLevel}</div>
                <div className="text-xs text-gray-600">建议水平</div>
              </div>
            </div>

            {/* 现代翻译 */}
            {modernTranslation && (
              <div className="bg-white rounded p-4 border">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700">现代翻译（置信度：{modernTranslation.overallConfidence}%）</label>
                  <button
                    onClick={() => copyToClipboard(modernTranslation.fullTranslation, '现代翻译')}
                    className="text-xs px-2 py-1 bg-amber-100 text-amber-600 rounded hover:bg-amber-200"
                  >
                    复制翻译
                  </button>
                </div>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  {modernTranslation.fullTranslation}
                </div>
              </div>
            )}

            {/* 学习建议 */}
            {studyGuide?.studyPlan && (
              <div className="bg-white rounded p-3 border">
                <h4 className="font-medium text-gray-800 mb-2">学习建议</h4>
                <ul className="text-sm space-y-1">
                  {studyGuide.studyPlan.map((plan: string, idx: number) => (
                    <li key={idx} className="text-amber-600">• {plan}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-blue-100">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-green-100 rounded flex items-center justify-center">
            <span className="text-green-600 text-xs">🧠</span>
          </div>
          <h2 className="text-lg font-semibold text-gray-800">智能识别结果</h2>
        </div>
      </div>

      <div className="p-6">
        {isRecognizing ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">AI正在智能分析图片内容，请稍候...</p>
            </div>
          </div>
        ) : result ? (
          <div className="space-y-6">
            {/* 基础识别信息 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    {getTypeIcon(result.type)}
                    识别类型：<span className="font-medium">{getTypeDisplayName(result.type)}</span>
                  </span>
                  <span>置信度：<span className="font-medium text-green-600">{(result.confidence * 100).toFixed(1)}%</span></span>
                  <span>使用模型：<span className="font-medium">{result.model}</span></span>
                  {result.provider && <span>提供商：<span className="font-medium">{result.provider}</span></span>}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(result.content)}
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

              {/* 基础识别内容 */}
              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-medium text-gray-700">识别内容</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyToClipboard(result.content, '识别内容')}
                      className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      复制文本
                    </button>
                  </div>
                </div>
                
                {/* 改进的文本显示区域 */}
                <div className="bg-gray-50 p-4 rounded border max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-gray-800 font-sans text-sm leading-relaxed break-words overflow-wrap-anywhere">
                    {result.content}
                  </pre>
                </div>
              </div>
            </div>

            {/* 智能分类信息 */}
            {renderClassificationInfo()}

            {/* 特殊分析结果 */}
            {result.specialAnalysis && (() => {
              const analysis = result.specialAnalysis as any;
              
              console.log('🔍 检查特殊分析结果:', {
                hasSpecialAnalysis: !!analysis,
                analysisKeys: analysis ? Object.keys(analysis) : [],
                analysisStructure: analysis,
                recognitionType: result.type
              });
              
              // 购物小票分析 (检查是否有购物小票特有字段)
              if (analysis.analysis?.extractedData?.items || analysis.analysis?.categoryAnalysis) {
                console.log('✅ 显示购物小票分析');
                return renderReceiptAnalysis();
              }
              
              // AI绘图Prompt分析
              if (analysis.prompts) {
                console.log('✅ 显示AI绘图Prompt分析');
                return renderPromptAnalysis();
              }
              
              // 证件识别分析 (检查是否有证件特有字段)
              if (analysis.analysis?.cardType) {
                console.log('✅ 显示证件识别分析');
                return renderIdCardAnalysis();
              }
              
              // 表格数据分析 (检查是否有表格特有字段)
              if (analysis.analysis?.tableType || analysis.analysis?.csvData || analysis.analysis?.structure) {
                console.log('✅ 显示表格数据分析');
                return renderTableAnalysis();
              }
              
              // 古籍文献分析 (检查是否有古籍特有字段)
              if (analysis.analysis?.dynasty || analysis.analysis?.modernTranslation) {
                console.log('✅ 显示古籍文献分析');
                return renderAncientTextAnalysis();
              }
              
              console.log('❌ 未匹配到任何特殊分析类型');
              return null;
            })()}



            {/* 如果是表格识别但没有特殊分析，显示手动CSV导出 */}
            {result.type === 'table' && !result.specialAnalysis && (
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-yellow-600 text-lg">📊</span>
                  <h3 className="font-semibold text-yellow-800">表格识别结果</h3>
                </div>
                <p className="text-sm text-yellow-700 mb-3">
                  已识别为表格内容，但未进行深度分析。您可以手动导出识别的文本内容：
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const blob = new Blob([result.content], { type: 'text/plain;charset=utf-8;' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `表格识别结果_${new Date().toLocaleDateString()}.txt`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                    className="px-4 py-2 bg-yellow-600 text-yellow-50 rounded-lg hover:bg-yellow-700 flex items-center gap-2 font-medium transition-all"
                  >
                    <Download className="w-4 h-4" />
                    下载文本
                  </button>
                  <button
                    onClick={() => {
                      // 尝试将识别内容转换为简单CSV格式
                      const lines = result.content.split('\n').filter(line => line.trim());
                      const csvContent = lines.map(line => {
                        // 尝试检测分隔符并转换为CSV
                        const separators = ['\t', '|', '  ', ' '];
                        for (const sep of separators) {
                          if (line.includes(sep)) {
                            return line.split(sep).map(cell => `"${cell.trim()}"`).join(',');
                          }
                        }
                        return `"${line.trim()}"`;
                      }).join('\n');
                      
                      // 添加UTF-8 BOM头以确保Excel正确识别中文字符
                      const BOM = '\uFEFF';
                      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `表格数据_${new Date().toLocaleDateString()}.csv`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                    className="px-4 py-2 bg-green-600 text-green-50 rounded-lg hover:bg-green-700 flex items-center gap-2 font-medium transition-all"
                  >
                    <Download className="w-4 h-4" />
                    导出CSV
                  </button>
                </div>
              </div>
            )}

            {/* 成功指示 */}
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">智能识别完成</span>
              {result.timestamp && (
                <span className="text-xs text-gray-500 ml-2">
                  {new Date(result.timestamp).toLocaleString()}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">🧠</div>
            <p className="text-lg">智能识别结果将显示在此处</p>
            <p className="text-sm mt-2">上传图片并选择AI模型后开始智能识别</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedRecognitionResult;
