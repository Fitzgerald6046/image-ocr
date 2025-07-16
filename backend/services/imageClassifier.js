import fs from 'fs';
import path from 'path';

/**
 * 图片智能分类服务
 * 用于自动检测图片类型，并为不同类型的图片提供专门的识别提示词和处理逻辑
 */
class ImageClassifierService {
  constructor() {
    // 图片类型分类提示词
    this.classificationPrompts = {
      initial: `请分析这张图片，并判断它属于以下哪种类型，只需要返回类型名称：
1. ancient - 古籍文献、古书、文言文、古代文档
2. receipt - 收据、发票、票据、凭证
3. document - 现代文档、书籍、报纸、杂志
4. poetry - 诗歌、文学作品、诗集
5. shopping - 购物小票、超市收据、消费清单
6. artwork - 艺术作品、绘画、插画、设计作品
7. id - 身份证、护照、证件、卡片
8. table - 表格、图表、数据表、统计图
9. handwriting - 手写文字、笔记、签名
10. photo - 普通照片、风景、人物、生活照
11. other - 其他类型

请只返回对应的英文类型名称，不要其他内容。`,
      
      confidence: `请对刚才的分类结果给出置信度评分(0-100)，并简要说明判断依据。格式：分数|依据`
    };

    // 针对不同类型的优化识别提示词
    this.optimizedPrompts = {
      ancient: `这是一张古籍文献图片。请：
1. 识别其中的古代文字内容（包括繁体字、古字）
2. 如果是文言文，提供现代汉语翻译
3. 标注重点字词的含义
4. 提供断句和标点
请以结构化格式返回结果。`,

      receipt: `这是一张票据图片。请提取以下信息：
- 商家名称和地址
- 票据类型和编号
- 日期和时间
- 金额信息（小计、税费、总计）
- 支付方式
- 其他重要信息
请以JSON格式返回提取的信息。`,

      document: `这是一张文档图片。请：
1. 完整识别所有文字内容
2. 保持原有的段落和格式结构
3. 如果有标题、副标题，请标明层级
4. 识别关键信息和要点
请以结构化格式返回。`,

      poetry: `这是一张诗歌文学作品图片。请：
1. 准确识别诗歌内容
2. 保持原有的行排列和韵律
3. 标注作者和出处（如果有）
4. 提供作品背景介绍（如果知道）
5. 解释重点词句含义
请以优美格式返回。`,

      shopping: `这是一张购物小票。请详细提取：
1. 商店信息（名称、地址、电话）
2. 购买日期和时间
3. 商品清单（名称、数量、单价、小计）
4. 优惠信息（折扣、优惠券等）
5. 税费信息
6. 支付方式和金额
7. 会员信息（如果有）
并进行金额校验：检查各项目金额计算是否正确。`,

      artwork: `这是一张艺术作品图片。请：
1. 详细描述画面内容和构图
2. 分析艺术风格和技法
3. 识别可能的艺术流派
4. 描述色彩运用和光影效果
5. 生成适合AI绘图的详细Prompt（包括Midjourney、DALL-E、Stable Diffusion格式）
请以专业艺术分析格式返回。`,

      id: `这是一张证件图片。请提取：
- 证件类型
- 姓名
- 证件号码
- 有效期
- 发证机关
- 其他关键信息
注意：请保护隐私，仅提取必要信息用于验证目的。`,

      table: `这是一张表格或图表图片。请：
1. 识别表格结构（行列数、标题）
2. 提取所有数据内容
3. 分析数据关系和趋势
4. 如果是图表，说明图表类型和含义
5. 以结构化格式（如CSV或JSON）返回数据`,

      handwriting: `这是一张手写内容图片。请：
1. 仔细识别手写文字（注意笔迹特点）
2. 处理模糊或难以辨认的字符
3. 保持原有的段落结构
4. 标注不确定的字符
5. 如果是笔记，提取关键要点`,

      photo: `这是一张普通照片。请：
1. 详细描述图片内容
2. 识别人物、物体、场景
3. 描述环境和背景
4. 注意时间、地点等线索
5. 如果有文字内容，一并识别`,

      other: `请分析这张图片并：
1. 描述图片主要内容
2. 识别其中的文字信息
3. 提供相关的信息提取
4. 判断可能的用途或类型`
    };

    // 多语言处理配置
    this.languageConfig = {
      traditional_to_simplified: true,
      auto_translate: ['en', 'ja', 'ko'], // 自动翻译的语言
      ancient_chinese_support: true
    };
  }

  /**
   * 智能分类图片类型
   * @param {string} imagePath - 图片路径
   * @param {object} modelConfig - AI模型配置
   * @returns {Promise<object>} 分类结果
   */
  async classifyImage(imagePath, modelConfig) {
    try {
      const aiServiceModule = await import('./aiModels.js');
      const aiService = aiServiceModule.default;
      
      console.log('🔍 开始图片智能分类...');
      
      // 第一步：获取图片分类
      const classificationResult = await aiService.recognizeImage(
        imagePath, 
        modelConfig, 
        'classification',
        this.classificationPrompts.initial
      );
      
      const detectedType = classificationResult.result.content.trim().toLowerCase();
      console.log('📋 检测到图片类型:', detectedType);
      
      // 第二步：获取置信度评估
      const confidenceResult = await aiService.recognizeImage(
        imagePath, 
        modelConfig, 
        'confidence',
        this.classificationPrompts.confidence
      );
      
      const [confidenceScore, reasoning] = confidenceResult.result.content.split('|');
      
      return {
        detectedType,
        confidence: parseInt(confidenceScore) || 80,
        reasoning: reasoning?.trim() || '自动分类',
        optimizedPrompt: this.optimizedPrompts[detectedType] || this.optimizedPrompts.other,
        needsLanguageProcessing: this.needsLanguageProcessing(detectedType),
        suggestedOptions: this.getSuggestedOptions(detectedType)
      };
      
    } catch (error) {
      console.error('图片分类失败:', error);
      // 返回默认配置
      return {
        detectedType: 'auto',
        confidence: 50,
        reasoning: '分类失败，使用默认配置',
        optimizedPrompt: this.optimizedPrompts.other,
        needsLanguageProcessing: false,
        suggestedOptions: []
      };
    }
  }

