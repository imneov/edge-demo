import { NextRequest, NextResponse } from 'next/server'

/**
 * 运行时配置存储
 * 注意: 这是一个简单的内存存储,服务重启后会丢失
 */
let runtimeConfig: {
  modelServiceUrl?: string
  nodeExporterUrl?: string
  nodeName?: string
} = {}

/**
 * 更新配置
 * POST /api/config/update
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { modelServiceUrl, nodeExporterUrl, nodeName } = body

    // 验证输入
    if (!nodeName || nodeName.trim() === '') {
      return NextResponse.json(
        { error: '节点名称不能为空' },
        { status: 400 }
      )
    }

    if (!modelServiceUrl || modelServiceUrl.trim() === '') {
      return NextResponse.json(
        { error: '模型服务地址不能为空' },
        { status: 400 }
      )
    }

    // 验证URL格式
    try {
      new URL(modelServiceUrl)
    } catch (e) {
      return NextResponse.json(
        { error: '模型服务地址格式不正确' },
        { status: 400 }
      )
    }

    // 验证 Node Exporter URL (如果提供)
    if (nodeExporterUrl && nodeExporterUrl.trim() !== '') {
      try {
        new URL(nodeExporterUrl)
      } catch (e) {
        return NextResponse.json(
          { error: 'Node Exporter 地址格式不正确' },
          { status: 400 }
        )
      }
    }

    // 保存到运行时配置
    runtimeConfig = {
      modelServiceUrl: modelServiceUrl.trim(),
      nodeName: nodeName.trim(),
    }

    // 如果提供了 Node Exporter URL,也保存
    if (nodeExporterUrl && nodeExporterUrl.trim() !== '') {
      runtimeConfig.nodeExporterUrl = nodeExporterUrl.trim()
    }

    console.log('Configuration updated:', runtimeConfig)

    return NextResponse.json({
      success: true,
      config: runtimeConfig,
    })
  } catch (error) {
    console.error('Failed to update configuration:', error)
    return NextResponse.json(
      {
        error: '更新配置失败',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * 获取运行时配置覆盖值
 */
export function getRuntimeConfig() {
  return runtimeConfig
}
