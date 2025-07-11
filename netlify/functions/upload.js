import { v4 as uuidv4 } from 'uuid';
import { v2 as cloudinary } from 'cloudinary';

// 配置Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const handler = async (event, context) => {
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
    // 检查环境变量
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Server configuration error',
          message: 'Cloudinary配置缺失'
        })
      };
    }

    // 检查content-type
    const contentType = event.headers['content-type'] || event.headers['Content-Type'];
    if (!contentType?.includes('multipart/form-data')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid content type',
          message: '需要multipart/form-data格式'
        })
      };
    }

    // 简化的multipart处理
    const boundary = contentType.split('boundary=')[1];
    if (!boundary) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Missing boundary',
          message: '缺少multipart boundary'
        })
      };
    }

    // 处理body数据
    let bodyBuffer;
    if (event.isBase64Encoded) {
      bodyBuffer = Buffer.from(event.body, 'base64');
    } else {
      bodyBuffer = Buffer.from(event.body, 'utf8');
    }

    // 使用简单的字符串匹配来提取文件数据
    const bodyString = bodyBuffer.toString('binary');
    const parts = bodyString.split(`--${boundary}`);
    
    let imageData = null;
    let filename = 'upload';
    
    for (const part of parts) {
      if (part.includes('Content-Disposition: form-data') && part.includes('name="image"')) {
        const lines = part.split('\r\n');
        const dispositionLine = lines.find(line => line.includes('Content-Disposition'));
        
        if (dispositionLine) {
          const filenameMatch = dispositionLine.match(/filename="([^"]+)"/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }
        
        // 找到空行后的内容就是文件数据
        const dataStartIndex = part.indexOf('\r\n\r\n') + 4;
        if (dataStartIndex > 3) {
          const fileDataString = part.substring(dataStartIndex);
          // 移除结尾的\r\n
          const cleanData = fileDataString.replace(/\r\n$/, '');
          imageData = Buffer.from(cleanData, 'binary');
          break;
        }
      }
    }

    if (!imageData) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'No image found',
          message: '未找到图片数据'
        })
      };
    }

    // 生成文件ID
    const fileId = uuidv4();
    
    // 上传到Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          public_id: fileId,
          folder: 'onebyone-ocr',
          resource_type: 'auto'
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      ).end(imageData);
    });

    // 返回成功结果
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        file: {
          id: fileId,
          originalName: filename,
          fileName: `${fileId}.${uploadResult.format}`,
          size: uploadResult.bytes,
          mimetype: `image/${uploadResult.format}`,
          url: uploadResult.secure_url,
          thumbnailUrl: uploadResult.secure_url.replace('/upload/', '/upload/w_300,h_300,c_fit/'),
          metadata: {
            width: uploadResult.width,
            height: uploadResult.height,
            format: uploadResult.format,
            bytes: uploadResult.bytes,
            publicId: uploadResult.public_id
          }
        },
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Upload function error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: '服务器内部错误',
        details: error.message
      })
    };
  }
};