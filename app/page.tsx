'use client'

import { useState, useEffect } from 'react'
import { Send, Wallet, Clock, CheckCircle, AlertCircle, ExternalLink, Plus, Trash2, Users, LogIn, LogOut, User, Shield, XCircle } from 'lucide-react'
import { loginUser, registerUser, logoutUser, getAuthToken, getAuthHeaders, getCurrentUser, User as UserType } from '@/lib/auth'
import { getTokenBalance, getNativeBalance } from '@/lib/wallet'

interface Recipient {
  name: string
  email: string
  id: string
  wallet: string
  hrsWorked: string
}

interface DistributionResult {
  success: boolean
  message: string
  data?: {
    recipient?: {
      name: string
      email: string
      id: string
      walletAddress: string
    }
    distribution?: {
      hoursWorked: number
      tokensDistributed: number
      rate: string
    }
    transaction?: {
      transactionHash: string
      blockNumber: number
      status: string
      explorerUrl: string
    }
    // For bulk results
    totalRecipients?: number
    successfulDistributions?: number
    failedDistributions?: number
    results?: Array<{
      success: boolean
      recipient: {
        name: string
        email: string
        id: string
        wallet: string
      }
      distribution: {
        hoursWorked: number
        tokensDistributed: number
        rate: string
      }
      transaction?: {
        transactionHash: string
        blockNumber: number
        status: string
        explorerUrl: string
      }
      error?: string
    }>
  }
  error?: string
}

