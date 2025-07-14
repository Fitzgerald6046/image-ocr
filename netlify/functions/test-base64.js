// Test base64 encoding of images
export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    console.log('=== Base64 Test ===');
    
    const { imageUrl } = JSON.parse(event.body);
    
    if (!imageUrl) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'imageUrl required'
        })
      };
    }
    
    console.log('Testing image URL:', imageUrl);
    
    // Step 1: Download image
    console.log('Step 1: Downloading image...');
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.status}`);
    }
    
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    console.log('Content type:', contentType);
    
    // Step 2: Get image buffer
    console.log('Step 2: Getting image buffer...');
    const imageBuffer = await imageResponse.arrayBuffer();
    console.log('Image buffer size:', imageBuffer.byteLength, 'bytes');
    
    if (imageBuffer.byteLength > 10 * 1024 * 1024) { // 10MB limit for testing
      throw new Error(`Image too large: ${imageBuffer.byteLength} bytes (max 10MB for test)`);
    }
    
    // Step 3: Convert to base64
    console.log('Step 3: Converting to base64...');
    const uint8Array = new Uint8Array(imageBuffer);
    let binaryString = '';
    
    // Use chunk-based conversion for large images
    const chunkSize = 8192; // 8KB chunks
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      for (let j = 0; j < chunk.length; j++) {
        binaryString += String.fromCharCode(chunk[j]);
      }
    }
    
    const imageBase64 = btoa(binaryString);
    console.log('Base64 length:', imageBase64.length);
    
    // Step 4: Test Gemini request format
    console.log('Step 4: Creating Gemini request...');
    const requestBody = {
      contents: [{
        parts: [
          { text: "简单描述这张图片" },
          {
            inlineData: {
              mimeType: contentType,
              data: imageBase64
            }
          }
        ]
      }],
      generationConfig: {
        maxOutputTokens: 100,
        temperature: 0.1
      }
    };
    
    const requestSize = JSON.stringify(requestBody).length;
    console.log('Request body size:', requestSize, 'characters');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        steps: {
          download: {
            status: 'success',
            contentType: contentType,
            size: imageBuffer.byteLength
          },
          base64: {
            status: 'success',
            length: imageBase64.length
          },
          requestBody: {
            status: 'success',
            size: requestSize,
            sizeKB: Math.round(requestSize / 1024)
          }
        },
        base64Preview: imageBase64.substring(0, 100) + '...',
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Base64 test error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Base64 test failed',
        message: error.message,
        stack: error.stack
      })
    };
  }
};