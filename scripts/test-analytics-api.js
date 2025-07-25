const http = require('http');

function testAnalyticsAPI() {
  // Test with July 2025 date range where we know data exists
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/analytics/dashboard?startDate=2025-07-01&endDate=2025-07-31',
    method: 'GET',
    headers: {
      'Cookie': 'next-auth.session-token=9d93b892-5c1f-4cc8-951f-71c31e4b14e2'
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
    
        console.log('=== Analytics Dashboard API Response ===');
        console.log('\nSales KPIs:');
        if (jsonData.salesKPIs) {
          console.log('- Total Revenue:', jsonData.salesKPIs.totalRevenue);
          console.log('- Total Orders:', jsonData.salesKPIs.totalOrders);
          console.log('- Avg Order Value:', jsonData.salesKPIs.avgOrderValue);
          console.log('- Total Quantity:', jsonData.salesKPIs.totalQuantity);
          console.log('- Unique Customers:', jsonData.salesKPIs.uniqueCustomerCount);
        }
        
        console.log('\nSales Trend (first 5 days):');
        if (jsonData.salesTrend && jsonData.salesTrend.length > 0) {
          jsonData.salesTrend.slice(0, 5).forEach(day => {
            console.log(`- ${day.date}: $${day.revenue} (${day.orders} orders)`);
          });
        }
        
        console.log('\nCategory Performance:');
        if (jsonData.categoryPerformance && jsonData.categoryPerformance.length > 0) {
          jsonData.categoryPerformance.forEach(cat => {
            console.log(`- ${cat.category}: $${cat.revenue} (${cat.quantity} units)`);
          });
        }
      } catch (error) {
        console.error('Error parsing JSON:', error);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Error testing API:', error);
  });

  req.end();
}

testAnalyticsAPI();
