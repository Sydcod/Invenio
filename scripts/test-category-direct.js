const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:oK1He1DJvOhkPNye@cluster0.km4yypv.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';

async function testCategoryPerformance() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collection = db.collection('salesorders');
    
    // Test direct aggregation for category performance
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
          status: { $nin: ['draft', 'cancelled'] }
        }
      },
      // Unwind items
      { $unwind: '$items' },
      // Group by category
      {
        $group: {
          _id: '$items.product.category',
          revenue: { $sum: '$items.total' },
          quantity: { $sum: '$items.quantity' },
          orders: { $addToSet: '$_id' }
        }
      },
      // Project final shape
      {
        $project: {
          name: '$_id',
          revenue: { $round: ['$revenue', 2] },
          quantity: 1,
          orderCount: { $size: '$orders' },
          _id: 0
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 }
    ];
    
    console.log('\n📊 Category Performance for July 2025:');
    console.log('=====================================');
    
    const results = await collection.aggregate(pipeline).toArray();
    
    if (results.length === 0) {
      console.log('❌ No category data found!');
      
      // Debug: Check if items have the expected structure
      const sampleOrder = await collection.findOne({ 
        'dates.orderDate': { $regex: '2025-07' },
        status: { $nin: ['draft', 'cancelled'] }
      });
      
      if (sampleOrder) {
        console.log('\n🔍 Sample order structure:');
        console.log('Order:', sampleOrder.orderNumber);
        console.log('Items count:', sampleOrder.items?.length);
        if (sampleOrder.items?.length > 0) {
          console.log('First item structure:', JSON.stringify(sampleOrder.items[0], null, 2));
        }
      }
    } else {
      console.log(`\n✅ Found ${results.length} categories:`);
      results.forEach((cat, index) => {
        console.log(`\n${index + 1}. ${cat.name || 'Unknown Category'}`);
        console.log(`   Revenue: $${cat.revenue.toLocaleString()}`);
        console.log(`   Quantity: ${cat.quantity}`);
        console.log(`   Orders: ${cat.orderCount}`);
      });
      
      const totalRevenue = results.reduce((sum, cat) => sum + cat.revenue, 0);
      console.log(`\n💰 Total Revenue across categories: $${totalRevenue.toLocaleString()}`);
    }
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testCategoryPerformance();
