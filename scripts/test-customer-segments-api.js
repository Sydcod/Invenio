// Test script to verify Customer Segments API response
const fetch = require('node-fetch');

async function testCustomerSegmentsAPI() {
  try {
    console.log('Testing Customer Segments API...\n');
    
    // Define date range
    const startDate = '2025-07-01';
    const endDate = '2025-07-31';
    
    // Make API request
    const url = `http://localhost:3000/api/analytics/dashboard?startDate=${startDate}&endDate=${endDate}`;
    console.log('Requesting:', url);
    
    const response = await fetch(url, {
      headers: {
        'Cookie': 'next-auth.session-token=dummy-token' // You may need to replace with a valid session
      }
    });
    
    if (!response.ok) {
      console.error('API Error:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    
    // Check Customer Segments structure
    console.log('\n=== Customer Segments Response ===');
    console.log('Number of segments:', data.customerSegments?.length || 0);
    console.log('\nCustomer Segments Data:');
    console.log(JSON.stringify(data.customerSegments, null, 2));
    
    // Check field names
    if (data.customerSegments && data.customerSegments.length > 0) {
      console.log('\n=== Field Names Check ===');
      const segment = data.customerSegments[0];
      console.log('Fields present:', Object.keys(segment));
      console.log('Has "count" field?', 'count' in segment);
      console.log('Has "customerCount" field?', 'customerCount' in segment);
      
      // Compare with frontend expectations
      console.log('\n=== Frontend Expectations ===');
      console.log('Expected fields: segment, count, revenue');
      console.log('Actual fields:', Object.keys(segment).join(', '));
      
      if ('customerCount' in segment && !('count' in segment)) {
        console.log('\n⚠️  ISSUE FOUND: API returns "customerCount" but frontend expects "count"');
      }
    }
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

// Run the test
testCustomerSegmentsAPI();
