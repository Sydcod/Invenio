const mongoose = require('mongoose');

async function debugChannelField() {
  try {
    await mongoose.connect('mongodb://localhost:27017/invenio');
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collection = db.collection('salesorders');
    
    // Get sample orders
    const sampleOrders = await collection.find({}).limit(5).toArray();
    console.log('\n=== SAMPLE ORDERS ===');
    sampleOrders.forEach((order, index) => {
      console.log(`\nOrder ${index + 1}:`);
      console.log('- channel:', order.channel);
      console.log('- status:', order.status);
      console.log('- orderDate:', order.dates?.orderDate);
    });
    
    // Check distinct channel values
    const channels = await collection.distinct('channel');
    console.log('\n=== DISTINCT CHANNEL VALUES ===');
    console.log(channels);
    
    // Count by channel
    const channelCounts = await collection.aggregate([
      { $group: { _id: '$channel', count: { $sum: 1 } } }
    ]).toArray();
    console.log('\n=== CHANNEL COUNTS ===');
    console.log(channelCounts);
    
    // Check orders with COMPLETED or DELIVERED status
    const completedOrders = await collection.find({
      status: { $in: ['Completed', 'Delivered'] }
    }).limit(5).toArray();
    console.log('\n=== COMPLETED/DELIVERED ORDERS ===');
    console.log('Count:', await collection.countDocuments({ status: { $in: ['Completed', 'Delivered'] } }));
    completedOrders.forEach((order, index) => {
      console.log(`\nOrder ${index + 1}:`);
      console.log('- channel:', order.channel);
      console.log('- status:', order.status);
      console.log('- customer email:', order.customer?.email);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

debugChannelField();
