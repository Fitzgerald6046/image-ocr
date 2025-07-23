#!/usr/bin/env node

/**
 * 测试脚本：验证代理修复效果
 * 用于确认API调用不会指向127.0.0.1:7890
 */

console.log('🧪 开始测试代理修复效果...\n');

// 测试1: 检查前端配置
console.log('📋 测试1: 前端API配置');
try {
  // 模拟浏览器环境
  global.window = {
    location: {
      hostname: 'example.netlify.app',
      protocol: 'https:',
      port: '',
      href: 'https://example.netlify.app'
    }
  };
  
  global.navigator = {
    userAgent: 'Mozilla/5.0 (Test)'
  };
  
  // 动态导入配置
  import('./src/config.ts').then(config => {
    console.log('   ✅ 前端配置加载成功');
    console.log('   📍 计算的baseURL:', config.API_CONFIG.baseURL);
    console.log('   🔍 生产环境检测:', config.API_CONFIG.baseURL === '');
    
    if (config.API_CONFIG.baseURL === '') {
      console.log('   ✅ 前端配置正确 - 使用相对路径');
    } else if (config.API_CONFIG.baseURL.includes('127.0.0.1:7890')) {
      console.log('   ❌ 前端配置错误 - 仍指向7890端口');
    } else {
      console.log('   ⚠️  前端配置异常 - 请检查');
    }
  }).catch(err => {
    console.log('   ❌ 前端配置加载失败:', err.message);
  });
} catch (error) {
  console.log('   ❌ 前端测试失败:', error.message);
}

// 测试2: 检查后端代理配置
console.log('\n📋 测试2: 后端代理配置');
try {
  // 模拟不同环境
  const testEnvironments = [
    {
      name: '生产环境(Netlify)',
      env: { NODE_ENV: 'production', NETLIFY: 'true' }
    },
    {
      name: '预览环境',
      env: { NODE_ENV: 'production', CONTEXT: 'deploy-preview' }
    },
    {
      name: '开发环境(WSL)',
      env: { NODE_ENV: 'development', WSL_DISTRO_NAME: 'Ubuntu' }
    },
    {
      name: '开发环境(本地)',
      env: { NODE_ENV: 'development' }
    }
  ];
  
  for (const testEnv of testEnvironments) {
    // 设置测试环境变量
    const originalEnv = { ...process.env };
    Object.assign(process.env, testEnv.env);
    
    try {
      // 动态导入代理配置
      delete require.cache[require.resolve('./backend/utils/proxyConfig.js')];
      const proxyConfig = await import('./backend/utils/proxyConfig.js');
      const config = proxyConfig.default.getProxyConfig();
      
      console.log(`   🔧 ${testEnv.name}:`);
      if (config) {
        console.log(`      代理URL: ${config.proxy}`);
        if (config.proxy && config.proxy.includes('127.0.0.1:7890')) {
          console.log('      ❌ 仍使用7890代理');
        } else {
          console.log('      ✅ 代理配置正常');
        }
      } else {
        console.log('      ✅ 无代理配置(直连)');
      }
    } catch (err) {
      console.log(`      ❌ 配置加载失败: ${err.message}`);
    }
    
    // 恢复环境变量
    process.env = originalEnv;
  }
} catch (error) {
  console.log('   ❌ 后端测试失败:', error.message);
}

// 测试3: 环境变量检查
console.log('\n📋 测试3: 当前环境变量');
const proxyVars = ['HTTP_PROXY', 'HTTPS_PROXY', 'NO_PROXY'];
for (const varName of proxyVars) {
  const value = process.env[varName];
  if (value) {
    console.log(`   ${varName}: ${value}`);
    if (value.includes('127.0.0.1:7890')) {
      console.log('   ❌ 检测到7890代理设置');
    }
  } else {
    console.log(`   ${varName}: 未设置 ✅`);
  }
}

console.log('\n🎯 修复建议:');
console.log('1. 确保Netlify环境变量中HTTP_PROXY和HTTPS_PROXY为空');
console.log('2. 在本地开发时，避免设置全局代理环境变量');
console.log('3. 部署后访问 /api/debug 检查实际环境状态');
console.log('4. 如仍有问题，检查Netlify Build Settings中的环境变量');

console.log('\n✅ 测试完成！');