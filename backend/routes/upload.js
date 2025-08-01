import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
// import sharp from 'sharp'; // 暂时移除sharp依赖
import fs from 'fs/promises';
import InputValidator from '../utils/inputValidator.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 支持的图片格式 - 使用InputValidator验证
const MAX_FILE_SIZE = (parseInt(process.env.MAX_FILE_SIZE) || 10) * 1024 * 1024; // MB to bytes

// 配置multer存储 - 增强安全性
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const uploadPath = path.join(__dirname, '../uploads');
      // 验证路径安全性
      const safePath = InputValidator.validateFilePath('uploads', __dirname + '/..');
      
      await fs.access(safePath);
      cb(null, safePath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // 目录不存在，创建它
        const uploadPath = path.join(__dirname, '../uploads');
        await fs.mkdir(uploadPath, { recursive: true });
        cb(null, uploadPath);
      } else {
        cb(error);
      }
    }
  },
  filename: (req, file, cb) => {
    try {
      // 使用安全的文件名生成
      const safeName = InputValidator.generateSafeFilename(file.originalname);
      cb(null, safeName);
    } catch (error) {
      cb(error);
    }
  }
});

// 文件过滤器 - 增强验证
const fileFilter = (req, file, cb) => {
  try {
    // 验证请求 - 跳过JSON检查，因为文件上传使用multipart/form-data
    const validation = InputValidator.validateRequest(req, {
      checkOrigin: process.env.NODE_ENV === 'production',
      maxBodySize: MAX_FILE_SIZE,
      requireJson: false // 文件上传不需要JSON格式
    });
    
    if (!validation.valid) {
      return cb(new Error(`请求验证失败: ${validation.errors.join(', ')}`));
    }

    // 验证文件类型和大小
    if (!InputValidator.validateImageType(file.mimetype, file.originalname)) {
      return cb(new Error(`不支持的文件格式: ${file.mimetype}`));
    }

    // 验证文件大小
    if (file.size && !InputValidator.validateFileSize(file.size, MAX_FILE_SIZE)) {
      return cb(new Error(`文件过大: ${(file.size / 1024 / 1024).toFixed(2)}MB`));
    }

    cb(null, true);
  } catch (error) {
    cb(error);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1
  }
});

// 图片上传端点
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: '请选择要上传的图片文件'
      });
    }

    const filePath = req.file.path;
    const fileName = req.file.filename;
    
    // 获取图片信息（简化版）
    const stats = await fs.stat(filePath);
    const imageInfo = {
      width: 0,
      height: 0,
      format: path.extname(fileName).slice(1),
      channels: 3,
      hasAlpha: false
    };
    
    // 暂时不生成缩略图
    const thumbnailPath = filePath; // 使用原图

    const result = {
      success: true,
      file: {
        id: path.parse(fileName).name, // 使用文件名作为ID
        originalName: req.file.originalname,
        fileName: fileName,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: `/uploads/${fileName}`,
        thumbnailUrl: `/uploads/${fileName}`,
        metadata: {
          width: imageInfo.width,
          height: imageInfo.height,
          format: imageInfo.format,
          channels: imageInfo.channels,
          hasAlpha: imageInfo.hasAlpha
        }
      },
      timestamp: new Date().toISOString()
    };

    console.log(`✅ 文件上传成功: ${req.file.originalname} -> ${fileName}`);
    res.json(result);

  } catch (error) {
    console.error('Upload error:', error);
    
    // 清理已上传的文件（如果存在）
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
    }

    res.status(500).json({
      error: 'Upload failed',
      message: error.message || '文件上传失败'
    });
  }
});

// 获取上传的文件信息
router.get('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const uploadsDir = path.join(__dirname, '../uploads');
    
    // 查找匹配的文件
    const files = await fs.readdir(uploadsDir);
    const matchingFile = files.find(file => file.startsWith(fileId));
    
    if (!matchingFile) {
      return res.status(404).json({
        error: 'File not found',
        message: '找不到指定的文件'
      });
    }

    const filePath = path.join(uploadsDir, matchingFile);
    const stats = await fs.stat(filePath);
    const imageInfo = {
      width: 0,
      height: 0,
      format: path.extname(matchingFile).slice(1),
      channels: 3,
      hasAlpha: false
    };

    res.json({
      success: true,
      file: {
        id: fileId,
        fileName: matchingFile,
        size: stats.size,
        url: `/uploads/${matchingFile}`,
        metadata: {
          width: imageInfo.width,
          height: imageInfo.height,
          format: imageInfo.format,
          channels: imageInfo.channels,
          hasAlpha: imageInfo.hasAlpha
        },
        uploadTime: stats.birthtime
      }
    });

  } catch (error) {
    console.error('Get file info error:', error);
    res.status(500).json({
      error: 'Failed to get file info',
      message: error.message
    });
  }
});

// 删除上传的文件
router.delete('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const uploadsDir = path.join(__dirname, '../uploads');
    
    // 查找匹配的文件
    const files = await fs.readdir(uploadsDir);
    const matchingFiles = files.filter(file => file.startsWith(fileId));
    
    if (matchingFiles.length === 0) {
      return res.status(404).json({
        error: 'File not found',
        message: '找不到指定的文件'
      });
    }

    // 删除所有匹配的文件（包括缩略图）
    for (const file of matchingFiles) {
      const filePath = path.join(uploadsDir, file);
      await fs.unlink(filePath);
    }

    console.log(`🗑️ 删除文件: ${matchingFiles.join(', ')}`);
    res.json({
      success: true,
      message: '文件删除成功',
      deletedFiles: matchingFiles
    });

  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      error: 'Failed to delete file',
      message: error.message
    });
  }
});

export default router; 