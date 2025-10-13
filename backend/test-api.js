const axios = require('axios');

// Test configuration
const API_BASE_URL = 'http://localhost:3001';

// Test data
const testData = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  id: 'EMP001',
  walletAddress: '0x70A9F9c304181320187fC16A9D02a99c0b73b390', // Replace with actual wallet address
  hrsWorked: 8.5
};

async function testTokenDistribution() {
  try {
    console.log('🧪 Testing Token Distribution API...\n');

    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Health check:', healthResponse.data);
    console.log('');

    // Test token distribution
    console.log('2. Testing token distribution...');
    console.log('📤 Sending request:', testData);
    
    const distributionResponse = await axios.post(`${API_BASE_URL}/api/distribute-tokens`, testData);
    console.log('✅ Distribution response:', JSON.stringify(distributionResponse.data, null, 2));
    console.log('');

    // Test invalid data
    console.log('3. Testing with invalid data...');
    try {
      await axios.post(`${API_BASE_URL}/api/distribute-tokens`, {
        name: 'Test User',
        // Missing required fields
      });
    } catch (error) {
      console.log('✅ Error handling works:', error.response.data);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testTokenDistribution();
}
