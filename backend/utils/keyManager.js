/**
 * API密钥管理器
 * 提供安全的API密钥存储、加密和访问功能
 */

import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

class KeyManager {
  constructor() {
    // 从环境变量获取加密密钥，如果没有则生成一个
    this.encryptionKey = process.env.ENCRYPTION_KEY || this.generateEncryptionKey();
    this.algorithm = 'aes-256-gcm';
    this.keyFile = path.join(process.cwd(), '.keys.json');
  }

  /**
   * 生成加密密钥
   * @returns {string} 32字节的十六进制密钥
   */
  generateEncryptionKey() {
    const key = crypto.randomBytes(32).toString('hex');
    console.warn('警告: 正在使用随机生成的加密密钥。请在环境变量中设置ENCRYPTION_KEY以确保密钥持久性。');
    return key;
  }

  /**
   * 加密API密钥
   * @param {string} plaintext - 明文API密钥
   * @returns {object} 包含加密数据和认证标签的对象
   */
  encryptKey(plaintext) {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(this.algorithm, this.encryptionKey);
      cipher.setAAD(Buffer.from('api-key'));
      
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
      };
    } catch (error) {
      throw new Error(`密钥加密失败: ${error.message}`);
    }
  }

  /**
   * 解密API密钥
   * @param {object} encryptedData - 加密的数据对象
   * @returns {string} 解密后的API密钥
   */
  decryptKey(encryptedData) {
    try {
      const { encrypted, iv, authTag } = encryptedData;
      const decipher = crypto.createDecipher(this.algorithm, this.encryptionKey);
      
      decipher.setAAD(Buffer.from('api-key'));
      decipher.setAuthTag(Buffer.from(authTag, 'hex'));
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error(`密钥解密失败: ${error.message}`);
    }
  }

  /**
   * 验证API密钥格式
   * @param {string} provider - AI提供商名称
   * @param {string} apiKey - API密钥
   * @returns {boolean} 是否为有效格式
   */
  validateKeyFormat(provider, apiKey) {
    if (!apiKey || typeof apiKey !== 'string') {
      return false;
    }

    const patterns = {
      'openai': /^sk-[a-zA-Z0-9]{48,}$/,
      'gemini': /^AIza[a-zA-Z0-9_-]{35}$/,
      'deepseek': /^sk-[a-zA-Z0-9]{32,}$/,
      'zhipu': /^[a-f0-9]{32}\.[a-zA-Z0-9]{6}$/,
      'claude': /^sk-ant-api[a-zA-Z0-9_-]{50,}$/,
      'custom': () => true // 自定义提供商不验证格式
    };

    const pattern = patterns[provider.toLowerCase()];
    if (!pattern) {
      return false;
    }

    return typeof pattern === 'function' ? pattern() : pattern.test(apiKey);
  }

  /**
   * 安全存储API密钥配置
   * @param {string} userId - 用户标识（可以是会话ID或用户ID）
   * @param {object} config - 模型配置
   * @returns {string} 配置ID
   */
  async storeKeyConfig(userId, config) {
    try {
      const { provider, apiKey, apiUrl, model } = config;
      
      // 验证API密钥格式
      if (!this.validateKeyFormat(provider, apiKey)) {
        throw new Error(`无效的${provider} API密钥格式`);
      }

      // 生成配置ID
      const configId = crypto.randomBytes(16).toString('hex');
      
      // 加密API密钥
      const encryptedKey = this.encryptKey(apiKey);
      
      // 准备存储的配置（不包含明文API密钥）
      const secureConfig = {
        id: configId,
        userId,
        provider,
        apiUrl,
        model,
        encryptedKey,
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString()
      };

      // 读取现有配置
      let configs = {};
      try {
        const data = await fs.readFile(this.keyFile, 'utf8');
        configs = JSON.parse(data);
      } catch (error) {
        // 文件不存在或无法读取，使用空对象
        configs = {};
      }

      // 存储新配置
      configs[configId] = secureConfig;
      
      await fs.writeFile(this.keyFile, JSON.stringify(configs, null, 2));
      
      return configId;
    } catch (error) {
      throw new Error(`存储密钥配置失败: ${error.message}`);
    }
  }

  /**
   * 获取API密钥配置
   * @param {string} configId - 配置ID
   * @returns {object} 包含解密后API密钥的完整配置
   */
  async getKeyConfig(configId) {
    try {
      const data = await fs.readFile(this.keyFile, 'utf8');
      const configs = JSON.parse(data);
      
      const config = configs[configId];
      if (!config) {
        throw new Error('配置不存在');
      }

      // 解密API密钥
      const apiKey = this.decryptKey(config.encryptedKey);
      
      // 更新最后使用时间
      config.lastUsed = new Date().toISOString();
      configs[configId] = config;
      await fs.writeFile(this.keyFile, JSON.stringify(configs, null, 2));

      // 返回包含解密密钥的配置
      return {
        id: config.id,
        provider: config.provider,
        apiUrl: config.apiUrl,
        model: config.model,
        apiKey,
        createdAt: config.createdAt,
        lastUsed: config.lastUsed
      };
    } catch (error) {
      throw new Error(`获取密钥配置失败: ${error.message}`);
    }
  }

  /**
   * 删除API密钥配置
   * @param {string} configId - 配置ID
   * @param {string} userId - 用户标识（安全验证）
   */
  async deleteKeyConfig(configId, userId) {
    try {
      const data = await fs.readFile(this.keyFile, 'utf8');
      const configs = JSON.parse(data);
      
      const config = configs[configId];
      if (!config) {
        throw new Error('配置不存在');
      }

      // 验证用户权限
      if (config.userId !== userId) {
        throw new Error('无权限删除此配置');
      }

      delete configs[configId];
      await fs.writeFile(this.keyFile, JSON.stringify(configs, null, 2));
    } catch (error) {
      throw new Error(`删除密钥配置失败: ${error.message}`);
    }
  }

  /**
   * 清理过期配置（超过30天未使用）
   */
  async cleanupExpiredConfigs() {
    try {
      const data = await fs.readFile(this.keyFile, 'utf8');
      const configs = JSON.parse(data);
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      let cleanedCount = 0;
      Object.keys(configs).forEach(configId => {
        const config = configs[configId];
        const lastUsed = new Date(config.lastUsed);
        
        if (lastUsed < thirtyDaysAgo) {
          delete configs[configId];
          cleanedCount++;
        }
      });

      if (cleanedCount > 0) {
        await fs.writeFile(this.keyFile, JSON.stringify(configs, null, 2));
        console.log(`清理了${cleanedCount}个过期的API密钥配置`);
      }
    } catch (error) {
      console.error('清理过期配置失败:', error.message);
    }
  }
}

// 创建单例实例
const keyManager = new KeyManager();

export default keyManager;