  /**
   * 判断是否需要语言处理
   */
  needsLanguageProcessing(imageType) {
    return ['ancient', 'document', 'poetry', 'handwriting', 'id'].includes(imageType);
  }

  /**
   * 获取针对特定类型的建议选项
   */
  getSuggestedOptions(imageType) {
    const options = {
      ancient: [
        { key: 'traditional_to_simplified', label: '繁体转简体', default: true },
        { key: 'add_punctuation', label: '添加标点符号', default: true },
        { key: 'modern_translation', label: '文言文翻译', default: true }
      ],
      receipt: [
        { key: 'extract_json', label: 'JSON格式提取', default: true },
        { key: 'amount_verification', label: '金额校验', default: true },
        { key: 'categorize_items', label: '商品分类', default: false }
      ],
      shopping: [
        { key: 'detailed_analysis', label: '详细分析', default: true },
        { key: 'amount_verification', label: '金额校验', default: true },
        { key: 'spending_insights', label: '消费洞察', default: false },
        { key: 'nutrition_analysis', label: '营养分析（食品）', default: false }
      ],
      artwork: [
        { key: 'style_analysis', label: '风格分析', default: true },
        { key: 'generate_prompts', label: '生成AI绘图Prompt', default: true },
        { key: 'color_palette', label: '色彩分析', default: false },
        { key: 'composition_analysis', label: '构图分析', default: false }
      ],
      document: [
        { key: 'preserve_format', label: '保持格式', default: true },
        { key: 'extract_key_points', label: '提取要点', default: false },
        { key: 'auto_translate', label: '自动翻译', default: false }
      ],
      table: [
        { key: 'export_csv', label: '导出CSV格式', default: true },
        { key: 'data_analysis', label: '数据分析', default: false },
        { key: 'chart_description', label: '图表说明', default: true }
      ]
    };
    
    return options[imageType] || [];
  }

  /**
   * 应用语言处理
   */
  async applyLanguageProcessing(text, options = {}) {
    let processedText = text;
    
    try {
      // 繁体转简体
      if (options.traditional_to_simplified) {
        processedText = await this.convertTraditionalToSimplified(processedText);
      }
      
      // 多语言翻译
      if (options.auto_translate && this.containsForeignLanguage(processedText)) {
        const translatedText = await this.translateToSimplifiedChinese(processedText, options.modelConfig);
        processedText = `原文：\n${processedText}\n\n中文翻译：\n${translatedText}`;
      }
      
      return processedText;
      
    } catch (error) {
      console.error('语言处理失败:', error);
      return text; // 返回原文
    }
  }

  /**
   * 繁体转简体
   */
  async convertTraditionalToSimplified(text) {
    // 这里可以集成更专业的繁简转换库
    // 现在使用基础的字符映射
    const traditionalMap = {
      '學': '学', '書': '书', '語': '语', '國': '国', '東': '东',
      '術': '术', '業': '业', '產': '产', '關': '关', '發': '发',
      '現': '现', '經': '经', '種': '种', '應': '应', '時': '时',
      '間': '间', '會': '会', '個': '个', '從': '从', '來': '来',
      '後': '后', '說': '说', '還': '还', '沒': '没', '這': '这',
      '點': '点', '對': '对', '開': '开', '問': '问', '題': '题'
    };
    
    let result = text;
    for (const [traditional, simplified] of Object.entries(traditionalMap)) {
      result = result.replace(new RegExp(traditional, 'g'), simplified);
    }
    
    return result;
  }

  /**
   * 检测是否包含外语
   */
  containsForeignLanguage(text) {
    // 检测英文
    const englishPattern = /[a-zA-Z]{3,}/;
    // 检测日文
    const japanesePattern = /[\u3040-\u309F\u30A0-\u30FF]/;
    // 检测韩文
    const koreanPattern = /[\uAC00-\uD7AF]/;
    
    return englishPattern.test(text) || japanesePattern.test(text) || koreanPattern.test(text);
  }

  /**
   * 翻译为简体中文
   */
  async translateToSimplifiedChinese(text, modelConfig) {
    try {
      const aiServiceModule = await import('./aiModels.js');
      const aiService = aiServiceModule.default;
      
      const translatePrompt = `请将以下文本翻译为简体中文，保持原意不变：

${text}

要求：
1. 翻译要准确自然
2. 保持原有的格式和段落
3. 专业术语要准确
4. 如果有古文或诗词，要有文学性

请只返回翻译结果，不要其他内容。`;

      const result = await aiService.recognizeImage(
        null, // 不需要图片，纯文本翻译
        modelConfig,
        'translate',
        translatePrompt
      );
      
      return result.result.content;
      
    } catch (error) {
      console.error('翻译失败:', error);
      return text;
    }
  }
}

export default ImageClassifierService; 