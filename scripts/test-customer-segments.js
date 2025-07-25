const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:oK1He1DJvOhkPNye@cluster0.km4yypv.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';

async function testCustomerSegments() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collection = db.collection('salesorders');
    
    // First, let's check what values exist for channel field
    console.log('\n🔍 Checking channel values in database:');
    const channels = await collection.distinct('channel');
    console.log('Available channels:', channels);
    
    // Test the customer segments aggregation
    const pipeline = [
      // Convert dates
      {
        $addFields: {
          'dates.orderDate': {
            $dateFromString: {
              dateString: '$dates.orderDate',
              onError: null,
              onNull: null
            }
          }
        }
      },
      // Match July 2025 data
      {
        $match: {
          'dates.orderDate': {
            $gte: new Date('2025-07-01'),
            $lte: new Date('2025-07-31')
          },
          status: { $in: ['completed', 'delivered'] }
        }
      },
      // Group by channel
      {
        $group: {
          _id: '$channel',
          customerCount: { $addToSet: '$customer.email' },
          revenue: { $sum: '$financial.grandTotal' },
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
          },
          _id: 0
        }
      },
      { $sort: { revenue: -1 } }
    ];
    
    console.log('\n📊 Customer Segments for July 2025:');
    console.log('===================================');
    
    const results = await collection.aggregate(pipeline).toArray();
    
    if (results.length === 0) {
      console.log('❌ No customer segment data found!');
      
      // Debug: Check orders in July
      const julyOrders = await collection.countDocuments({
        'dates.orderDate': { $regex: '2025-07' },
        status: { $in: ['completed', 'delivered'] }
      });
      console.log(`\nOrders in July with completed/delivered status: ${julyOrders}`);
      
      // Check if there's any order with channel field
      const sampleOrder = await collection.findOne({ 
        'dates.orderDate': { $regex: '2025-07' }
      });
      
      if (sampleOrder) {
        console.log('\n🔍 Sample order structure:');
        console.log('Order:', sampleOrder.orderNumber);
        console.log('Status:', sampleOrder.status);
        console.log('Channel:', sampleOrder.channel);
        console.log('Customer isB2B:', sampleOrder.customer?.isB2B);
        console.log('Customer company:', sampleOrder.customer?.company);
      }
    } else {
      console.log(`\n✅ Found ${results.length} customer segments:`);
      results.forEach((segment, index) => {
        console.log(`\n${index + 1}. ${segment.segment}`);
        console.log(`   Customers: ${segment.customerCount}`);
        console.log(`   Revenue: $${segment.revenue.toLocaleString()}`);
        console.log(`   Orders: ${segment.orderCount}`);
        console.log(`   Avg Order Value: $${segment.avgOrderValue.toLocaleString()}`);
      });
      
      const totalRevenue = results.reduce((sum, seg) => sum + seg.revenue, 0);
      console.log(`\n💰 Total Revenue: $${totalRevenue.toLocaleString()}`);
    }
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testCustomerSegments();
