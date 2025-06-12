/**
 * 购物小票智能校验系统
 * 提供小票信息提取、金额校验、消费分析等功能
 */
class ReceiptValidatorService {
  constructor() {
    // 常见商品分类
    this.productCategories = {
      food: ['食品', '蔬菜', '水果', '肉类', '海鲜', '牛奶', '面包', '零食', '饮料'],
      daily: ['洗发水', '牙膏', '纸巾', '洗衣液', '卫生纸', '香皂', '毛巾'],
      medicine: ['药品', '保健品', '维生素', '感冒药', '止痛药', '消炎药'],
      clothing: ['衣服', '鞋子', '帽子', '袜子', '内衣', '外套', '裤子'],
      electronics: ['手机', '电脑', '数据线', '充电器', '耳机', '电池'],
      books: ['书籍', '杂志', '文具', '笔', '本子', '教材'],
      other: ['其他']
    };

    // 税率配置
    this.taxRates = {
      standard: 0.13,  // 标准税率13%
      food: 0.05,      // 食品税率5%
      medicine: 0,     // 药品免税
      books: 0.05      // 书籍税率5%
    };
  }

  /**
   * 分析购物小票
   * @param {string} recognitionContent - AI识别的文本内容
   * @returns {object} 分析结果
   */
  async analyzeReceipt(recognitionContent) {
    try {
      console.log('🧾 开始分析购物小票...');
      
      // 提取结构化信息
      const extractedData = this.extractReceiptData(recognitionContent);
      
      // 验证金额计算
      const validation = this.validateCalculations(extractedData);
      
      // 商品分类分析
      const categoryAnalysis = this.categorizeItems(extractedData.items);
      
      // 消费洞察
      const insights = this.generateInsights(extractedData, categoryAnalysis);
      
      // 营养分析（针对食品）
      const nutritionAnalysis = this.analyzeNutrition(extractedData.items);
      
      return {
        success: true,
        analysis: {
          extractedData,
          validation,
          categoryAnalysis,
          insights,
          nutritionAnalysis,
          summary: {
            totalItems: extractedData.items.length,
            totalAmount: extractedData.total,
            validationStatus: validation.isValid ? '✅ 通过' : '❌ 异常',
            mainCategory: categoryAnalysis.mainCategory,
            healthScore: nutritionAnalysis.healthScore
          }
        }
      };
      
    } catch (error) {
      console.error('小票分析失败:', error);
      return {
        success: false,
        error: error.message,
        analysis: null
      };
    }
  }

