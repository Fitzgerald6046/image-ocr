import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import ImageClassifierService from './imageClassifier.js';
import ReceiptValidatorService from './receiptValidator.js';
import PromptGeneratorService from './promptGenerator.js';
import IdCardValidatorService from './idCardValidator.js';
import TableAnalyzerService from './tableAnalyzer.js';
import AncientTextProcessorService from './ancientTextProcessor.js';
import proxyConfig from '../utils/proxyConfig.js';

// 网络配置优化 - 使用新的动态代理配置
const createAxiosConfig = () => {
  const config = {
    timeout: 60000, // 60秒超时
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  };
  
  // 使用新的代理配置
  const axiosProxyConfig = proxyConfig.getAxiosConfig();
  Object.assign(config, axiosProxyConfig);
  
  // 记录代理状态（仅在开发环境）
  if (process.env.NODE_ENV !== 'production') {
    proxyConfig.logProxyStatus();
  }
  
  return config;
};

// 识别类型到提示词的映射 - 优化为更简洁的版本，减少token消耗
const RECOGNITION_PROMPTS = {
  auto: "请识别图片中的文字，或描述图片内容。",
  ancient: "识别古籍中的文字内容。",
  receipt: "提取票据中的商家、金额、日期等信息。",
  document: "识别文档中的文字内容。",
  poetry: "识别诗歌内容。",
  shopping: "提取购物小票信息。",
  artwork: "描述艺术作品内容和特点。",
  id: "识别证件中的关键信息。",
  table: "提取表格数据。",
  handwriting: "识别手写文字。",
  prompt: "为这张图片生成AI绘图提示词。",
  translate: "识别文字并翻译为中文。"
};

class AIModelService {
  constructor() {
    this.providers = {
      gemini: this.callGeminiAPI.bind(this),
      openrouter: this.callOpenRouterAPI.bind(this),
      deepseek: this.callDeepSeekAPI.bind(this),
      openai: this.callOpenAIAPI.bind(this),
      claude: this.callClaudeAPI.bind(this),
      custom: this.callCustomAPI.bind(this),
      'custom-gemini': this.callCustomGeminiAPI.bind(this),
      'custom-openai': this.callCustomOpenAIAPI.bind(this),
      'custom-claude': this.callCustomClaudeAPI.bind(this)
    };
    
    // 初始化图片智能分类服务
    this.imageClassifier = new ImageClassifierService();
    
    // 初始化购物小票智能校验服务
    this.receiptValidator = new ReceiptValidatorService();
    
    // 初始化AI图片生成Prompt服务
    this.promptGenerator = new PromptGeneratorService();
    
    // 初始化证件识别与验证服务
    this.idCardValidator = new IdCardValidatorService();
    
    // 初始化表格分析服务
    this.tableAnalyzer = new TableAnalyzerService();
    
    // 初始化古籍文献处理服务
    this.ancientTextProcessor = new AncientTextProcessorService();
  }

  // 主要的识别方法
  async recognizeImage(imagePath, modelConfig, recognitionType = 'auto', customPrompt = null) {
    try {
      console.log('🔍 开始识别图片，配置:', JSON.stringify(modelConfig, null, 2));
      
      // 优先使用配置中指定的提供商类型
      let providerId = modelConfig.provider || this.getProviderFromModel(modelConfig.model);
      console.log('🔍 初始提供商ID:', providerId);
      
      // 如果是自定义提供商，根据API URL判断实际类型
      if (providerId === 'custom' || modelConfig.isCustom) {
        console.log('🔍 检测到自定义提供商，进行进一步检测...');
        providerId = this.detectProviderFromConfig(modelConfig);
      }
      
      console.log('🔍 最终提供商ID:', providerId);
      const provider = this.providers[providerId];
      console.log('🔍 找到提供商方法:', !!provider);
      
      if (!provider) {
        throw new Error(`不支持的AI提供商: ${providerId}`);
      }

      let prompt = customPrompt || RECOGNITION_PROMPTS[recognitionType] || RECOGNITION_PROMPTS.auto;
      let classificationResult = null;
      
      // 如果是智能识别模式，先进行图片分类
      if (recognitionType === 'auto' && imagePath && !customPrompt) {
        console.log('🧠 启动智能分类模式...');
        try {
          classificationResult = await this.imageClassifier.classifyImage(imagePath, modelConfig);
          console.log('📋 智能分类结果:', classificationResult);
          
          // 使用优化的提示词
          if (classificationResult.optimizedPrompt) {
            prompt = classificationResult.optimizedPrompt;
            console.log('✨ 使用优化提示词进行识别');
          }
        } catch (classifyError) {
          console.warn('⚠️ 智能分类失败，使用默认识别:', classifyError.message);
        }
      }
      
      console.log(`🤖 使用 ${providerId} 模型 ${modelConfig.model} 进行识别...`);
      console.log(`🔍 提供商检测结果: ${providerId} (原始: ${modelConfig.provider || 'auto'})`);
      
      const result = await provider(imagePath, modelConfig, prompt);
      
      // 应用语言处理（如果需要）
      let processedContent = result.content;
      if (classificationResult?.needsLanguageProcessing) {
        console.log('🌐 应用语言处理...');
        try {
          processedContent = await this.imageClassifier.applyLanguageProcessing(
            result.content, 
            { 
              traditional_to_simplified: true,
              auto_translate: false,
              modelConfig 
            }
          );
        } catch (langError) {
          console.warn('⚠️ 语言处理失败:', langError.message);
        }
      }
      
      // 应用特殊分析（根据检测类型）
      let specialAnalysis = null;
      if (classificationResult) {
        const detectedType = classificationResult.detectedType;
        
        // 购物小票智能校验
        if (detectedType === 'shopping' || recognitionType === 'shopping') {
          console.log('🛒 启动购物小票智能校验...');
          try {
            specialAnalysis = await this.receiptValidator.analyzeReceipt(processedContent);
            console.log('✅ 购物小票分析完成');
          } catch (receiptError) {
            console.warn('⚠️ 购物小票分析失败:', receiptError.message);
          }
        }
        
        // AI绘图Prompt生成
        if (detectedType === 'artwork' || recognitionType === 'artwork' || recognitionType === 'prompt') {
          console.log('🎨 启动AI绘图Prompt生成...');
          try {
            specialAnalysis = await this.promptGenerator.generatePrompts(processedContent, detectedType);
            console.log('✅ AI绘图Prompt生成完成');
          } catch (promptError) {
            console.warn('⚠️ Prompt生成失败:', promptError.message);
          }
        }
        
        // 证件识别与验证
        if (detectedType === 'id' || recognitionType === 'id') {
          console.log('🆔 启动证件识别与验证...');
          try {
            specialAnalysis = await this.idCardValidator.analyzeIdCard(processedContent, {
              privacyLevel: 'medium',
              keepOriginal: false
            });
            console.log('✅ 证件识别与验证完成');
          } catch (idError) {
            console.warn('⚠️ 证件验证失败:', idError.message);
          }
        }
        
        // 表格数据分析
        if (detectedType === 'table' || recognitionType === 'table') {
          console.log('📊 启动表格数据分析...');
          try {
            specialAnalysis = await this.tableAnalyzer.analyzeTable(processedContent, {
              encoding: 'utf-8',
              delimiter: ',',
              includeHeaders: true
            });
            console.log('✅ 表格数据分析完成');
          } catch (tableError) {
            console.warn('⚠️ 表格分析失败:', tableError.message);
          }
        }
        
        // 古籍文献处理
        if (detectedType === 'ancient' || recognitionType === 'ancient') {
          console.log('📜 启动古籍文献处理...');
          try {
            specialAnalysis = await this.ancientTextProcessor.processAncientText(processedContent);
            console.log('✅ 古籍文献处理完成');
          } catch (ancientError) {
            console.warn('⚠️ 古籍文献处理失败:', ancientError.message);
          }
        }
      }
      
      return {
        success: true,
        result: {
          content: processedContent,
          originalContent: result.content !== processedContent ? result.content : undefined,
          confidence: result.confidence || 0.9,
          model: modelConfig.model,
          provider: providerId,
          recognitionType,
          timestamp: new Date().toISOString(),
          metadata: result.metadata || {},
          classification: classificationResult ? {
            detectedType: classificationResult.detectedType,
            confidence: classificationResult.confidence,
            reasoning: classificationResult.reasoning,
            suggestedOptions: classificationResult.suggestedOptions
          } : null,
          specialAnalysis: specialAnalysis // 添加特殊分析结果
        }
      };

    } catch (error) {
      console.error('Recognition error:', error);
      throw new Error(`识别失败: ${error.message}`);
    }
  }

