/**
 * 古籍文献识别与处理服务
 * 提供古文注释、现代翻译、文献分析等功能
 */
class AncientTextProcessorService {
  constructor() {
    // 朝代时期定义
    this.dynasties = {
      pre_qin: {
        name: '先秦',
        period: '公元前221年以前',
        characteristics: ['古文字', '无标点', '简洁语法'],
        features: ['甲骨文', '金文', '篆书']
      },
      qin_han: {
        name: '秦汉',
        period: '公元前221年-公元220年',
        characteristics: ['隶书', '史书体', '官方文体'],
        features: ['史记', '汉书', '法律条文']
      },
      wei_jin: {
        name: '魏晋南北朝',
        period: '公元220年-589年',
        characteristics: ['楷书兴起', '骈文', '文学化'],
        features: ['诗赋', '志怪小说', '哲学著作']
      },
      tang_song: {
        name: '唐宋',
        period: '公元618年-1279年',
        characteristics: ['楷书成熟', '诗词繁荣', '理学兴起'],
        features: ['唐诗', '宋词', '理学著作']
      },
      yuan_ming_qing: {
        name: '元明清',
        period: '公元1279年-1912年',
        characteristics: ['白话文兴起', '小说繁荣', '考据学'],
        features: ['章回小说', '戏曲', '史料汇编']
      }
    };

    // 文体类型识别
    this.textTypes = {
      poetry: {
        name: '诗歌',
        patterns: ['韵律', '对仗', '平仄', '格律'],
        subtypes: ['古诗', '律诗', '绝句', '词', '曲']
      },
      prose: {
        name: '散文',
        patterns: ['议论', '叙述', '抒情'],
        subtypes: ['古文', '骈文', '记', '传', '序']
      },
      historical: {
        name: '史书',
        patterns: ['纪年', '传记', '志', '表'],
        subtypes: ['正史', '编年体', '纪传体', '典制']
      },
      philosophical: {
        name: '哲学',
        patterns: ['道理', '论证', '思辨'],
        subtypes: ['儒学', '道学', '佛学', '理学']
      },
      technical: {
        name: '技术文献',
        patterns: ['方法', '技艺', '工艺'],
        subtypes: ['医书', '农书', '工技', '算学']
      }
    };

    // 常见古文词汇和现代对应
    this.vocabularyMappings = {
      // 人称代词
      '吾': '我', '予': '我', '余': '我', '朕': '我',
      '汝': '你', '尔': '你', '子': '你',
      '其': '他/她/它', '之': '的/他/她/它',
      
      // 常用动词
      '曰': '说', '谓': '叫做/认为', '谓之': '叫做',
      '焉': '怎么/哪里', '何': '什么/哪里',
      '为': '是/做', '乃': '就是/于是',
      
      // 语气词
      '也': '啊/呀', '矣': '了', '哉': '啊',
      '乎': '吗/呢', '耶': '吗',
      
      // 时间词
      '昔': '从前', '今': '现在', '后': '以后',
      '朝': '早上', '夕': '晚上', '夜': '夜晚',
      
      // 地点词
      '此': '这里', '彼': '那里', '兹': '这里',
      '东': '东方', '西': '西方', '南': '南方', '北': '北方'
    };

    // 语法结构模式
    this.grammarPatterns = {
      // 判断句
      判断句: {
        patterns: ['...者，...也', '...，...也', '...乃...'],
        explanation: '古文中表示判断的句式'
      },
      
      // 被动句
      被动句: {
        patterns: ['为...所...', '被...', '见...于...'],
        explanation: '表示被动的句式'
      },
      
      // 倒装句
      宾语前置: {
        patterns: ['何...', '安...', '奚...'],
        explanation: '疑问代词作宾语时前置'
      },
      
      // 省略句
      省略句: {
        patterns: ['承前省略', '蒙后省略'],
        explanation: '省略主语、谓语或宾语的句式'
      }
    };
  }

