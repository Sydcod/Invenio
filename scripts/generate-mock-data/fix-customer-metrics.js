const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:oK1He1DJvOhkPNye@cluster0.km4yypv.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';

async function fixCustomerMetrics() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Get all customers
    const customers = await db.collection('customers').find({}).toArray();
    console.log(`Found ${customers.length} customers to update`);
    
    let updated = 0;
    let skipped = 0;
    
    // Process each customer
    for (const customer of customers) {
      // Find all orders for this customer
      const orders = await db.collection('salesorders').find({
        'customer.email': customer.email
      }).toArray();
      
      if (orders.length === 0) {
        skipped++;
        continue;
      }
      
      // Calculate metrics
      let totalSpent = 0;
      let totalReturns = 0;
      let totalRefunds = 0;
      let firstOrderDate = null;
      let lastOrderDate = null;
      
      orders.forEach(order => {
        // Calculate total from available fields
        let orderTotal = 0;
        
        if (order.financial) {
          // Try grandTotal first
          if (order.financial.grandTotal !== null && order.financial.grandTotal !== undefined) {
            orderTotal = order.financial.grandTotal;
          } 
          // Otherwise calculate from items
          else if (order.items && order.items.length > 0) {
            const subtotal = order.items.reduce((sum, item) => {
              return sum + (item.quantity * item.unitPrice);
            }, 0);
            
            // Add tax (7% Florida tax)
            const tax = subtotal * 0.07;
            
            // Add shipping
            const shipping = order.financial.shippingCost || 0;
            
            // Apply any discount
            const discount = order.financial.totalDiscount || 0;
            
            orderTotal = subtotal + tax + shipping - discount;
          }
          // Last resort - use totalCost if available
          else if (order.financial.totalCost) {
            orderTotal = order.financial.totalCost * 1.3; // Rough estimate with markup
          }
        }
        
        totalSpent += orderTotal;
        
        // Track returns
        if (order.returns && order.returns.length > 0) {
          totalReturns += order.returns.length;
          order.returns.forEach(ret => {
            totalRefunds += ret.refundAmount || 0;
          });
        }
        
        // Track dates
        const orderDate = new Date(order.dates?.orderDate || order.createdAt);
        if (!firstOrderDate || orderDate < firstOrderDate) {
          firstOrderDate = orderDate;
        }
        if (!lastOrderDate || orderDate > lastOrderDate) {
          lastOrderDate = orderDate;
        }
      });
      
      // Update customer metrics
      const updateData = {
        'metrics.totalOrders': orders.length,
        'metrics.totalSpent': Math.round(totalSpent * 100) / 100,
        'metrics.averageOrderValue': Math.round((totalSpent / orders.length) * 100) / 100,
        'metrics.totalReturns': totalReturns,
        'metrics.totalRefunds': Math.round(totalRefunds * 100) / 100,
        'metrics.lifetimeValue': Math.round((totalSpent - totalRefunds) * 100) / 100
      };
      
      if (firstOrderDate) {
        updateData['metrics.firstOrderDate'] = firstOrderDate;
      }
      if (lastOrderDate) {
        updateData['metrics.lastOrderDate'] = lastOrderDate;
      }
      
      // Update credit limit for B2B customers based on spending
      if (customer.type === 'B2B') {
        if (totalSpent > 50000) {
          updateData.creditLimit = 100000;
        } else if (totalSpent > 20000) {
          updateData.creditLimit = 50000;
        } else if (totalSpent > 5000) {
          updateData.creditLimit = 25000;
        } else {
          updateData.creditLimit = 10000;
        }
      }
      
      // Update tags based on new metrics
      const tags = [];
      if (totalSpent > 50000) {
        tags.push('vip', 'high-value');
      } else if (totalSpent > 10000) {
        tags.push('valued');
      }
      if (orders.length > 10) {
        tags.push('frequent-buyer');
      }
      if (customer.type === 'B2B') {
        tags.push('business');
      }
      
      updateData.tags = tags;
      
      // Update loyalty tier
      let loyaltyTier = 'bronze';
      if (totalSpent >= 50000) {
        loyaltyTier = 'platinum';
      } else if (totalSpent >= 25000) {
        loyaltyTier = 'gold';
      } else if (totalSpent >= 10000) {
        loyaltyTier = 'silver';
      }
      
      updateData['loyalty.tier'] = loyaltyTier;
      updateData['loyalty.points'] = Math.floor(totalSpent);
      
      // Perform update
      await db.collection('customers').updateOne(
        { _id: customer._id },
        { $set: updateData }
      );
      
      updated++;
      
      if (updated % 10 === 0) {
        console.log(`Updated ${updated} customers...`);
      }
    }
    
    console.log(`\nUpdate complete:`);
    console.log(`  Updated: ${updated} customers`);
    console.log(`  Skipped: ${skipped} customers (no orders found)`);
    
    // Show summary statistics
    const updatedCustomers = await db.collection('customers').find({}).toArray();
    
    const stats = {
      totalRevenue: updatedCustomers.reduce((sum, c) => sum + (c.metrics?.totalSpent || 0), 0),
      averageCustomerValue: 0,
      topSpenders: updatedCustomers
        .sort((a, b) => (b.metrics?.totalSpent || 0) - (a.metrics?.totalSpent || 0))
        .slice(0, 5)
    };
    
    stats.averageCustomerValue = stats.totalRevenue / updatedCustomers.length;
    
    console.log(`\nOverall Statistics:`);
    console.log(`  Total Revenue: $${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    console.log(`  Average Customer Value: $${stats.averageCustomerValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    
    console.log(`\nTop 5 Customers by Spending:`);
    stats.topSpenders.forEach((c, i) => {
      console.log(`  ${i + 1}. ${c.name} ${c.company ? `(${c.company})` : ''} - $${(c.metrics?.totalSpent || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    });
    
    // Verify a sample customer
    const sampleCustomer = await db.collection('customers').findOne({ type: 'B2B' });
    if (sampleCustomer) {
      console.log(`\nSample B2B Customer:`);
      console.log(`  Name: ${sampleCustomer.name}`);
      console.log(`  Company: ${sampleCustomer.company}`);
      console.log(`  Total Orders: ${sampleCustomer.metrics?.totalOrders || 0}`);
      console.log(`  Total Spent: $${(sampleCustomer.metrics?.totalSpent || 0).toFixed(2)}`);
      console.log(`  Credit Limit: $${(sampleCustomer.creditLimit || 0).toLocaleString()}`);
      console.log(`  Loyalty Tier: ${sampleCustomer.loyalty?.tier || 'N/A'}`);
      console.log(`  Tags: ${sampleCustomer.tags?.join(', ') || 'None'}`);
    }
    
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    
  } catch (error) {
    console.error('Error fixing customer metrics:', error);
    process.exit(1);
  }
}

// Run the fix
fixCustomerMetrics();
