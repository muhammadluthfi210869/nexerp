import axios from 'axios';

async function testLeads() {
  const baseURL = 'http://localhost:3000';
  console.log('Testing leads creation...');
  try {
    const login = await axios.post(`${baseURL}/auth/login`, {
      email: 'bd@portoaureon.com',
      password: 'password123'
    });
    const token = login.data.access_token;
    console.log('Token received successfully.');

    const res = await axios.post(`${baseURL}/leads`, {
      client_name: 'Debug Test lead',
      phone_number: '081234567890',
      city: 'Jakarta',
      source_id: 'TIKTOK',
      status: 'NEW'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Lead created:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    if (err.response) {
      console.error('API Error Response:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('Request Execution Error:', err.message);
    }
  }
}

testLeads();
