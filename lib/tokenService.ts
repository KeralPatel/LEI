import { ethers } from 'ethers'

const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)"
]

export class TokenService {
  private rpcUrl: string
  private chainId: string
  private privateKey: string
  private tokenContractAddress: string
  private provider: ethers.JsonRpcProvider
  private wallet: ethers.Wallet
  private tokenContract: ethers.Contract

  constructor() {
    this.rpcUrl = process.env.RPC_URL || 'https://mainnet-rpc.kxcoscan.com'
    this.chainId = process.env.CHAIN_ID || '8060'
    this.privateKey = process.env.PRIVATE_KEY || ''
    this.tokenContractAddress = process.env.TOKEN_CONTRACT_ADDRESS || ''
    
    if (!this.privateKey) {
      throw new Error('PRIVATE_KEY environment variable is required')
    }
    
    if (!this.tokenContractAddress) {
      throw new Error('TOKEN_CONTRACT_ADDRESS environment variable is required')
    }

    this.provider = new ethers.JsonRpcProvider(this.rpcUrl)
    this.wallet = new ethers.Wallet(this.privateKey, this.provider)
    this.tokenContract = new ethers.Contract(this.tokenContractAddress, ERC20_ABI, this.wallet)
  }

  async distributeTokens(recipientAddress: string, amount: number, metadata: any = {}) {
    try {
      console.log(`Starting token distribution to ${recipientAddress} for ${amount} tokens`)

      if (!ethers.isAddress(recipientAddress)) {
        throw new Error('Invalid recipient wallet address')
      }

      const decimals = await this.tokenContract.decimals()
      const tokenAmount = ethers.parseUnits(amount.toString(), decimals)

      const balance = await this.tokenContract.balanceOf(this.wallet.address)
      if (balance < tokenAmount) {
        throw new Error(`Insufficient token balance. Required: ${amount}, Available: ${ethers.formatUnits(balance, decimals)}`)
      }

      const gasEstimate = await this.tokenContract.transfer.estimateGas(recipientAddress, tokenAmount)
      const feeData = await this.provider.getFeeData()
      
      const gasLimit = gasEstimate * 120n / 100n

      console.log(`Gas estimate: ${gasEstimate}, Gas limit: ${gasLimit}, Gas price: ${feeData.gasPrice}`)

      const tx = await this.tokenContract.transfer(recipientAddress, tokenAmount, {
        gasLimit: gasLimit,
        gasPrice: feeData.gasPrice
      })

      console.log(`Transaction sent: ${tx.hash}`)

      const receipt = await tx.wait()
      
      console.log(`Transaction confirmed in block: ${receipt.blockNumber}`)

      const explorerUrl = `https://kxcoscan.com/tx/${tx.hash}`
      
      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        gasPrice: feeData.gasPrice?.toString(),
        status: receipt.status === 1 ? 'success' : 'failed',
        explorerUrl: explorerUrl,
        recipient: recipientAddress,
        amount: amount,
        tokenContract: this.tokenContractAddress,
        network: 'Knightsbridge',
        chainId: this.chainId,
        timestamp: new Date().toISOString(),
        metadata: metadata
      }

    } catch (error: any) {
      console.error('Token distribution failed:', error)
      throw new Error(`Token distribution failed: ${error.message}`)
    }
  }

  async getTokenInfo() {
    try {
      const [name, symbol, decimals] = await Promise.all([
        this.tokenContract.name(),
        this.tokenContract.symbol(),
        this.tokenContract.decimals()
      ])

      return {
        name,
        symbol,
        decimals: decimals.toString(),
        contractAddress: this.tokenContractAddress,
        network: 'Knightsbridge',
        chainId: this.chainId
      }
    } catch (error) {
      console.error('Failed to get token info:', error)
      throw error
    }
  }

  async getWalletBalance(address: string) {
    try {
      const balance = await this.tokenContract.balanceOf(address)
      const decimals = await this.tokenContract.decimals()
      return ethers.formatUnits(balance, decimals)
    } catch (error) {
      console.error('Failed to get wallet balance:', error)
      throw error
    }
  }
}

// Create a singleton instance
let tokenServiceInstance: TokenService | null = null

export function getTokenService(): TokenService {
  if (!tokenServiceInstance) {
    tokenServiceInstance = new TokenService()
  }
  return tokenServiceInstance
}

export async function distributeTokens(recipientAddress: string, amount: number, metadata: any = {}) {
  const tokenService = getTokenService()
  return await tokenService.distributeTokens(recipientAddress, amount, metadata)
}
