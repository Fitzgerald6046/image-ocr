/**
 * 历史记录管理工具
 * 负责保存、检索和管理识别历史记录
 */

export interface HistoryItem {
  id: string;
  timestamp: number;
  fileName: string;
  fileSize: number;
  fileType: string;
  recognitionType: string;
  model: string;
  provider: string;
  result: {
    content: string;
    confidence: number;
    originalContent?: string;
    classification?: any;
    specialAnalysis?: any;
  };
  previewUrl?: string;
  tags?: string[];
  isFavorite?: boolean;
}

export interface HistoryFilter {
  dateRange?: {
    start: Date;
    end: Date;
  };
  recognitionType?: string;
  model?: string;
  provider?: string;
  searchText?: string;
  onlyFavorites?: boolean;
}

export class HistoryManager {
  private static readonly STORAGE_KEY = 'ocr_history';
  private static readonly MAX_HISTORY_SIZE = 1000;

  /**
   * 保存识别记录
   */
  static saveRecord(record: Omit<HistoryItem, 'id' | 'timestamp'>): HistoryItem {
    const historyItem: HistoryItem = {
      id: this.generateId(),
      timestamp: Date.now(),
      ...record
    };

    const history = this.getHistory();
    history.unshift(historyItem);

    // 限制历史记录数量
    if (history.length > this.MAX_HISTORY_SIZE) {
      history.splice(this.MAX_HISTORY_SIZE);
    }

    this.saveHistory(history);
    return historyItem;
  }

