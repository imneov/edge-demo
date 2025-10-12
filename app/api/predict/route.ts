import { NextRequest, NextResponse } from 'next/server'

/**
 * 代理模型服务的推理请求
 * 用于避免CORS问题
 * 从imageUrl下载图片,然后以multipart/form-data格式转发给后端
 */
export async function POST(request: NextRequest) {
  const modelServiceUrl = process.env.MODEL_SERVICE_URL || 'http://localhost:19000'

  try {
    // 读取请求体
    const body = await request.json()
    const { imageUrl, imageId } = body
    console.log('Prediction request:', { imageUrl, imageId })

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'imageUrl is required' },
        { status: 400 }
      )
    }

    // 从URL下载图片
    console.log('Downloading image from:', imageUrl)
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.status}`)
    }

    // 获取图片数据
    const imageBuffer = await imageResponse.arrayBuffer()
    const imageBlob = new Blob([imageBuffer], {
      type: imageResponse.headers.get('content-type') || 'image/png'
    })

    // 构建multipart/form-data
    const formData = new FormData()
    // 从URL中提取文件名,或使用默认名称
    const filename = imageUrl.split('/').pop() || `image_${imageId}.png`
    formData.append('file', imageBlob, filename)

    console.log('Forwarding to model service:', `${modelServiceUrl}/predict`)

    // 转发到模型服务
    const response = await fetch(`${modelServiceUrl}/predict`, {
      method: 'POST',
      body: formData,
    })

    if (response.ok) {
      const data = await response.json()
      console.log('✅ Prediction result:', data)
      return NextResponse.json(data)
    } else {
      const errorText = await response.text()
      console.error('❌ Prediction failed:', response.status, errorText)
      return NextResponse.json(
        {
          error: 'Prediction failed',
          status: response.status,
          message: errorText
        },
        { status: response.status }
      )
    }
  } catch (error) {
    console.error('Failed to process prediction request:', error)
    return NextResponse.json(
      {
        error: 'Failed to process prediction request',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
