async function testPost() {
  const staffId = 'fdff12c8-bb2e-4e3b-af34-6d99f119b174'; // Sarah
  const payload = {
    hkiId: 'HKI-BATCH-TEST-' + Date.now(),
    brandName: 'Antigravity Test',
    type: 'Trademark',
    clientName: 'Dreamlab',
    picId: staffId,
    applicationDate: new Date().toISOString(),
  };

  try {
    console.log('--- TESTING HKI POST ---');
    
    console.log('Logging in...');
    const loginResp = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'compliance@dreamlab.com',
        password: 'password123'
      })
    });
    
    if (!loginResp.ok) throw new Error('Login failed: ' + await loginResp.text());
    
    const loginData = await loginResp.json();
    const token = loginData.access_token;
    console.log('Login successful.');

    console.log('Creating HKI record...');
    const postResp = await fetch('http://localhost:3000/legality/hki', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(payload)
    });
    
    if (!postResp.ok) throw new Error('POST failed: ' + await postResp.text());
    
    const postData = await postResp.json();
    console.log('POST SUCCESS:', postData);

    console.log('Fetching HKI records...');
    const getResp = await fetch('http://localhost:3000/legality/hki', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const getData = await getResp.json();
    console.log('Records Count:', getData.length);
  } catch (error: any) {
    console.error('ERROR:', error.message);
  }
}

testPost();
