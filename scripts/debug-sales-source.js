const mongoose = require('mongoose');

async function debugSalesSource() {
  try {
    await mongoose.connect('mongodb://localhost:27017/test');
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Check distinct source values in salesorders
    const sources = await db.collection('salesorders').distinct('source');
    console.log('\nDistinct source values:', sources);
    
    // Check a few sample orders
    const sampleOrders = await db.collection('salesorders')
      .find({ status: { $nin: ['draft', 'cancelled'] } })
      .limit(5)
      .toArray();
    
    console.log('\nSample orders:');
    sampleOrders.forEach(order => {
      console.log(`- Order ${order.orderNumber}: source = "${order.source}", status = "${order.status}"`);
    });
    
    // Run the aggregation pipeline manually
    const aggregationResult = await db.collection('salesorders').aggregate([
      {
        $addFields: {
          'dates.orderDateConverted': {
            $dateFromString: {
              dateString: '$dates.orderDate',
              onError: null,
              onNull: null
            }
          }
        }
      },
      {
        $match: {
          status: { $nin: ['draft', 'cancelled'] },
          'dates.orderDateConverted': {
            $gte: new Date('2025-07-01'),
            $lte: new Date('2025-07-31')
          }
        }
      },
      {
        $group: {
          _id: '$source',
          revenue: { $sum: '$financial.grandTotal' }
        }
      },
      {
        $project: {
          _id: 0,
          source: '$_id',
          revenue: 1
        }
      },
      {
        $sort: { revenue: -1 }
      }
    ]).toArray();
    
    console.log('\nAggregation result for source distribution:');
    console.log(JSON.stringify(aggregationResult, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

debugSalesSource();
