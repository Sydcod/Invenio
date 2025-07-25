const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:oK1He1DJvOhkPNye@cluster0.km4yypv.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';

async function checkOrderStatuses() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collection = db.collection('salesorders');
    
    // Count orders by status
    console.log('\n📊 Orders by Status:');
    const statusCounts = await collection.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]).toArray();
    
    statusCounts.forEach(status => {
      console.log(`- ${status._id}: ${status.count} orders`);
    });
    
    // Check specifically for completed and delivered orders
    const completedOrders = await collection.countDocuments({ status: 'completed' });
    const deliveredOrders = await collection.countDocuments({ status: 'delivered' });
    
    console.log('\n🎯 Target statuses for Customer Segments:');
    console.log(`- completed: ${completedOrders} orders`);
    console.log(`- delivered: ${deliveredOrders} orders`);
    console.log(`- Total (completed + delivered): ${completedOrders + deliveredOrders} orders`);
    
    if (completedOrders + deliveredOrders === 0) {
      console.log('\n⚠️ WARNING: No orders with status "completed" or "delivered"!');
      console.log('This is why Customer Segments aggregation returns empty results.');
      console.log('\n💡 Solution: Either:');
      console.log('1. Update some orders to have "completed" or "delivered" status');
      console.log('2. Or modify the aggregation to include other statuses');
    }
    
    // Show distribution by channel and status
    console.log('\n📈 Orders by Channel and Status:');
    const channelStatus = await collection.aggregate([
      {
        $group: {
          _id: {
            channel: '$channel',
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.channel': 1, '_id.status': 1 } }
    ]).toArray();
    
    channelStatus.forEach(item => {
      console.log(`- ${item._id.channel} / ${item._id.status}: ${item.count} orders`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkOrderStatuses();
