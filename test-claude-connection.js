#!/usr/bin/env node

/**
 * Claude API连接测试工具
 * 用于诊断和测试Claude API连接问题
 */

import AIModelService from './backend/services/aiModels.js';
import fs from 'fs';
import path from 'path';

async function testClaudeConnection() {
  console.log('🧪 Claude API连接测试工具');
  console.log('================================');
  
  // 测试配置示例
  const testConfigs = [
    {
      name: '官方Claude API',
      config: {
        provider: 'claude',
        apiUrl: 'https://api.anthropic.com/v1',
        apiKey: 'sk-ant-api03-your-real-key-here', // 请替换为真实的API密钥
        model: 'claude-3-sonnet-20240229'
      }
    },
    {
      name: '自定义Claude API',
      config: {
        provider: 'custom-claude',
        apiUrl: 'https://your-claude-proxy.com/v1', // 请替换为真实的中转地址
        apiKey: 'your-api-key', // 请替换为真实的API密钥
        model: 'claude-3-sonnet-20240229'
      }
    }
  ];
  
  for (const { name, config } of testConfigs) {
    console.log(`\n🔍 测试配置: ${name}`);
    console.log('----------------------------');
    
    try {
      // 测试连接
      console.log('1. 测试API连接...');
      const connectionResult = await AIModelService.testConnection(config);
      
      if (connectionResult.success) {
        console.log('✅ 连接测试成功:', connectionResult.message);
        
        // 如果有测试图片，尝试识别
        const testImagePath = './backend/uploads';
        const files = fs.existsSync(testImagePath) ? fs.readdirSync(testImagePath) : [];
        const imageFile = files.find(file => 
          file.toLowerCase().endsWith('.jpg') || 
          file.toLowerCase().endsWith('.png') || 
          file.toLowerCase().endsWith('.jpeg')
        );
        
        if (imageFile) {
          console.log('2. 测试图片识别...');
          const imagePath = path.join(testImagePath, imageFile);
          console.log(`   使用测试图片: ${imageFile}`);
          
          try {
            const result = await AIModelService.recognizeImage(
              imagePath, 
              config, 
              'auto', 
              '请识别这张图片中的内容'
            );
            
            if (result.success) {
              console.log('✅ 图片识别成功');
              console.log('   内容预览:', result.result.content.substring(0, 100) + '...');
              console.log('   置信度:', result.result.confidence);
              console.log('   使用模型:', result.result.model);
            } else {
              console.log('❌ 图片识别失败');
            }
          } catch (recognitionError) {
            console.log('❌ 图片识别错误:', recognitionError.message);
          }
        } else {
          console.log('⚠️  未找到测试图片，跳过识别测试');
        }
      } else {
        console.log('❌ 连接测试失败:', connectionResult.message);
      }
      
    } catch (error) {
      console.log('❌ 测试过程出错:', error.message);
    }
  }
  
  console.log('\n📋 测试完成');
  console.log('================================');
  console.log('如果测试失败，请检查:');
  console.log('1. API密钥是否正确');
  console.log('2. API地址是否可访问');
  console.log('3. 网络连接是否正常');
  console.log('4. 代理设置是否正确');
  console.log('5. API配额是否充足');
}

// 命令行参数处理
if (process.argv.length > 2) {
  const action = process.argv[2];
  
  if (action === '--help' || action === '-h') {
    console.log('Claude API连接测试工具使用说明:');
    console.log('');
    console.log('使用方法:');
    console.log('  node test-claude-connection.js        # 运行默认测试');
    console.log('  node test-claude-connection.js --help  # 显示帮助');
    console.log('');
    console.log('注意事项:');
    console.log('1. 请在脚本中替换真实的API密钥和地址');
    console.log('2. 确保backend/uploads目录下有测试图片');
    console.log('3. 如果在WSL环境，可能需要设置代理');
    process.exit(0);
  }
}

// 运行测试
testClaudeConnection().catch(error => {
  console.error('💥 测试工具运行失败:', error);
  process.exit(1);
});