  /**
   * 获取所有历史记录
   */
  static getHistory(): HistoryItem[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load history:', error);
      return [];
    }
  }

  /**
   * 根据ID获取历史记录
   */
  static getHistoryById(id: string): HistoryItem | null {
    const history = this.getHistory();
    return history.find(item => item.id === id) || null;
  }

  /**
   * 过滤历史记录
   */
  static filterHistory(filter: HistoryFilter): HistoryItem[] {
    let history = this.getHistory();

    // 日期范围过滤
    if (filter.dateRange) {
      const startTime = filter.dateRange.start.getTime();
      const endTime = filter.dateRange.end.getTime();
      history = history.filter(item => 
        item.timestamp >= startTime && item.timestamp <= endTime
      );
    }

    // 识别类型过滤
    if (filter.recognitionType && filter.recognitionType !== 'all') {
      history = history.filter(item => item.recognitionType === filter.recognitionType);
    }

    // 模型过滤
    if (filter.model && filter.model !== 'all') {
      history = history.filter(item => item.model === filter.model);
    }

    // 提供商过滤
    if (filter.provider && filter.provider !== 'all') {
      history = history.filter(item => item.provider === filter.provider);
    }

    // 搜索文本过滤
    if (filter.searchText) {
      const searchLower = filter.searchText.toLowerCase();
      history = history.filter(item => 
        item.fileName.toLowerCase().includes(searchLower) ||
        item.result.content.toLowerCase().includes(searchLower) ||
        (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchLower)))
      );
    }

    // 只显示收藏
    if (filter.onlyFavorites) {
      history = history.filter(item => item.isFavorite);
    }

    return history;
  }

  /**
   * 删除历史记录
   */
  static deleteRecord(id: string): boolean {
    const history = this.getHistory();
    const index = history.findIndex(item => item.id === id);
    
    if (index === -1) return false;
    
    history.splice(index, 1);
    this.saveHistory(history);
    return true;
  }

  /**
   * 批量删除历史记录
   */
  static deleteRecords(ids: string[]): number {
    const history = this.getHistory();
    const idsSet = new Set(ids);
    const newHistory = history.filter(item => !idsSet.has(item.id));
    const deletedCount = history.length - newHistory.length;
    
    this.saveHistory(newHistory);
    return deletedCount;
  }

  /**
   * 清空所有历史记录
   */
  static clearHistory(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * 更新历史记录
   */
  static updateRecord(id: string, updates: Partial<HistoryItem>): boolean {
    const history = this.getHistory();
    const index = history.findIndex(item => item.id === id);
    
    if (index === -1) return false;
    
    history[index] = { ...history[index], ...updates };
    this.saveHistory(history);
    return true;
  }

  /**
   * 切换收藏状态
   */
  static toggleFavorite(id: string): boolean {
    const history = this.getHistory();
    const index = history.findIndex(item => item.id === id);
    
    if (index === -1) return false;
    
    history[index].isFavorite = !history[index].isFavorite;
    this.saveHistory(history);
    return history[index].isFavorite;
  }

  /**
   * 添加标签
   */
  static addTag(id: string, tag: string): boolean {
    const history = this.getHistory();
    const index = history.findIndex(item => item.id === id);
    
    if (index === -1) return false;
    
    if (!history[index].tags) {
      history[index].tags = [];
    }
    
    if (!history[index].tags!.includes(tag)) {
      history[index].tags!.push(tag);
      this.saveHistory(history);
    }
    
    return true;
  }

  /**
   * 移除标签
   */
  static removeTag(id: string, tag: string): boolean {
    const history = this.getHistory();
    const index = history.findIndex(item => item.id === id);
    
    if (index === -1) return false;
    
    if (history[index].tags) {
      history[index].tags = history[index].tags.filter(t => t !== tag);
      this.saveHistory(history);
    }
    
    return true;
  }

  /**
   * 获取统计信息
   */
  static getStatistics(): {
    totalRecords: number;
    recentRecords: number;
    favoriteRecords: number;
    recognitionTypes: Record<string, number>;
    models: Record<string, number>;
    providers: Record<string, number>;
  } {
    const history = this.getHistory();
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    
    const recentRecords = history.filter(item => 
      (now - item.timestamp) < (7 * dayMs)
    ).length;
    
    const favoriteRecords = history.filter(item => item.isFavorite).length;
    
    const recognitionTypes: Record<string, number> = {};
    const models: Record<string, number> = {};
    const providers: Record<string, number> = {};
    
    history.forEach(item => {
      recognitionTypes[item.recognitionType] = (recognitionTypes[item.recognitionType] || 0) + 1;
      models[item.model] = (models[item.model] || 0) + 1;
      providers[item.provider] = (providers[item.provider] || 0) + 1;
    });
    
    return {
      totalRecords: history.length,
      recentRecords,
      favoriteRecords,
      recognitionTypes,
      models,
      providers
    };
  }

  /**
   * 导出历史记录
   */
  static exportHistory(format: 'json' | 'csv' = 'json'): string {
    const history = this.getHistory();
    
    if (format === 'json') {
      return JSON.stringify(history, null, 2);
    } else if (format === 'csv') {
      const headers = ['ID', '时间', '文件名', '识别类型', '模型', '提供商', '置信度', '内容'];
      const rows = history.map(item => [
        item.id,
        new Date(item.timestamp).toLocaleString(),
        item.fileName,
        item.recognitionType,
        item.model,
        item.provider,
        item.result.confidence.toFixed(2),
        item.result.content.replace(/[\r\n]/g, ' ').substring(0, 100)
      ]);
      
      return [headers, ...rows].map(row => 
        row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(',')
      ).join('\n');
    }
    
    return '';
  }

  /**
   * 导入历史记录
   */
  static importHistory(data: string, format: 'json' = 'json'): number {
    try {
      if (format === 'json') {
        const importedHistory: HistoryItem[] = JSON.parse(data);
        const currentHistory = this.getHistory();
        
        // 合并历史记录，避免重复
        const existingIds = new Set(currentHistory.map(item => item.id));
        const newRecords = importedHistory.filter(item => !existingIds.has(item.id));
        
        const mergedHistory = [...currentHistory, ...newRecords];
        mergedHistory.sort((a, b) => b.timestamp - a.timestamp);
        
        // 限制数量
        if (mergedHistory.length > this.MAX_HISTORY_SIZE) {
          mergedHistory.splice(this.MAX_HISTORY_SIZE);
        }
        
        this.saveHistory(mergedHistory);
        return newRecords.length;
      }
    } catch (error) {
      console.error('Failed to import history:', error);
      throw new Error('导入历史记录失败');
    }
    
    return 0;
  }

  /**
   * 获取所有唯一标签
   */
  static getAllTags(): string[] {
    const history = this.getHistory();
    const tagSet = new Set<string>();
    
    history.forEach(item => {
      if (item.tags) {
        item.tags.forEach(tag => tagSet.add(tag));
      }
    });
    
    return Array.from(tagSet).sort();
  }

  /**
   * 生成唯一ID
   */
  private static generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 保存历史记录到localStorage
   */
  private static saveHistory(history: HistoryItem[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save history:', error);
      // 如果存储失败，可能是因为空间不足，尝试清理旧记录
      if (history.length > 100) {
        const reducedHistory = history.slice(0, 100);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(reducedHistory));
      }
    }
  }
}