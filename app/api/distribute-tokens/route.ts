import { NextRequest, NextResponse } from 'next/server'
import { distributeTokens } from '@/lib/tokenService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, id, walletAddress, hrsWorked } = body

    if (!name || !email || !id || !walletAddress || !hrsWorked) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: name, email, id, walletAddress, hrsWorked'
      }, { status: 400 })
    }

    const hours = parseFloat(hrsWorked)
    if (isNaN(hours) || hours <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid hours worked. Must be a positive number.'
      }, { status: 400 })
    }

    const tokensToDistribute = Math.floor(hours)

    console.log(`Distributing ${tokensToDistribute} tokens to ${walletAddress} for ${hours} hours worked`)
    const transactionResult = await distributeTokens(walletAddress, tokensToDistribute, {
      name,
      email,
      id,
      hrsWorked: hours
    })

    return NextResponse.json({
      success: true,
      message: 'Tokens distributed successfully',
      data: {
        recipient: {
          name,
          email,
          id,
          walletAddress
        },
        distribution: {
          hoursWorked: hours,
          tokensDistributed: tokensToDistribute,
          rate: '1 token per hour'
        },
        transaction: transactionResult
      }
    })

  } catch (error: any) {
    console.error('Token distribution error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to distribute tokens',
      details: error.message
    }, { status: 500 })
  }
}
