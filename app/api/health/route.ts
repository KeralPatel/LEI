import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Token Distribution API',
    network: 'Knightsbridge',
    chainId: process.env.CHAIN_ID || 8060
  })
}
