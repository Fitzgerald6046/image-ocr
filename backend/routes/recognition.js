import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import aiModelService from '../services/aiModels.js';
import InputValidator from '../utils/inputValidator.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 图片识别端点 - 增强安全验证
router.post('/', async (req, res) => {
  try {
    // 验证请求
    const validation = InputValidator.validateRequest(req, {
      requireJson: true,
      checkOrigin: process.env.NODE_ENV === 'production'
    });
    
    if (!validation.valid) {
      return res.status(400).json({
        error: 'INVALID_REQUEST',
        message: `请求验证失败: ${validation.errors.join(', ')}`
      });
    }

    const { fileId, modelConfig, recognitionType = 'auto' } = req.body;
    
    // 验证必需参数
    if (!fileId || !modelConfig) {
      return res.status(400).json({
        error: 'MISSING_PARAMETERS',
        message: '缺少必需参数: fileId 和 modelConfig'
      });
    }

    // 验证fileId格式
    if (!InputValidator.validateFileId(fileId)) {
      return res.status(400).json({
        error: 'INVALID_FILE_ID',
        message: '无效的文件ID格式'
      });
    }

    // 验证识别类型
    if (!InputValidator.validateRecognitionType(recognitionType)) {
      return res.status(400).json({
        error: 'INVALID_RECOGNITION_TYPE',
        message: `不支持的识别类型: ${recognitionType}`
      });
    }

    // 验证模型配置
    if (!InputValidator.validateProvider(modelConfig.provider)) {
      return res.status(400).json({
        error: 'INVALID_PROVIDER',
        message: `不支持的AI提供商: ${modelConfig.provider}`
      });
    }

    // 验证必要参数
    if (!fileId) {
      return res.status(400).json({
        error: 'Missing fileId',
        message: '请提供文件ID'
      });
    }

    if (!modelConfig || !modelConfig.model || !modelConfig.apiKey) {
      return res.status(400).json({
        error: 'Invalid model config',
        message: '请提供完整的模型配置（模型名称和API密钥）'
      });
    }

    // 查找图片文件
    const uploadsDir = path.join(__dirname, '../uploads');
    const files = await fs.readdir(uploadsDir);
    const imageFile = files.find(file => file.startsWith(fileId) && !file.startsWith('thumb_'));

    if (!imageFile) {
      return res.status(404).json({
        error: 'File not found',
        message: '找不到指定的图片文件'
      });
    }

    const imagePath = path.join(uploadsDir, imageFile);

    console.log(`🔍 开始识别图片: ${imageFile}`);
    console.log(`📋 识别类型: ${recognitionType}`);
    console.log(`🤖 使用模型: ${modelConfig.model}`);

    // 添加超时保护
    const RECOGNITION_TIMEOUT = 90000; // 90秒超时
    console.log('🚀 开始AI识别，超时时间:', RECOGNITION_TIMEOUT / 1000, '秒');
    
    // 调用AI模型进行识别，包含超时控制
    const recognition = await Promise.race([
      aiModelService.recognizeImage(
        imagePath, 
        modelConfig, 
        recognitionType
      ),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('识别请求超时，请检查网络连接或稍后重试')), RECOGNITION_TIMEOUT)
      )
    ]);

    // 详细记录识别结果用于调试
    console.log('🔍 AI模型服务返回的完整结果:');
    console.log('   success:', recognition.success);
    console.log('   result存在:', !!recognition.result);
    if (recognition.result) {
      console.log('   content长度:', recognition.result.content?.length || 0);
      console.log('   content前200字符:', recognition.result.content?.substring(0, 200) || 'empty');
      console.log('   confidence:', recognition.result.confidence);
    }

    // 记录识别日志
    console.log(`✅ 识别完成: ${imageFile} - ${(recognition.result.confidence * 100).toFixed(1)}%`);

    const response = {
      success: true,
      recognition: recognition.result,
      file: {
        id: fileId,
        name: imageFile,
        url: `/uploads/${imageFile}`
      }
    };

    console.log('📤 准备发送给前端的响应:');
    console.log('   success:', response.success);
    console.log('   recognition存在:', !!response.recognition);
    console.log('   recognition.content长度:', response.recognition?.content?.length || 0);

    // 设置CORS和响应头
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');  
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Content-Type', 'application/json');

    const jsonResponse = JSON.stringify(response);
    console.log('📤 JSON响应长度:', jsonResponse.length);
    console.log('📤 JSON响应前500字符:', jsonResponse.substring(0, 500));

    res.json(response);
    
    console.log('📤 响应已发送');

  } catch (error) {
    console.error('❌ Recognition route error:', error);
    console.error('❌ Error type:', typeof error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    
    // 检查是否是API调用错误还是其他错误
    if (error.response) {
      console.error('❌ API响应错误:', error.response.status, error.response.data);
    }
    
    const errorResponse = {
      error: 'Recognition failed',
      message: error.message || '图片识别失败',
      code: error.code || 'RECOGNITION_ERROR',
      details: process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        type: typeof error,
        name: error.name
      } : undefined
    };
    
    console.error('📤 发送错误响应给前端:', errorResponse);
    
    // 设置CORS和响应头
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');  
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Content-Type', 'application/json');
    
    res.status(500).json(errorResponse);
    
    console.error('📤 错误响应已发送');
  }
});

