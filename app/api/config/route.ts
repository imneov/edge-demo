import { NextResponse } from 'next/server'
import { getRuntimeConfig } from '../config/update/route'

/**
 * 获取当前配置
 * 优先返回运行时配置,如果没有则返回环境变量
 */
export async function GET() {
  const runtimeConfig = getRuntimeConfig()

  return NextResponse.json({
    modelServiceUrl: runtimeConfig.modelServiceUrl || process.env.MODEL_SERVICE_URL || 'http://localhost:19000',
    nodeExporterUrl: runtimeConfig.nodeExporterUrl || process.env.NODE_EXPORTER_URL || 'http://localhost:9100',
    nodeName: runtimeConfig.nodeName || process.env.NODE_NAME || 'hw002',
  })
}
