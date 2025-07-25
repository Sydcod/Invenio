const { MongoClient } = require('mongodb');

async function testAnalytics() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('test');
    const salesOrders = db.collection('salesorders');
    const products = db.collection('products');
    
    // Define date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    console.log('\nDate range:');
    console.log('Start:', startDate.toISOString());
    console.log('End:', endDate.toISOString());
    
    // Check total orders in database
    const totalOrders = await salesOrders.countDocuments();
    console.log(`\nTotal orders in database: ${totalOrders}`);
    
    // Check orders in date range
    const ordersInRange = await salesOrders.countDocuments({
      'dates.orderDate': {
        $gte: startDate,
        $lte: endDate
      }
    });
    console.log(`Orders in last 30 days: ${ordersInRange}`);
    
    // Get a sample order to see structure
    const sampleOrder = await salesOrders.findOne();
    console.log('\nSample order dates:', sampleOrder?.dates);
    console.log('Sample order financial:', sampleOrder?.financial);
    
    // Test simple KPI aggregation
    console.log('\n=== Testing Simple KPI Aggregation ===');
    const kpiResult = await salesOrders.aggregate([
      {
        $match: {
          'dates.orderDate': {
            $gte: startDate,
            $lte: endDate
          },
          status: { $nin: ['draft', 'cancelled'] }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$financial.grandTotal' },
          totalOrders: { $sum: 1 },
          avgOrderValue: { $avg: '$financial.grandTotal' }
        }
      }
    ]).toArray();
    
    console.log('KPI Result:', kpiResult);
    
    // Test daily sales trend
    console.log('\n=== Testing Daily Sales Trend ===');
    const trendResult = await salesOrders.aggregate([
      {
        $match: {
          'dates.orderDate': {
            $gte: startDate,
            $lte: endDate
          },
          status: { $nin: ['draft', 'cancelled'] }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$dates.orderDate' } },
          revenue: { $sum: '$financial.grandTotal' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 5 }
    ]).toArray();
    
    console.log('Daily trend (first 5 days):', trendResult);
    
    // Check for orders with missing dates
    const ordersWithoutDates = await salesOrders.countDocuments({
      'dates.orderDate': { $exists: false }
    });
    console.log(`\nOrders without dates.orderDate: ${ordersWithoutDates}`);
    
    // Check for orders with null dates
    const ordersWithNullDates = await salesOrders.countDocuments({
      'dates.orderDate': null
    });
    console.log(`Orders with null dates.orderDate: ${ordersWithNullDates}`);
    
    // Check inventory
    const totalProducts = await products.countDocuments();
    console.log(`\nTotal products: ${totalProducts}`);
    
    const inventoryValue = await products.aggregate([
      {
        $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ['$costPrice', '$inventory.quantity'] } },
          totalQuantity: { $sum: '$inventory.quantity' }
        }
      }
    ]).toArray();
    
    console.log('Inventory value:', inventoryValue);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('\nConnection closed');
  }
}

testAnalytics();
