// backend/services/geminiService.js
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const { configureAxiosProxy } = require('../utils/proxyConfig');

class GeminiService {
  constructor(apiKey, apiUrl) {
    this.apiKey = apiKey;
    this.apiUrl = apiUrl || 'https://generativelanguage.googleapis.com/v1beta';
    
    // 创建 axios 实例时应用代理配置
    this.client = axios.create(configureAxiosProxy({
      baseURL: this.apiUrl,
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json'
      }
    }));
  }

  async recognizeImage(imagePath, recognitionType = 'auto', modelName = 'gemini-2.0-flash-exp') {
    try {
      console.log(`🔍 [Gemini] 开始识别图片: ${imagePath}`);
      console.log(`📋 识别类型: ${recognitionType}, 模型: ${modelName}`);
      
      // 读取图片并转换为 base64
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      
      // 根据识别类型构建系统提示
      const systemPrompt = this.getSystemPrompt(recognitionType);
      
      // 构建请求体
      const requestBody = {
        contents: [{
          parts: [
            {
              text: systemPrompt
            },
            {
              inline_data: {
                mime_type: this.getMimeType(imagePath),
                data: base64Image
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          topK: 40,
          topP: 0.95
        }
      };
      
      // 发送请求
      const response = await this.client.post(
        `/models/${modelName}:generateContent?key=${this.apiKey}`,
        requestBody
      );
      
      if (response.data && response.data.candidates && response.data.candidates[0]) {
        const content = response.data.candidates[0].content;
        const text = content.parts[0].text;
        
        console.log('✅ [Gemini] 识别成功');
        
        return {
          success: true,
          content: text,
          confidence: 0.95,
          model: modelName,
          provider: 'gemini',
          originalContent: text
        };
      } else {
        throw new Error('Gemini API 返回了无效的响应格式');
      }
      
    } catch (error) {
      console.error('❌ [Gemini] 识别失败:', error.message);
      
      // 处理特定错误
      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data;
        
        if (status === 429) {
          throw new Error('API 请求频率限制，请稍后重试');
        } else if (status === 401) {
          throw new Error('API 密钥无效，请检查配置');
        } else if (status === 400) {
          const errorMessage = errorData?.error?.message || '请求参数错误';
          throw new Error(`请求错误: ${errorMessage}`);
        }
      }
      
      throw error;
    }
  }

  getSystemPrompt(recognitionType) {
    const prompts = {
      'auto': '请智能识别这张图片的内容类型，并提供详细的识别结果。如果是文字内容，请完整提取所有文字；如果是图表或数据，请解析其内容；如果是其他类型，请详细描述。',
      'ancient': '这是一张古籍文献的图片。请识别图中的所有古文字，包括繁体字、异体字等。请保持原文格式，标注难以辨认的字，并提供简要的释义。',
      'receipt': '这是一张票据或发票的图片。请提取所有关键信息，包括：商家名称、日期、金额、商品明细、税额等。请以结构化的格式输出。',
      'document': '请识别这张文档图片中的所有文字内容，保持原有的格式和排版。注意识别标题、段落、列表等结构。',
      'poetry': '这是一张包含诗歌或文学作品的图片。请完整识别其中的文字，保持原有的格式和韵律，并标注作者、朝代等信息（如果有）。',
      'id': '这是一张证件照片。请识别证件类型和其中的关键信息，注意保护隐私，只提取必要的字段。',
      'table': '这是一张包含表格或图表的图片。请识别并提取表格中的所有数据，保持表格结构，以易于理解的格式输出。',
      'handwriting': '这是一张手写内容的图片。请尽可能准确地识别手写文字，对于难以辨认的部分请标注出来。',
      'prompt': '请分析这张图片，生成一个详细的AI绘画提示词（prompt），包括画面主体、风格、色彩、构图、氛围等要素。',
      'translate': '请识别图片中的文字，并提供准确的翻译。如果包含多种语言，请分别标注并翻译。'
    };
    
    return prompts[recognitionType] || prompts['auto'];
  }

  getMimeType(imagePath) {
    const ext = imagePath.split('.').pop().toLowerCase();
    const mimeTypes = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp'
    };
    return mimeTypes[ext] || 'image/jpeg';
  }

  async testConnection() {
    try {
      console.log('🧪 [Gemini] 测试连接...');
      
      const response = await this.client.get(
        `/models?key=${this.apiKey}`
      );
      
      if (response.data && response.data.models) {
        console.log('✅ [Gemini] 连接测试成功');
        return {
          success: true,
          message: '连接成功',
          models: response.data.models.map(m => m.name)
        };
      }
      
      throw new Error('API 返回了无效的响应');
    } catch (error) {
      console.error('❌ [Gemini] 连接测试失败:', error.message);
      throw error;
    }
  }
}

module.exports = GeminiService;