  // 根据模型名称确定提供商（回退方法）
  getProviderFromModel(modelName) {
    if (modelName.includes('gemini')) return 'gemini';
    if (modelName.includes('deepseek')) return 'deepseek';
    if (modelName.includes('gpt')) return 'openai';
    if (modelName.includes('google/') || modelName.includes('meta-llama/') || modelName.includes('mistralai/')) return 'openrouter';
    
    // 默认返回自定义提供商
    return 'custom';
  }

  // 根据配置检测提供商类型
  detectProviderFromConfig(config) {
    const apiUrl = config.apiUrl.toLowerCase();
    
    // 根据API URL检测实际提供商类型
    if (apiUrl.includes('generativelanguage.googleapis.com') || 
        apiUrl.includes('googleapis.com')) {
      console.log('🔍 检测到官方Gemini API URL，使用gemini提供商');
      return 'gemini';
    }
    
    if (apiUrl.includes('openrouter.ai')) {
      console.log('🔍 检测到OpenRouter API URL，使用openrouter提供商');
      return 'openrouter';
    }
    
    if (apiUrl.includes('deepseek.com')) {
      console.log('🔍 检测到DeepSeek API URL，使用deepseek提供商');
      return 'deepseek';
    }
    
    if (apiUrl.includes('openai.com')) {
      console.log('🔍 检测到OpenAI API URL，使用openai提供商');
      return 'openai';
    }
    
    if (apiUrl.includes('anthropic.com')) {
      console.log('🔍 检测到Claude API URL，使用claude提供商');
      return 'claude';
    }
    
    // 对于自定义中转API，尝试检测API格式
    console.log('🔍 检测到自定义API URL，分析API格式...');
    
    // 如果URL包含某些关键词，可能是特定格式的中转
    if (apiUrl.includes('gemini') || config.model.toLowerCase().includes('gemini')) {
      console.log('🔍 检测到Gemini格式的中转API');
      return 'custom-gemini';
    }
    
    if (apiUrl.includes('openai') || apiUrl.includes('chat/completions')) {
      console.log('🔍 检测到OpenAI格式的中转API');
      return 'custom-openai';
    }
    
    // 默认使用通用自定义格式
    console.log('🔍 使用通用自定义格式');
    return 'custom';
  }

  // Gemini API调用
  async callGeminiAPI(imagePath, config, prompt) {
    try {
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      
      // 检查图片大小和识别类型，动态调整token限制
      const imageSizeKB = imageBuffer.length / 1024;
      const isLargeImage = imageSizeKB > 500; // 大于500KB认为是复杂图片
      const isTableRecognition = prompt.includes('表格') || prompt.includes('table') || prompt.includes('数据结构');
      
      // 构造正确的API URL - 如果config.apiUrl已经包含models路径，就不要重复添加
      let apiUrl;
      if (config.apiUrl.endsWith('/models')) {
        apiUrl = `${config.apiUrl}/${config.model}:generateContent`;
      } else {
        apiUrl = `${config.apiUrl}/models/${config.model}:generateContent`;
      }
      
      console.log('🔗 Gemini API请求信息:');
      console.log('   请求URL:', apiUrl);
      console.log('   模型名称:', config.model);
      console.log('   图片大小:', `${imageSizeKB.toFixed(1)}KB`);
      console.log('   表格识别:', isTableRecognition ? '是 (使用16384 tokens)' : '否');
      
      const requestData = {
        contents: [{
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: this.getMimeType(imagePath),
                data: base64Image
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: isTableRecognition ? 16384 : (isLargeImage ? 8192 : 4096),
          topP: 0.8,
          topK: 40
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH", 
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      };

      const axiosConfig = createAxiosConfig();
      const response = await axios.post(apiUrl, requestData, {
        ...axiosConfig,
        headers: {
          ...axiosConfig.headers,
          'Content-Type': 'application/json',
          'x-goog-api-key': config.apiKey
        }  // 增加到60秒
      });

      // 添加详细的响应日志
      console.log(`📏 图片大小: ${imageSizeKB.toFixed(1)}KB, 使用${isLargeImage ? '高' : '标准'}token限制`);
      console.log('📋 Gemini API 完整响应:', JSON.stringify(response.data, null, 2));
      
      if (response.data.candidates && response.data.candidates.length > 0) {
        const candidate = response.data.candidates[0];
        console.log('🔍 第一个候选:', JSON.stringify(candidate, null, 2));
        
        let content = '';
        
        // 处理多种可能的响应结构
        if (candidate.content) {
          if (candidate.content.parts && candidate.content.parts.length > 0) {
            // 标准结构：content.parts[0].text
            content = candidate.content.parts[0].text;
          } else if (typeof candidate.content === 'string') {
            // 简化结构：content直接是字符串
            content = candidate.content;
          } else if (candidate.content.text) {
            // 备用结构：content.text
            content = candidate.content.text;
          } else {
            // content对象存在但结构异常，可能是模型被限制或达到token限制
            console.warn('⚠️ Gemini返回了异常的content结构:', candidate.content);
            if (candidate.finishReason === 'MAX_TOKENS') {
              content = '响应因达到最大token限制而被截断，请尝试使用更简单的提示词或降低图片复杂度。';
            } else {
              content = `模型响应异常 (${candidate.finishReason || 'unknown reason'})`;
            }
          }
        } else if (candidate.text) {
          // 备选方案：直接text字段
          content = candidate.text;
        } else if (candidate.output) {
          // 备选方案：output字段
          content = candidate.output;
        } else {
          // 完全无法解析的情况
          console.error('❌ 无法解析候选响应结构:', candidate);
          if (candidate.finishReason === 'MAX_TOKENS') {
            content = '响应因达到最大token限制而被截断，这可能是由于图片过于复杂或包含大量文字。建议简化输入或使用更高token限制的模型。';
          } else if (candidate.finishReason === 'SAFETY') {
            content = '响应被安全过滤器阻止，请检查图片内容是否符合使用政策。';
          } else {
            throw new Error(`无法解析Gemini API响应结构，结束原因: ${candidate.finishReason || 'unknown'}`);
          }
        }
        
        return {
          content,
          confidence: content.includes('响应异常') || content.includes('被截断') ? 0.3 : 0.9,
          metadata: {
            finishReason: candidate.finishReason || 'unknown',
            usage: response.data.usageMetadata || {}
          }
        };
      } else {
        console.error('❌ Gemini API返回空候选列表:', response.data);
        throw new Error('Gemini API返回了空结果');
      }

    } catch (error) {
      if (error.response) {
        console.error('❌ Gemini API错误详情:');
        console.error('   状态码:', error.response.status);
        console.error('   状态文本:', error.response.statusText);
        console.error('   响应头:', JSON.stringify(error.response.headers, null, 2));
        console.error('   响应数据:', JSON.stringify(error.response.data, null, 2));
        
        const errorMessage = error.response.data?.error?.message || 
                           error.response.data?.message || 
                           error.response.statusText || 
                           '未知错误';
        throw new Error(`Gemini API错误: ${errorMessage}`);
      } else if (error.request) {
        console.error('❌ 网络请求错误:', error.request);
        throw new Error(`网络请求失败: ${error.message}`);
      } else {
        console.error('❌ 其他错误:', error.message);
        throw new Error(`请求配置错误: ${error.message}`);
      }
    }
  }

  // DeepSeek API调用
  async callDeepSeekAPI(imagePath, config, prompt) {
    try {
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      
      // 检测是否为表格识别，动态调整token数量
      const isTableRecognition = prompt.includes('表格') || prompt.includes('table') || prompt.includes('数据结构');
      
      const apiUrl = `${config.apiUrl}/chat/completions`;
      
      const requestData = {
        model: config.model,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:${this.getMimeType(imagePath)};base64,${base64Image}`
                }
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: isTableRecognition ? 16384 : 4096
      };

      const response = await axios.post(apiUrl, requestData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        timeout: 60000  // 增加到60秒
      });

      if (response.data.choices && response.data.choices[0]) {
        const content = response.data.choices[0].message.content;
        return {
          content,
          confidence: 0.9,
          metadata: {
            finishReason: response.data.choices[0].finish_reason,
            usage: response.data.usage
          }
        };
      } else {
        throw new Error('DeepSeek API返回了空结果');
      }

    } catch (error) {
      if (error.response) {
        console.error('DeepSeek API Error:', error.response.data);
        throw new Error(`DeepSeek API错误: ${error.response.data.error?.message || '未知错误'}`);
      }
      throw error;
    }
  }

  // OpenRouter API调用
  async callOpenRouterAPI(imagePath, config, prompt) {
    try {
      console.log('🌐 使用OpenRouter API进行识别');
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      
      // 检测是否为表格识别，动态调整token数量
      const isTableRecognition = prompt.includes('表格') || prompt.includes('table') || prompt.includes('数据结构');
      console.log('   表格识别:', isTableRecognition ? '是 (使用16384 tokens)' : '否');
      
      const apiUrl = `${config.apiUrl}/chat/completions`;
      
      const requestData = {
        model: config.model,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:${this.getMimeType(imagePath)};base64,${base64Image}`,
                  detail: "high"
                }
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: isTableRecognition ? 16384 : 4096
      };

      const response = await axios.post(apiUrl, requestData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
          'HTTP-Referer': 'https://localhost:3000',  // OpenRouter建议添加referer
          'X-Title': 'OneyOne OCR System'  // OpenRouter建议添加应用标识
        },
        timeout: 60000
      });

      console.log('📋 OpenRouter API响应:', JSON.stringify(response.data, null, 2));

      if (response.data.choices && response.data.choices[0]) {
        const content = response.data.choices[0].message.content;
        return {
          content,
          confidence: 0.9,
          metadata: {
            finishReason: response.data.choices[0].finish_reason,
            usage: response.data.usage,
            provider: 'openrouter'
          }
        };
      } else {
        throw new Error('OpenRouter API返回了空结果');
      }

    } catch (error) {
      if (error.response) {
        console.error('❌ OpenRouter API错误详情:');
        console.error('   状态码:', error.response.status);
        console.error('   状态文本:', error.response.statusText);
        console.error('   响应头:', JSON.stringify(error.response.headers, null, 2));
        console.error('   响应数据:', JSON.stringify(error.response.data, null, 2));
        
        const errorMessage = error.response.data?.error?.message || 
                           error.response.data?.message || 
                           error.response.statusText || 
                           '未知错误';
        throw new Error(`OpenRouter API错误: ${errorMessage}`);
      } else if (error.request) {
        console.error('❌ OpenRouter 网络请求错误:', error.request);
        throw new Error(`OpenRouter 网络请求失败: ${error.message}`);
      } else {
        console.error('❌ OpenRouter 其他错误:', error.message);
        throw new Error(`OpenRouter 请求配置错误: ${error.message}`);
      }
    }
  }

  // OpenAI API调用
  async callOpenAIAPI(imagePath, config, prompt) {
    try {
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      
      // 检测是否为表格识别，动态调整token数量
      const isTableRecognition = prompt.includes('表格') || prompt.includes('table') || prompt.includes('数据结构');
      
      const apiUrl = `${config.apiUrl}/chat/completions`;
      
      const requestData = {
        model: config.model,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:${this.getMimeType(imagePath)};base64,${base64Image}`,
                  detail: "high"
                }
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: isTableRecognition ? 16384 : 4096
      };

      const response = await axios.post(apiUrl, requestData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        timeout: 60000  // 增加到60秒
      });

      if (response.data.choices && response.data.choices[0]) {
        const content = response.data.choices[0].message.content;
        return {
          content,
          confidence: 0.9,
          metadata: {
            finishReason: response.data.choices[0].finish_reason,
            usage: response.data.usage
          }
        };
      } else {
        throw new Error('OpenAI API返回了空结果');
      }

    } catch (error) {
      if (error.response) {
        console.error('❌ OpenAI API错误详情:');
        console.error('   状态码:', error.response.status);
        console.error('   状态文本:', error.response.statusText);
        console.error('   响应头:', JSON.stringify(error.response.headers, null, 2));
        console.error('   响应数据:', JSON.stringify(error.response.data, null, 2));
        
        const errorMessage = error.response.data?.error?.message || 
                           error.response.data?.message || 
                           error.response.statusText || 
                           '未知错误';
        throw new Error(`OpenAI API错误: ${errorMessage}`);
      } else if (error.request) {
        console.error('❌ OpenAI 网络请求错误:', error.request);
        throw new Error(`OpenAI 网络请求失败: ${error.message}`);
      } else {
        console.error('❌ OpenAI 其他错误:', error.message);
        throw new Error(`OpenAI 请求配置错误: ${error.message}`);
      }
    }
  }

  // 获取文件的MIME类型
  getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
      '.bmp': 'image/bmp',
      '.tiff': 'image/tiff'
    };
    return mimeTypes[ext] || 'image/jpeg';
  }

  // 测试API连接
  async testConnection(config) {
    try {
      console.log('🧪 测试连接配置:', config);
      
      // 根据API URL判断提供商类型
      let providerId = 'custom'; // 默认为自定义
      let testUrl = config.apiUrl;
      let headers = {};
      
      if (config.apiUrl.includes('generativelanguage.googleapis.com')) {
        providerId = 'gemini';
        // 对于Gemini，如果API URL不包含具体端点，添加/models
        if (!config.apiUrl.includes('/models') && !config.apiUrl.includes(':generateContent')) {
          const baseUrl = config.apiUrl.endsWith('/') ? config.apiUrl.slice(0, -1) : config.apiUrl;
          testUrl = `${baseUrl}/models`;
        }
        headers = { 'x-goog-api-key': config.apiKey };
      } else if (config.apiUrl.includes('openrouter.ai')) {
        providerId = 'openrouter';
        // 对于OpenRouter，如果API URL不包含具体端点，添加/models
        if (!config.apiUrl.includes('/models') && !config.apiUrl.includes('/chat/completions')) {
          testUrl = `${config.apiUrl}/models`;
        }
        headers = { 
          'Authorization': `Bearer ${config.apiKey}`,
          'HTTP-Referer': 'https://localhost:3000',
          'X-Title': 'OneyOne OCR System'
        };
      } else if (config.apiUrl.includes('deepseek.com')) {
        providerId = 'deepseek';
        // 对于DeepSeek，如果API URL不包含具体端点，添加/models
        if (!config.apiUrl.includes('/models') && !config.apiUrl.includes('/chat/completions')) {
          testUrl = `${config.apiUrl}/models`;
        }
        headers = { 'Authorization': `Bearer ${config.apiKey}` };
      } else if (config.apiUrl.includes('anthropic.com')) {
        providerId = 'claude';
        // 对于Claude，使用简单的连接测试，因为Claude API需要POST请求
        // 我们只测试网络连通性，不测试具体的API端点
        testUrl = config.apiUrl.replace('/messages', ''); // 移除messages端点进行连通性测试
        headers = { 
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01'
        };
      } else {
        // 对于自定义提供商，直接使用用户提供的完整URL
        // 不添加任何端点，让用户指定完整的测试URL
        providerId = 'custom';
        testUrl = config.apiUrl;
        
        // 对于自定义提供商，尝试多种认证方式
        console.log('🔍 检测自定义提供商，尝试Bearer token认证...');
        headers = { 'Authorization': `Bearer ${config.apiKey}` };
        
        try {
          console.log('🔗 测试URL (Bearer):', testUrl);
          console.log('🔑 测试Headers (Bearer):', headers);
          
          const response = await axios.get(testUrl, {
            headers,
            timeout: 15000,
            validateStatus: (status) => status < 500
          });
          
          if (response.status === 200 || response.status === 403) {
            console.log('✅ Bearer token认证成功，状态:', response.status);
            return { success: true, message: '连接成功 (Bearer Token)' };
          }
        } catch (bearerError) {
          
          // 尝试API Key方式
          headers = { 'x-api-key': config.apiKey };
          
          try {
            
            const response = await axios.get(testUrl, {
              headers,
              timeout: 15000,
              validateStatus: (status) => status < 500
            });
            
            if (response.status === 200 || response.status === 403) {
              return { success: true, message: '连接成功 (API Key)' };
            }
          } catch (apikeyError) {
            
            // 尝试Google风格的API Key
            headers = { 'x-goog-api-key': config.apiKey };
            
            try {
              const response = await axios.get(testUrl, {
                headers,
                timeout: 15000,
                validateStatus: (status) => status < 500
              });
              
              if (response.status === 200 || response.status === 403) {
                return { success: true, message: '连接成功 (Google API Key)' };
              }
            } catch (googleError) {
              console.log('🔄 所有认证方式失败，使用最后一次错误...');
              throw googleError;
            }
          }
        }
      }
      
      console.log('🔍 检测到提供商类型:', providerId);
      console.log('🔗 测试URL:', testUrl);
      console.log('🔑 测试Headers:', headers);
      
      // 增加重试机制和更长超时时间
      let response;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          console.log(`🔄 尝试连接 (${retryCount + 1}/${maxRetries})...`);
          response = await axios.get(testUrl, {
            headers,
            timeout: 30000, // 增加到30秒
            validateStatus: (status) => status < 500
          });
          break; // 成功则退出循环
        } catch (retryError) {
          retryCount++;
          if (retryCount >= maxRetries) {
            throw retryError; // 重试次数用完，抛出错误
          }
          console.log(`⚠️ 连接失败，${2}秒后重试...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      if (response.status === 200 || response.status === 403) {
        console.log('✅ 连接测试成功，状态:', response.status);
        return { success: true, message: `连接成功 (${providerId})` };
      } else {
        console.log('❌ 连接测试失败，状态:', response.status);
        return { 
          success: false, 
          message: `HTTP ${response.status}: ${response.statusText}` 
        };
      }
      
    } catch (error) {
      console.error('❌ 连接测试异常:', error);
      
      // 提供更详细的错误信息
      let errorMessage = '连接失败';
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 401) {
          errorMessage = 'API密钥无效或已过期';
        } else if (status === 403) {
          errorMessage = data?.error?.message || 'API权限不足或密钥无效';
        } else if (status === 404) {
          errorMessage = 'API端点不存在，请检查API地址是否包含完整路径';
        } else if (status >= 500) {
          errorMessage = '服务器错误，请稍后重试';
        } else {
          errorMessage = data?.error?.message || `HTTP ${status}: ${error.response.statusText}`;
        }
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = '连接超时，请检查网络或API地址';
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = 'DNS解析失败，请检查API地址';
      } else {
        errorMessage = error.message || '未知错误';
      }
      
      return { 
        success: false, 
        message: errorMessage
      };
    }
  }
  // 自定义API调用（通用格式）
  async callCustomAPI(imagePath, config, prompt) {
    console.log('🔧 使用通用自定义API格式');
    
    // 默认尝试OpenAI格式
    try {
      return await this.callCustomOpenAIAPI(imagePath, config, prompt);
    } catch (openaiError) {
      console.log('🔄 OpenAI格式失败，尝试Gemini格式...');
      try {
        return await this.callCustomGeminiAPI(imagePath, config, prompt);
      } catch (geminiError) {
        console.error('❌ 所有格式都失败');
        throw new Error(`自定义API调用失败: OpenAI格式错误: ${openaiError.message}, Gemini格式错误: ${geminiError.message}`);
      }
    }
  }

  // 自定义Gemini格式API调用
  async callCustomGeminiAPI(imagePath, config, prompt) {
    try {
      console.log('🔧 使用自定义Gemini API格式');
      console.log('🔧 传入的配置:', JSON.stringify(config, null, 2));
      
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      
      // 检查图片大小和识别类型
      const imageSizeKB = imageBuffer.length / 1024;
      const isLargeImage = imageSizeKB > 500;
      const isTableRecognition = prompt.includes('表格') || prompt.includes('table') || prompt.includes('数据结构');
      
      // 构建API URL - 对于中转API直接使用提供的URL
      let apiUrl = config.apiUrl;
      
      // 检查是否为官方Google API或使用了标准路径的中转API
      // 特殊处理：try-gemini-play即使有/v1beta也需要特殊处理
      if ((apiUrl.includes('generativelanguage.googleapis.com') || apiUrl.includes('/v1beta')) && 
          !apiUrl.includes('try-gemini-play.deno.dev')) {
        console.log('🔧 检测到标准Gemini API格式');
        console.log('📋 原始URL:', config.apiUrl);
        console.log('📋 模型名称:', config.model);
        
        // 标准Gemini API格式，需要正确构建端点
        if (!apiUrl.includes(':generateContent')) {
          // 移除末尾的斜杠
          let baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
          
          // 确定使用的模型
          const modelName = config.model || 'gemini-pro';
          
          // 根据URL格式构建正确的端点
          if (baseUrl.endsWith('/v1beta/models')) {
            // 情况1: URL是 .../v1beta/models
            apiUrl = `${baseUrl}/${modelName}:generateContent`;
          } else if (baseUrl.endsWith('/v1beta')) {
            // 情况2: URL是 .../v1beta
            apiUrl = `${baseUrl}/models/${modelName}:generateContent`;
          } else if (baseUrl.includes('/v1beta/models/')) {
            // 情况3: URL已经包含了部分模型路径
            apiUrl = `${baseUrl}:generateContent`;
          } else {
            // 情况4: 其他情况，添加完整路径
            apiUrl = `${baseUrl}/models/${modelName}:generateContent`;
          }
        }
        
        console.log('📋 构建的最终URL:', apiUrl);
      } else {
        // 中转API，直接使用用户提供的URL，不添加路径
        console.log('🔧 检测到中转API，直接使用提供的URL:', apiUrl);
        
        // 如果用户在URL中已经包含了具体的端点，保持不变
        // 否则我们需要根据中转API的格式来构建
        
        // 常见的中转API格式检测
        if (apiUrl.includes('/v1/chat/completions')) {
          // OpenAI格式的中转，切换到OpenAI调用方式
          console.log('🔄 检测到OpenAI格式的中转API，切换调用方式');
          return await this.callCustomOpenAIAPI(imagePath, config, prompt);
        }
        
        // 对于特定的中转服务（如 try-gemini-play.deno.dev），使用直接调用方式
        if (apiUrl.includes('try-gemini-play.deno.dev')) {
          console.log('🔧 检测到try-gemini-play中转服务，跳过端点测试，直接使用配置的URL');
          console.log('🔧 将直接调用:', apiUrl);
          // 不进行端点测试，直接使用用户配置的URL
          // 这个服务可能有自己特殊的API格式，让它在实际请求时处理
        }
        
        // 对于其他中转API，尝试添加可能的端点路径
        else if (!apiUrl.includes('/models/') && !apiUrl.includes(':generateContent') && !apiUrl.includes('/api/') && !apiUrl.includes('/v1/')) {
          console.log('🔧 中转API检测到根URL，尝试常见的API端点...');
          
          // 尝试常见的API端点
          const possibleEndpoints = [
            '/api/generate',
            '/v1/chat/completions', 
            '/v1/models/generateContent',
            '/generateContent',
            '/api/v1/generate'
          ];
          
          for (const endpoint of possibleEndpoints) {
            const testUrl = apiUrl.endsWith('/') ? apiUrl + endpoint.slice(1) : apiUrl + endpoint;
            console.log(`🔍 尝试端点: ${testUrl}`);
            
            try {
              const testResponse = await axios.post(testUrl, {
                contents: [{
                  parts: [{ text: "test" }]
                }]
              }, {
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${config.apiKey}`
                },
                timeout: 10000
              });
              
              if (testResponse.status === 200 && testResponse.data && typeof testResponse.data === 'object') {
                console.log(`✅ 找到有效端点: ${testUrl}`);
                apiUrl = testUrl;
                break;
              }
            } catch (testError) {
              console.log(`❌ 端点 ${endpoint} 失败:`, testError.response?.status || testError.message);
              continue;
            }
          }
        }
      }
      
      // 构建请求数据 - 根据API类型选择格式
      let requestData;
      
      if ((apiUrl.includes('generativelanguage.googleapis.com') || apiUrl.includes('/v1beta')) && 
          !apiUrl.includes('try-gemini-play.deno.dev')) {
        // 官方Gemini API格式或标准格式的中转API（但不包括try-gemini-play）
        console.log('🔧 使用标准Gemini请求格式');
        requestData = {
          contents: [{
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: this.getMimeType(imagePath),
                  data: base64Image
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: isTableRecognition ? 16384 : (isLargeImage ? 8192 : 4096),
            topP: 0.8,
            topK: 40
          }
        };
      } else {
        // 中转API - 尝试多种格式
        console.log('🔧 构建中转API请求数据...');
        
        // 尝试多种请求格式
        const formats = [
          // 格式1: 标准Gemini格式
          {
            name: 'Gemini格式',
            data: {
              contents: [{
                parts: [
                  { text: prompt },
                  {
                    inline_data: {
                      mime_type: this.getMimeType(imagePath),
                      data: base64Image
                    }
                  }
                ]
              }],
              ...(config.model && { model: config.model })
            }
          },
          // 格式2: OpenAI格式
          {
            name: 'OpenAI格式',
            data: {
              model: config.model || 'gpt-4-vision-preview',
              messages: [{
                role: 'user',
                content: [
                  { type: 'text', text: prompt },
                  {
                    type: 'image_url',
                    image_url: {
                      url: `data:${this.getMimeType(imagePath)};base64,${base64Image}`
                    }
                  }
                ]
              }],
              max_tokens: isTableRecognition ? 16384 : 4096
            }
          },
          // 格式3: 简化格式
          {
            name: '简化格式',
            data: {
              prompt: prompt,
              image: base64Image,
              model: config.model
            }
          }
        ];
        
        // 默认使用第一种格式，如果失败会在下面的循环中尝试其他格式
        requestData = formats[0].data;
      }

      // 根据API类型选择合适的认证方式顺序
      let authHeaders;
      
      console.log('🔍 准备选择认证方式，当前apiUrl:', apiUrl);
      console.log('🔍 检查条件:');
      console.log('  - 包含googleapis.com:', apiUrl.includes('generativelanguage.googleapis.com'));
      console.log('  - 包含/v1beta:', apiUrl.includes('/v1beta'));
      console.log('  - 包含try-gemini-play:', apiUrl.includes('try-gemini-play.deno.dev'));
      
      // 特殊处理：try-gemini-play优先于其他检测
      if (apiUrl.includes('try-gemini-play.deno.dev')) {
        // 对于try-gemini-play特殊处理
        console.log('🔧 使用try-gemini-play专用认证方式');
        console.log('🔧 检查URL:', apiUrl);
        authHeaders = [
          { 'x-goog-api-key': config.apiKey },
          { 'Authorization': `Bearer ${config.apiKey}` },
          { 'api-key': config.apiKey },
          { 'x-api-key': config.apiKey },
          { 'X-API-Key': config.apiKey },
          {}  // URL参数认证
        ];
      } else if (apiUrl.includes('generativelanguage.googleapis.com') || apiUrl.includes('/v1beta')) {
        // 标准Gemini API格式，优先使用官方认证方式
        console.log('🔧 使用标准Gemini认证方式');
        authHeaders = [
          { 'x-goog-api-key': config.apiKey },
          { 'Authorization': `Bearer ${config.apiKey}` },
          { 'x-api-key': config.apiKey }
        ];

      } else {
        // 其他中转API，尝试更多认证方式
        authHeaders = [
          { 'Authorization': `Bearer ${config.apiKey}` },
          { 'x-goog-api-key': config.apiKey },
          { 'x-api-key': config.apiKey },
          { 'api-key': config.apiKey },
          { 'X-API-Key': config.apiKey },
          { 'Cookie': `api_key=${config.apiKey}` },
          {}  // URL参数认证
        ];
      }

      let lastError;
      for (const headers of authHeaders) {
        try {
          const authMethod = Object.keys(headers)[0] || 'URL参数';
          console.log(`🔐 尝试认证方式: ${authMethod}`);
          
          // 如果是空header，尝试在URL中添加API密钥
          let requestUrl = apiUrl;
          if (Object.keys(headers).length === 0) {
            const separator = apiUrl.includes('?') ? '&' : '?';
            requestUrl = `${apiUrl}${separator}api_key=${encodeURIComponent(config.apiKey)}`;
          }
          
          console.log('🚀 发送请求:');
          console.log(`   URL: ${requestUrl}`);
          console.log(`   方法: POST`);
          console.log(`   认证头: ${JSON.stringify(headers)}`);
          console.log(`   请求数据: ${JSON.stringify(requestData, null, 2)}`);
          
          const response = await axios.post(requestUrl, requestData, {
            headers: {
              'Content-Type': 'application/json',
              ...headers
            },
            timeout: 60000
          });

          console.log(`📏 图片大小: ${imageSizeKB.toFixed(1)}KB`);
          console.log('📋 自定义Gemini API 响应:', response.status);
          console.log('📄 完整响应数据:', JSON.stringify(response.data, null, 2));
          
          let content = '';
          
          // 尝试多种响应格式解析
          if (response.data) {
            // 格式1: 标准Gemini格式
            if (response.data.candidates && response.data.candidates.length > 0) {
              const candidate = response.data.candidates[0];
              if (candidate.content?.parts?.[0]?.text) {
                content = candidate.content.parts[0].text;
              } else if (candidate.content?.text) {
                content = candidate.content.text;
              } else if (candidate.text) {
                content = candidate.text;
              }
            }
            // 格式2: 直接返回文本
            else if (typeof response.data === 'string') {
              console.log('⚠️ API返回了字符串格式的数据，长度:', response.data.length);
              console.log('📄 字符串开头内容:', response.data.substring(0, 200));
              
              // 如果是HTML页面，进行详细分析
              if (response.data.includes('<!DOCTYPE html>') || response.data.includes('<html')) {
                console.log('📄 检测到HTML响应，分析内容寻找错误信息...');
                 
                // 分析HTML内容查找可能的错误信息
                const htmlContent = response.data.toLowerCase();
                 
                if (htmlContent.includes('error') || htmlContent.includes('unauthorized') || htmlContent.includes('forbidden')) {
                  console.error('❌ HTML中包含错误信息，完整内容:', response.data.substring(0, 500));
                  throw new Error('中转API返回错误页面，可能是认证失败或请求格式错误');
                }
                 
                if (htmlContent.includes('api key') || htmlContent.includes('please input') || htmlContent.includes('login')) {
                  console.error('❌ HTML要求输入API密钥，可能是登录页面');
                  throw new Error('中转API返回登录页面，请检查API密钥是否正确或是否需要先在网页界面登录');
                }
                
                // 对于try-gemini-play特殊处理 - 如果返回HTML，可能是网页界面而非API
                if (apiUrl.includes('try-gemini-play.deno.dev') && response.data.length > 1000) {
                  console.error('❌ try-gemini-play返回了完整的HTML页面（长度: ' + response.data.length + '字符）');
                  console.log('📋 HTML片段:', response.data.substring(0, 300) + '...');
                  throw new Error('try-gemini-play返回了网页界面而非API响应。请检查：1) API端点是否正确 2) 是否需要正确的API路径 3) 认证方式是否匹配该服务的要求');
                }
                 
                // 如果HTML很长且不包含明显错误，说明可能是功能页面而非API响应
                if (response.data.length > 5000) {
                  console.error('❌ 返回了完整的HTML页面（长度: ' + response.data.length + '字符）');
                  console.log('📋 HTML开头内容:', response.data.substring(0, 200) + '...');
                  throw new Error('中转API返回了网页界面而非API响应。这通常意味着：1) URL指向网页而非API端点 2) 需要不同的请求方法或格式 3) 需要额外的认证步骤');
                }
                 
                // 如果HTML较短，可能是错误信息页面，尝试解析
                content = response.data;
              } else {
                // 非HTML的字符串响应，可能是纯文本API响应
                content = response.data;
              }
            }
            // 格式3: OpenAI格式
            else if (response.data.choices && response.data.choices.length > 0) {
              content = response.data.choices[0].message?.content || response.data.choices[0].text;
            }
            // 格式4: 自定义格式 - 直接在data中有text/content字段
            else if (response.data.text) {
              content = response.data.text;
            } else if (response.data.content) {
              content = response.data.content;
            } else if (response.data.message) {
              content = response.data.message;
            } else if (response.data.result) {
              content = response.data.result;
            } else if (response.data.output) {
              content = response.data.output;
            } else if (response.data.response) {
              content = response.data.response;
            }
            
            if (!content) {
              console.error('❌ 无法从响应中提取内容，响应结构:', Object.keys(response.data));
              throw new Error('无法解析API响应内容 - 请检查API返回格式');
            }
            
            // 获取finishReason（如果存在candidate的话）
            let finishReason = 'unknown';
            if (response.data.candidates && response.data.candidates.length > 0) {
              finishReason = response.data.candidates[0].finishReason || 'unknown';
            }
            
            return {
              content,
              confidence: 0.9,
              metadata: {
                finishReason,
                usage: response.data.usageMetadata || response.data.usage || {},
                authMethod: Object.keys(headers)[0]
              }
            };
          } else {
            throw new Error('API返回了空结果');
          }
        } catch (error) {
          lastError = error;
          console.log(`❌ 认证方式 ${Object.keys(headers)[0]} 失败:`, error.response?.status || error.message);
          continue;
        }
      }
      
      throw lastError;

    } catch (error) {
      if (error.response) {
        console.error('自定义Gemini API Error:', error.response.data);
        throw new Error(`自定义Gemini API错误: ${error.response.data.error?.message || error.response.statusText || '未知错误'}`);
      }
      throw error;
    }
  }

  // 自定义OpenAI格式API调用
  async callCustomOpenAIAPI(imagePath, config, prompt) {
    try {
      console.log('🔧 使用自定义OpenAI API格式');
      
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      
      // 检测是否为表格识别，动态调整token数量
      const isTableRecognition = prompt.includes('表格') || prompt.includes('table') || prompt.includes('数据结构');
      
      // 构建API URL
      let apiUrl = config.apiUrl;
      if (!apiUrl.includes('/chat/completions')) {
        const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
        apiUrl = `${baseUrl}/chat/completions`;
      }
      
      const requestData = {
        model: config.model || 'gpt-4-vision-preview',
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:${this.getMimeType(imagePath)};base64,${base64Image}`,
                  detail: "high"
                }
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: isTableRecognition ? 16384 : 4096
      };

      const response = await axios.post(apiUrl, requestData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        timeout: 60000
      });

      console.log('📋 自定义OpenAI API 响应:', response.status);

      if (response.data.choices && response.data.choices[0]) {
        const content = response.data.choices[0].message.content;
        return {
          content,
          confidence: 0.9,
          metadata: {
            finishReason: response.data.choices[0].finish_reason,
            usage: response.data.usage
          }
        };
      } else {
        throw new Error('API返回了空结果');
      }

    } catch (error) {
      if (error.response) {
        console.error('❌ 自定义OpenAI API错误详情:');
        console.error('   状态码:', error.response.status);
        console.error('   状态文本:', error.response.statusText);
        console.error('   响应头:', JSON.stringify(error.response.headers, null, 2));
        console.error('   响应数据:', JSON.stringify(error.response.data, null, 2));
        
        const errorMessage = error.response.data?.error?.message || 
                           error.response.data?.message || 
                           error.response.statusText || 
                           '未知错误';
        throw new Error(`自定义OpenAI API错误: ${errorMessage}`);
      } else if (error.request) {
        console.error('❌ 自定义OpenAI 网络请求错误:', error.request);
        throw new Error(`自定义OpenAI 网络请求失败: ${error.message}`);
      } else {
        console.error('❌ 自定义OpenAI 其他错误:', error.message);
        throw new Error(`自定义OpenAI 请求配置错误: ${error.message}`);
      }
    }
  }

  // Claude API调用
  async callClaudeAPI(imagePath, config, prompt) {
    try {
      console.log('🤖 使用Claude API进行识别...');
      
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      
      // 检测是否为表格识别，动态调整token数量
      const isTableRecognition = prompt.includes('表格') || prompt.includes('table') || prompt.includes('数据结构');
      
      // 确保API URL正确 - Claude API默认地址
      let apiUrl = config.apiUrl;
      if (!apiUrl || apiUrl.trim() === '') {
        apiUrl = 'https://api.anthropic.com/v1';
      }
      
      // 规范化API URL
      apiUrl = apiUrl.replace(/\/+$/, ''); // 移除末尾斜杠
      if (!apiUrl.endsWith('/messages')) {
        apiUrl = `${apiUrl}/messages`;
      }
      
      const requestData = {
        model: config.model || 'claude-3-sonnet-20240229',
        max_tokens: isTableRecognition ? 4096 : 2048, // 增加默认token数量
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: this.getMimeType(imagePath),
                  data: base64Image
                }
              }
            ]
          }
        ]
      };

      const axiosConfig = createAxiosConfig();
      
      // 正确设置Claude API认证头
      const headers = {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01'
      };

      // 合并代理配置的headers
      if (axiosConfig.headers) {
        Object.assign(headers, axiosConfig.headers);
      }

      console.log('📋 Claude API 请求配置:', {
        url: apiUrl,
        model: config.model,
        maxTokens: requestData.max_tokens,
        hasImage: true,
        hasApiKey: !!config.apiKey,
        apiKeyPrefix: config.apiKey ? config.apiKey.substring(0, 8) + '...' : 'none'
      });

      const response = await axios.post(apiUrl, requestData, {
        ...axiosConfig,
        headers,
        timeout: 120000 // 增加超时时间到2分钟
      });
      
      console.log('📋 Claude API 响应:', response.status);
      console.log('📋 Claude 响应数据结构:', JSON.stringify(response.data, null, 2));

      if (response.data.content && response.data.content.length > 0) {
        const content = response.data.content[0].text;
        return {
          content,
          confidence: 0.9,
          metadata: {
            finishReason: response.data.stop_reason,
            usage: response.data.usage,
            provider: 'claude'
          }
        };
      } else {
        console.error('❌ Claude API返回的数据结构异常:', response.data);
        throw new Error('Claude API返回了空结果或格式异常');
      }

    } catch (error) {
      console.error('❌ Claude API调用失败:', error);
      
      if (error.response) {
        console.error('❌ Claude API错误详情:');
        console.error('   状态码:', error.response.status);
        console.error('   状态文本:', error.response.statusText);
        console.error('   响应头:', JSON.stringify(error.response.headers, null, 2));
        console.error('   响应数据:', JSON.stringify(error.response.data, null, 2));
        
        let errorMessage = '未知错误';
        
        // 根据状态码提供更具体的错误信息
        if (error.response.status === 401) {
          errorMessage = 'API密钥无效或未提供。请检查Claude API密钥是否正确。';
        } else if (error.response.status === 403) {
          errorMessage = 'API访问被拒绝。请检查API密钥权限或账户状态。';
        } else if (error.response.status === 429) {
          errorMessage = '请求频率超限。请稍后重试或检查API配额。';
        } else if (error.response.status === 400) {
          const apiError = error.response.data?.error;
          if (apiError?.type === 'invalid_request_error') {
            errorMessage = `请求格式错误: ${apiError.message || '请检查请求参数'}`;
          } else {
            errorMessage = `请求参数错误: ${error.response.data?.error?.message || '请检查模型名称和参数'}`;
          }
        } else if (error.response.status >= 500) {
          errorMessage = 'Claude API服务器错误，请稍后重试。';
        } else {
          errorMessage = error.response.data?.error?.message || 
                       error.response.data?.message || 
                       error.response.statusText;
        }
        
        throw new Error(`Claude API错误 (${error.response.status}): ${errorMessage}`);
      } else if (error.request) {
        console.error('❌ Claude 网络请求错误:', error.code || error.message);
        
        if (error.code === 'ECONNABORTED') {
          throw new Error('Claude API请求超时，请检查网络连接或稍后重试');
        } else if (error.code === 'ENOTFOUND') {
          throw new Error('无法连接到Claude API服务器，请检查网络连接');
        } else {
          throw new Error(`Claude 网络连接失败: ${error.message}`);
        }
      } else {
        console.error('❌ Claude 其他错误:', error.message);
        throw new Error(`Claude 请求配置错误: ${error.message}`);
      }
    }
  }

  // 自定义Claude API调用
  async callCustomClaudeAPI(imagePath, config, prompt) {
    try {
      console.log('🔧 使用自定义Claude API格式');
      
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      
      // 检测是否为表格识别，动态调整token数量
      const isTableRecognition = prompt.includes('表格') || prompt.includes('table') || prompt.includes('数据结构');
      
      // 规范化API URL
      let apiUrl = config.apiUrl;
      apiUrl = apiUrl.replace(/\/+$/, ''); // 移除末尾斜杠
      if (!apiUrl.endsWith('/messages')) {
        apiUrl = `${apiUrl}/messages`;
      }
      
      const requestData = {
        model: config.model || 'claude-3-sonnet-20240229',
        max_tokens: isTableRecognition ? 4096 : 2048,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: this.getMimeType(imagePath),
                  data: base64Image
                }
              }
            ]
          }
        ]
      };

      const axiosConfig = createAxiosConfig();
      
      // 支持多种认证方式的自定义Claude API
      const authHeaders = [
        { 'x-api-key': config.apiKey, 'anthropic-version': '2023-06-01' },
        { 'Authorization': `Bearer ${config.apiKey}`, 'anthropic-version': '2023-06-01' },
        { 'api-key': config.apiKey },
        { 'Authorization': `Bearer ${config.apiKey}` }
      ];

      console.log('📋 自定义Claude API 请求配置:', {
        url: apiUrl,
        model: config.model,
        maxTokens: requestData.max_tokens,
        hasApiKey: !!config.apiKey
      });

      let lastError;
      for (const [index, authHeader] of authHeaders.entries()) {
        try {
          const authMethod = Object.keys(authHeader)[0];
          console.log(`🔐 尝试认证方式 ${index + 1}/4: ${authMethod}`);
          
          const headers = {
            'Content-Type': 'application/json',
            ...authHeader
          };
          
          // 合并代理配置的headers
          if (axiosConfig.headers) {
            Object.assign(headers, axiosConfig.headers);
          }

          const response = await axios.post(apiUrl, requestData, {
            ...axiosConfig,
            headers,
            timeout: 120000
          });
          
          console.log('📋 自定义Claude API 响应:', response.status);
          console.log('✅ 认证成功，使用方式:', authMethod);

          if (response.data.content && response.data.content.length > 0) {
            const content = response.data.content[0].text;
            return {
              content,
              confidence: 0.9,
              metadata: {
                finishReason: response.data.stop_reason,
                usage: response.data.usage,
                authMethod
              }
            };
          } else {
            throw new Error('API返回了空结果或格式异常');
          }
        } catch (error) {
          lastError = error;
          const authMethod = Object.keys(authHeader)[0];
          console.log(`❌ 认证方式 ${authMethod} 失败:`, error.response?.status || error.message);
          continue;
        }
      }
      
      // 所有认证方式都失败，抛出最后一个错误
      throw lastError;

    } catch (error) {
      console.error('❌ 自定义Claude API调用失败:', error);
      
      if (error.response) {
        console.error('❌ 自定义Claude API错误详情:');
        console.error('   状态码:', error.response.status);
        console.error('   状态文本:', error.response.statusText);
        console.error('   响应头:', JSON.stringify(error.response.headers, null, 2));
        console.error('   响应数据:', JSON.stringify(error.response.data, null, 2));
        
        let errorMessage = '未知错误';
        
        // 根据状态码提供更具体的错误信息
        if (error.response.status === 401) {
          errorMessage = 'API密钥无效或认证方式不正确。请检查自定义Claude API密钥和认证方式。';
        } else if (error.response.status === 403) {
          errorMessage = 'API访问被拒绝。请检查API密钥权限或中转服务配置。';
        } else if (error.response.status === 429) {
          errorMessage = '请求频率超限。请稍后重试或检查API配额限制。';
        } else if (error.response.status === 400) {
          const apiError = error.response.data?.error;
          errorMessage = `请求参数错误: ${apiError?.message || error.response.data?.message || '请检查模型名称和参数'}`;
        } else if (error.response.status >= 500) {
          errorMessage = '自定义Claude API服务器错误，请稍后重试或联系API提供方。';
        } else {
          errorMessage = error.response.data?.error?.message || 
                       error.response.data?.message || 
                       error.response.statusText;
        }
        
        throw new Error(`自定义Claude API错误 (${error.response.status}): ${errorMessage}`);
      } else if (error.request) {
        console.error('❌ 自定义Claude 网络请求错误:', error.code || error.message);
        
        if (error.code === 'ECONNABORTED') {
          throw new Error('自定义Claude API请求超时，请检查网络连接或API服务状态');
        } else if (error.code === 'ENOTFOUND') {
          throw new Error('无法连接到自定义Claude API服务器，请检查API地址和网络连接');
        } else {
          throw new Error(`自定义Claude 网络连接失败: ${error.message}`);
        }
      } else {
        console.error('❌ 自定义Claude 其他错误:', error.message);
        throw new Error(`自定义Claude 请求配置错误: ${error.message}`);
      }
    }
  }
}

export default new AIModelService(); 