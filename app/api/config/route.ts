import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    modelServiceUrl: process.env.MODEL_SERVICE_URL || 'http://localhost:8000',
    nodeExporterUrl: process.env.NODE_EXPORTER_URL || 'http://localhost:9100',
    nodeName: process.env.NODE_NAME || 'unknown-node',
  })
}
