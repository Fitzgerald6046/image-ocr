import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Star, 
  Download, 
  Trash2, 
  Eye, 
  Calendar,
  Tag,
  MoreHorizontal,
  ArrowLeft,
  RefreshCw,
  Layers
} from 'lucide-react';
import { HistoryManager, HistoryItem, HistoryFilter } from '../utils/historyManager';

interface HistoryViewProps {
  onBack: () => void;
  onViewResult: (item: HistoryItem) => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ onBack, onViewResult }) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<HistoryItem[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedModel, setSelectedModel] = useState('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  });

  // 加载历史记录
  useEffect(() => {
    loadHistory();
  }, []);

  // 应用过滤器
  useEffect(() => {
    applyFilters();
  }, [history, searchText, selectedType, selectedModel, showFavoritesOnly, dateRange]);

  const loadHistory = () => {
    const loadedHistory = HistoryManager.getHistory();
    setHistory(loadedHistory);
  };

  const applyFilters = () => {
    const filter: HistoryFilter = {
      searchText: searchText.trim() || undefined,
      recognitionType: selectedType !== 'all' ? selectedType : undefined,
      model: selectedModel !== 'all' ? selectedModel : undefined,
      onlyFavorites: showFavoritesOnly,
      dateRange: dateRange.start && dateRange.end ? {
        start: new Date(dateRange.start),
        end: new Date(dateRange.end)
      } : undefined
    };

    const filtered = HistoryManager.filterHistory(filter);
    setFilteredHistory(filtered);
  };

  const toggleFavorite = (id: string) => {
    HistoryManager.toggleFavorite(id);
    loadHistory();
  };

  const deleteItem = (id: string) => {
    if (confirm('确定要删除这条记录吗？')) {
      HistoryManager.deleteRecord(id);
      loadHistory();
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const deleteSelected = () => {
    if (selectedItems.size === 0) return;
    
    if (confirm(`确定要删除选中的 ${selectedItems.size} 条记录吗？`)) {
      HistoryManager.deleteRecords(Array.from(selectedItems));
      loadHistory();
      setSelectedItems(new Set());
    }
  };

  const clearAllHistory = () => {
    if (confirm('确定要清空所有历史记录吗？此操作无法撤销。')) {
      HistoryManager.clearHistory();
      loadHistory();
      setSelectedItems(new Set());
    }
  };

  const exportHistory = () => {
    const data = HistoryManager.exportHistory('json');
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `history_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleItemSelection = (id: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedItems(new Set(filteredHistory.map(item => item.id)));
  };

  const deselectAll = () => {
    setSelectedItems(new Set());
  };

  const getUniqueTypes = () => {
    const types = new Set(history.map(item => item.recognitionType));
    return Array.from(types);
  };

  const getUniqueModels = () => {
    const models = new Set(history.map(item => item.model));
    return Array.from(models);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString();
    } else if (diffDays === 1) {
      return '昨天 ' + date.toLocaleTimeString();
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const statistics = HistoryManager.getStatistics();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                返回
              </button>
              <div className="flex items-center gap-2">
                <History className="w-6 h-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">历史记录</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={loadHistory}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                title="刷新"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={exportHistory}
                className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Download className="w-4 h-4" />
                导出
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 侧边栏 - 统计和过滤 */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* 统计信息 */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">统计信息</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">总记录数</span>
                    <span className="font-medium">{statistics.totalRecords}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">最近一周</span>
                    <span className="font-medium">{statistics.recentRecords}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">收藏记录</span>
                    <span className="font-medium">{statistics.favoriteRecords}</span>
                  </div>
                </div>
              </div>

              {/* 过滤器 */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">过滤选项</h3>
                
                <div className="space-y-4">
                  {/* 识别类型 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      识别类型
                    </label>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">全部类型</option>
                      {getUniqueTypes().map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  {/* 模型 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      AI模型
                    </label>
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">全部模型</option>
                      {getUniqueModels().map(model => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                    </select>
                  </div>

                  {/* 日期范围 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      日期范围
                    </label>
                    <div className="space-y-2">
                      <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* 只显示收藏 */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="favorites-only"
                      checked={showFavoritesOnly}
                      onChange={(e) => setShowFavoritesOnly(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="favorites-only" className="ml-2 block text-sm text-gray-900">
                      只显示收藏
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 主内容区 */}
          <div className="lg:col-span-3">
            {/* 搜索和操作栏 */}
            <div className="bg-white rounded-lg p-4 border border-gray-200 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="搜索文件名或识别内容..."
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {selectedItems.size > 0 && (
                    <button
                      onClick={deleteSelected}
                      className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      删除选中 ({selectedItems.size})
                    </button>
                  )}
                  
                  <button
                    onClick={clearAllHistory}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    清空全部
                  </button>
                </div>
              </div>
              
              {/* 批量操作 */}
              {filteredHistory.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>找到 {filteredHistory.length} 条记录</span>
                  <button
                    onClick={selectAll}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    全选
                  </button>
                  <span>|</span>
                  <button
                    onClick={deselectAll}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    取消全选
                  </button>
                </div>
              )}
            </div>

            {/* 历史记录列表 */}
            <div className="space-y-4">
              {filteredHistory.length === 0 ? (
                <div className="bg-white rounded-lg p-12 border border-gray-200 text-center">
                  <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {history.length === 0 ? '暂无历史记录' : '没有找到符合条件的记录'}
                  </h3>
                  <p className="text-gray-500">
                    {history.length === 0 
                      ? '开始识别图片后，历史记录将显示在这里'
                      : '尝试调整搜索条件或过滤器'
                    }
                  </p>
                </div>
              ) : (
                filteredHistory.map((item) => {
                  const isBatchProcessing = item.tags?.includes('批量处理');
                  return (
                    <div
                      key={item.id}
                      className={`bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow ${
                        selectedItems.has(item.id) ? 'bg-blue-50 border-blue-300' : ''
                      } ${
                        isBatchProcessing ? 'border-l-4 border-l-purple-500' : ''
                      }`}
                    >
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => toggleItemSelection(item.id)}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {isBatchProcessing && (
                              <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                <Layers className="w-3 h-3" />
                                批量处理
                              </div>
                            )}
                            <h4 className="text-lg font-medium text-gray-900 truncate">
                              {item.fileName}
                            </h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleFavorite(item.id)}
                              className={`p-1 rounded transition-colors ${
                                item.isFavorite 
                                  ? 'text-yellow-500 hover:text-yellow-600' 
                                  : 'text-gray-400 hover:text-yellow-500'
                              }`}
                            >
                              <Star className={`w-4 h-4 ${item.isFavorite ? 'fill-current' : ''}`} />
                            </button>
                            <button
                              onClick={() => onViewResult(item)}
                              className="p-1 text-blue-500 hover:text-blue-700 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteItem(item.id)}
                              className="p-1 text-red-500 hover:text-red-700 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                          <div>
                            <span className="font-medium">时间:</span> {formatDate(item.timestamp)}
                          </div>
                          <div>
                            <span className="font-medium">类型:</span> {item.recognitionType}
                          </div>
                          <div>
                            <span className="font-medium">模型:</span> {item.model}
                          </div>
                          <div>
                            <span className="font-medium">置信度:</span> {Math.round(item.result.confidence * 100)}%
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded p-3 mb-3">
                          <p className="text-sm text-gray-700 line-clamp-3">
                            {item.result.content}
                          </p>
                        </div>
                        
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <Tag className="w-3 h-3 text-gray-400" />
                            {item.tags.map(tag => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryView;