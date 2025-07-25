// Test script to check exact API response for dashboard
const http = require('http');

function testDashboardAPI() {
  console.log('Testing Dashboard API Response...\n');
  
  // Current date is July 2025
  const currentDate = new Date('2025-07-25');
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  
  // Format dates as the frontend does
  const startDate = startOfMonth.toISOString().split('T')[0]; // 2025-07-01
  const endDate = currentDate.toISOString().split('T')[0];     // 2025-07-25
  
  console.log('Date Range:', { startDate, endDate });
  
  // Make API request exactly as frontend does
  const url = `/api/analytics/dashboard?startDate=${startDate}&endDate=${endDate}`;
  console.log('Requesting:', `http://localhost:3000${url}`);
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: url,
    method: 'GET',
    headers: {
      'Cookie': 'next-auth.session-token=dummy-token' // May need valid session
    }
  };
  
  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode !== 200) {
        console.error('API Error:', res.statusCode, res.statusMessage);
        console.error('Response:', data);
        return;
      }
      
      try {
        const jsonData = JSON.parse(data);
        
        console.log('\n=== Full API Response ===');
        console.log(JSON.stringify(jsonData, null, 2));
        
        // Check Customer Segments specifically
        console.log('\n=== Customer Segments Data ===');
        if (jsonData.customerSegments) {
          console.log('Number of segments:', jsonData.customerSegments.length);
          console.log('Customer Segments:', JSON.stringify(jsonData.customerSegments, null, 2));
          
          if (jsonData.customerSegments.length === 0) {
            console.log('\n⚠️  Customer Segments array is empty!');
          } else {
            // Check field names
            const segment = jsonData.customerSegments[0];
            console.log('\nFirst segment fields:', Object.keys(segment));
            console.log('Has "count" field?', 'count' in segment);
            console.log('Has "segment" field?', 'segment' in segment);
            console.log('Has "revenue" field?', 'revenue' in segment);
          }
        } else {
          console.log('❌ customerSegments field is missing from API response!');
        }
        
        // Check other data
        console.log('\n=== Other Data Checks ===');
        console.log('Has KPIs?', !!jsonData.kpis);
        console.log('Has Sales Trend?', !!jsonData.salesTrend);
        console.log('Sales Trend length:', jsonData.salesTrend?.length || 0);
        console.log('Has Category Performance?', !!jsonData.categoryPerformance);
        console.log('Category Performance length:', jsonData.categoryPerformance?.length || 0);
        
      } catch (error) {
        console.error('Error parsing response:', error);
        console.error('Raw response:', data);
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('Request error:', error);
  });
  
  req.end();
}

// Run the test
testDashboardAPI();
