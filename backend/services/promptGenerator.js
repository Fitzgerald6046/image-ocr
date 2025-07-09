/**
 * AI图片生成Prompt服务
 * 用于分析艺术作品并生成适合Midjourney、DALL-E、Stable Diffusion等的专业Prompt
 */
class PromptGeneratorService {
  constructor() {
    // 艺术风格词汇库
    this.styleKeywords = {
      classical: ['古典主义', '新古典主义', '学院派', 'classical', 'neoclassical', 'academic'],
      impressionist: ['印象派', '印象主义', 'impressionism', 'impressionist', 'plein air'],
      abstract: ['抽象', '抽象派', 'abstract', 'non-figurative', 'non-representational'],
      surreal: ['超现实', '超现实主义', 'surreal', 'surrealism', 'dreamlike'],
      minimalist: ['极简', '极简主义', 'minimal', 'minimalism', 'simple'],
      baroque: ['巴洛克', 'baroque', 'ornate', 'dramatic'],
      renaissance: ['文艺复兴', 'renaissance', 'classical realism'],
      modern: ['现代', '现代派', 'modern', 'contemporary'],
      pop: ['波普', '波普艺术', 'pop art', 'popular culture'],
      cubist: ['立体派', '立体主义', 'cubism', 'cubist', 'geometric']
    };

    // 媒介和技法
    this.mediums = {
      oil: ['油画', 'oil painting', 'oil on canvas'],
      watercolor: ['水彩', 'watercolor', 'aquarelle'],
      acrylic: ['丙烯', 'acrylic', 'acrylic painting'],
      digital: ['数字绘画', 'digital art', 'digital painting'],
      pencil: ['铅笔', 'pencil drawing', 'graphite'],
      ink: ['墨水', '水墨', 'ink drawing', 'ink wash'],
      pastel: ['粉彩', 'pastel', 'soft pastel'],
      charcoal: ['炭笔', 'charcoal', 'charcoal drawing'],
      mixed: ['混合媒介', 'mixed media'],
      photography: ['摄影', 'photography', 'photographic']
    };

    // 情绪和氛围
    this.moods = {
      peaceful: ['宁静', '和平', 'peaceful', 'serene', 'tranquil', 'calm'],
      dramatic: ['戏剧性', '强烈', 'dramatic', 'intense', 'powerful'],
      melancholic: ['忧郁', '伤感', 'melancholic', 'sad', 'nostalgic'],
      joyful: ['快乐', '愉悦', 'joyful', 'happy', 'cheerful'],
      mysterious: ['神秘', '深沉', 'mysterious', 'enigmatic', 'mystical'],
      energetic: ['充满活力', '动感', 'energetic', 'dynamic', 'vibrant'],
      romantic: ['浪漫', 'romantic', 'tender', 'intimate'],
      dark: ['黑暗', '阴郁', 'dark', 'gloomy', 'somber']
    };

    // 构图类型
    this.compositions = {
      portrait: ['肖像', '人像', 'portrait', 'bust', 'headshot'],
      landscape: ['风景', '景观', 'landscape', 'scenic', 'vista'],
      stillLife: ['静物', 'still life', 'nature morte'],
      abstract: ['抽象构图', 'abstract composition'],
      geometric: ['几何构图', 'geometric composition'],
      symmetrical: ['对称构图', 'symmetrical composition'],
      asymmetrical: ['非对称构图', 'asymmetrical composition'],
      diagonal: ['对角线构图', 'diagonal composition'],
      triangular: ['三角构图', 'triangular composition']
    };

    // 色彩方案
    this.colorSchemes = {
      monochromatic: ['单色', 'monochromatic', 'monochrome'],
      complementary: ['对比色', 'complementary colors'],
      analogous: ['类似色', 'analogous colors'],
      triadic: ['三色调', 'triadic colors'],
      warm: ['暖色调', 'warm colors', 'warm palette'],
      cool: ['冷色调', 'cool colors', 'cool palette'],
      vibrant: ['鲜艳', 'vibrant colors', 'saturated'],
      muted: ['柔和', 'muted colors', 'desaturated'],
      pastel: ['粉彩色', 'pastel colors', 'soft colors'],
      earth: ['大地色', 'earth tones', 'natural colors']
    };

    // 光影效果
    this.lighting = {
      natural: ['自然光', 'natural lighting', 'daylight'],
      dramatic: ['戏剧光', 'dramatic lighting', 'chiaroscuro'],
      soft: ['柔光', 'soft lighting', 'diffused light'],
      backlighting: ['逆光', 'backlighting', 'rim lighting'],
      golden: ['金色时光', 'golden hour', 'warm light'],
      blue: ['蓝调时光', 'blue hour', 'cool light'],
      artificial: ['人造光', 'artificial lighting', 'studio lighting'],
      candle: ['烛光', 'candlelight', 'warm glow'],
      neon: ['霓虹灯', 'neon lighting', 'electric glow']
    };
  }

