// Wallet utilities for frontend-backend integration

export interface WalletBalance {
  balance: string
  wallet: string
  tokenContract: string
}

export interface NativeBalance {
  balance: string
  wallet: string
  currency: string
}

export interface BalanceResponse {
  success: boolean
  data?: WalletBalance
  error?: string
}

export interface NativeBalanceResponse {
  success: boolean
  data?: NativeBalance
  error?: string
}

// Get token balance
export const getTokenBalance = async (): Promise<BalanceResponse> => {
  try {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      return {
        success: false,
        error: 'Not authenticated'
      }
    }

    const response = await fetch('/api/wallet/balance', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    const data = await response.json()
    return data
  } catch (error) {
    return {
      success: false,
      error: 'Failed to connect to server'
    }
  }
}

// Get native balance
export const getNativeBalance = async (): Promise<NativeBalanceResponse> => {
  try {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      return {
        success: false,
        error: 'Not authenticated'
      }
    }

    const response = await fetch('/api/wallet/native-balance', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    const data = await response.json()
    return data
  } catch (error) {
    return {
      success: false,
      error: 'Failed to connect to server'
    }
  }
}
