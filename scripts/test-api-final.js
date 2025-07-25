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

console.log('🔍 Testing API with correct date range...');
console.log(`URL: http://localhost:3000${options.path}`);

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`\n📊 Status Code: ${res.statusCode}`);
    
    try {
      const jsonData = JSON.parse(data);
      
      // Check Customer Segments specifically
      if (jsonData.customerSegments) {
        console.log('\n🎯 Customer Segments:', JSON.stringify(jsonData.customerSegments, null, 2));
        
        if (jsonData.customerSegments.length === 0) {
          console.log('\n⚠️ Customer Segments is empty!');
        } else {
          console.log(`\n✅ Found ${jsonData.customerSegments.length} customer segments`);
        }
      } else {
        console.log('\n❌ No customerSegments field in response');
      }
      
      // Also show other metrics to confirm API is working
      console.log('\n📈 Other metrics:');
      console.log(`- Total Revenue: ${jsonData.salesKPIs?.totalRevenue || 'N/A'}`);
      console.log(`- Total Orders: ${jsonData.salesKPIs?.totalOrders || 'N/A'}`);
      
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
