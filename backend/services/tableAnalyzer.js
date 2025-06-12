/**
 * 表格识别与数据分析服务
 * 提供CSV导出、数据分析、统计计算等功能
 */
class TableAnalyzerService {
  constructor() {
    // 表格类型定义
    this.tableTypes = {
      financial: {
        name: '财务报表',
        patterns: ['收入', '支出', '利润', '资产', '负债', '现金流'],
        analysis: ['趋势分析', '比率分析', '增长率计算']
      },
      inventory: {
        name: '库存清单',
        patterns: ['商品', '数量', '价格', '库存', '型号', '规格'],
        analysis: ['库存统计', '价值分析', '周转率']
      },
      sales: {
        name: '销售报表',
        patterns: ['销售额', '客户', '产品', '订单', '业绩'],
        analysis: ['销售趋势', '客户分析', '产品排名']
      },
      schedule: {
        name: '时间表',
        patterns: ['时间', '日期', '课程', '活动', '安排'],
        analysis: ['时间分布', '冲突检测', '工作量分析']
      },
      survey: {
        name: '调查表',
        patterns: ['问题', '选项', '得分', '评价', '满意度'],
        analysis: ['统计分析', '满意度计算', '相关性分析']
      },
      generic: {
        name: '通用表格',
        patterns: [],
        analysis: ['基础统计', '数据清洗', '格式标准化']
      }
    };

    // 数据类型识别
    this.dataTypes = {
      number: {
        patterns: [/^\d+$/, /^\d+\.\d+$/, /^[\d,]+(\.\d+)?$/, /^[¥$€£]\d+/],
        validators: [this.isNumber.bind(this)]
      },
      date: {
        patterns: [/^\d{4}-\d{2}-\d{2}$/, /^\d{4}\/\d{2}\/\d{2}$/, /^\d{4}年\d{1,2}月\d{1,2}日$/],
        validators: [this.isDate.bind(this)]
      },
      time: {
        patterns: [/^\d{1,2}:\d{2}$/, /^\d{1,2}:\d{2}:\d{2}$/],
        validators: [this.isTime.bind(this)]
      },
      percentage: {
        patterns: [/^\d+(\.\d+)?%$/],
        validators: [this.isPercentage.bind(this)]
      },
      text: {
        patterns: [],
        validators: [() => true] // 默认为文本
      }
    };
  }

  /**
   * 分析表格数据
   */
  async analyzeTable(recognitionContent, options = {}) {
    try {
      console.log('📊 开始分析表格数据...');
      
      // 解析表格结构
      const parsedTable = this.parseTableStructure(recognitionContent);
      
      // 检测表格类型
      const tableType = this.detectTableType(parsedTable);
      
      // 数据类型分析
      const dataTypeAnalysis = this.analyzeDataTypes(parsedTable);
      
      // 数据质量检查
      const qualityCheck = this.checkDataQuality(parsedTable);
      
      // 统计分析
      const statistics = this.calculateStatistics(parsedTable, dataTypeAnalysis);
      
      // 生成CSV
      const csvData = this.generateCSV(parsedTable, options);
      
      // 数据洞察
      const insights = this.generateInsights(parsedTable, tableType, statistics);
      
      return {
        success: true,
        analysis: {
          tableType,
          structure: {
            rows: parsedTable.data.length,
            columns: parsedTable.headers.length,
            totalCells: parsedTable.data.length * parsedTable.headers.length
          },
          headers: parsedTable.headers,
          dataTypes: dataTypeAnalysis,
          qualityCheck,
          statistics,
          insights,
          csvData,
          summary: {
            tableTypeName: this.tableTypes[tableType]?.name || '通用表格',
            dataQuality: qualityCheck.overallScore,
            hasNumericData: statistics.numericColumns > 0,
            exportReady: qualityCheck.overallScore >= 70
          }
        }
      };
      
    } catch (error) {
      console.error('表格分析失败:', error);
      return {
        success: false,
        error: error.message,
        analysis: null
      };
    }
  }

  /**
   * 解析表格结构
   */
  parseTableStructure(content) {
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      throw new Error('未找到有效的表格数据');
    }

    // 尝试多种分隔符
    const separators = ['\t', '|', ',', ' ', '，'];
    let bestSeparator = '\t';
    let maxColumns = 0;

