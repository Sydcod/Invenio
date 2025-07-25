const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:oK1He1DJvOhkPNye@cluster0.km4yypv.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';

async function testAggregation() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB\n');
    
    const db = mongoose.connection.db;
    const collection = db.collection('salesorders');
    
    // Test the exact aggregation pipeline
    const pipeline = [
      // Date conversion stage
      {
        $addFields: {
          'dates.orderDate': {
            $dateFromString: {
              dateString: '$dates.orderDate',
              onError: null
            }
          }
        }
      },
      // Match stage - same as API
      {
        $match: {
          'dates.orderDate': {
            $gte: new Date('2025-01-01'),
            $lte: new Date('2025-05-31')
          },
          status: { $in: ['completed', 'delivered'] }
        }
      },
      // Add order total
      {
        $addFields: {
          orderTotal: { $sum: '$items.total' }
        }
      },
      // Group by channel
      {
        $group: {
          _id: '$channel',
          customerCount: { $addToSet: '$customer.email' },
          revenue: { $sum: '$orderTotal' },
          orderCount: { $sum: 1 }
        }
      },
      // Project final shape
      {
        $project: {
          segment: { $ifNull: ['$_id', 'B2C'] },
          customerCount: { $size: '$customerCount' },
          revenue: { $round: ['$revenue', 2] },
          orderCount: 1,
          avgOrderValue: {
            $round: [
              { $divide: ['$revenue', '$orderCount'] },
              2
            ]
          }
        }
      },
      { $sort: { segment: 1 } }
    ];
    
    console.log('🔍 Running Customer Segments aggregation...\n');
    
    // Run aggregation
    const result = await collection.aggregate(pipeline).toArray();
    
    console.log('📊 Aggregation Result:');
    console.log(JSON.stringify(result, null, 2));
    
    // Also check how many orders match our criteria
    const matchingOrders = await collection.countDocuments({
      'dates.orderDate': {
        $gte: '2025-01-01',
        $lte: '2025-05-31'
      },
      status: { $in: ['completed', 'delivered'] }
    });
    
    console.log(`\n📈 Orders matching criteria (with string dates): ${matchingOrders}`);
    
    // Test with direct date query
    const testPipeline = [
      {
        $match: {
          status: { $in: ['completed', 'delivered'] }
        }
      },
      {
        $group: {
          _id: '$channel',
          count: { $sum: 1 }
        }
      }
    ];
    
    const testResult = await collection.aggregate(testPipeline).toArray();
    console.log('\n🧪 Test without date filter:');
    console.log(JSON.stringify(testResult, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testAggregation();
