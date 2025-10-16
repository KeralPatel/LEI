import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Forward the request to the backend API
    const response = await fetch(`${BACKEND_URL}/api/wallet/withdraw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('authorization') || '',
      },
      body: JSON.stringify(body)
    })

    const data = await response.json()

    return NextResponse.json(data, { status: response.status })

  } catch (error: any) {
    console.error('Withdrawal error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to connect to backend server',
      details: error.message
    }, { status: 500 })
  }
}
