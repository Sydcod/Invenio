const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:oK1He1DJvOhkPNye@cluster0.km4yypv.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';

async function debugCustomerMetrics() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Check a single customer
    const sampleCustomer = await db.collection('customers').findOne({});
    console.log('\nSample Customer:', sampleCustomer.name, '(', sampleCustomer.email, ')');
    
    // Find orders for this customer
    const orders = await db.collection('salesorders').find({
      'customer.email': sampleCustomer.email
    }).toArray();
    
    console.log(`Found ${orders.length} orders for this customer`);
    
    let totalSpent = 0;
    orders.forEach((order, index) => {
      console.log(`\nOrder ${index + 1}:`, order.orderNumber);
      console.log('  Financial:', order.financial);
      console.log('  Grand Total:', order.financial?.grandTotal);
      totalSpent += order.financial?.grandTotal || 0;
    });
    
    console.log(`\nTotal Spent: $${totalSpent.toFixed(2)}`);
    
    // Try updating just this one customer
    const updateResult = await db.collection('customers').updateOne(
      { _id: sampleCustomer._id },
      { 
        $set: { 
          'metrics.totalSpent': totalSpent,
          'metrics.totalOrders': orders.length
        } 
      }
    );
    
    console.log('\nUpdate Result:', updateResult);
    
    // Verify the update
    const updatedCustomer = await db.collection('customers').findOne({ _id: sampleCustomer._id });
    console.log('\nUpdated Customer Metrics:', updatedCustomer.metrics);
    
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the debug
debugCustomerMetrics();
