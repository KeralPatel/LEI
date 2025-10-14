'use client'

import { useState } from 'react'
import { Send, Wallet, Clock, CheckCircle, AlertCircle, ExternalLink, Plus, Trash2, Users } from 'lucide-react'

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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

      const response = await fetch('/api/distribute-tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()
      setResult(data)
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Token Distribution Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Test interface for Knightsbridge token distribution
          </p>
        </div>

        <div className="max-w-6xl mx-auto space-y-8">
          {/* Form Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-6">
              <Send className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-2xl font-semibold text-gray-900">Distribute Tokens</h2>
            </div>

            {/* Mode Selection */}
            <div className="mb-6">
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setDistributionMode('single')}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    distributionMode === 'single'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Single Recipient
                </button>
                <button
                  type="button"
                  onClick={() => setDistributionMode('bulk')}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    distributionMode === 'bulk'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Employee ID *
                    </label>
                    <input
                      type="text"
                      name="id"
                      value={formData.id}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      placeholder="EMP001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Wallet Address *
                    </label>
                    <input
                      type="text"
                      name="walletAddress"
                      value={formData.walletAddress}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black font-mono text-sm"
                      placeholder="0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      placeholder="8.5"
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Multiple Recipients Form - Table Style */}
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full bg-white border border-gray-200 rounded-lg" style={{ minWidth: '1200px' }}>
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                              #
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                              Name *
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                              Email *
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                              ID *
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                              Hours *
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-80">
                              Wallet Address *
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {recipients.map((recipient, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {index + 1}
                              </td>
                              <td className="px-3 py-4 whitespace-nowrap">
                                <input
                                  type="text"
                                  value={recipient.name}
                                  onChange={(e) => handleRecipientChange(index, 'name', e.target.value)}
                                  required
                                  className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-black text-sm"
                                  placeholder="John Doe"
                                />
                              </td>
                              <td className="px-3 py-4 whitespace-nowrap">
                                <input
                                  type="email"
                                  value={recipient.email}
                                  onChange={(e) => handleRecipientChange(index, 'email', e.target.value)}
                                  required
                                  className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-black text-sm"
                                  placeholder="john@example.com"
                                />
                              </td>
                              <td className="px-3 py-4 whitespace-nowrap">
                                <input
                                  type="text"
                                  value={recipient.id}
                                  onChange={(e) => handleRecipientChange(index, 'id', e.target.value)}
                                  required
                                  className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-black text-sm"
                                  placeholder="EMP001"
                                />
                              </td>
                              <td className="px-3 py-4 whitespace-nowrap">
                                <input
                                  type="number"
                                  value={recipient.hrsWorked}
                                  onChange={(e) => handleRecipientChange(index, 'hrsWorked', e.target.value)}
                                  required
                                  min="0"
                                  step="0.1"
                                  className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-black text-sm"
                                  placeholder="8.5"
                                />
                              </td>
                              <td className="px-3 py-4">
                                <input
                                  type="text"
                                  value={recipient.wallet}
                                  onChange={(e) => handleRecipientChange(index, 'wallet', e.target.value)}
                                  required
                                  className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-black font-mono text-xs"
                                  placeholder="0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
                                />
                              </td>
                              <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                                {recipients.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeRecipient(index)}
                                    className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
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
                      className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Another Recipient
                    </button>
                  </div>
                </>
              )}

              {/* Submit Button */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Distribute Tokens
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>

          {/* Results Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-6">
              <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
              <h2 className="text-2xl font-semibold text-gray-900">Results</h2>
            </div>

            {!result ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Submit the form to see distribution results</p>
              </div>
            ) : result.success ? (
              <div className="space-y-4">
                {/* Success Message */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-green-800 font-medium">Distribution Successful!</span>
                  </div>
                  <p className="text-green-700 mt-1">{result.message}</p>
                </div>

                {/* Single Recipient Results */}
                {result.data?.recipient && (
                  <>
                    {/* Recipient Info */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Recipient</h3>
                      <div className="space-y-1 text-sm text-black">
                        <div><span className="font-medium">Name:</span> {result.data.recipient.name}</div>
                        <div><span className="font-medium">Email:</span> {result.data.recipient.email}</div>
                        <div><span className="font-medium">ID:</span> {result.data.recipient.id}</div>
                        <div className="flex items-center">
                          <Wallet className="h-4 w-4 mr-1" />
                          <span className="font-medium">Address:</span>
                          <span className="ml-1 font-mono text-xs break-all text-black">{result.data.recipient.walletAddress}</span>
                        </div>
                      </div>
                    </div>

                    {/* Distribution Info */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Distribution Details</h3>
                      <div className="space-y-1 text-sm text-black">
                        <div><span className="font-medium">Hours Worked:</span> {result.data.distribution?.hoursWorked}</div>
                        <div><span className="font-medium">Tokens Distributed:</span> {result.data.distribution?.tokensDistributed}</div>
                        <div><span className="font-medium">Rate:</span> {result.data.distribution?.rate}</div>
                      </div>
                    </div>

                    {/* Transaction Info */}
                    {result.data.transaction && (
                      <div className="bg-purple-50 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">Transaction</h3>
                        <div className="space-y-1 text-sm text-black">
                          <div className="flex items-center">
                            <span className="font-medium">Status:</span>
                            <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                              result.data.transaction.status === 'success' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {result.data.transaction.status}
                            </span>
                          </div>
                          <div><span className="font-medium">Block:</span> {result.data.transaction.blockNumber}</div>
                          <div className="flex items-center">
                            <span className="font-medium">Hash:</span>
                            <span className="ml-1 font-mono text-xs break-all text-black">{result.data.transaction.transactionHash}</span>
                          </div>
                          <div className="pt-2">
                            <a
                              href={result.data.transaction.explorerUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
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
                      <h3 className="font-semibold text-gray-900">Individual Results</h3>
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
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                  <span className="text-red-800 font-medium">Distribution Failed</span>
                </div>
                <p className="text-red-700 mt-1">{result.error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
