import { NextRequest, NextResponse } from 'next/server'
import { distributeTokens, distributeTokensBulk } from '@/lib/tokenService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Check if it's a single recipient (backward compatibility) or multiple recipients
    if (body.recipients && Array.isArray(body.recipients)) {
      // Multiple recipients
      const { recipients } = body

      if (!recipients || recipients.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'No recipients provided'
        }, { status: 400 })
      }

      // Validate all recipients
      for (let i = 0; i < recipients.length; i++) {
        const recipient = recipients[i]
        if (!recipient.name || !recipient.email || !recipient.id || !recipient.wallet || !recipient.hrsWorked) {
          return NextResponse.json({
            success: false,
            error: `Missing required fields for recipient ${i + 1}: name, email, id, wallet, hrsWorked`
          }, { status: 400 })
        }

        const hours = parseFloat(recipient.hrsWorked)
        if (isNaN(hours) || hours <= 0) {
          return NextResponse.json({
            success: false,
            error: `Invalid hours worked for recipient ${i + 1} (${recipient.name}). Must be a positive number.`
          }, { status: 400 })
        }
      }

      console.log(`Distributing tokens to ${recipients.length} recipients`)
      const results = await distributeTokensBulk(recipients)

      return NextResponse.json({
        success: true,
        message: `Tokens distributed successfully to ${recipients.length} recipients`,
        data: {
          totalRecipients: recipients.length,
          successfulDistributions: results.filter(r => r.success).length,
          failedDistributions: results.filter(r => !r.success).length,
          results: results
        }
      })

    } else {
      // Single recipient (backward compatibility)
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
    }

  } catch (error: any) {
    console.error('Token distribution error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to distribute tokens',
      details: error.message
    }, { status: 500 })
  }
}