  /**
   * 分析古籍文献
   */
  async processAncientText(recognitionContent, options = {}) {
    try {
      console.log('📜 开始分析古籍文献...');
      
      // 文本预处理
      const preprocessedText = this.preprocessText(recognitionContent);
      
      // 朝代识别
      const dynastyAnalysis = this.analyzeDynasty(preprocessedText);
      
      // 文体类型识别
      const textTypeAnalysis = this.analyzeTextType(preprocessedText);
      
      // 分句处理
      const sentences = this.segmentSentences(preprocessedText);
      
      // 逐句注释
      const annotations = await this.generateAnnotations(sentences);
      
      // 现代翻译
      const modernTranslation = await this.generateModernTranslation(sentences, annotations);
      
      // 语法分析
      const grammarAnalysis = this.analyzeGrammar(sentences);
      
      // 文学价值分析
      const literaryAnalysis = this.analyzeLiteraryValue(preprocessedText, textTypeAnalysis);
      
      // 生成学习建议
      const studyGuide = this.generateStudyGuide(dynastyAnalysis, textTypeAnalysis, annotations);
      
      return {
        success: true,
        analysis: {
          originalText: preprocessedText,
          dynasty: dynastyAnalysis,
          textType: textTypeAnalysis,
          sentences: sentences.length,
          annotations,
          modernTranslation,
          grammarAnalysis,
          literaryAnalysis,
          studyGuide,
          summary: {
            period: dynastyAnalysis.detected || '未知时期',
            genre: textTypeAnalysis.detected || '未知文体',
            difficulty: this.assessDifficulty(annotations),
            recommendedLevel: this.getRecommendedLevel(dynastyAnalysis, textTypeAnalysis)
          }
        }
      };
      
    } catch (error) {
      console.error('古籍文献分析失败:', error);
      return {
        success: false,
        error: error.message,
        analysis: null
      };
    }
  }

  /**
   * 文本预处理
   */
  preprocessText(content) {
    return content
      .replace(/\s+/g, '') // 移除多余空格
      .replace(/[，。！？；：]/g, match => match) // 保留中文标点
      .replace(/[,.\!?;:]/g, '') // 移除英文标点
      .trim();
  }

  /**
   * 朝代识别
   */
  analyzeDynasty(text) {
    const analysis = {
      detected: null,
      confidence: 0,
      evidence: [],
      characteristics: []
    };

    // 检查每个朝代的特征
    for (const [dynastyKey, dynasty] of Object.entries(this.dynasties)) {
      let matchScore = 0;
      const evidence = [];

      // 检查特征词汇
      dynasty.features.forEach(feature => {
        if (text.includes(feature)) {
          matchScore += 2;
          evidence.push(`包含"${feature}"`);
        }
      });

      // 检查文体特征
      dynasty.characteristics.forEach(char => {
        const patterns = this.getCharacteristicPatterns(char);
        patterns.forEach(pattern => {
          if (new RegExp(pattern).test(text)) {
            matchScore += 1;
            evidence.push(`符合${char}特征`);
          }
        });
      });

      if (matchScore > analysis.confidence) {
        analysis.detected = dynastyKey;
        analysis.confidence = matchScore;
        analysis.evidence = evidence;
        analysis.characteristics = dynasty.characteristics;
      }
    }

    // 计算置信度百分比
    analysis.confidencePercent = Math.min(Math.round((analysis.confidence / 10) * 100), 100);

    return analysis;
  }

  /**
   * 获取特征模式
   */
  getCharacteristicPatterns(characteristic) {
    const patterns = {
      '古文字': ['[甲金篆]', '象形', '会意'],
      '无标点': ['^[^，。！？；：]+$'],
      '简洁语法': ['..之..', '..者..也', '..乃..'],
      '隶书': ['隶', '汉'],
      '楷书': ['楷', '正'],
      '骈文': ['..而..', '四六'],
      '韵律': ['..兮', '平仄'],
      '对仗': ['工对', '流水对']
    };
    
    return patterns[characteristic] || [];
  }