    for (const sep of separators) {
      const testColumns = lines[0].split(sep).length;
      if (testColumns > maxColumns) {
        maxColumns = testColumns;
        bestSeparator = sep;
      }
    }

    // 如果没有明显的分隔符，尝试固定宽度解析
    if (maxColumns <= 1) {
      return this.parseFixedWidthTable(lines);
    }

    // 解析数据
    const headers = this.cleanCells(lines[0].split(bestSeparator));
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const cells = this.cleanCells(lines[i].split(bestSeparator));
      if (cells.length === headers.length) {
        data.push(cells);
      }
    }

    return {
      headers,
      data,
      separator: bestSeparator
    };
  }

  /**
   * 解析固定宽度表格
   */
  parseFixedWidthTable(lines) {
    // 检测列边界
    const columnBoundaries = this.detectColumnBoundaries(lines);
    
    const headers = this.extractFixedWidthCells(lines[0], columnBoundaries);
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const cells = this.extractFixedWidthCells(lines[i], columnBoundaries);
      if (cells.length === headers.length) {
        data.push(cells);
      }
    }

    return {
      headers,
      data,
      separator: 'fixed-width'
    };
  }

  /**
   * 检测列边界
   */
  detectColumnBoundaries(lines) {
    const boundaries = [0];
    
    // 统计每个位置的空格频率
    const spaceCount = new Array(Math.max(...lines.map(l => l.length))).fill(0);
    
    lines.forEach(line => {
      for (let i = 0; i < line.length; i++) {
        if (line[i] === ' ') {
          spaceCount[i]++;
        }
      }
    });

    // 找到连续空格区域作为分隔符
    let inSpace = false;
    for (let i = 0; i < spaceCount.length; i++) {
      const isSpace = spaceCount[i] > lines.length * 0.8;
      
      if (!inSpace && isSpace) {
        inSpace = true;
      } else if (inSpace && !isSpace) {
        boundaries.push(i);
        inSpace = false;
      }
    }

    boundaries.push(spaceCount.length);
    return boundaries;
  }

  /**
   * 提取固定宽度单元格
   */
  extractFixedWidthCells(line, boundaries) {
    const cells = [];
    for (let i = 0; i < boundaries.length - 1; i++) {
      const start = boundaries[i];
      const end = boundaries[i + 1];
      const cell = line.substring(start, end).trim();
      cells.push(cell);
    }
    return cells.filter(cell => cell.length > 0);
  }

  /**
   * 清理单元格数据
   */
  cleanCells(cells) {
    return cells.map(cell => 
      cell.trim()
        .replace(/^[|]+|[|]+$/g, '') // 移除边框字符
        .replace(/^\s+|\s+$/g, '') // 移除前后空格
    ).filter(cell => cell.length > 0);
  }

  /**
   * 检测表格类型
   */
  detectTableType(parsedTable) {
    const allText = [...parsedTable.headers, ...parsedTable.data.flat()].join(' ').toLowerCase();
    
    for (const [type, config] of Object.entries(this.tableTypes)) {
      if (type === 'generic') continue;
      
      const matchCount = config.patterns.filter(pattern => 
        allText.includes(pattern.toLowerCase())
      ).length;
      
      if (matchCount >= 2) {
        return type;
      }
    }
    
    return 'generic';
  }

  /**
   * 分析数据类型
   */
  analyzeDataTypes(parsedTable) {
    const typeAnalysis = {};
    
    parsedTable.headers.forEach((header, colIndex) => {
      const columnData = parsedTable.data.map(row => row[colIndex] || '');
      const detectedType = this.detectColumnDataType(columnData);
      
      typeAnalysis[header] = {
        type: detectedType,
        sampleValues: columnData.slice(0, 3),
        nullCount: columnData.filter(val => !val || val.trim() === '').length,
        uniqueCount: new Set(columnData).size
      };
    });
    
    return typeAnalysis;
  }

  /**
   * 检测列数据类型
   */
  detectColumnDataType(columnData) {
    const nonEmptyData = columnData.filter(val => val && val.trim() !== '');
    
    if (nonEmptyData.length === 0) return 'text';
    
    // 检查各种数据类型
    for (const [typeName, typeConfig] of Object.entries(this.dataTypes)) {
      const matchCount = nonEmptyData.filter(value => 
        typeConfig.patterns.some(pattern => pattern.test(value)) ||
        typeConfig.validators.some(validator => validator(value))
      ).length;
      
      const matchRatio = matchCount / nonEmptyData.length;
      
      if (matchRatio >= 0.7) { // 70%以上匹配则认为是该类型
        return typeName;
      }
    }
    
    return 'text';
  }

  /**
   * 数据验证方法
   */
  isNumber(value) {
    const cleaned = value.replace(/[,¥$€£]/g, '');
    return !isNaN(parseFloat(cleaned)) && isFinite(cleaned);
  }

  isDate(value) {
    return !isNaN(Date.parse(value));
  }

  isTime(value) {
    return /^\d{1,2}:\d{2}(:\d{2})?$/.test(value);
  }

  isPercentage(value) {
    return value.endsWith('%') && !isNaN(parseFloat(value.slice(0, -1)));
  }

  /**
   * 检查数据质量
   */
  checkDataQuality(parsedTable) {
    const totalCells = parsedTable.data.length * parsedTable.headers.length;
    let validCells = 0;
    let duplicateRows = 0;
    const issues = [];

    // 计算有效单元格
    parsedTable.data.forEach(row => {
      row.forEach(cell => {
        if (cell && cell.trim() !== '') {
          validCells++;
        }
      });
    });

    // 检测重复行
    const rowStrings = parsedTable.data.map(row => row.join('|'));
    const uniqueRows = new Set(rowStrings);
    duplicateRows = rowStrings.length - uniqueRows.size;

    // 检测不一致的行长度
    const inconsistentRows = parsedTable.data.filter(row => 
      row.length !== parsedTable.headers.length
    ).length;

    // 计算质量分数
    const completeness = (validCells / totalCells) * 100;
    const consistency = ((parsedTable.data.length - inconsistentRows) / parsedTable.data.length) * 100;
    const uniqueness = ((parsedTable.data.length - duplicateRows) / parsedTable.data.length) * 100;
    
    const overallScore = (completeness + consistency + uniqueness) / 3;

    // 生成问题报告
    if (completeness < 80) {
      issues.push(`数据完整性较低 (${completeness.toFixed(1)}%)`);
    }
    if (inconsistentRows > 0) {
      issues.push(`发现 ${inconsistentRows} 行数据格式不一致`);
    }
    if (duplicateRows > 0) {
      issues.push(`发现 ${duplicateRows} 行重复数据`);
    }

    return {
      overallScore: Math.round(overallScore),
      completeness: Math.round(completeness),
      consistency: Math.round(consistency),
      uniqueness: Math.round(uniqueness),
      issues,
      metrics: {
        totalCells,
        validCells,
        emptyOrInvalid: totalCells - validCells,
        duplicateRows,
        inconsistentRows
      }
    };
  }

  /**
   * 计算统计信息
   */
  calculateStatistics(parsedTable, dataTypeAnalysis) {
    const stats = {
      numericColumns: 0,
      textColumns: 0,
      dateColumns: 0,
      columnStats: {}
    };

    parsedTable.headers.forEach((header, colIndex) => {
      const columnData = parsedTable.data.map(row => row[colIndex] || '');
      const dataType = dataTypeAnalysis[header].type;
      
      if (dataType === 'number') {
        stats.numericColumns++;
        stats.columnStats[header] = this.calculateNumericStats(columnData);
      } else if (dataType === 'date') {
        stats.dateColumns++;
        stats.columnStats[header] = this.calculateDateStats(columnData);
      } else {
        stats.textColumns++;
        stats.columnStats[header] = this.calculateTextStats(columnData);
      }
    });

    return stats;
  }

  /**
   * 计算数值统计
   */
  calculateNumericStats(columnData) {
    const numbers = columnData
      .filter(val => val && val.trim() !== '')
      .map(val => parseFloat(val.replace(/[,¥$€£]/g, '')))
      .filter(num => !isNaN(num));

    if (numbers.length === 0) {
      return { type: 'numeric', count: 0 };
    }

    const sum = numbers.reduce((a, b) => a + b, 0);
    const avg = sum / numbers.length;
    const sorted = numbers.sort((a, b) => a - b);
    
    return {
      type: 'numeric',
      count: numbers.length,
      sum: sum,
      average: Math.round(avg * 100) / 100,
      median: sorted[Math.floor(sorted.length / 2)],
      min: sorted[0],
      max: sorted[sorted.length - 1],
      range: sorted[sorted.length - 1] - sorted[0]
    };
  }

  /**
   * 计算日期统计
   */
  calculateDateStats(columnData) {
    const dates = columnData
      .filter(val => val && val.trim() !== '')
      .map(val => new Date(val))
      .filter(date => !isNaN(date.getTime()));

    if (dates.length === 0) {
      return { type: 'date', count: 0 };
    }

    const sorted = dates.sort((a, b) => a - b);
    
    return {
      type: 'date',
      count: dates.length,
      earliest: sorted[0].toISOString().split('T')[0],
      latest: sorted[sorted.length - 1].toISOString().split('T')[0],
      span: Math.ceil((sorted[sorted.length - 1] - sorted[0]) / (1000 * 60 * 60 * 24))
    };
  }

  /**
   * 计算文本统计
   */
  calculateTextStats(columnData) {
    const texts = columnData.filter(val => val && val.trim() !== '');
    const lengths = texts.map(text => text.length);
    
    return {
      type: 'text',
      count: texts.length,
      uniqueValues: new Set(texts).size,
      averageLength: lengths.length > 0 ? Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length) : 0,
      maxLength: Math.max(...lengths, 0),
      minLength: Math.min(...lengths, 0)
    };
  }

  /**
   * 生成CSV数据
   */
  generateCSV(parsedTable, options = {}) {
    const { encoding = 'utf-8', delimiter = ',', includeHeaders = true } = options;
    
    let csvContent = '';
    
    // 添加表头
    if (includeHeaders) {
      csvContent += parsedTable.headers.map(header => 
        this.escapeCsvValue(header, delimiter)
      ).join(delimiter) + '\n';
    }
    
    // 添加数据行
    parsedTable.data.forEach(row => {
      csvContent += row.map(cell => 
        this.escapeCsvValue(cell, delimiter)
      ).join(delimiter) + '\n';
    });
    
    return {
      content: csvContent,
      filename: `table_export_${new Date().toISOString().split('T')[0]}.csv`,
      size: csvContent.length,
      encoding,
      rows: parsedTable.data.length + (includeHeaders ? 1 : 0)
    };
  }

  /**
   * CSV值转义
   */
  escapeCsvValue(value, delimiter) {
    if (!value) return '';
    
    const stringValue = String(value);
    
    // 如果包含分隔符、换行符或引号，需要用引号包围
    if (stringValue.includes(delimiter) || stringValue.includes('\n') || stringValue.includes('"')) {
      return '"' + stringValue.replace(/"/g, '""') + '"';
    }
    
    return stringValue;
  }

  /**
   * 生成数据洞察
   */
  generateInsights(parsedTable, tableType, statistics) {
    const insights = [];
    
    // 基础洞察
    insights.push({
      type: 'structure',
      title: '表格结构',
      content: `发现 ${parsedTable.data.length} 行数据，${parsedTable.headers.length} 列字段`
    });

    // 数据类型洞察
    if (statistics.numericColumns > 0) {
      insights.push({
        type: 'datatype',
        title: '数值数据',
        content: `包含 ${statistics.numericColumns} 个数值列，可进行统计分析`
      });
    }

    // 表格类型洞察
    if (tableType !== 'generic') {
      const typeName = this.tableTypes[tableType].name;
      insights.push({
        type: 'category',
        title: '表格类型',
        content: `识别为${typeName}，建议进行相关业务分析`
      });
    }

    // 数值统计洞察
    for (const [column, stats] of Object.entries(statistics.columnStats)) {
      if (stats.type === 'numeric') {
        insights.push({
          type: 'statistics',
          title: `${column} 数值分析`,
          content: `平均值: ${stats.average}, 总和: ${stats.sum}, 范围: ${stats.min} - ${stats.max}`
        });
      }
    }

    return insights;
  }
}

export default TableAnalyzerService; 