// 批量识别端点
router.post('/batch', async (req, res) => {
  try {
    const { fileIds, modelConfig, recognitionType = 'auto' } = req.body;

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({
        error: 'Invalid fileIds',
        message: '请提供有效的文件ID数组'
      });
    }

    if (!modelConfig || !modelConfig.model || !modelConfig.apiKey) {
      return res.status(400).json({
        error: 'Invalid model config',
        message: '请提供完整的模型配置'
      });
    }

    const uploadsDir = path.join(__dirname, '../uploads');
    const results = [];

    for (const fileId of fileIds) {
      try {
        const files = await fs.readdir(uploadsDir);
        const imageFile = files.find(file => file.startsWith(fileId) && !file.startsWith('thumb_'));

        if (!imageFile) {
          results.push({
            fileId,
            success: false,
            error: '文件未找到'
          });
          continue;
        }

        const imagePath = path.join(uploadsDir, imageFile);
        const recognition = await aiModelService.recognizeImage(
          imagePath, 
          modelConfig, 
          recognitionType
        );

        results.push({
          fileId,
          success: true,
          recognition: recognition.result,
          file: {
            id: fileId,
            name: imageFile,
            url: `/uploads/${imageFile}`
          }
        });

      } catch (error) {
        console.error(`Batch recognition error for ${fileId}:`, error);
        results.push({
          fileId,
          success: false,
          error: error.message || '识别失败'
        });
      }
    }

    res.json({
      success: true,
      results,
      total: fileIds.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });

  } catch (error) {
    console.error('Batch recognition error:', error);
    res.status(500).json({
      error: 'Batch recognition failed',
      message: error.message || '批量识别失败'
    });
  }
});

// 获取识别历史记录
router.get('/history', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    // 这里可以实现识别历史记录的存储和查询
    // 目前返回一个模拟的响应
    res.json({
      success: true,
      history: [],
      total: 0,
      limit: parseInt(limit),
      offset: parseInt(offset),
      message: '识别历史记录功能将在后续版本中实现'
    });

  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      error: 'Failed to get history',
      message: error.message
    });
  }
});

// 获取支持的识别类型
router.get('/types', (req, res) => {
  const recognitionTypes = [
    { value: 'auto', label: '🔍 智能识别 (自动判断类型)', description: '自动判断图片类型并进行相应识别' },
    { value: 'ancient', label: '📜 古籍文献识别', description: '识别古籍、古文字等历史文献' },
    { value: 'receipt', label: '🧾 票据类识别', description: '识别发票、收据等票据信息' },
    { value: 'document', label: '📄 文档识别', description: '识别各种文档和表格内容' },
    { value: 'poetry', label: '🎭 诗歌文学识别', description: '识别诗歌、文学作品等内容' },
    { value: 'shopping', label: '🛒 购物小票识别', description: '识别购物小票和商品信息' },
    { value: 'artwork', label: '🎨 艺术图画分析', description: '分析艺术作品的内容和风格' },
    { value: 'id', label: '🆔 证件识别', description: '识别身份证、驾照等证件信息' },
    { value: 'table', label: '📊 表格图表识别', description: '识别表格、图表中的数据' },
    { value: 'handwriting', label: '✍️ 手写内容识别', description: '识别手写文字和笔记' },
    { value: 'prompt', label: '🎯 AI绘图Prompt生成', description: '为图片生成AI绘图提示词' },
    { value: 'translate', label: '🌐 多语言翻译识别', description: '识别并翻译多种语言文字' }
  ];

  res.json({
    success: true,
    types: recognitionTypes
  });
});

export default router; 