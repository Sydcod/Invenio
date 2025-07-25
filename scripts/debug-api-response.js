const http = require('http');

const params = new URLSearchParams({
  startDate: '2025-01-01',
  endDate: '2025-05-31',
  warehouse: 'all'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: `/api/analytics/dashboard?${params}`,
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  }
};

console.log('🔍 Calling API to debug response...\n');

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`Status: ${res.statusCode}\n`);
    
    try {
      const jsonData = JSON.parse(data);
      
      console.log('=== FULL API RESPONSE ===');
      console.log(JSON.stringify(jsonData, null, 2));
      
      console.log('\n=== CUSTOMER SEGMENTS SPECIFIC ===');
      if (jsonData.customerSegments) {
        console.log('✅ customerSegments field exists');
        console.log('Length:', jsonData.customerSegments.length);
        console.log('Data:', JSON.stringify(jsonData.customerSegments, null, 2));
      } else {
        console.log('❌ customerSegments field is missing from response!');
        console.log('Available fields:', Object.keys(jsonData));
      }
      
    } catch (error) {
      console.error('Error parsing response:', error);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
});

req.end();