export default function Home() {
  const [distributionMode, setDistributionMode] = useState<'single' | 'bulk'>('single')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    id: '',
    walletAddress: '',
    hrsWorked: ''
  })
  const [recipients, setRecipients] = useState<Recipient[]>([
    { name: '', email: '', id: '', wallet: '', hrsWorked: '' }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<DistributionResult | null>(null)
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<UserType | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [authForm, setAuthForm] = useState({ email: '', password: '' })
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [showCopyToast, setShowCopyToast] = useState(false)
  
  // Withdrawal state
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false)
  const [withdrawalForm, setWithdrawalForm] = useState({
    type: 'tokens' as 'tokens' | 'native',
    amount: '',
    toAddress: ''
  })
  const [withdrawalLoading, setWithdrawalLoading] = useState(false)
  const [withdrawalError, setWithdrawalError] = useState('')
  
  // Wallet state
  const [tokenBalance, setTokenBalance] = useState<string>('0')
  const [nativeBalance, setNativeBalance] = useState<string>('0')
  const [walletLoading, setWalletLoading] = useState(false)

  // Check authentication on component mount
  useEffect(() => {
    const token = getAuthToken()
    const userData = getCurrentUser()
    if (token && userData) {
      setIsAuthenticated(true)
      setUser(userData)
    }
  }, [])

  // Load wallet balances when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadWalletBalances()
    }
  }, [isAuthenticated])

  const loadWalletBalances = async () => {
    setWalletLoading(true)
    try {
      const [tokenResponse, nativeResponse] = await Promise.all([
        getTokenBalance(),
        getNativeBalance()
      ])
      
      if (tokenResponse.success && tokenResponse.data) {
        setTokenBalance(tokenResponse.data.balance)
      }
      
      if (nativeResponse.success && nativeResponse.data) {
        setNativeBalance(nativeResponse.data.balance)
      }
    } catch (error) {
      console.error('Failed to load wallet balances:', error)
    } finally {
      setWalletLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleRecipientChange = (index: number, field: keyof Recipient, value: string) => {
    setRecipients(prev => prev.map((recipient, i) => 
      i === index ? { ...recipient, [field]: value } : recipient
    ))
  }

  const addRecipient = () => {
    setRecipients(prev => [...prev, { name: '', email: '', id: '', wallet: '', hrsWorked: '' }])
  }

  const removeRecipient = (index: number) => {
    if (recipients.length > 1) {
      setRecipients(prev => prev.filter((_, i) => i !== index))
    }
  }

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError('')

    try {
      const response = authMode === 'login' 
        ? await loginUser(authForm)
        : await registerUser(authForm)

      if (response.success) {
        setIsAuthenticated(true)
        setUser(response.data?.user || null)
        setShowAuthModal(false)
        setAuthForm({ email: '', password: '' })
        // Load wallet balances after successful auth
        loadWalletBalances()
      } else {
        setAuthError(response.error || 'Authentication failed')
      }
    } catch (error) {
      setAuthError('Authentication failed')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = () => {
    logoutUser()
    setIsAuthenticated(false)
    setUser(null)
    setTokenBalance('0')
    setNativeBalance('0')
  }

  const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setWithdrawalLoading(true)
    setWithdrawalError('')

    try {
      const authHeaders = getAuthHeaders()
      const response = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeaders.Authorization && { Authorization: authHeaders.Authorization }),
        },
        body: JSON.stringify({
          type: withdrawalForm.type,
          amount: withdrawalForm.amount,
          toAddress: withdrawalForm.toAddress
        })
      })

      const data = await response.json()

      if (data.success) {
        setShowWithdrawalModal(false)
        setWithdrawalForm({ type: 'tokens', amount: '', toAddress: '' })
        // Refresh balances after successful withdrawal
        loadWalletBalances()
        // Show success message
        alert(`Successfully withdrew ${withdrawalForm.amount} ${withdrawalForm.type === 'tokens' ? 'tokens' : 'KDA'} to ${withdrawalForm.toAddress}`)
      } else {
        setWithdrawalError(data.error || 'Withdrawal failed')
      }
    } catch (error: any) {
      setWithdrawalError('Failed to process withdrawal. Please try again.')
      console.error('Withdrawal error:', error)
    } finally {
      setWithdrawalLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isAuthenticated) {
      setShowAuthModal(true)
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      let requestBody
      
      if (distributionMode === 'single') {
        requestBody = {
          ...formData,
          hrsWorked: parseFloat(formData.hrsWorked)
        }
      } else {
        // Validate all recipients
        const validRecipients = recipients.map(recipient => ({
          name: recipient.name,
          email: recipient.email,
          id: recipient.id,
          wallet: recipient.wallet,
          hrsWorked: parseFloat(recipient.hrsWorked)
        }))
        
        requestBody = {
          recipients: validRecipients
        }
      }

      const authHeaders = getAuthHeaders()
      const response = await fetch('/api/distribute-tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeaders.Authorization && { Authorization: authHeaders.Authorization }),
        },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()
      setResult(data)
      
      // Reload wallet balances after distribution
      if (data.success) {
        loadWalletBalances()
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Connection failed',
        error: 'Failed to connect to API. Make sure the backend server is running.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      id: '',
      walletAddress: '',
      hrsWorked: ''
    })
    setRecipients([{ name: '', email: '', id: '', wallet: '', hrsWorked: '' }])
    setResult(null)
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-6">
              <div className="bg-blue-600 p-3 rounded-xl">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">
                  Token Distribution Dashboard
                </h1>
                <p className="text-xl text-gray-300 mt-2">
                  Knightsbridge Network Integration
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              {isAuthenticated ? (
                <>
                  <button
                    onClick={handleLogout}
                    className="flex items-center px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                  >
                    <LogOut className="h-5 w-5 mr-2" />
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <LogIn className="h-5 w-5 mr-2" />
                  Login / Register
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto space-y-8">
          {/* Authentication Notice */}
          {!isAuthenticated && (
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-2xl p-6">
              <div className="flex items-center">
                <div className="bg-yellow-500 p-2 rounded-full">
                  <AlertCircle className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-bold text-white">Authentication Required</h3>
                  <p className="text-yellow-100 mt-1">
                    You need to login or register to distribute tokens. The system uses custodial wallets for secure token management.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Wallet Information */}
          {isAuthenticated && (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-600 p-2 rounded-xl">
                    <Wallet className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Your Custodial Wallet</h3>
                    <p className="text-gray-300 text-sm">Deposit tokens and native currency to this address</p>
                  </div>
                </div>
                <button
                  onClick={loadWalletBalances}
                  disabled={walletLoading}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <div className={`h-4 w-4 mr-2 ${walletLoading ? 'animate-spin' : ''}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  Refresh
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Wallet Address */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-300">Wallet Address</span>
                    <button
                      onClick={() => {
                        if (user?.custodialWallet.address) {
                          navigator.clipboard.writeText(user.custodialWallet.address);
                          setShowCopyToast(true);
                          setTimeout(() => setShowCopyToast(false), 2000);
                        }
                      }}
                      className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                  <div className="font-mono text-sm text-white break-all bg-black/20 p-2 rounded-lg">
                    {user?.custodialWallet.address || 'Loading...'}
                  </div>
                </div>

                {/* Balance Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="text-sm text-gray-300 mb-1">Token Balance</div>
                    <div className="text-2xl font-bold text-white">
                      {walletLoading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Loading...
                        </div>
                      ) : (
                        `${tokenBalance} tokens`
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="text-sm text-gray-300 mb-1">Native Balance (KDA)</div>
                    <div className="text-2xl font-bold text-white">
                      {walletLoading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Loading...
                        </div>
                      ) : (
                        `${nativeBalance} KDA`
                      )}
                    </div>
                  </div>
                </div>

                {/* Withdrawal Section */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-white font-semibold">Withdraw Funds</h4>
                    <button
                      onClick={() => setShowWithdrawalModal(true)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      Withdraw
                    </button>
                  </div>
                  <div className="text-sm text-gray-300">
                    Withdraw tokens or native KDA from your custodial wallet to an external address
                  </div>
                </div>

                {/* Deposit Instructions */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                  <h4 className="text-white font-semibold mb-2">How to Deposit</h4>
                  <div className="text-sm text-blue-100 space-y-1">
                    <p>• <strong>Tokens:</strong> Send your tokens to the wallet address above</p>
                    <p>• <strong>Native KDA:</strong> Send KDA to the same address for transaction fees</p>
                    <p>• <strong>Network:</strong> Make sure you're using the Knightsbridge network</p>
                    <p>• <strong>Refresh:</strong> Click the refresh button to update your balance</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Section */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-2xl p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="bg-blue-600 p-3 rounded-xl">
                  <Send className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white">Distribute Tokens</h2>
                  <p className="text-gray-300 mt-1">Send tokens to recipients securely</p>
                </div>
              </div>
              {isAuthenticated && (
                <div className="bg-green-500/20 backdrop-blur-sm border border-green-500/30 rounded-xl px-4 py-2">
                  <div className="flex items-center text-green-300">
                    <User className="h-4 w-4 mr-2" />
                    <span className="font-medium">Authenticated</span>
                  </div>
                </div>
              )}
            </div>

            {/* Mode Selection */}
            <div className="mb-8">
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setDistributionMode('single')}
                  className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                    distributionMode === 'single'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20 border border-white/20'
                  }`}
                >
                  Single Recipient
                </button>
                <button
                  type="button"
                  onClick={() => setDistributionMode('bulk')}
                  className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                    distributionMode === 'bulk'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20 border border-white/20'
                  }`}
                >
                  <Users className="h-4 w-4 inline mr-2" />
                  Multiple Recipients
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {distributionMode === 'single' ? (
                <>
                  {/* Single Recipient Form */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 backdrop-blur-sm transition-all duration-200"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 backdrop-blur-sm transition-all duration-200"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Employee ID *
                    </label>
                    <input
                      type="text"
                      name="id"
                      value={formData.id}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 backdrop-blur-sm transition-all duration-200"
                      placeholder="EMP001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Wallet Address *
                    </label>
                    <input
                      type="text"
                      name="walletAddress"
                      value={formData.walletAddress}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 backdrop-blur-sm transition-all duration-200 font-mono text-sm"
                      placeholder="0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Hours Worked *
                    </label>
                    <input
                      type="number"
                      name="hrsWorked"
                      value={formData.hrsWorked}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.1"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 backdrop-blur-sm transition-all duration-200"
                      placeholder="8.5"
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Multiple Recipients Form - Table Style */}
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full bg-white/5 backdrop-blur-sm border border-white/20 rounded-2xl" style={{ minWidth: '1200px' }}>
                        <thead className="bg-white/10">
                          <tr>
                            <th className="px-4 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-12">
                              #
                            </th>
                            <th className="px-4 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-32">
                              Name *
                            </th>
                            <th className="px-4 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-40">
                              Email *
                            </th>
                            <th className="px-4 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-24">
                              ID *
                            </th>
                            <th className="px-4 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-20">
                              Hours *
                            </th>
                            <th className="px-4 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-80">
                              Wallet Address *
                            </th>
                            <th className="px-4 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-16">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {recipients.map((recipient, index) => (
                            <tr key={index} className="hover:bg-white/5 transition-colors duration-200">
                              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-white">
                                {index + 1}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <input
                                  type="text"
                                  value={recipient.name}
                                  onChange={(e) => handleRecipientChange(index, 'name', e.target.value)}
                                  required
                                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 backdrop-blur-sm transition-all duration-200 text-sm"
                                  placeholder="John Doe"
                                />
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <input
                                  type="email"
                                  value={recipient.email}
                                  onChange={(e) => handleRecipientChange(index, 'email', e.target.value)}
                                  required
                                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 backdrop-blur-sm transition-all duration-200 text-sm"
                                  placeholder="john@example.com"
                                />
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <input
                                  type="text"
                                  value={recipient.id}
                                  onChange={(e) => handleRecipientChange(index, 'id', e.target.value)}
                                  required
                                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 backdrop-blur-sm transition-all duration-200 text-sm"
                                  placeholder="EMP001"
                                />
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <input
                                  type="number"
                                  value={recipient.hrsWorked}
                                  onChange={(e) => handleRecipientChange(index, 'hrsWorked', e.target.value)}
                                  required
                                  min="0"
                                  step="0.1"
                                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 backdrop-blur-sm transition-all duration-200 text-sm"
                                  placeholder="8.5"
                                />
                              </td>
                              <td className="px-4 py-4">
                                <input
                                  type="text"
                                  value={recipient.wallet}
                                  onChange={(e) => handleRecipientChange(index, 'wallet', e.target.value)}
                                  required
                                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 backdrop-blur-sm transition-all duration-200 font-mono text-xs"
                                  placeholder="0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
                                />
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                {recipients.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeRecipient(index)}
                                    className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/20 transition-all duration-200"
                                    title="Remove recipient"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    <button
                      type="button"
                      onClick={addRecipient}
                      className="w-full py-4 px-6 border-2 border-dashed border-white/30 rounded-xl text-gray-300 hover:border-blue-500 hover:text-blue-300 transition-all duration-200 flex items-center justify-center bg-white/5 hover:bg-white/10 backdrop-blur-sm"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Add Another Recipient
                    </button>
                  </div>
                </>
              )}

              {/* Submit Button */}
              <div className="flex space-x-4 pt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 text-white py-4 px-6 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-3" />
                      Distribute Tokens
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-4 border border-white/30 text-gray-300 rounded-xl hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>

          {/* Results Section */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-2xl p-8">
            <div className="flex items-center mb-8">
              <div className="bg-green-600 p-3 rounded-xl">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <h2 className="text-3xl font-bold text-white">Results</h2>
                <p className="text-gray-300 mt-1">Transaction outcomes and details</p>
              </div>
            </div>

            {!result ? (
              <div className="text-center py-12">
                <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
                  <Clock className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-300 text-lg">Submit the form to see distribution results</p>
                </div>
              </div>
            ) : result.success ? (
              <div className="space-y-4">
                {/* Success Message */}
                <div className="bg-green-500/20 border border-green-500/30 rounded-2xl p-6">
                  <div className="flex items-center">
                    <div className="bg-green-500 p-2 rounded-full">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                    <div className="ml-4">
                      <span className="text-white font-bold text-lg">Distribution Successful!</span>
                      <p className="text-green-100 mt-1">{result.message}</p>
                    </div>
                  </div>
                </div>

                {/* Single Recipient Results */}
                {result.data?.recipient && (
                  <>
                    {/* Recipient Info */}
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                      <h3 className="font-bold text-white mb-4 text-lg">Recipient</h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center"><span className="font-medium text-gray-300 w-20">Name:</span> <span className="text-white">{result.data.recipient.name}</span></div>
                        <div className="flex items-center"><span className="font-medium text-gray-300 w-20">Email:</span> <span className="text-white">{result.data.recipient.email}</span></div>
                        <div className="flex items-center"><span className="font-medium text-gray-300 w-20">ID:</span> <span className="text-white">{result.data.recipient.id}</span></div>
                        <div className="flex items-start">
                          <Wallet className="h-4 w-4 mr-2 mt-0.5 text-gray-300" />
                          <span className="font-medium text-gray-300 w-20">Address:</span>
                          <span className="ml-1 font-mono text-xs break-all text-white">{result.data.recipient.walletAddress}</span>
                        </div>
                      </div>
                    </div>

                    {/* Distribution Info */}
                    <div className="bg-blue-500/20 border border-blue-500/30 rounded-2xl p-6">
                      <h3 className="font-bold text-white mb-4 text-lg">Distribution Details</h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center"><span className="font-medium text-gray-300 w-32">Hours Worked:</span> <span className="text-white font-mono">{result.data.distribution?.hoursWorked}</span></div>
                        <div className="flex items-center"><span className="font-medium text-gray-300 w-32">Tokens Distributed:</span> <span className="text-white font-mono">{result.data.distribution?.tokensDistributed}</span></div>
                        <div className="flex items-center"><span className="font-medium text-gray-300 w-32">Rate:</span> <span className="text-white">{result.data.distribution?.rate}</span></div>
                      </div>
                    </div>

                    {/* Transaction Info */}
                    {result.data.transaction && (
                      <div className="bg-purple-500/20 border border-purple-500/30 rounded-2xl p-6">
                        <h3 className="font-bold text-white mb-4 text-lg">Transaction</h3>
                        <div className="space-y-3 text-sm">
                          <div className="flex items-center">
                            <span className="font-medium text-gray-300 w-20">Status:</span>
                            <span className={`ml-2 px-3 py-1 rounded-full text-xs font-medium ${
                              result.data.transaction.status === 'success' 
                                ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                                : 'bg-red-500/20 text-red-300 border border-red-500/30'
                            }`}>
                              {result.data.transaction.status}
                            </span>
                          </div>
                          <div className="flex items-center"><span className="font-medium text-gray-300 w-20">Block:</span> <span className="text-white font-mono">{result.data.transaction.blockNumber}</span></div>
                          <div className="flex items-start">
                            <span className="font-medium text-gray-300 w-20">Hash:</span>
                            <span className="ml-1 font-mono text-xs break-all text-white">{result.data.transaction.transactionHash}</span>
                          </div>
                          <div className="pt-3">
                            <a
                              href={result.data.transaction.explorerUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View on Explorer
                            </a>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Bulk Distribution Results */}
                {result.data?.totalRecipients && (
                  <>
                    {/* Summary */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Distribution Summary</h3>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{result.data.totalRecipients}</div>
                          <div className="text-gray-600">Total Recipients</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{result.data.successfulDistributions}</div>
                          <div className="text-gray-600">Successful</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">{result.data.failedDistributions}</div>
                          <div className="text-gray-600">Failed</div>
                        </div>
                      </div>
                    </div>

                    {/* Individual Results */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-white">Individual Results</h3>
                      {result.data.results?.map((individualResult, index) => (
                        <div key={index} className={`rounded-lg p-4 ${
                          individualResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              {individualResult.success ? (
                                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                              )}
                              <span className="font-medium text-gray-900">{individualResult.recipient.name}</span>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              individualResult.success 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {individualResult.success ? 'Success' : 'Failed'}
                            </span>
                          </div>
                          
                          <div className="text-sm text-gray-600 space-y-1">
                            <div><span className="font-medium">Email:</span> {individualResult.recipient.email}</div>
                            <div><span className="font-medium">ID:</span> {individualResult.recipient.id}</div>
                            <div><span className="font-medium">Hours:</span> {individualResult.distribution.hoursWorked}</div>
                            <div><span className="font-medium">Tokens:</span> {individualResult.distribution.tokensDistributed}</div>
                            {individualResult.transaction && (
                              <div className="pt-2">
                                <a
                                  href={individualResult.transaction.explorerUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center text-blue-600 hover:text-blue-800 text-xs"
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  View Transaction
                                </a>
                              </div>
                            )}
                            {individualResult.error && (
                              <div className="text-red-600 text-xs mt-1">
                                Error: {individualResult.error}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-6">
                <div className="flex items-center">
                  <div className="bg-red-500 p-2 rounded-full">
                    <AlertCircle className="h-5 w-5 text-white" />
                  </div>
                  <div className="ml-4">
                    <span className="text-white font-bold text-lg">Distribution Failed</span>
                    <p className="text-red-100 mt-1">{result.error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Authentication Modal */}
        {showAuthModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-2xl p-8 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-white">
                  {authMode === 'login' ? 'Login' : 'Register'}
                </h2>
                <button
                  onClick={() => setShowAuthModal(false)}
                  className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={authForm.email}
                    onChange={(e) => setAuthForm(prev => ({ ...prev, email: e.target.value }))}
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 backdrop-blur-sm transition-all duration-200"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={authForm.password}
                    onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 backdrop-blur-sm transition-all duration-200"
                    placeholder="••••••••"
                  />
                </div>

                {authError && (
                  <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4">
                    <p className="text-red-200 text-sm">{authError}</p>
                  </div>
                )}

                <div className="flex space-x-4">
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="flex-1 bg-blue-600 text-white py-4 px-6 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {authLoading ? 'Processing...' : (authMode === 'login' ? 'Login' : 'Register')}
                  </button>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                    className="text-blue-300 hover:text-blue-200 text-sm transition-colors"
                  >
                    {authMode === 'login' 
                      ? "Don't have an account? Register" 
                      : "Already have an account? Login"
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Withdrawal Modal */}
        {showWithdrawalModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl border border-white/20 shadow-2xl w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">Withdraw Funds</h3>
                  <button
                    onClick={() => setShowWithdrawalModal(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleWithdrawalSubmit} className="space-y-4">
                  {/* Withdrawal Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Withdrawal Type
                    </label>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setWithdrawalForm(prev => ({ ...prev, type: 'tokens' }))}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          withdrawalForm.type === 'tokens'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white/10 text-gray-300 hover:bg-white/20'
                        }`}
                      >
                        Tokens
                      </button>
                      <button
                        type="button"
                        onClick={() => setWithdrawalForm(prev => ({ ...prev, type: 'native' }))}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          withdrawalForm.type === 'native'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white/10 text-gray-300 hover:bg-white/20'
                        }`}
                      >
                        Native KDA
                      </button>
                    </div>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Amount
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      value={withdrawalForm.amount}
                      onChange={(e) => setWithdrawalForm(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder={`Enter amount in ${withdrawalForm.type === 'tokens' ? 'tokens' : 'KDA'}`}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <div className="text-xs text-gray-400 mt-1">
                      Available: {withdrawalForm.type === 'tokens' ? `${tokenBalance} tokens` : `${nativeBalance} KDA`}
                    </div>
                  </div>

                  {/* To Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      To Address
                    </label>
                    <input
                      type="text"
                      value={withdrawalForm.toAddress}
                      onChange={(e) => setWithdrawalForm(prev => ({ ...prev, toAddress: e.target.value }))}
                      placeholder="Enter recipient wallet address"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  {/* Error Message */}
                  {withdrawalError && (
                    <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3">
                      <div className="flex items-center">
                        <XCircle className="h-5 w-5 text-red-400 mr-2" />
                        <span className="text-red-300 text-sm">{withdrawalError}</span>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={withdrawalLoading}
                    className="w-full bg-red-600 text-white py-3 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {withdrawalLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      `Withdraw ${withdrawalForm.type === 'tokens' ? 'Tokens' : 'KDA'}`
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Copy Toast Notification */}
      {showCopyToast && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg z-50 flex items-center space-x-2">
          <CheckCircle className="h-5 w-5" />
          <span>Wallet address copied to clipboard!</span>
        </div>
      )}
    </div>
  )
}