  /**
   * 文体类型识别
   */
  analyzeTextType(text) {
    const analysis = {
      detected: null,
      confidence: 0,
      subtype: null,
      features: []
    };

    for (const [typeKey, textType] of Object.entries(this.textTypes)) {
      let matchScore = 0;
      const features = [];

      // 检查模式匹配
      textType.patterns.forEach(pattern => {
        if (text.includes(pattern)) {
          matchScore += 2;
          features.push(pattern);
        }
      });

      // 检查结构特征
      const structureScore = this.checkStructuralFeatures(text, textType);
      matchScore += structureScore;

      if (matchScore > analysis.confidence) {
        analysis.detected = typeKey;
        analysis.confidence = matchScore;
        analysis.features = features;
        
        // 检测子类型
        analysis.subtype = this.detectSubtype(text, textType.subtypes);
      }
    }

    return analysis;
  }

  /**
   * 检查结构特征
   */
  checkStructuralFeatures(text, textType) {
    let score = 0;
    
    if (textType.name === '诗歌') {
      // 检查韵律和格律
      const lines = text.split(/[。！？]/);
      if (lines.length >= 4 && lines.every(line => line.length >= 4 && line.length <= 10)) {
        score += 3; // 符合诗歌行数和字数特征
      }
    } else if (textType.name === '史书') {
      // 检查年号、人名等
      if (/[元年|二年|三年]/.test(text) || /[王|帝|公|侯]/.test(text)) {
        score += 2;
      }
    }

    return score;
  }

  /**
   * 检测子类型
   */
  detectSubtype(text, subtypes) {
    for (const subtype of subtypes) {
      if (this.matchesSubtype(text, subtype)) {
        return subtype;
      }
    }
    return null;
  }

  /**
   * 匹配子类型
   */
  matchesSubtype(text, subtype) {
    const subtypePatterns = {
      '律诗': [/^.{5,7}[，。].{5,7}[，。].{5,7}[，。].{5,7}[。！？]$/],
      '绝句': [/^.{5,7}[，。].{5,7}[。！？]$/],
      '记': [/记$/, /记曰/],
      '传': [/传$/, /传曰/],
      '正史': [/史$/, /记$/],
      '儒学': [/仁|义|礼|智|信|孔|孟/],
      '道学': [/道|德|无为|自然|老|庄/]
    };

    const patterns = subtypePatterns[subtype];
    return patterns && patterns.some(pattern => pattern.test(text));
  }

  /**
   * 分句处理
   */
  segmentSentences(text) {
    // 根据古文标点分句
    const sentences = text.split(/[。！？]/).filter(s => s.trim().length > 0);
    
    return sentences.map((sentence, index) => ({
      id: index + 1,
      original: sentence.trim(),
      length: sentence.trim().length,
      complexity: this.assessSentenceComplexity(sentence)
    }));
  }

  /**
   * 评估句子复杂度
   */
  assessSentenceComplexity(sentence) {
    let complexity = 0;
    
    // 长度因素
    if (sentence.length > 20) complexity += 2;
    else if (sentence.length > 10) complexity += 1;
    
    // 语法结构因素
    if (/..者..也/.test(sentence)) complexity += 1;
    if (/..所../.test(sentence)) complexity += 1;
    if (/..之../.test(sentence)) complexity += 1;
    
    // 生僻词因素
    const rareChars = sentence.match(/[韱鬰鬮鬯鬲]/g);
    if (rareChars) complexity += rareChars.length;
    
    return Math.min(complexity, 5); // 复杂度1-5级
  }

  /**
   * 生成注释
   */
  async generateAnnotations(sentences) {
    const annotations = [];
    
    for (const sentence of sentences) {
      const annotation = {
        sentenceId: sentence.id,
        original: sentence.original,
        wordAnnotations: this.annotateWords(sentence.original),
        grammarNotes: this.analyzeGrammarStructure(sentence.original),
        culturalNotes: this.addCulturalNotes(sentence.original),
        difficulty: sentence.complexity
      };
      
      annotations.push(annotation);
    }
    
    return annotations;
  }

