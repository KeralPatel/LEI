# Token Distribution Backend

A Node.js backend API for distributing tokens based on working hours on the Knightsbridge network.

## Features

- **Token Distribution**: Distributes tokens based on working hours (1 hour = 1 token)
- **Knightsbridge Network**: Built for the Knightsbridge EVM Layer 2 chain
- **Blockchain Integration**: Uses ethers.js for smart contract interactions
- **RESTful API**: Simple Express.js endpoints for token distribution

## Network Configuration

- **Network Name**: Knightsbridge
- **RPC URL**: https://mainnet-rpc.kxcoscan.com
- **Chain ID**: 8060
- **Currency**: KDA
- **Block Explorer**: https://kxcoscan.com

## API Endpoints

### POST /api/distribute-tokens

Distributes tokens to a wallet based on working hours.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "id": "EMP001",
  "walletAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  "hrsWorked": 8.5
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tokens distributed successfully",
  "data": {
    "recipient": {
      "name": "John Doe",
      "email": "john@example.com",
      "id": "EMP001",
      "walletAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
    },
    "distribution": {
      "hoursWorked": 8.5,
      "tokensDistributed": 8,
      "rate": "1 token per hour"
    },
    "transaction": {
      "transactionHash": "0x...",
      "blockNumber": 12345,
      "status": "success",
      "explorerUrl": "https://kxcoscan.com/tx/0x..."
    }
  }
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "Token Distribution API",
  "network": "Knightsbridge",
  "chainId": "8060"
}
```

## Setup

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Environment Configuration:**
   Copy `env.example` to `.env` and configure:
   ```bash
   cp env.example .env
   ```

   Update the following variables in `.env`:
   ```env
   RPC_URL=https://mainnet-rpc.kxcoscan.com
   CHAIN_ID=8060
   PRIVATE_KEY=your_private_key_here
   TOKEN_CONTRACT_ADDRESS=your_token_contract_address_here
   PORT=3001
   ```

3. **Start the Server:**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

4. **Test the API:**
   ```bash
   npm test
   ```

## Development

### Available Scripts
```bash
npm start      # Start production server
npm run dev    # Start development server with nodemon
npm test       # Run API tests
```

### Project Structure
```
backend/
├── services/
│   └── tokenService.js    # Blockchain service
├── server.js              # Express server
├── test-api.js           # API tests
├── package.json          # Dependencies
├── env.example           # Environment template
└── README.md            # This file
```

## Security Notes

- **Private Key**: Store your private key securely in environment variables
- **Environment**: Never commit `.env` to version control
- **Network**: Ensure you're using the correct network configuration
- **Gas**: Monitor gas prices and transaction costs

## Troubleshooting

### Common Issues
1. **"PRIVATE_KEY environment variable is required"**
   - Ensure `.env` file exists with your private key
   
2. **"TOKEN_CONTRACT_ADDRESS environment variable is required"**
   - Add your token contract address to `.env`
   
3. **"Insufficient token balance"**
   - Ensure your wallet has enough tokens to distribute
   
4. **"Invalid recipient wallet address"**
   - Verify the wallet address format (0x...)

## License

MIT
