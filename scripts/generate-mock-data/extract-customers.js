const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:oK1He1DJvOhkPNye@cluster0.km4yypv.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';

async function extractCustomersFromOrders() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Get all sales orders
    const salesOrders = await db.collection('salesorders').find({}).toArray();
    console.log(`Found ${salesOrders.length} sales orders`);
    
    // Extract unique customers by email
    const customersMap = new Map();
    
    salesOrders.forEach(order => {
      const customer = order.customer;
      if (customer && customer.email) {
        const key = customer.email.toLowerCase();
        
        // If we haven't seen this customer yet, or if this order is newer
        if (!customersMap.has(key) || 
            (order.dates.orderDate > customersMap.get(key).lastOrderDate)) {
          
          customersMap.set(key, {
            // Basic info
            name: customer.name,
            email: customer.email.toLowerCase(),
            phone: customer.phone,
            
            // B2B info
            company: customer.company,
            taxId: customer.taxId,
            type: customer.company ? 'B2B' : 'B2C',
            
            // Address from order shipping address
            billingAddress: order.shipping?.address || {
              street: '123 Default Street',
              city: 'Miami',
              state: 'FL',
              country: 'USA',
              postalCode: '33101'
            },
            
            // Financial
            paymentTerms: order.payment?.terms || 'Due on Receipt',
            
            // Initial metrics
            firstOrderDate: order.dates.orderDate,
            lastOrderDate: order.dates.orderDate,
            orderIds: [order._id],
            
            // Metadata
            createdBy: order.createdBy,
            updatedBy: order.updatedBy
          });
        } else {
          // Update existing customer metrics
          const existing = customersMap.get(key);
          existing.orderIds.push(order._id);
          if (order.dates.orderDate < existing.firstOrderDate) {
            existing.firstOrderDate = order.dates.orderDate;
          }
          if (order.dates.orderDate > existing.lastOrderDate) {
            existing.lastOrderDate = order.dates.orderDate;
          }
        }
      }
    });
    
    console.log(`\nFound ${customersMap.size} unique customers`);
    
    // Calculate metrics for each customer
    const customersToInsert = [];
    let customerCounter = 1;
    
    for (const [email, customerData] of customersMap) {
      // Calculate metrics from all orders
      const customerOrders = await db.collection('salesorders').find({
        'customer.email': email
      }).toArray();
      
      let totalSpent = 0;
      let totalReturns = 0;
      let totalRefunds = 0;
      
      customerOrders.forEach(order => {
        totalSpent += order.financial?.grandTotal || 0;
        
        if (order.returns && order.returns.length > 0) {
          totalReturns += order.returns.length;
          order.returns.forEach(ret => {
            totalRefunds += ret.refundAmount || 0;
          });
        }
      });
      
      // Determine customer attributes based on type
      let creditLimit = 0;
      let industry = '';
      let preferredPaymentMethod = 'card';
      
      if (customerData.type === 'B2B') {
        creditLimit = totalSpent > 50000 ? 100000 : 
                     totalSpent > 20000 ? 50000 : 
                     totalSpent > 5000 ? 25000 : 10000;
        
        // Guess industry from company name
        const companyLower = (customerData.company || '').toLowerCase();
        if (companyLower.includes('tech') || companyLower.includes('software') || companyLower.includes('digital')) {
          industry = 'Technology';
        } else if (companyLower.includes('hotel') || companyLower.includes('resort')) {
          industry = 'Hospitality';
        } else if (companyLower.includes('university') || companyLower.includes('school') || companyLower.includes('academy')) {
          industry = 'Education';
        } else if (companyLower.includes('hospital') || companyLower.includes('clinic') || companyLower.includes('medical')) {
          industry = 'Healthcare';
        } else if (companyLower.includes('restaurant') || companyLower.includes('cafe')) {
          industry = 'Food Service';
        } else {
          industry = 'General Business';
        }
        
        preferredPaymentMethod = 'bank_transfer';
      } else {
        preferredPaymentMethod = Math.random() > 0.7 ? 'card' : 'online';
      }
      
      // Create customer object
      const customer = {
        customerNumber: `CUS-${String(customerCounter++).padStart(5, '0')}`,
        type: customerData.type,
        
        // Basic info
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone,
        
        // B2B specific
        company: customerData.company,
        taxId: customerData.taxId,
        industry: customerData.type === 'B2B' ? industry : undefined,
        
        // Address
        billingAddress: customerData.billingAddress,
        shippingAddresses: [{
          isDefault: true,
          ...customerData.billingAddress
        }],
        
        // Financial
        creditLimit: creditLimit,
        currentBalance: 0,
        paymentTerms: customerData.paymentTerms,
        preferredPaymentMethod: preferredPaymentMethod,
        
        // Metrics
        metrics: {
          totalOrders: customerData.orderIds.length,
          totalSpent: totalSpent,
          averageOrderValue: totalSpent / customerData.orderIds.length,
          lastOrderDate: customerData.lastOrderDate,
          firstOrderDate: customerData.firstOrderDate,
          totalReturns: totalReturns,
          totalRefunds: totalRefunds,
          lifetimeValue: totalSpent - totalRefunds
        },
        
        // Preferences
        preferences: {
          communication: {
            emailMarketing: Math.random() > 0.3,
            smsMarketing: Math.random() > 0.7,
            phoneMarketing: customerData.type === 'B2B' && Math.random() > 0.5
          },
          shipping: {
            preferredMethod: Math.random() > 0.5 ? 'standard' : 'express'
          },
          invoicing: {
            sendInvoiceBy: customerData.type === 'B2B' ? 'email' : 'none',
            consolidateInvoices: customerData.type === 'B2B' && Math.random() > 0.5
          }
        },
        
        // Status
        status: 'active',
        rating: 3 + Math.floor(Math.random() * 3), // 3-5 stars
        tags: [],
        source: 'import',
        
        // Metadata
        createdBy: customerData.createdBy,
        updatedBy: customerData.updatedBy,
        createdAt: customerData.firstOrderDate,
        updatedAt: customerData.lastOrderDate,
        
        // Store order IDs for later reference
        _orderIds: customerData.orderIds
      };
      
      // Add tags based on spending
      if (customer.metrics.totalSpent > 50000) {
        customer.tags.push('vip', 'high-value');
      } else if (customer.metrics.totalSpent > 10000) {
        customer.tags.push('valued');
      }
      
      if (customer.metrics.totalOrders > 10) {
        customer.tags.push('frequent-buyer');
      }
      
      if (customer.type === 'B2B') {
        customer.tags.push('business');
      }
      
      customersToInsert.push(customer);
    }
    
    // Sort by customer number
    customersToInsert.sort((a, b) => a.customerNumber.localeCompare(b.customerNumber));
    
    // Show statistics
    const b2bCount = customersToInsert.filter(c => c.type === 'B2B').length;
    const b2cCount = customersToInsert.filter(c => c.type === 'B2C').length;
    
    console.log(`\nCustomer breakdown:`);
    console.log(`  B2B: ${b2bCount} (${Math.round(b2bCount / customersToInsert.length * 100)}%)`);
    console.log(`  B2C: ${b2cCount} (${Math.round(b2cCount / customersToInsert.length * 100)}%)`);
    
    console.log(`\nTop 5 customers by spending:`);
    customersToInsert
      .sort((a, b) => b.metrics.totalSpent - a.metrics.totalSpent)
      .slice(0, 5)
      .forEach((c, i) => {
        console.log(`  ${i + 1}. ${c.name} ${c.company ? `(${c.company})` : ''} - $${c.metrics.totalSpent.toFixed(2)}`);
      });
    
    // Clear existing customers
    const deleteResult = await db.collection('customers').deleteMany({});
    console.log(`\nCleared ${deleteResult.deletedCount} existing customers`);
    
    // Insert customers
    const result = await db.collection('customers').insertMany(customersToInsert);
    console.log(`Inserted ${result.insertedCount} customers into MongoDB`);
    
    // Update sales orders with customer IDs
    console.log(`\nUpdating sales orders with customer references...`);
    let updatedOrders = 0;
    
    for (const customer of customersToInsert) {
      const customerId = result.insertedIds[customersToInsert.indexOf(customer)];
      
      // Update all orders for this customer
      const updateResult = await db.collection('salesorders').updateMany(
        { _id: { $in: customer._orderIds } },
        { $set: { customerId: customerId } }
      );
      
      updatedOrders += updateResult.modifiedCount;
    }
    
    console.log(`Updated ${updatedOrders} sales orders with customer IDs`);
    
    // Sample verification
    const sampleWithCustomer = await db.collection('salesorders').findOne({ customerId: { $exists: true } });
    if (sampleWithCustomer) {
      console.log(`\nSample order with customer reference:`);
      console.log(`  Order: ${sampleWithCustomer.orderNumber}`);
      console.log(`  Customer ID: ${sampleWithCustomer.customerId}`);
      
      const linkedCustomer = await db.collection('customers').findOne({ _id: sampleWithCustomer.customerId });
      if (linkedCustomer) {
        console.log(`  Customer: ${linkedCustomer.name} (${linkedCustomer.customerNumber})`);
      }
    }
    
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    
  } catch (error) {
    console.error('Error extracting customers:', error);
    process.exit(1);
  }
}

// Run the extraction
extractCustomersFromOrders();
