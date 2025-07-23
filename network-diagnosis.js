// 网络环境诊断工具
import fetch from 'node-fetch';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function diagnoseNetworkEnvironment() {
  console.log('🔍 开始网络环境诊断...\n');
  
  // 1. 检测运行环境
  console.log('📍 环境检测:');
  console.log(`   操作系统: ${process.platform}`);
  console.log(`   Node.js版本: ${process.version}`);
  console.log(`   架构: ${process.arch}`);
  
  // 检测是否在WSL中
  try {
    if (process.platform === 'linux') {
      const { stdout } = await execAsync('uname -r');
      if (stdout.includes('microsoft') || stdout.includes('WSL')) {
        console.log('   环境: WSL (Windows Subsystem for Linux)');
      } else {
        console.log('   环境: 原生Linux');
      }
    } else {
      console.log('   环境: 原生Windows');
    }
  } catch (error) {
    console.log('   环境检测失败');
  }
  
  // 2. DNS解析测试
  console.log('\n🌐 DNS解析测试:');
  try {
    const { stdout } = await execAsync('nslookup localhost');
    console.log('   localhost解析结果:');
    stdout.split('\n').forEach(line => {
      if (line.includes('Address:') && line.includes('127.0.0.1')) {
        console.log('   ✅ IPv4解析正常: 127.0.0.1');
      }
      if (line.includes('Address:') && line.includes('::1')) {
        console.log('   ⚠️  IPv6解析存在: ::1');
      }
    });
  } catch (error) {
    console.log('   ❌ DNS解析测试失败');
  }
  
  // 3. 代理设置检测
  console.log('\n🔧 代理设置检测:');
  const proxyVars = ['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy'];
  let proxyFound = false;
  
  proxyVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`   ${varName}: ${value}`);
      proxyFound = true;
    }
  });
  
  if (!proxyFound) {
    console.log('   无代理环境变量设置');
  }
  
  // 4. 网络连通性测试
  console.log('\n🚀 网络连通性测试:');
  
  const testUrls = [
    { name: '本地服务', url: 'http://127.0.0.1:3001/health' },
    { name: 'Google API', url: 'https://generativelanguage.googleapis.com/v1beta/models' },
    { name: 'OpenAI API', url: 'https://api.openai.com/v1/models' }
  ];
  
  for (const test of testUrls) {
    try {
      console.log(`   测试 ${test.name}...`);
      const startTime = Date.now();
      
      const response = await fetch(test.url, {
        method: 'GET',
        timeout: 5000,
        headers: {
          'User-Agent': 'Network-Diagnosis/1.0'
        }
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`   ✅ ${test.name}: ${response.status} (${duration}ms)`);
    } catch (error) {
      console.log(`   ❌ ${test.name}: ${error.message}`);
    }
  }
  
  // 5. 建议
  console.log('\n💡 建议:');
  if (process.platform === 'win32') {
    console.log('   - 在PowerShell中运行 ./fix-network-issues.ps1');
    console.log('   - 或在WSL环境中开发以避免网络问题');
  }
  console.log('   - 检查防火墙设置');
  console.log('   - 确保API密钥有效');
  console.log('   - 考虑使用VPN或代理');
}

// 运行诊断
diagnoseNetworkEnvironment().catch(console.error);