const http = require('http');

async function testAPI() {
  try {
    console.log('Testing Analytics API with correct date range...');
    
    const url = 'http://localhost:3000/api/analytics/dashboard?startDate=2025-01-01&endDate=2025-05-31';
    
    const data = await new Promise((resolve, reject) => {
      http.get(url, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    });
    
    console.log('\n📊 API Response received');
    
    if (data.customerSegments) {
      console.log('\n✅ Customer Segments Data:');
      console.log(JSON.stringify(data.customerSegments, null, 2));
      
      if (data.customerSegments.length > 0) {
        console.log('\n🎉 SUCCESS! Customer Segments are now showing:');
        data.customerSegments.forEach(segment => {
          console.log(`- ${segment.segment}: ${segment.count || segment.customerCount} customers, $${segment.revenue} revenue`);
        });
      } else {
        console.log('\n❌ Customer Segments array is empty');
      }
    } else {
      console.log('\n❌ No customerSegments field in response');
    }
    
    // Also show other metrics to confirm API is working
    console.log('\n📈 Other Metrics:');
    console.log('- Total Revenue:', data.kpis?.totalRevenue?.value);
    console.log('- Total Orders:', data.kpis?.totalOrders?.value);
    console.log('- Categories:', data.categoryPerformance?.length);
    
  } catch (error) {
    console.error('Error testing API:', error.message);
  }
}

testAPI();
