const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

async function testAPI() {
  console.log('🧪 Testing Backend API Endpoints...\n');

  try {
    // Test health endpoint
    console.log('1. Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check:', healthResponse.data);
    console.log('');

    // Test products endpoint (public)
    console.log('2. Testing Products Endpoint...');
    const productsResponse = await axios.get(`${BASE_URL}/products`);
    console.log('✅ Products:', productsResponse.data.products?.length || 0, 'products found');
    console.log('');

    // Test auth registration
    console.log('3. Testing User Registration...');
    const testUser = {
      name: 'Test User',
      email: 'test@example.com',
      phone: '+1234567890',
      password: 'password123',
      address: {
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'Test Country'
      },
      bankDetails: {
        accountNumber: '1234567890',
        routingNumber: '987654321',
        bankName: 'Test Bank'
      }
    };

    try {
      const registerResponse = await axios.post(`${BASE_URL}/auth/register`, testUser);
      console.log('✅ Registration successful:', registerResponse.data.user.email);
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        console.log('ℹ️  User already exists, skipping registration');
      } else {
        console.log('❌ Registration error:', error.response?.data?.message || error.message);
      }
    }
    console.log('');

    // Test login
    console.log('4. Testing User Login...');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'test@example.com',
        password: 'password123'
      });
      console.log('✅ Login successful for:', loginResponse.data.user.email);
      
      const token = loginResponse.data.token;
      
      // Test protected endpoint
      console.log('5. Testing Protected Endpoint...');
      const profileResponse = await axios.get(`${BASE_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Profile access successful:', profileResponse.data.name);
      
    } catch (error) {
      console.log('❌ Login error:', error.response?.data?.message || error.message);
    }

    console.log('\n🎉 API Testing Complete!');
    
  } catch (error) {
    console.error('❌ API Test Error:', error.message);
  }
}

testAPI();
