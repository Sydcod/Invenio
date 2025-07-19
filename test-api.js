// API Test Script for Invenio
const BASE_URL = 'http://localhost:3001/api';

// Test helper function
async function testAPI(method, endpoint, data = null, description = '') {
  console.log(`\n📋 Testing: ${description || endpoint}`);
  console.log(`   Method: ${method}`);
  console.log(`   URL: ${BASE_URL}${endpoint}`);
  
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (data && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const responseData = await response.text();
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (responseData) {
      try {
        const json = JSON.parse(responseData);
        console.log(`   Response:`, JSON.stringify(json, null, 2));
      } catch {
        console.log(`   Response:`, responseData);
      }
    }
    
    return { success: response.ok, status: response.status, data: responseData };
  } catch (error) {
    console.log(`   ❌ Error:`, error.message);
    return { success: false, error: error.message };
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Invenio API Tests...\n');
  console.log('================================');
  
  // Test Categories API
  console.log('\n🏷️  CATEGORIES API TESTS');
  await testAPI('GET', '/categories', null, 'Get all categories');
  
  // Test Products API
  console.log('\n📦 PRODUCTS API TESTS');
  await testAPI('GET', '/products', null, 'Get all products');
  await testAPI('GET', '/products/search?q=test', null, 'Search products');
  
  // Test Warehouses API
  console.log('\n🏭 WAREHOUSES API TESTS');
  await testAPI('GET', '/warehouses', null, 'Get all warehouses');
  
  // Test Suppliers API
  console.log('\n🚚 SUPPLIERS API TESTS');
  await testAPI('GET', '/suppliers', null, 'Get all suppliers');
  
  // Test Purchase Orders API
  console.log('\n📋 PURCHASE ORDERS API TESTS');
  await testAPI('GET', '/purchase-orders', null, 'Get all purchase orders');
  
  // Test Sales Orders API
  console.log('\n💰 SALES ORDERS API TESTS');
  await testAPI('GET', '/sales-orders', null, 'Get all sales orders');
  
  // Test Organizations API
  console.log('\n🏢 ORGANIZATIONS API TESTS');
  await testAPI('GET', '/organizations', null, 'Get organization details');
  await testAPI('GET', '/organizations/stats', null, 'Get organization stats');
  await testAPI('GET', '/organizations/members', null, 'Get organization members');
  
  console.log('\n================================');
  console.log('✅ API Tests Completed!\n');
}

// Run the tests
runTests().catch(console.error);
