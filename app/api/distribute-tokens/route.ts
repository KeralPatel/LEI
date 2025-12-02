import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Set max duration for this route (in seconds) - 5 minutes for bulk distributions
export const maxDuration = 300

// Helper function to create a fetch with timeout
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number = 300000 // 5 minutes default
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error('Request timeout: The operation took too long to complete')
    }
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Determine timeout based on request type
    // Bulk distributions need more time
    const isBulk = body.recipients && Array.isArray(body.recipients)
    const timeout = isBulk ? 300000 : 120000 // 5 min for bulk, 2 min for single
    
    // Forward the request to the backend API with timeout
    const response = await fetchWithTimeout(
      `${BACKEND_URL}/api/distribute-tokens`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add authentication header if needed
          'Authorization': request.headers.get('authorization') || '',
        },
        body: JSON.stringify(body)
      },
      timeout
    )

    // Check if response is ok before parsing
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: 'Unknown error occurred',
        status: response.status
      }))
      return NextResponse.json(errorData, { status: response.status })
    }

    const data = await response.json()
    
    return NextResponse.json(data, { status: response.status })

  } catch (error: any) {
    console.error('Token distribution error:', error)
    
    // Handle timeout errors specifically
    if (error.message && error.message.includes('timeout')) {
      return NextResponse.json({
        success: false,
        error: 'Request timeout',
        message: 'The token distribution operation is taking longer than expected. This may happen with bulk distributions. Please check the backend logs or try again with fewer recipients.',
        details: error.message
      }, { status: 504 })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to connect to backend server',
      details: error.message
    }, { status: 500 })
  }
}