  /**
   * 词汇注释
   */
  annotateWords(sentence) {
    const annotations = [];
    
    // 逐字分析
    for (let i = 0; i < sentence.length; i++) {
      const char = sentence[i];
      const twoChar = sentence.substr(i, 2);
      const threeChar = sentence.substr(i, 3);
      
      // 检查三字词
      if (this.vocabularyMappings[threeChar]) {
        annotations.push({
          position: i,
          original: threeChar,
          modern: this.vocabularyMappings[threeChar],
          type: 'phrase',
          explanation: this.getWordExplanation(threeChar)
        });
        i += 2; // 跳过已处理的字符
        continue;
      }
      
      // 检查双字词
      if (this.vocabularyMappings[twoChar]) {
        annotations.push({
          position: i,
          original: twoChar,
          modern: this.vocabularyMappings[twoChar],
          type: 'word',
          explanation: this.getWordExplanation(twoChar)
        });
        i += 1; // 跳过已处理的字符
        continue;
      }
      
      // 检查单字
      if (this.vocabularyMappings[char]) {
        annotations.push({
          position: i,
          original: char,
          modern: this.vocabularyMappings[char],
          type: 'character',
          explanation: this.getWordExplanation(char)
        });
      }
    }
    
    return annotations;
  }

  /**
   * 获取词汇解释
   */
  getWordExplanation(word) {
    const explanations = {
      '吾': '第一人称代词，相当于现代汉语的"我"',
      '汝': '第二人称代词，相当于现代汉语的"你"',
      '其': '第三人称代词，可指人或物',
      '曰': '动词，表示"说话"的意思',
      '也': '语气助词，表示肯定或感叹',
      '矣': '语气助词，表示完成或感叹',
      '乎': '语气助词，表示疑问或感叹'
    };
    
    return explanations[word] || '古汉语词汇，需结合语境理解';
  }

  /**
   * 语法结构分析
   */
  analyzeGrammarStructure(sentence) {
    const notes = [];
    
    for (const [patternName, pattern] of Object.entries(this.grammarPatterns)) {
      pattern.patterns.forEach(p => {
        if (new RegExp(p.replace(/\.\.\./g, '.+')).test(sentence)) {
          notes.push({
            pattern: patternName,
            structure: p,
            explanation: pattern.explanation,
            example: sentence
          });
        }
      });
    }
    
    return notes;
  }

  /**
   * 添加文化注释
   */
  addCulturalNotes(sentence) {
    const notes = [];
    
    // 检查历史人物
    const historicalFigures = ['孔子', '老子', '庄子', '孟子', '荀子', '墨子'];
    historicalFigures.forEach(figure => {
      if (sentence.includes(figure)) {
        notes.push({
          type: 'historical_figure',
          term: figure,
          explanation: this.getHistoricalFigureInfo(figure)
        });
      }
    });
    
    // 检查典故
    const allusions = ['桃李', '青梅竹马', '画龙点睛', '杞人忧天'];
    allusions.forEach(allusion => {
      if (sentence.includes(allusion)) {
        notes.push({
          type: 'allusion',
          term: allusion,
          explanation: this.getAllusionInfo(allusion)
        });
      }
    });
    
    return notes;
  }

  /**
   * 获取历史人物信息
   */
  getHistoricalFigureInfo(figure) {
    const info = {
      '孔子': '春秋时期思想家、教育家，儒家学派创始人',
      '老子': '春秋时期思想家，道家学派创始人',
      '庄子': '战国时期思想家，道家学派重要代表',
      '孟子': '战国时期思想家，儒家学派重要代表'
    };
    
    return info[figure] || '重要历史人物';
  }

  /**
   * 获取典故信息
   */
  getAllusionInfo(allusion) {
    const info = {
      '桃李': '比喻学生，出自《韩诗外传》',
      '青梅竹马': '比喻男女儿时的亲密感情',
      '画龙点睛': '比喻关键的一笔或话语使全局生动',
      '杞人忧天': '比喻不必要的担心'
    };
    
    return info[allusion] || '重要典故或成语';
  }