  /**
   * 分析艺术作品并生成多种格式的Prompt
   */
  async generatePrompts(imageAnalysis, imageType = 'artwork') {
    try {
      console.log('🎨 开始生成AI绘图Prompt...');
      
      // 提取关键视觉元素
      const visualElements = this.extractVisualElements(imageAnalysis);
      
      // 分析艺术风格
      const styleAnalysis = this.analyzeArtStyle(imageAnalysis);
      
      // 生成不同平台的Prompt
      const prompts = {
        midjourney: this.generateMidjourneyPrompt(visualElements, styleAnalysis),
        dalleE: this.generateDallEPrompt(visualElements, styleAnalysis),
        stableDiffusion: this.generateStableDiffusionPrompt(visualElements, styleAnalysis),
        general: this.generateGeneralPrompt(visualElements, styleAnalysis)
      };

      // 生成技术参数建议
      const technicalParams = this.generateTechnicalParams(styleAnalysis);
      
      return {
        success: true,
        prompts,
        technicalParams,
        visualElements,
        styleAnalysis,
        recommendations: this.generateRecommendations(styleAnalysis)
      };
      
    } catch (error) {
      console.error('Prompt生成失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 提取视觉元素
   */
  extractVisualElements(analysis) {
    const elements = {
      subjects: [],
      objects: [],
      environment: '',
      colors: [],
      composition: '',
      style: '',
      mood: '',
      medium: '',
      lighting: ''
    };

    const text = analysis.toLowerCase();

    // 提取主体和对象
    const subjectKeywords = ['人物', '女性', '男性', '儿童', '动物', '建筑', '树木', '花朵', '山', '海', '天空'];
    subjectKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        elements.subjects.push(keyword);
      }
    });

    // 提取色彩信息
    const colorKeywords = ['红', '蓝', '绿', '黄', '紫', '橙', '黑', '白', '灰', '金', '银', '粉'];
    colorKeywords.forEach(color => {
      if (text.includes(color)) {
        elements.colors.push(color);
      }
    });

    // 分析风格
    for (const [style, keywords] of Object.entries(this.styleKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        elements.style = style;
        break;
      }
    }

    // 分析媒介
    for (const [medium, keywords] of Object.entries(this.mediums)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        elements.medium = medium;
        break;
      }
    }

