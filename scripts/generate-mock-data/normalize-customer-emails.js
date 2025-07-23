const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:oK1He1DJvOhkPNye@cluster0.km4yypv.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';

async function normalizeEmails() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Normalize emails in customers collection
    console.log('\nNormalizing emails in customers collection...');
    
    const customers = await db.collection('customers').find({}).toArray();
    let normalizedCustomers = 0;
    
    for (const customer of customers) {
      const normalizedEmail = customer.email.toLowerCase();
      
      if (customer.email !== normalizedEmail) {
        await db.collection('customers').updateOne(
          { _id: customer._id },
          { $set: { email: normalizedEmail } }
        );
        
        normalizedCustomers++;
        if (normalizedCustomers <= 5) {
          console.log(`Normalized: ${customer.email} -> ${normalizedEmail}`);
        }
      }
    }
    
    console.log(`Normalized ${normalizedCustomers} customer emails`);
    
    // Normalize emails in salesorders collection
    console.log('\nNormalizing emails in salesorders collection...');
    
    const salesOrders = await db.collection('salesorders').find({}).toArray();
    let normalizedOrders = 0;
    
    for (const order of salesOrders) {
      if (order.customer?.email) {
        const normalizedEmail = order.customer.email.toLowerCase();
        
        if (order.customer.email !== normalizedEmail) {
          await db.collection('salesorders').updateOne(
            { _id: order._id },
            { $set: { 'customer.email': normalizedEmail } }
          );
          
          normalizedOrders++;
          if (normalizedOrders <= 5) {
            console.log(`Normalized order ${order.orderNumber}: ${order.customer.email} -> ${normalizedEmail}`);
          }
        }
      }
    }
    
    console.log(`Normalized ${normalizedOrders} sales order emails`);
    
    // Verify the normalization
    console.log('\nVerification:');
    
    // Check for a specific customer and their orders
    const sampleCustomer = await db.collection('customers').findOne({ type: 'B2C' });
    console.log(`\nSample Customer: ${sampleCustomer.name} (${sampleCustomer.email})`);
    
    const matchingOrders = await db.collection('salesorders').find({
      'customer.email': sampleCustomer.email
    }).toArray();
    
    console.log(`Found ${matchingOrders.length} orders for this customer`);
    
    if (matchingOrders.length > 0) {
      console.log('Sample matching orders:');
      matchingOrders.slice(0, 3).forEach(order => {
        console.log(`  ${order.orderNumber} - ${order.customer.email} - Total: $${order.financial?.grandTotal || 'N/A'}`);
      });
    }
    
    // Show email distribution
    console.log('\nEmail Case Check:');
    const upperCaseCustomers = await db.collection('customers').countDocuments({
      email: { $regex: '[A-Z]' }
    });
    
    const upperCaseOrders = await db.collection('salesorders').countDocuments({
      'customer.email': { $regex: '[A-Z]' }
    });
    
    console.log(`Customers with uppercase in email: ${upperCaseCustomers}`);
    console.log(`Sales orders with uppercase in email: ${upperCaseOrders}`);
    
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    
  } catch (error) {
    console.error('Error normalizing emails:', error);
    process.exit(1);
  }
}

// Run the normalization
normalizeEmails();