  /**
   * 提取小票结构化数据
   */
  extractReceiptData(content) {
    const data = {
      store: { name: '', address: '', phone: '' },
      date: '',
      time: '',
      items: [],
      subtotal: 0,
      tax: 0,
      discount: 0,
      total: 0,
      payment: { method: '', amount: 0 },
      receiptNumber: ''
    };

    const lines = content.split('\n');
    let currentSection = 'header';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // 提取商店信息
      if (this.isStoreName(line) && !data.store.name) {
        data.store.name = line;
      }
      
      // 提取日期时间
      const dateMatch = line.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})|(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
      if (dateMatch && !data.date) {
        data.date = line;
      }
      
      const timeMatch = line.match(/(\d{1,2}):(\d{2})/);
      if (timeMatch && !data.time) {
        data.time = timeMatch[0];
      }

      // 提取商品信息
      const itemMatch = this.parseItemLine(line);
      if (itemMatch) {
        data.items.push(itemMatch);
      }

      // 提取金额信息
      if (line.includes('小计') || line.includes('小結') || line.includes('subtotal')) {
        data.subtotal = this.extractAmount(line);
      }
      
      if (line.includes('税') || line.includes('稅') || line.includes('tax')) {
        data.tax = this.extractAmount(line);
      }
      
      if (line.includes('折扣') || line.includes('优惠') || line.includes('discount')) {
        data.discount = this.extractAmount(line);
      }
      
      if (line.includes('总计') || line.includes('總計') || line.includes('total') || line.includes('合计')) {
        data.total = this.extractAmount(line);
      }
      
      // 提取支付方式
      if (line.includes('现金') || line.includes('現金') || line.includes('cash')) {
        data.payment.method = '现金';
        data.payment.amount = this.extractAmount(line);
      } else if (line.includes('卡') || line.includes('card')) {
        data.payment.method = '银行卡';
        data.payment.amount = this.extractAmount(line);
      } else if (line.includes('支付宝') || line.includes('alipay')) {
        data.payment.method = '支付宝';
        data.payment.amount = this.extractAmount(line);
      } else if (line.includes('微信') || line.includes('wechat')) {
        data.payment.method = '微信支付';
        data.payment.amount = this.extractAmount(line);
      }
    }

    return data;
  }

  /**
   * 判断是否为商店名称
   */
  isStoreName(line) {
    const storeKeywords = ['超市', '商店', '便利店', '购物', '商场', '市场'];
    return storeKeywords.some(keyword => line.includes(keyword)) || 
           line.length < 20 && /^[\u4e00-\u9fa5A-Za-z\s]+$/.test(line);
  }

  /**
   * 解析商品行
   */
  parseItemLine(line) {
    // 匹配商品名称、数量、单价、金额的模式
    const patterns = [
      // 商品名 数量 单价 金额
      /(.+?)\s+(\d+(?:\.\d+)?)\s*[×x*]\s*(\d+(?:\.\d+)?)\s*=?\s*(\d+(?:\.\d+)?)/,
      // 商品名 金额
      /(.+?)\s+(\d+(?:\.\d+)?)/
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        if (match.length === 5) {
          // 完整信息
          return {
            name: match[1].trim(),
            quantity: parseFloat(match[2]),
            price: parseFloat(match[3]),
            amount: parseFloat(match[4])
          };
        } else if (match.length === 3) {
          // 只有名称和金额
          return {
            name: match[1].trim(),
            quantity: 1,
            price: parseFloat(match[2]),
            amount: parseFloat(match[2])
          };
        }
      }
    }

    return null;
  }

  /**
   * 提取金额
   */
  extractAmount(line) {
    const amountMatch = line.match(/(\d+(?:\.\d+)?)/);
    return amountMatch ? parseFloat(amountMatch[1]) : 0;
  }

  /**
   * 验证金额计算
   */
  validateCalculations(data) {
    const validation = {
      isValid: true,
      errors: [],
      checks: {}
    };

    // 检查商品小计
    const itemsTotal = data.items.reduce((sum, item) => sum + item.amount, 0);
    validation.checks.itemsTotal = {
      calculated: itemsTotal,
      recorded: data.subtotal || data.total,
      isValid: Math.abs(itemsTotal - (data.subtotal || data.total)) < 0.01
    };

    if (!validation.checks.itemsTotal.isValid) {
      validation.errors.push(`商品小计不匹配：计算值 ${itemsTotal}，记录值 ${data.subtotal || data.total}`);
      validation.isValid = false;
    }

    // 检查税费计算
    if (data.tax > 0) {
      const expectedTax = data.subtotal * 0.13; // 假设标准税率
      validation.checks.tax = {
        calculated: expectedTax,
        recorded: data.tax,
        isValid: Math.abs(expectedTax - data.tax) < 0.01
      };

      if (!validation.checks.tax.isValid) {
        validation.errors.push(`税费计算异常：预期 ${expectedTax.toFixed(2)}，实际 ${data.tax}`);
        validation.isValid = false;
      }
    }

    // 检查总计
    const expectedTotal = (data.subtotal || itemsTotal) + data.tax - data.discount;
    validation.checks.total = {
      calculated: expectedTotal,
      recorded: data.total,
      isValid: Math.abs(expectedTotal - data.total) < 0.01
    };

    if (!validation.checks.total.isValid) {
      validation.errors.push(`总计不匹配：计算值 ${expectedTotal.toFixed(2)}，记录值 ${data.total}`);
      validation.isValid = false;
    }

    return validation;
  }

  /**
   * 商品分类分析
   */
  categorizeItems(items) {
    const categorized = {
      food: [],
      daily: [],
      medicine: [],
      clothing: [],
      electronics: [],
      books: [],
      other: []
    };

    const categoryStats = {};

    items.forEach(item => {
      let assigned = false;
      
      for (const [category, keywords] of Object.entries(this.productCategories)) {
        if (keywords.some(keyword => item.name.includes(keyword))) {
          categorized[category].push(item);
          assigned = true;
          break;
        }
      }
      
      if (!assigned) {
        categorized.other.push(item);
      }
    });

    // 计算各分类统计
    for (const [category, items] of Object.entries(categorized)) {
      if (items.length > 0) {
        categoryStats[category] = {
          count: items.length,
          amount: items.reduce((sum, item) => sum + item.amount, 0),
          items: items.map(item => item.name)
        };
      }
    }

    // 找出主要分类
    const mainCategory = Object.entries(categoryStats)
      .sort(([,a], [,b]) => b.amount - a.amount)[0]?.[0] || 'other';

    return {
      categorized,
      stats: categoryStats,
      mainCategory,
      categoryNames: {
        food: '食品饮料',
        daily: '日用品',
        medicine: '医药保健',
        clothing: '服装鞋帽',
        electronics: '电子产品',
        books: '图书文具',
        other: '其他'
      }
    };
  }

  /**
   * 生成消费洞察
   */
  generateInsights(data, categoryAnalysis) {
    const insights = [];

    // 消费结构分析
    const totalAmount = data.total;
    const mainCategory = categoryAnalysis.mainCategory;
    const mainCategoryAmount = categoryAnalysis.stats[mainCategory]?.amount || 0;
    const mainCategoryPercent = ((mainCategoryAmount / totalAmount) * 100).toFixed(1);

    insights.push({
      type: 'structure',
      title: '消费结构分析',
      content: `本次消费主要集中在${categoryAnalysis.categoryNames[mainCategory]}（${mainCategoryPercent}%），共花费 ¥${mainCategoryAmount.toFixed(2)}`
    });

    // 单价分析
    const avgPrice = data.items.reduce((sum, item) => sum + item.price, 0) / data.items.length;
    const highPriceItems = data.items.filter(item => item.price > avgPrice * 2);
    
    if (highPriceItems.length > 0) {
      insights.push({
        type: 'price',
        title: '高价商品提醒',
        content: `发现 ${highPriceItems.length} 件高价商品：${highPriceItems.map(item => item.name).join('、')}`
      });
    }

    // 节约建议
    if (categoryAnalysis.stats.food && categoryAnalysis.stats.food.amount > totalAmount * 0.5) {
      insights.push({
        type: 'saving',
        title: '节约建议',
        content: '食品消费占比较高，建议合理规划采购，避免浪费'
      });
    }

    return insights;
  }

  /**
   * 营养分析（针对食品）
   */
  analyzeNutrition(items) {
    const foodItems = items.filter(item => 
      this.productCategories.food.some(keyword => item.name.includes(keyword))
    );

    if (foodItems.length === 0) {
      return { healthScore: 0, analysis: '未检测到食品商品' };
    }

    let healthScore = 70; // 基础分数
    const analysis = [];

    // 检查蔬菜水果
    const vegetablesAndFruits = foodItems.filter(item => 
      ['蔬菜', '水果'].some(keyword => item.name.includes(keyword))
    );
    
    if (vegetablesAndFruits.length > 0) {
      healthScore += 15;
      analysis.push('✅ 购买了蔬菜水果，营养均衡');
    } else {
      healthScore -= 10;
      analysis.push('⚠️ 建议增加蔬菜水果摄入');
    }

    // 检查零食饮料
    const snacksAndDrinks = foodItems.filter(item => 
      ['零食', '饮料', '可乐', '薯片', '巧克力'].some(keyword => item.name.includes(keyword))
    );
    
    if (snacksAndDrinks.length > foodItems.length * 0.3) {
      healthScore -= 20;
      analysis.push('⚠️ 零食饮料占比较高，建议减少摄入');
    }

    // 检查肉类
    const meatItems = foodItems.filter(item => 
      ['肉', '鱼', '虾', '鸡', '牛', '猪'].some(keyword => item.name.includes(keyword))
    );
    
    if (meatItems.length > 0) {
      healthScore += 10;
      analysis.push('✅ 蛋白质来源充足');
    }

    return {
      healthScore: Math.max(0, Math.min(100, healthScore)),
      analysis: analysis.join('\n'),
      recommendations: this.generateNutritionRecommendations(healthScore)
    };
  }

  /**
   * 生成营养建议
   */
  generateNutritionRecommendations(healthScore) {
    if (healthScore >= 80) {
      return '饮食搭配很健康，请继续保持！';
    } else if (healthScore >= 60) {
      return '饮食基本均衡，可以增加更多蔬菜水果。';
    } else {
      return '建议调整饮食结构，增加蔬菜水果，减少加工食品。';
    }
  }
}

export default ReceiptValidatorService; 