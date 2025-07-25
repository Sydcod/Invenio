const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:oK1He1DJvOhkPNye@cluster0.km4yypv.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';

async function testFixedCustomerSegments() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collection = db.collection('salesorders');
    
    // Use a date range that contains actual data (January to May 2025)
    const startDate = '2025-01-01';
    const endDate = '2025-05-31';
    
    console.log('Testing with date range:', { startDate, endDate });
    
    // Create the fixed pipeline
    const pipeline = [
      // Convert string dates to Date objects
      {
        $addFields: {
          convertedOrderDate: {
            $dateFromString: {
              dateString: '$dates.orderDate',
              onError: null
            }
          }
        }
      },
      // Match date range and status
      {
        $match: {
          convertedOrderDate: {
            $gte: new Date(startDate),
            $lte: new Date(endDate + 'T23:59:59.999Z')
          },
          status: { $in: ['completed', 'delivered'] }
        }
      },
      // Calculate order total from items array
      {
        $addFields: {
          orderTotal: {
            $sum: '$items.total'
          }
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
      // Format output
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
          },
          _id: 0
        }
      },
      // Sort by revenue descending
      {
        $sort: { revenue: -1 }
      }
    ];
    
    console.log('\nExecuting aggregation...');
    const result = await collection.aggregate(pipeline).toArray();
    
    console.log('\n✅ Customer Segments Result:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.length > 0) {
      console.log('\n📊 Summary:');
      result.forEach(segment => {
        console.log(`- ${segment.segment}: ${segment.customerCount} customers, $${segment.revenue} revenue, ${segment.orderCount} orders`);
      });
      
      const totalRevenue = result.reduce((sum, seg) => sum + seg.revenue, 0);
      console.log(`\nTotal Revenue across all segments: $${totalRevenue.toFixed(2)}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testFixedCustomerSegments();