  /**
   * 生成现代翻译
   */
  async generateModernTranslation(sentences, annotations) {
    const translations = [];
    
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      const annotation = annotations[i];
      
      let modernText = sentence.original;
      
      // 应用词汇转换
      annotation.wordAnnotations.forEach(wordAnnotation => {
        modernText = modernText.replace(
          wordAnnotation.original, 
          wordAnnotation.modern
        );
      });
      
      // 调整语序和语法
      modernText = this.adjustModernGrammar(modernText, annotation.grammarNotes);
      
      // 添加标点符号
      modernText = this.addModernPunctuation(modernText);
      
      translations.push({
        sentenceId: sentence.id,
        original: sentence.original,
        modern: modernText,
        translationType: this.getTranslationType(annotation),
        confidence: this.calculateTranslationConfidence(annotation)
      });
    }
    
    return {
      fullTranslation: translations.map(t => t.modern).join(''),
      sentences: translations,
      overallConfidence: Math.round(
        translations.reduce((sum, t) => sum + t.confidence, 0) / translations.length
      )
    };
  }

  /**
   * 调整现代语法
   */
  adjustModernGrammar(text, grammarNotes) {
    // 处理判断句
    text = text.replace(/(.+)者，(.+)也/g, '$1就是$2');
    text = text.replace(/(.+)，(.+)也/g, '$1是$2');
    
    // 处理被动句
    text = text.replace(/为(.+)所(.+)/g, '被$1$2');
    
    // 处理疑问句
    text = text.replace(/何(.+)/g, '什么$1');
    text = text.replace(/安(.+)/g, '怎么$1');
    
    return text;
  }

  /**
   * 添加现代标点
   */
  addModernPunctuation(text) {
    // 简单的标点调整
    text = text.replace(/然/g, '，然而');
    text = text.replace(/故/g, '，所以');
    text = text.replace(/而/g, '，而');
    
    return text;
  }

  /**
   * 获取翻译类型
   */
  getTranslationType(annotation) {
    if (annotation.difficulty <= 2) return 'literal'; // 直译
    if (annotation.difficulty <= 4) return 'interpretive'; // 意译
    return 'free'; // 自由翻译
  }

  /**
   * 计算翻译置信度
   */
  calculateTranslationConfidence(annotation) {
    let confidence = 100;
    
    // 根据复杂度降低置信度
    confidence -= annotation.difficulty * 10;
    
    // 根据注释覆盖度调整
    const coverageRatio = annotation.wordAnnotations.length / annotation.original.length;
    confidence = Math.max(confidence * coverageRatio, 60);
    
    return Math.round(confidence);
  }

  /**
   * 语法分析
   */
  analyzeGrammar(sentences) {
    const analysis = {
      patterns: {},
      complexity: 0,
      features: []
    };
    
    sentences.forEach(sentence => {
      // 统计语法模式
      for (const [patternName, pattern] of Object.entries(this.grammarPatterns)) {
        pattern.patterns.forEach(p => {
          if (new RegExp(p.replace(/\.\.\./g, '.+')).test(sentence.original)) {
            analysis.patterns[patternName] = (analysis.patterns[patternName] || 0) + 1;
          }
        });
      }
    });
    
    // 计算整体复杂度
    analysis.complexity = sentences.reduce((sum, s) => sum + s.complexity, 0) / sentences.length;
    
    // 提取特征
    analysis.features = Object.keys(analysis.patterns).map(pattern => ({
      pattern,
      count: analysis.patterns[pattern],
      description: this.grammarPatterns[pattern].explanation
    }));
    
    return analysis;
  }

  /**
   * 文学价值分析
   */
  analyzeLiteraryValue(text, textTypeAnalysis) {
    const analysis = {
      artisticValue: 0,
      historicalValue: 0,
      educationalValue: 0,
      characteristics: [],
      themes: []
    };
    
    // 艺术价值评估
    if (textTypeAnalysis.detected === 'poetry') {
      analysis.artisticValue += 30;
      analysis.characteristics.push('具有韵律美');
    }
    
    // 历史价值评估
    if (textTypeAnalysis.detected === 'historical') {
      analysis.historicalValue += 40;
      analysis.characteristics.push('具有史料价值');
    }
    
    // 教育价值评估
    if (textTypeAnalysis.detected === 'philosophical') {
      analysis.educationalValue += 35;
      analysis.characteristics.push('具有思想教育意义');
    }
    
    // 主题分析
    const themes = this.extractThemes(text);
    analysis.themes = themes;
    
    return analysis;
  }

  /**
   * 主题提取
   */
  extractThemes(text) {
    const themeKeywords = {
      '修身养性': ['德', '仁', '义', '礼', '智', '信'],
      '治国理政': ['政', '法', '民', '君', '臣', '国'],
      '人生哲理': ['生', '死', '命', '运', '道', '理'],
      '自然美景': ['山', '水', '花', '鸟', '月', '风'],
      '离别思乡': ['别', '思', '乡', '家', '归', '远']
    };
    
    const themes = [];
    for (const [theme, keywords] of Object.entries(themeKeywords)) {
      const matchCount = keywords.filter(keyword => text.includes(keyword)).length;
      if (matchCount >= 2) {
        themes.push({
          theme,
          relevance: Math.round((matchCount / keywords.length) * 100),
          matchedKeywords: keywords.filter(keyword => text.includes(keyword))
        });
      }
    }
    
    return themes;
  }

  /**
   * 生成学习建议
   */
  generateStudyGuide(dynastyAnalysis, textTypeAnalysis, annotations) {
    const guide = {
      studyPlan: [],
      focusPoints: [],
      resources: [],
      exercises: []
    };
    
    // 根据难度制定学习计划
    const avgDifficulty = annotations.reduce((sum, a) => sum + a.difficulty, 0) / annotations.length;
    
    if (avgDifficulty <= 2) {
      guide.studyPlan.push('适合初学者，可以从基础词汇开始');
      guide.focusPoints.push('重点掌握常用古文词汇');
    } else if (avgDifficulty <= 4) {
      guide.studyPlan.push('适合中等水平学习者，需要掌握语法结构');
      guide.focusPoints.push('重点理解古文语法特点');
    } else {
      guide.studyPlan.push('适合高级学习者，需要深入理解文化背景');
      guide.focusPoints.push('重点掌握文化典故和深层含义');
    }
    
    // 推荐学习资源
    guide.resources.push('《古代汉语词典》');
    guide.resources.push('《古文观止》');
    
    if (dynastyAnalysis.detected) {
      const dynastyName = this.dynasties[dynastyAnalysis.detected].name;
      guide.resources.push(`《${dynastyName}文学史》`);
    }
    
    // 练习建议
    guide.exercises.push('逐句翻译练习');
    guide.exercises.push('关键词汇记忆');
    guide.exercises.push('语法结构分析');
    
    return guide;
  }

  /**
   * 评估难度
   */
  assessDifficulty(annotations) {
    const avgDifficulty = annotations.reduce((sum, a) => sum + a.difficulty, 0) / annotations.length;
    
    if (avgDifficulty <= 2) return '入门';
    if (avgDifficulty <= 3) return '初级';
    if (avgDifficulty <= 4) return '中级';
    return '高级';
  }

  /**
   * 获取推荐学习水平
   */
  getRecommendedLevel(dynastyAnalysis, textTypeAnalysis) {
    const levels = {
      'pre_qin': '高级',
      'qin_han': '中级',
      'wei_jin': '中级',
      'tang_song': '初级',
      'yuan_ming_qing': '入门'
    };
    
    return levels[dynastyAnalysis.detected] || '中级';
  }
}

export default AncientTextProcessorService; 