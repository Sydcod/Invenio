const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:oK1He1DJvOhkPNye@cluster0.km4yypv.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';

async function checkOrderDates() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collection = db.collection('salesorders');
    
    // Get the date range of all orders
    const dateRange = await collection.aggregate([
      {
        $group: {
          _id: null,
          minDate: { $min: '$orderDate' },
          maxDate: { $max: '$orderDate' },
          count: { $sum: 1 }
        }
      }
    ]).toArray();
    
    console.log('\n📅 Order Date Range:');
    console.log('Earliest order:', dateRange[0]?.minDate);
    console.log('Latest order:', dateRange[0]?.maxDate);
    console.log('Total orders:', dateRange[0]?.count);
    
    // Get orders grouped by month
    const ordersByMonth = await collection.aggregate([
      {
        $group: {
          _id: {
            $substr: ['$orderDate', 0, 7] // Extract YYYY-MM
          },
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
          channels: { $addToSet: '$channel' }
        }
      },
      {
        $sort: { '_id': -1 }
      },
      {
        $limit: 10
      }
    ]).toArray();
    
    console.log('\n📊 Orders by Month (most recent):');
    ordersByMonth.forEach(month => {
      console.log(`${month._id}: ${month.count} orders, $${month.revenue.toFixed(2)} revenue, channels: ${month.channels.join(', ')}`);
    });
    
    // Get a few sample orders with their dates
    const sampleOrders = await collection.find({})
      .sort({ orderDate: -1 })
      .limit(5)
      .project({ orderNumber: 1, orderDate: 1, channel: 1, totalAmount: 1 })
      .toArray();
    
    console.log('\n🛒 Sample Recent Orders:');
    sampleOrders.forEach(order => {
      console.log(`- ${order.orderNumber}: ${order.orderDate} (${order.channel}) - $${order.totalAmount}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkOrderDates();
