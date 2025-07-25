const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:oK1He1DJvOhkPNye@cluster0.km4yypv.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';

async function testSalesOrdersAccess() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collection = db.collection('salesorders');
    
    // Test 1: Count documents
    const count = await collection.countDocuments({});
    console.log(`\n✅ Total sales orders: ${count}`);
    
    // Test 2: Test date range query (last 30 days)
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    console.log(`\n📅 Testing date range query:`);
    console.log(`  Start: ${startDate.toISOString()}`);
    console.log(`  End: ${endDate.toISOString()}`);
    
    // Note: dates are stored as strings, so direct date comparison won't work
    const dateRangeCount = await collection.countDocuments({
      'dates.orderDate': {
        $gte: startDate.toISOString(),
        $lte: endDate.toISOString()
      }
    });
    console.log(`  Orders in date range: ${dateRangeCount}`);
    
    // Test 3: Test status query
    const statusCounts = await collection.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    
    console.log(`\n📊 Status distribution:`);
    statusCounts.forEach(({ _id, count }) => {
      console.log(`  ${_id}: ${count}`);
    });
    
    // Test 4: Test warehouse query
    const warehouseCounts = await collection.aggregate([
      { $group: { _id: '$warehouse.name', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    
    console.log(`\n🏭 Warehouse distribution:`);
    warehouseCounts.forEach(({ _id, count }) => {
      console.log(`  ${_id}: ${count}`);
    });
    
    // Test 5: Test search functionality
    const searchResults = await collection.find({
      $or: [
        { orderNumber: { $regex: 'SO-2025', $options: 'i' } },
        { 'customer.name': { $regex: 'John', $options: 'i' } }
      ]
    }).limit(5).toArray();
    
    console.log(`\n🔍 Search test results: ${searchResults.length} orders found`);
    
    // Test 6: Verify indexes are being used
    const explainResult = await collection.find({
      'dates.orderDate': { $gte: startDate.toISOString() },
      status: 'delivered'
    }).explain('executionStats');
    
    console.log(`\n⚡ Index usage test:`);
    console.log(`  Total docs examined: ${explainResult.executionStats.totalDocsExamined}`);
    console.log(`  Total keys examined: ${explainResult.executionStats.totalKeysExamined}`);
    console.log(`  Execution time: ${explainResult.executionStats.executionTimeMillis}ms`);
    
    // Test 7: Sample order
    const sampleOrder = await collection.findOne({ status: 'delivered' });
    if (sampleOrder) {
      console.log(`\n📦 Sample order:`);
      console.log(`  Order Number: ${sampleOrder.orderNumber}`);
      console.log(`  Customer: ${sampleOrder.customer.name}`);
      console.log(`  Date: ${sampleOrder.dates.orderDate}`);
      console.log(`  Total: $${sampleOrder.financial.grandTotal.toFixed(2)}`);
    }
    
    await mongoose.disconnect();
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testSalesOrdersAccess();
