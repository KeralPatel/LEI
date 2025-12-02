import { NextRequest } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Set max duration for this route (in seconds) - 5 minutes for bulk distributions
export const maxDuration = 300

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Forward the request to the backend streaming API
    const response = await fetch(`${BACKEND_URL}/api/distribute-tokens-stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('authorization') || '',
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: 'Unknown error occurred',
        status: response.status
      }))
      return new Response(JSON.stringify(errorData), { 
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Create a readable stream that forwards the SSE stream from backend
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) {
          controller.close()
          return
        }

        try {
          while (true) {
            const { done, value } = await reader.read()
            
            if (done) {
              controller.close()
              break
            }

            // Forward the chunk to the client
            controller.enqueue(value)
          }
        } catch (error) {
          console.error('Stream error:', error)
          controller.error(error)
        }
      }
    })

    // Return the stream with appropriate headers for SSE
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })

  } catch (error: any) {
    console.error('Token distribution streaming error:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to connect to backend server',
      details: error.message
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

