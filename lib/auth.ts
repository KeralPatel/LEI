// Authentication utilities for frontend-backend integration

export interface User {
  id: string
  email: string
  custodialWallet: {
    address: string
  }
  is_active: boolean
  created_at: string
  last_login: string
}

export interface AuthResponse {
  success: boolean
  message: string
  data?: {
    user: User
    token: string
  }
  error?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
}

// Store token in localStorage
export const setAuthToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token)
  }
}

export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token')
  }
  return null
}

export const removeAuthToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token')
  }
}

// API calls
export const loginUser = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials)
    })

    const data = await response.json()
    
    if (data.success && data.data?.token) {
      setAuthToken(data.data.token)
      if (data.data.user) {
        localStorage.setItem('user_data', JSON.stringify(data.data.user))
      }
    }
    
    return data
  } catch (error) {
    return {
      success: false,
      message: 'Failed to connect to server',
      error: 'Connection failed'
    }
  }
}

export const registerUser = async (credentials: RegisterCredentials): Promise<AuthResponse> => {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials)
    })

    const data = await response.json()
    
    if (data.success && data.data?.token) {
      setAuthToken(data.data.token)
      if (data.data.user) {
        localStorage.setItem('user_data', JSON.stringify(data.data.user))
      }
    }
    
    return data
  } catch (error) {
    return {
      success: false,
      message: 'Failed to connect to server',
      error: 'Connection failed'
    }
  }
}

export const logoutUser = () => {
  removeAuthToken()
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user_data')
  }
}

export const getAuthHeaders = () => {
  const token = getAuthToken()
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

export const getCurrentUser = (): User | null => {
  if (typeof window !== 'undefined') {
    const userData = localStorage.getItem('user_data')
    return userData ? JSON.parse(userData) : null
  }
  return null
}
