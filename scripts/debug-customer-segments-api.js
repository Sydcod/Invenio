const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:oK1He1DJvOhkPNye@cluster0.km4yypv.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';

async function debugCustomerSegments() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Use the same parameters as the dashboard
    const startDate = '2025-07-01';
    const endDate = '2025-07-25';

    console.log('Testing with date range:', { startDate, endDate });

    // Build the pipeline similar to the API
    const db = mongoose.connection.db;
    const collection = db.collection('salesorders');
    
    // Create the pipeline with date conversion first
    const pipeline = [
      // Convert string dates to Date objects
      {
        $addFields: {
          convertedOrderDate: {
            $dateFromString: {
              dateString: '$orderDate',
              onError: null
            }
          }
        }
      },
      // Match date range
      {
        $match: {
          convertedOrderDate: {
            $gte: new Date(startDate),
            $lte: new Date(endDate + 'T23:59:59.999Z')
          }
        }
      },
      // Group by channel
      {
        $group: {
          _id: '$channel',
          customerCount: { $addToSet: '$customerId' },
          revenue: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
          avgOrderValue: { $avg: '$totalAmount' }
        }
      },
      // Convert customerCount set to count
      {
        $project: {
          segment: '$_id',
          customerCount: { $size: '$customerCount' },
          revenue: 1,
          orderCount: 1,
          avgOrderValue: 1
        }
      },
      // Sort by revenue descending
      {
        $sort: { revenue: -1 }
      }
    ];

    console.log('\nPipeline stages:');
    pipeline.forEach((stage, index) => {
      console.log(`Stage ${index}:`, JSON.stringify(stage, null, 2));
    });

    // Execute the aggregation
    const result = await collection.aggregate(pipeline).toArray();

    console.log('\nCustomer Segments Result:');
    console.log(JSON.stringify(result, null, 2));

    if (result.length === 0) {
      console.log('\n⚠️  No customer segments found!');
      
      // Let's check if there are any sales orders at all
      const allOrders = await collection.find({
        orderDate: {
          $gte: startDate,
          $lte: endDate + 'T23:59:59.999Z'
        }
      }).limit(5).toArray();
      
      console.log('\nSample orders in date range (using string comparison):');
      console.log(JSON.stringify(allOrders, null, 2));

      // Check unique channels in the entire collection
      const channels = await collection.distinct('channel');
      console.log('\nAll unique channels in collection:', channels);
      
      // Count total orders
      const totalOrders = await collection.countDocuments();
      console.log('\nTotal orders in collection:', totalOrders);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

debugCustomerSegments();
