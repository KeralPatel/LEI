// API Key management utilities

export interface ApiKey {
  key: string
  id: string
  name: string
  keyPrefix: string
  permissions: {
    read: boolean
    write: boolean
    admin: boolean
  }
  isActive: boolean
  lastUsed?: string
  expiresAt?: string
  createdAt: string
}

export interface CreateApiKeyRequest {
  name: string
  permissions?: {
    read: boolean
    write: boolean
    admin: boolean
  }
  expiresAt?: string
}

export interface CreateApiKeyResponse {
  success: boolean
  message: string
  data?: {
    apiKey: ApiKey & {
      key: string // Only returned during creation
    }
  }
  error?: string
}

export interface ApiKeyListResponse {
  success: boolean
  data?: {
    apiKeys: ApiKey[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
      hasNext: boolean
      hasPrev: boolean
    }
  }
  error?: string
}

// Store API key in localStorage (for testing purposes)
export const storeApiKey = (apiKey: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('api_key', apiKey)
  }
}

// Get stored API key
export const getStoredApiKey = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('api_key')
  }
  return null
}

// Remove stored API key
export const removeStoredApiKey = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('api_key')
  }
}

// Get API key headers for requests
export const getApiKeyHeaders = (): Record<string, string> => {
  const apiKey = getStoredApiKey()
  return apiKey ? { 'X-API-Key': apiKey } : {}
}

// Create a new API key
export const createApiKey = async (request: CreateApiKeyRequest): Promise<CreateApiKeyResponse> => {
  try {
    const authHeaders = getAuthHeaders()
    const response = await fetch('/api/api-keys', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeaders.Authorization && { Authorization: authHeaders.Authorization })
      },
      body: JSON.stringify(request)
    })

    const data = await response.json()
    return data
  } catch (error) {
    return {
      success: false,
      message: 'Failed to connect to server',
      error: 'Connection failed'
    }
  }
}

// Get list of API keys
export const getApiKeys = async (page: number = 1, limit: number = 20): Promise<ApiKeyListResponse> => {
  try {
    const authHeaders = getAuthHeaders()
    const response = await fetch(`/api/api-keys?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        ...(authHeaders.Authorization && { Authorization: authHeaders.Authorization })
      }
    })

    const data = await response.json()
    return data
  } catch (error) {
    return {
      success: false,
      error: 'Connection failed'
    }
  }
}

// Get specific API key details
export const getApiKey = async (id: string) => {
  try {
    const authHeaders = getAuthHeaders()
    const response = await fetch(`/api/api-keys/${id}`, {
      method: 'GET',
      headers: {
        ...(authHeaders.Authorization && { Authorization: authHeaders.Authorization })
      }
    })

    const data = await response.json()
    return data
  } catch (error) {
    return {
      success: false,
      error: 'Connection failed'
    }
  }
}

// Update API key
export const updateApiKey = async (id: string, updates: Partial<ApiKey>) => {
  try {
    const authHeaders = getAuthHeaders()
    const response = await fetch(`/api/api-keys/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeaders.Authorization && { Authorization: authHeaders.Authorization })
      },
      body: JSON.stringify(updates)
    })

    const data = await response.json()
    return data
  } catch (error) {
    return {
      success: false,
      error: 'Connection failed'
    }
  }
}

// Delete API key
export const deleteApiKey = async (id: string) => {
  try {
    const authHeaders = getAuthHeaders()
    const response = await fetch(`/api/api-keys/${id}`, {
      method: 'DELETE',
      headers: {
        ...(authHeaders.Authorization && { Authorization: authHeaders.Authorization })
      }
    })

    const data = await response.json()
    return data
  } catch (error) {
    return {
      success: false,
      error: 'Connection failed'
    }
  }
}

// Test API key authentication
export const testApiKey = async (apiKey: string) => {
  try {
    const response = await fetch('/api/api-keys/test', {
      method: 'GET',
      headers: {
        'X-API-Key': apiKey
      }
    })

    const data = await response.json()
    return data
  } catch (error) {
    return {
      success: false,
      error: 'Connection failed'
    }
  }
}

// Import getAuthHeaders from auth.ts
import { getAuthHeaders } from './auth'
