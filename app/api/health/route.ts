import { NextResponse } from 'next/server'

/**
 * 代理模型服务的健康检查请求
 * 用于避免CORS问题
 */
export async function GET() {
  const modelServiceUrl = process.env.MODEL_SERVICE_URL || 'http://localhost:19000'

  try {
    const response = await fetch(`${modelServiceUrl}/health`, {
      method: 'GET',
    })

    // 无论返回什么状态码,只要能连接就返回成功
    return NextResponse.json(
      {
        status: 'online',
        serviceStatus: response.status,
        message: 'Model service is reachable'
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Failed to connect to model service:', error)
    return NextResponse.json(
      {
        status: 'offline',
        message: 'Model service is not reachable',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    )
  }
}
