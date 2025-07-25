/**
 * 清理上传文件夹的脚本
 * 删除所有上传的文件但保留目录结构
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function cleanupUploads() {
  try {
    const uploadsDir = path.join(__dirname, '../uploads');
    
    console.log('🧹 开始清理上传目录...');
    console.log(`📂 目录路径: ${uploadsDir}`);

    // 检查目录是否存在
    try {
      await fs.access(uploadsDir);
    } catch (error) {
      console.log('📂 上传目录不存在，无需清理');
      return;
    }

    // 读取目录内容
    const files = await fs.readdir(uploadsDir);
    console.log(`📊 发现 ${files.length} 个文件`);

    if (files.length === 0) {
      console.log('✅ 上传目录已经是空的');
      return;
    }

    // 删除所有文件
    let deletedCount = 0;
    let errorCount = 0;

    for (const file of files) {
      const filePath = path.join(uploadsDir, file);
      
      try {
        const stats = await fs.stat(filePath);
        
        if (stats.isFile()) {
          await fs.unlink(filePath);
          deletedCount++;
          console.log(`🗑️  删除文件: ${file}`);
        } else if (stats.isDirectory()) {
          // 如果是子目录，递归删除
          await fs.rmdir(filePath, { recursive: true });
          deletedCount++;
          console.log(`📁 删除目录: ${file}`);
        }
      } catch (error) {
        console.error(`❌ 删除失败 ${file}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 清理结果:');
    console.log(`✅ 成功删除: ${deletedCount} 个项目`);
    console.log(`❌ 删除失败: ${errorCount} 个项目`);

    // 创建 .gitkeep 文件以保留目录结构
    const gitkeepPath = path.join(uploadsDir, '.gitkeep');
    await fs.writeFile(gitkeepPath, '# 此文件用于保持上传目录结构\n# 上传的文件不应提交到版本控制系统\n');
    console.log('📄 创建 .gitkeep 文件');

    console.log('\n✅ 上传目录清理完成！');

  } catch (error) {
    console.error('❌ 清理过程中发生错误:', error);
    process.exit(1);
  }
}

// 运行清理函数
cleanupUploads();