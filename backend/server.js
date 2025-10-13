const express = require('express');
const cors = require('cors');
const { distributeTokens } = require('./services/tokenService');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Token Distribution API',
    network: 'Knightsbridge',
    chainId: process.env.CHAIN_ID || 8060
  });
});

// Token distribution endpoint
app.post('/api/distribute-tokens', async (req, res) => {
  try {
    const { name, email, id, walletAddress, hrsWorked } = req.body;

    if (!name || !email || !id || !walletAddress || !hrsWorked) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, email, id, walletAddress, hrsWorked'
      });
    }

    const hours = parseFloat(hrsWorked);
    if (isNaN(hours) || hours <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid hours worked. Must be a positive number.'
      });
    }

    const tokensToDistribute = Math.floor(hours);

    console.log(`Distributing ${tokensToDistribute} tokens to ${walletAddress} for ${hours} hours worked`);
    const transactionResult = await distributeTokens(walletAddress, tokensToDistribute, {
      name,
      email,
      id,
      hrsWorked: hours
    });

    res.json({
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
    });

  } catch (error) {
    console.error('Token distribution error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to distribute tokens',
      details: error.message
    });
  }
});

// Get distributions endpoint (placeholder)
app.get('/api/distributions', (req, res) => {
  res.json({
    success: true,
    message: 'Distributions endpoint',
    data: []
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API endpoint: http://localhost:${PORT}/api/distribute-tokens`);
});

module.exports = app;
