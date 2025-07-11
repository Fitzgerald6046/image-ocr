import { v4 as uuidv4 } from 'uuid';
import { v2 as cloudinary } from 'cloudinary';

// 配置Cloudinary（需要在Netlify环境变量中设置）
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
    // 检查环境变量
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Server configuration error',
          message: 'Cloudinary配置缺失，请在Netlify环境变量中配置CLOUDINARY_*'
        })
      };
    }

    // 创建一个临时的可读流来处理multipart数据
    const boundary = event.headers['content-type']?.split('boundary=')[1];
    if (!boundary) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid content type',
          message: '缺少multipart boundary'
        })
      };
    }

    // 解析multipart数据
    const body = event.isBase64Encoded 
      ? Buffer.from(event.body, 'base64') 
      : Buffer.from(event.body);

    // 使用简单的multipart解析
    const parts = parseMultipart(body, boundary);
    const imagePart = parts.find(part => part.name === 'image');

    if (!imagePart || !imagePart.data) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'No image found',
          message: '未找到图片文件'
        })
      };
    }

    const fileId = uuidv4();
    const fileName = imagePart.filename || `upload-${Date.now()}`;

    // 直接从Buffer上传到Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          public_id: fileId,
          folder: 'onebyone-ocr',
          resource_type: 'auto',
          quality: 'auto:good',
          format: 'auto'
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(imagePart.data);
    });

    // 返回结果
    const result = {
      success: true,
      file: {
        id: fileId,
        originalName: fileName,
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
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Upload error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Upload failed',
        message: error.message || '文件上传失败',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};

// 简单的multipart解析器
function parseMultipart(buffer, boundary) {
  const parts = [];
  const boundaryStr = `--${boundary}`;
  const endBoundaryStr = `--${boundary}--`;
  
  // 将buffer转换为字符串以便处理
  const content = buffer.toString('binary');
  
  // 分割内容
  const sections = content.split(boundaryStr);
  
  for (let i = 1; i < sections.length; i++) {
    const section = sections[i];
    
    // 跳过结束边界
    if (section.startsWith('--')) break;
    
    // 解析每个部分
    const part = parseMultipartPart(section);
    if (part) parts.push(part);
  }
  
  return parts;
}

function parseMultipartPart(section) {
  // 查找头部结束位置
  const headerEnd = section.indexOf('\r\n\r\n');
  if (headerEnd === -1) return null;
  
  const headerPart = section.substring(0, headerEnd);
  const dataPart = section.substring(headerEnd + 4);
  
  // 解析头部
  const headers = headerPart.split('\r\n');
  const disposition = headers.find(h => h.toLowerCase().startsWith('content-disposition:'));
  
  if (!disposition) return null;
  
  const nameMatch = disposition.match(/name="([^"]+)"/);
  const filenameMatch = disposition.match(/filename="([^"]+)"/);
  
  // 转换数据为Buffer
  const dataBuffer = Buffer.from(dataPart.replace(/\r\n$/, ''), 'binary');
  
  return {
    name: nameMatch ? nameMatch[1] : null,
    filename: filenameMatch ? filenameMatch[1] : null,
    data: dataBuffer
  };
}