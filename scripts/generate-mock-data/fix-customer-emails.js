const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:oK1He1DJvOhkPNye@cluster0.km4yypv.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';

async function fixCustomerEmails() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Fix emails in customers collection
    console.log('\nFixing emails in customers collection...');
    
    const customers = await db.collection('customers').find({}).toArray();
    let fixedCustomers = 0;
    
    for (const customer of customers) {
      // Check if email contains comma in domain
      if (customer.email && customer.email.includes(',')) {
        const fixedEmail = customer.email.replace(/,/g, '.');
        
        await db.collection('customers').updateOne(
          { _id: customer._id },
          { $set: { email: fixedEmail } }
        );
        
        fixedCustomers++;
        console.log(`Fixed: ${customer.email} -> ${fixedEmail}`);
      }
    }
    
    console.log(`Fixed ${fixedCustomers} customer emails`);
    
    // Fix emails in salesorders collection
    console.log('\nFixing emails in salesorders collection...');
    
    const salesOrders = await db.collection('salesorders').find({}).toArray();
    let fixedOrders = 0;
    
    for (const order of salesOrders) {
      // Check if customer email contains comma in domain
      if (order.customer?.email && order.customer.email.includes(',')) {
        const fixedEmail = order.customer.email.replace(/,/g, '.');
        
        await db.collection('salesorders').updateOne(
          { _id: order._id },
          { $set: { 'customer.email': fixedEmail } }
        );
        
        fixedOrders++;
        if (fixedOrders <= 5) {
          console.log(`Fixed order ${order.orderNumber}: ${order.customer.email} -> ${fixedEmail}`);
        }
      }
    }
    
    console.log(`Fixed ${fixedOrders} sales order emails`);
    
    // Verify the fix
    console.log('\nVerification:');
    
    // Check for any remaining commas in customer emails
    const remainingBadCustomers = await db.collection('customers').countDocuments({
      email: { $regex: ',', $options: 'i' }
    });
    
    const remainingBadOrders = await db.collection('salesorders').countDocuments({
      'customer.email': { $regex: ',', $options: 'i' }
    });
    
    console.log(`Customers with commas in email: ${remainingBadCustomers}`);
    console.log(`Sales orders with commas in email: ${remainingBadOrders}`);
    
    // Show sample fixed emails
    console.log('\nSample fixed customer emails:');
    const sampleCustomers = await db.collection('customers')
      .find({ type: 'B2B' })
      .limit(5)
      .project({ name: 1, email: 1, company: 1 })
      .toArray();
    
    sampleCustomers.forEach(c => {
      console.log(`  ${c.name} (${c.company}): ${c.email}`);
    });
    
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    
  } catch (error) {
    console.error('Error fixing emails:', error);
    process.exit(1);
  }
}

// Run the fix
fixCustomerEmails();
