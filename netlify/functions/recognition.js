import axios from 'axios';

// 创建专用的axios实例，确保在Netlify环境中不使用代理
const createAxiosInstance = () => {
  const config = {
    timeout: 60000, // 60秒超时
    maxRedirects: 5
  };
  
  // 在Netlify环境中明确禁用代理
  if (process.env.NETLIFY || process.env.CONTEXT || process.env.DEPLOY_URL || process.env.NETLIFY_DEV) {
    config.proxy = false;
    console.log('🚫 Netlify environment detected - all proxy disabled');
  }
  
  return axios.create(config);
};

const axiosInstance = createAxiosInstance();

// 识别类型和对应的提示词
const RECOGNITION_PROMPTS = {
  auto: '请分析这张图片，自动识别其类型（如文档、收据、古籍、证件等），并提取相关信息。',
  ancient: '请识别这张古籍或古文字图片中的文字内容，保持原文格式，并提供现代文字的对应翻译。',
  receipt: '请识别这张收据或发票中的关键信息，包括商家名称、日期、金额、商品清单等。',
  document: '请识别这张文档图片中的所有文字内容，保持原有格式和结构。',
  id: '请识别这张证件图片中的信息，包括姓名、证件号码、有效期等关键信息。',
  table: '请识别这张表格或图表中的数据，以结构化的方式展示内容。',
  handwriting: '请识别这张手写文字图片中的内容，尽可能准确地转换为文本。',
  prompt: '请为这张图片生成详细的AI绘图提示词，包括风格、色彩、构图等要素。'
};

export const handler = async (event, context) => {
  // 设置CORS头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { fileId, imageUrl, modelConfig, recognitionType = 'auto' } = JSON.parse(event.body);

    // 验证必要参数
    if (!fileId && !imageUrl) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Missing fileId or imageUrl',
          message: '请提供文件ID或图片URL'
        })
      };
    }

    if (!modelConfig || !modelConfig.model || !modelConfig.apiKey) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid model config',
          message: '请提供完整的模型配置（模型名称和API密钥）'
        })
      };
    }

    console.log(`🔍 开始识别图片: ${fileId || imageUrl}`);
    console.log(`📋 识别类型: ${recognitionType}`);
    console.log(`🤖 使用模型: ${modelConfig.model}`);

    // 获取识别提示词
    const prompt = RECOGNITION_PROMPTS[recognitionType] || RECOGNITION_PROMPTS.auto;

    // 调用AI模型进行识别
    const recognition = await recognizeImage(imageUrl, modelConfig, prompt);

    console.log(`✅ 识别完成: ${fileId || imageUrl}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        recognition: recognition,
        file: {
          id: fileId,
          url: imageUrl
        }
      })
    };

  } catch (error) {
    console.error('Recognition error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Recognition failed',
        message: error.message || '图片识别失败'
      })
    };
  }
};

// 根据不同的AI模型提供商进行识别
async function recognizeImage(imageUrl, modelConfig, prompt) {
  const { model, apiKey, apiUrl } = modelConfig;

  try {
    if (model.includes('gemini')) {
      return await recognizeWithGemini(imageUrl, modelConfig, prompt);
    } else if (model.includes('gpt') || model.includes('openai')) {
      return await recognizeWithOpenAI(imageUrl, modelConfig, prompt);
    } else if (model.includes('deepseek')) {
      return await recognizeWithDeepSeek(imageUrl, modelConfig, prompt);
    } else if (model.includes('claude')) {
      return await recognizeWithClaude(imageUrl, modelConfig, prompt);
    } else {
      return await recognizeWithGeneric(imageUrl, modelConfig, prompt);
    }
  } catch (error) {
    console.error('AI model recognition error:', error);
    throw new Error(`AI模型识别失败: ${error.message}`);
  }
}

// Gemini识别
async function recognizeWithGemini(imageUrl, modelConfig, prompt) {
  const { model, apiKey, apiUrl } = modelConfig;
  
  // 下载图片并转换为base64
  const imageData = await downloadImageAsBase64(imageUrl);
  
  const requestBody = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: imageData
            }
          }
        ]
      }
    ]
  };

  const response = await axiosInstance.post(
    `${apiUrl}/models/${model}:generateContent?key=${apiKey}`,
    requestBody,
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );

  const result = response.data.candidates[0].content.parts[0].text;
  
  return {
    content: result,
    confidence: 0.95, // Gemini通常有较高的置信度
    model: model,
    provider: 'gemini',
    timestamp: new Date().toISOString()
  };
}

// OpenAI识别
async function recognizeWithOpenAI(imageUrl, modelConfig, prompt) {
  const { model, apiKey, apiUrl } = modelConfig;
  
  const requestBody = {
    model: model,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: imageUrl } }
        ]
      }
    ],
    max_tokens: 2000
  };

  const response = await axiosInstance.post(
    `${apiUrl}/chat/completions`,
    requestBody,
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const result = response.data.choices[0].message.content;
  
  return {
    content: result,
    confidence: 0.92,
    model: model,
    provider: 'openai',
    timestamp: new Date().toISOString()
  };
}

// DeepSeek识别
async function recognizeWithDeepSeek(imageUrl, modelConfig, prompt) {
  const { model, apiKey, apiUrl } = modelConfig;
  
  const requestBody = {
    model: model,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: imageUrl } }
        ]
      }
    ]
  };

  const response = await axiosInstance.post(
    `${apiUrl}/chat/completions`,
    requestBody,
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const result = response.data.choices[0].message.content;
  
  return {
    content: result,
    confidence: 0.90,
    model: model,
    provider: 'deepseek',
    timestamp: new Date().toISOString()
  };
}

// Claude识别
async function recognizeWithClaude(imageUrl, modelConfig, prompt) {
  const { model, apiKey, apiUrl } = modelConfig;
  
  // 下载图片并转换为base64
  const imageData = await downloadImageAsBase64(imageUrl);
  
  const requestBody = {
    model: model,
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data: imageData
            }
          }
        ]
      }
    ]
  };

  const response = await axiosInstance.post(
    `${apiUrl}/messages`,
    requestBody,
    {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      }
    }
  );

  const result = response.data.content[0].text;
  
  return {
    content: result,
    confidence: 0.93,
    model: model,
    provider: 'claude',
    timestamp: new Date().toISOString()
  };
}

// 通用识别（适用于OpenAI兼容接口）
async function recognizeWithGeneric(imageUrl, modelConfig, prompt) {
  const { model, apiKey, apiUrl } = modelConfig;
  
  const requestBody = {
    model: model,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: imageUrl } }
        ]
      }
    ],
    max_tokens: 2000
  };

  const response = await axiosInstance.post(
    `${apiUrl}/chat/completions`,
    requestBody,
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const result = response.data.choices[0].message.content;
  
  return {
    content: result,
    confidence: 0.85,
    model: model,
    provider: 'generic',
    timestamp: new Date().toISOString()
  };
}

// 下载图片并转换为base64
async function downloadImageAsBase64(imageUrl) {
  // 确保在Netlify环境中不使用代理
  const config = {
    responseType: 'arraybuffer',
    timeout: 30000,
    maxRedirects: 5
  };
  
  // 明确禁用代理（Netlify Functions应直接连接）
  if (process.env.NETLIFY || process.env.CONTEXT || process.env.DEPLOY_URL) {
    config.proxy = false;
    console.log('🚫 Netlify environment - proxy disabled for image download');
  }
  
  const response = await axiosInstance.get(imageUrl, config);
  const base64 = Buffer.from(response.data).toString('base64');
  return base64;
}