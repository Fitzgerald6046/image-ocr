import { v4 as uuidv4 } from 'uuid';
import formidable from 'formidable';
import { v2 as cloudinary } from 'cloudinary';

// 配置Cloudinary（需要在Netlify环境变量中设置）
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 支持的图片格式
const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp', 'image/tiff', 'image/bmp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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
    // 处理文件上传
    const contentType = event.headers['content-type'] || event.headers['Content-Type'];
    
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid content type',
          message: '请使用multipart/form-data格式上传文件'
        })
      };
    }

    // 解析base64上传的文件
    const body = event.isBase64Encoded ? Buffer.from(event.body, 'base64') : event.body;
    
    // 处理multipart数据
    const form = formidable({
      maxFileSize: MAX_FILE_SIZE,
      keepExtensions: true,
      filter: ({ mimetype }) => SUPPORTED_FORMATS.includes(mimetype)
    });

    const [fields, files] = await form.parse(body);
    
    if (!files.image || files.image.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'No file uploaded',
          message: '请选择要上传的图片文件'
        })
      };
    }

    const file = files.image[0];
    const fileId = uuidv4();

    // 上传到Cloudinary
    const uploadResult = await cloudinary.uploader.upload(file.filepath, {
      public_id: fileId,
      folder: 'onebyone-ocr',
      resource_type: 'image',
      quality: 'auto:good',
      format: 'auto'
    });

    // 返回结果
    const result = {
      success: true,
      file: {
        id: fileId,
        originalName: file.originalFilename,
        fileName: `${fileId}.${file.originalFilename.split('.').pop()}`,
        size: file.size,
        mimetype: file.mimetype,
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
        message: error.message || '文件上传失败'
      })
    };
  }
};