/**
 * 文件处理工具类
 * 提供文件验证、压缩、预处理等功能
 */

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  fileInfo?: {
    name: string;
    size: number;
    type: string;
    lastModified: number;
  };
}

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: string;
}

export class FileHandler {
  // 支持的文件类型
  private static readonly SUPPORTED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/tiff'
  ];

  // 文件大小限制（10MB）
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024;

  /**
   * 验证文件
   */
  static validateFile(file: File): FileValidationResult {
    // 检查文件是否存在
    if (!file) {
      return {
        isValid: false,
        error: '未选择文件'
      };
    }

    // 检查文件类型
    if (!this.SUPPORTED_TYPES.includes(file.type)) {
      return {
        isValid: false,
        error: `不支持的文件格式: ${file.type}。支持的格式: JPG、PNG、GIF、WebP、BMP、TIFF`
      };
    }

    // 检查文件大小
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `文件大小超出限制: ${this.formatFileSize(file.size)}。最大支持 ${this.formatFileSize(this.MAX_FILE_SIZE)}`
      };
    }

    // 验证文件名
    if (file.name.length > 255) {
      return {
        isValid: false,
        error: '文件名过长，请重命名后再上传'
      };
    }

    return {
      isValid: true,
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      }
    };
  }

  /**
   * 格式化文件大小
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 获取文件信息
   */
  static async getFileInfo(file: File): Promise<{
    name: string;
    size: string;
    type: string;
    lastModified: string;
    dimensions?: { width: number; height: number };
  }> {
    const dimensions = await this.getImageDimensions(file);
    
    return {
      name: file.name,
      size: this.formatFileSize(file.size),
      type: file.type,
      lastModified: new Date(file.lastModified).toLocaleString(),
      dimensions
    };
  }

  /**
   * 获取图片尺寸
   */
  static getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight
        });
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('无法获取图片尺寸'));
      };
      
      img.src = url;
    });
  }

  /**
   * 压缩图片
   */
  static async compressImage(
    file: File,
    options: CompressionOptions = {}
  ): Promise<{ file: File; originalSize: number; compressedSize: number; compressionRatio: number }> {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.8,
      format = 'image/jpeg'
    } = options;

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      if (!ctx) {
        reject(new Error('无法创建canvas上下文'));
        return;
      }

      img.onload = () => {
        // 计算压缩后的尺寸
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // 绘制图片
        ctx.drawImage(img, 0, 0, width, height);

        // 转换为Blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('图片压缩失败'));
              return;
            }

            const compressedFile = new File([blob], file.name, {
              type: format,
              lastModified: Date.now()
            });

            const originalSize = file.size;
            const compressedSize = compressedFile.size;
            const compressionRatio = Math.round((1 - compressedSize / originalSize) * 100);

            resolve({
              file: compressedFile,
              originalSize,
              compressedSize,
              compressionRatio
            });
          },
          format,
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('无法加载图片'));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * 创建文件预览URL
   */
  static createPreviewUrl(file: File): string {
    return URL.createObjectURL(file);
  }

  /**
   * 释放预览URL
   */
  static revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url);
  }

  /**
   * 检查是否需要压缩
   */
  static shouldCompress(file: File): boolean {
    const COMPRESSION_THRESHOLD = 2 * 1024 * 1024; // 2MB
    return file.size > COMPRESSION_THRESHOLD;
  }

  /**
   * 读取文件为Base64
   */
  static readAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('读取文件失败'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('文件读取错误'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  /**
   * 检查文件是否为图片
   */
  static isImage(file: File): boolean {
    return file.type.startsWith('image/');
  }

  /**
   * 获取文件扩展名
   */
  static getFileExtension(fileName: string): string {
    return fileName.split('.').pop()?.toLowerCase() || '';
  }

  /**
   * 生成唯一文件名
   */
  static generateUniqueFileName(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const extension = this.getFileExtension(originalName);
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    
    return `${nameWithoutExt}_${timestamp}_${random}.${extension}`;
  }
}