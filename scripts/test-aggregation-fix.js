const { MongoClient } = require('mongodb');

async function testAggregationFix() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('test');
    const salesorders = db.collection('salesorders');

    console.log('=== Testing Aggregation Fix for String Dates ===\n');

    // Test 1: Sales KPIs for July 2025
    console.log('1. Sales KPIs for July 2025:');
    const salesKPIs = await salesorders.aggregate([
      {
        $addFields: {
          'dates.orderDate': { $dateFromString: { dateString: '$dates.orderDate' } }
        }
      },
      {
        $match: {
          'dates.orderDate': {
            $gte: new Date('2025-07-01'),
            $lte: new Date('2025-07-31T23:59:59.999Z')
          },
          status: { $nin: ['draft', 'cancelled'] }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$financial.grandTotal' },
          totalOrders: { $sum: 1 },
          avgOrderValue: { $avg: '$financial.grandTotal' },
          totalQuantity: { $sum: { $sum: '$items.quantity' } }
        }
      }
    ]).toArray();
    
    if (salesKPIs.length > 0) {
      console.log('- Total Revenue: $' + salesKPIs[0].totalRevenue.toFixed(2));
      console.log('- Total Orders: ' + salesKPIs[0].totalOrders);
      console.log('- Avg Order Value: $' + salesKPIs[0].avgOrderValue.toFixed(2));
      console.log('- Total Quantity: ' + salesKPIs[0].totalQuantity);
    } else {
      console.log('- No data found');
    }

    // Test 2: Sales Trend by Day
    console.log('\n2. Sales Trend by Day (first 5 days with sales):');
    const salesTrend = await salesorders.aggregate([
      {
        $addFields: {
          'dates.orderDate': { $dateFromString: { dateString: '$dates.orderDate' } }
        }
      },
      {
        $match: {
          'dates.orderDate': {
            $gte: new Date('2025-07-01'),
            $lte: new Date('2025-07-31T23:59:59.999Z')
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
    
    salesTrend.forEach(day => {
      console.log(`- ${day._id}: $${day.revenue.toFixed(2)} (${day.orders} orders)`);
    });

    // Test 3: Category Performance
    console.log('\n3. Top Categories by Revenue:');
    const categoryPerf = await salesorders.aggregate([
      {
        $addFields: {
          'dates.orderDate': { $dateFromString: { dateString: '$dates.orderDate' } }
        }
      },
      {
        $match: {
          'dates.orderDate': {
            $gte: new Date('2025-07-01'),
            $lte: new Date('2025-07-31T23:59:59.999Z')
          },
          status: { $nin: ['draft', 'cancelled'] }
        }
      },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: '$product.category.name',
          revenue: { $sum: { $multiply: ['$items.quantity', '$items.unitPrice'] } },
          quantity: { $sum: '$items.quantity' }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 }
    ]).toArray();
    
    categoryPerf.forEach(cat => {
      console.log(`- ${cat._id}: $${cat.revenue.toFixed(2)} (${cat.quantity} units)`);
    });

    console.log('\n✅ All aggregations working with string date conversion!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

testAggregationFix();