    // 分析情绪
    for (const [mood, keywords] of Object.entries(this.moods)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        elements.mood = mood;
        break;
      }
    }

    // 分析构图
    for (const [comp, keywords] of Object.entries(this.compositions)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        elements.composition = comp;
        break;
      }
    }

    // 分析光影
    for (const [light, keywords] of Object.entries(this.lighting)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        elements.lighting = light;
        break;
      }
    }

    return elements;
  }

  /**
   * 分析艺术风格
   */
  analyzeArtStyle(analysis) {
    const text = analysis.toLowerCase();
    
    const styleFeatures = {
      realism: this.calculateStyleScore(text, ['写实', '现实', '真实', 'realistic', 'photorealistic']),
      abstract: this.calculateStyleScore(text, ['抽象', '抽象派', 'abstract', 'non-figurative']),
      impressionist: this.calculateStyleScore(text, ['印象', '印象派', 'impressionist', '笔触', 'brushstroke']),
      expressionist: this.calculateStyleScore(text, ['表现', '表现主义', 'expressionist', '情感', 'emotional']),
      surreal: this.calculateStyleScore(text, ['超现实', '梦幻', 'surreal', 'dreamlike', '奇幻']),
      minimalist: this.calculateStyleScore(text, ['简约', '极简', 'minimal', 'simple', '简单']),
      baroque: this.calculateStyleScore(text, ['华丽', '复杂', 'ornate', 'elaborate', '巴洛克']),
      modern: this.calculateStyleScore(text, ['现代', '当代', 'modern', 'contemporary'])
    };

    // 找出主要风格
    const dominantStyle = Object.entries(styleFeatures)
      .sort(([,a], [,b]) => b - a)[0][0];

    return {
      dominantStyle,
      styleScores: styleFeatures,
      confidence: styleFeatures[dominantStyle]
    };
  }

  /**
   * 计算风格评分
   */
  calculateStyleScore(text, keywords) {
    let score = 0;
    keywords.forEach(keyword => {
      if (text.includes(keyword)) {
        score += 1;
      }
    });
    return score;
  }

  /**
   * 生成Midjourney格式的Prompt
   */
  generateMidjourneyPrompt(elements, styleAnalysis) {
    const parts = [];

    // 主要描述
    if (elements.subjects.length > 0) {
      parts.push(elements.subjects.join(' and '));
    }

    // 风格描述
    if (elements.style) {
      const styleNames = this.styleKeywords[elements.style];
      parts.push(`in ${styleNames[styleNames.length - 1]} style`);
    } else if (styleAnalysis.dominantStyle) {
      parts.push(`in ${styleAnalysis.dominantStyle} style`);
    }

    // 媒介
    if (elements.medium) {
      const mediumNames = this.mediums[elements.medium];
      parts.push(mediumNames[mediumNames.length - 1]);
    }

    // 色彩
    if (elements.colors.length > 0) {
      parts.push(`${elements.colors.join(' and ')} color palette`);
    }

    // 情绪和氛围
    if (elements.mood) {
      const moodNames = this.moods[elements.mood];
      parts.push(moodNames[moodNames.length - 1]);
    }

    // 光影
    if (elements.lighting) {
      const lightingNames = this.lighting[elements.lighting];
      parts.push(lightingNames[lightingNames.length - 1]);
    }

    const prompt = parts.join(', ');
    
    // 添加Midjourney特有的参数建议
    const params = [];
    if (styleAnalysis.dominantStyle === 'photorealistic') params.push('--style photographic');
    if (elements.composition === 'portrait') params.push('--ar 2:3');
    if (elements.composition === 'landscape') params.push('--ar 16:9');
    
    return {
      main: prompt,
      suggested_params: params.join(' '),
      full: `${prompt} ${params.join(' ')}`.trim()
    };
  }

  /**
   * 生成DALL-E格式的Prompt
   */
  generateDallEPrompt(elements, styleAnalysis) {
    const parts = [];

    // DALL-E偏好详细描述
    parts.push('A detailed');
    
    if (elements.style || styleAnalysis.dominantStyle) {
      const style = elements.style || styleAnalysis.dominantStyle;
      const styleNames = this.styleKeywords[style] || [style];
      parts.push(styleNames[styleNames.length - 1]);
    }

    if (elements.medium) {
      const mediumNames = this.mediums[elements.medium];
      parts.push(mediumNames[mediumNames.length - 1]);
    }

    parts.push('of');

    if (elements.subjects.length > 0) {
      parts.push(elements.subjects.join(' and '));
    }

    // 添加详细描述
    const details = [];
    if (elements.colors.length > 0) {
      details.push(`featuring ${elements.colors.join(' and ')} colors`);
    }
    
    if (elements.mood) {
      const moodNames = this.moods[elements.mood];
      details.push(`with a ${moodNames[moodNames.length - 1]} atmosphere`);
    }

    if (elements.lighting) {
      const lightingNames = this.lighting[elements.lighting];
      details.push(`illuminated by ${lightingNames[lightingNames.length - 1]}`);
    }

    if (details.length > 0) {
      parts.push(details.join(', '));
    }

    return {
      main: parts.join(' '),
      style_emphasis: styleAnalysis.dominantStyle,
      quality_level: 'high quality, professional, detailed'
    };
  }

  /**
   * 生成Stable Diffusion格式的Prompt
   */
  generateStableDiffusionPrompt(elements, styleAnalysis) {
    const positive = [];
    const negative = ['blurry', 'low quality', 'distorted', 'ugly', 'disfigured'];

    // 正面提示词
    if (elements.subjects.length > 0) {
      positive.push(...elements.subjects);
    }

    // 风格标签
    if (elements.style || styleAnalysis.dominantStyle) {
      const style = elements.style || styleAnalysis.dominantStyle;
      positive.push(style);
    }

    // 质量标签
    positive.push('masterpiece', 'best quality', 'highly detailed');

    // 媒介
    if (elements.medium) {
      const mediumNames = this.mediums[elements.medium];
      positive.push(mediumNames[mediumNames.length - 1]);
    }

    // 艺术家风格（如果检测到特定风格）
    if (styleAnalysis.dominantStyle === 'impressionist') {
      positive.push('monet style', 'renoir style');
      negative.push('photography');
    } else if (styleAnalysis.dominantStyle === 'abstract') {
      positive.push('kandinsky style', 'mondrian style');
      negative.push('realistic');
    }

    // 技术参数
    const technicalTags = ['8k', 'detailed', 'professional', 'artistic'];
    positive.push(...technicalTags);

    return {
      positive: positive.join(', '),
      negative: negative.join(', '),
      suggested_steps: 20,
      suggested_cfg: 7.5,
      suggested_sampler: 'DPM++ 2M Karras'
    };
  }

  /**
   * 生成通用格式的Prompt
   */
  generateGeneralPrompt(elements, styleAnalysis) {
    const description = [];

    if (elements.subjects.length > 0) {
      description.push(`主题：${elements.subjects.join('、')}`);
    }

    if (elements.style || styleAnalysis.dominantStyle) {
      const style = elements.style || styleAnalysis.dominantStyle;
      description.push(`风格：${style}`);
    }

    if (elements.medium) {
      description.push(`媒介：${elements.medium}`);
    }

    if (elements.colors.length > 0) {
      description.push(`色彩：${elements.colors.join('、')}`);
    }

    if (elements.mood) {
      description.push(`氛围：${elements.mood}`);
    }

    if (elements.lighting) {
      description.push(`光影：${elements.lighting}`);
    }

    if (elements.composition) {
      description.push(`构图：${elements.composition}`);
    }

    return {
      structured: description.join('\n'),
      natural: description.join('，'),
      tags: [
        ...elements.subjects,
        elements.style || styleAnalysis.dominantStyle,
        elements.medium,
        ...elements.colors,
        elements.mood,
        elements.lighting,
        elements.composition
      ].filter(Boolean).join(', ')
    };
  }

  /**
   * 生成技术参数建议
   */
  generateTechnicalParams(styleAnalysis) {
    const params = {
      midjourney: {
        aspect_ratio: '--ar 1:1',
        quality: '--q 2',
        stylize: '--s 750',
        chaos: '--chaos 0'
      },
      dalle: {
        size: '1024x1024',
        quality: 'hd',
        style: 'vivid'
      },
      stable_diffusion: {
        steps: 20,
        cfg_scale: 7.5,
        sampler: 'DPM++ 2M Karras',
        size: '512x512'
      }
    };

    // 根据风格调整参数
    if (styleAnalysis.dominantStyle === 'abstract') {
      params.midjourney.chaos = '--chaos 25';
      params.stable_diffusion.cfg_scale = 10;
    } else if (styleAnalysis.dominantStyle === 'photorealistic') {
      params.midjourney.stylize = '--s 250';
      params.stable_diffusion.steps = 30;
    }

    return params;
  }

  /**
   * 生成使用建议
   */
  generateRecommendations(styleAnalysis) {
    const recommendations = [];

    recommendations.push({
      title: '平台选择建议',
      content: this.getPlatformRecommendation(styleAnalysis.dominantStyle)
    });

    recommendations.push({
      title: '参数调整建议',
      content: this.getParameterRecommendation(styleAnalysis.dominantStyle)
    });

    recommendations.push({
      title: '提示词优化建议',
      content: this.getPromptOptimizationTips(styleAnalysis.dominantStyle)
    });

    return recommendations;
  }

  /**
   * 获取平台建议
   */
  getPlatformRecommendation(style) {
    const recommendations = {
      photorealistic: 'DALL-E 3或Midjourney V6，擅长写实风格',
      abstract: 'Stable Diffusion，对抽象艺术支持较好',
      impressionist: 'Midjourney，对艺术风格模拟出色',
      surreal: 'DALL-E 3，创意和想象力表现优秀',
      minimalist: 'Midjourney，简约风格效果佳',
      baroque: 'Stable Diffusion，复杂细节处理能力强'
    };

    return recommendations[style] || 'Midjourney（通用性较好）';
  }

  /**
   * 获取参数建议
   */
  getParameterRecommendation(style) {
    const recommendations = {
      photorealistic: '使用较低的 stylize 值和较高的 quality 设置',
      abstract: '增加 chaos 值，使用较高的 stylize 值',
      impressionist: '中等 stylize 值，注重色彩表现',
      surreal: '高 chaos 值，增加创意性',
      minimalist: '低 chaos 值，简洁的构图',
      baroque: '高质量设置，注重细节表现'
    };

    return recommendations[style] || '使用默认参数，根据结果调整';
  }

  /**
   * 获取提示词优化建议
   */
  getPromptOptimizationTips(style) {
    const tips = {
      photorealistic: '添加具体的相机和镜头描述，如"shot with Canon 5D"',
      abstract: '使用情感化的词汇，避免过于具体的描述',
      impressionist: '强调笔触和色彩，如"loose brushstrokes"',
      surreal: '结合矛盾元素，创造意外的组合',
      minimalist: '使用简洁的词汇，避免过多修饰',
      baroque: '强调装饰性和细节，如"ornate details"'
    };

    return tips[style] || '保持描述清晰简洁，避免相互矛盾的要求';
  }
}

export default PromptGeneratorService; 