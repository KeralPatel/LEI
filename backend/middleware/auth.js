const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Verify JWT token and attach user to request
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or inactive user'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(403).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};

/**
 * Generate JWT token for user
 */
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findByPk(decoded.userId, {
        attributes: { exclude: ['password'] }
      });
      
      if (user && user.is_active) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

/**
 * Check if user has sufficient balance for operation
 */
const checkBalance = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const user = req.user;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount'
      });
    }

    // Get user's token balance
    const custodialWalletService = require('../services/custodialWalletService');
    const tokenContractAddress = process.env.TOKEN_CONTRACT_ADDRESS;
    
    if (!tokenContractAddress) {
      return res.status(500).json({
        success: false,
        error: 'Token contract not configured'
      });
    }

    const balance = await custodialWalletService.getTokenBalance(
      user.custodialWallet.address,
      tokenContractAddress
    );

    if (parseFloat(balance) < parseFloat(amount)) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance',
        details: {
          required: amount,
          available: balance
        }
      });
    }

    next();
  } catch (error) {
    console.error('Balance check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check balance'
    });
  }
};

module.exports = {
  authenticateToken,
  generateToken,
  optionalAuth,
  checkBalance
};
