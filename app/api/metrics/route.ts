import { NextResponse } from 'next/server'

export async function GET() {
  const nodeExporterUrl = process.env.NODE_EXPORTER_URL || 'http://localhost:9100'
  
  try {
    const response = await fetch(`${nodeExporterUrl}/metrics`)
    const text = await response.text()
    
    return new NextResponse(text, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    })
  } catch (error) {
    console.error('Failed to fetch metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics from node exporter' },
      { status: 500 }
    )
  }
}
