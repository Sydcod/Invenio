const fs = require('fs');
const path = require('path');
const { faker } = require('@faker-js/faker');
const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:oK1He1DJvOhkPNye@cluster0.km4yypv.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';

// B2B Company types
const b2bTypes = [
  { type: 'Tech Startup', prefix: 'Tech', suffix: ['Labs', 'Solutions', 'Systems', 'Innovations'] },
  { type: 'University', prefix: '', suffix: ['University', 'Institute', 'College'] },
  { type: 'School', prefix: '', suffix: ['High School', 'Academy', 'Preparatory School'] },
  { type: 'Hotel', prefix: '', suffix: ['Hotel', 'Resort', 'Inn', 'Suites'] },
  { type: 'Small Business', prefix: '', suffix: ['Inc', 'LLC', 'Corp', 'Co'] }
];

// Miami area locations for realistic addresses
const miamiAreas = [
  { city: 'Miami', state: 'FL', areas: ['Downtown', 'Brickell', 'Coral Gables', 'Coconut Grove', 'Wynwood'] },
  { city: 'Miami Beach', state: 'FL', areas: ['South Beach', 'North Beach', 'Mid Beach'] },
  { city: 'Fort Lauderdale', state: 'FL', areas: ['Las Olas', 'Downtown', 'Beach Area'] },
  { city: 'Aventura', state: 'FL', areas: [''] },
  { city: 'Doral', state: 'FL', areas: [''] },
  { city: 'Homestead', state: 'FL', areas: [''] }
];

function generateB2BCustomer() {
  const companyType = faker.helpers.arrayElement(b2bTypes);
  let companyName;
  
  if (companyType.type === 'University' || companyType.type === 'School') {
    companyName = `${faker.location.city()} ${faker.helpers.arrayElement(companyType.suffix)}`;
  } else if (companyType.type === 'Hotel') {
    companyName = `${faker.company.name().split(' ')[0]} ${faker.helpers.arrayElement(companyType.suffix)}`;
  } else {
    companyName = `${companyType.prefix} ${faker.company.name()} ${faker.helpers.arrayElement(companyType.suffix)}`.trim();
  }
  
  const contactPerson = faker.person.fullName();
  const department = faker.helpers.arrayElement(['IT Department', 'Procurement', 'Operations', 'Facilities', 'Administration']);
  
  return {
    name: contactPerson,
    email: faker.internet.email({ firstName: contactPerson.split(' ')[0], lastName: contactPerson.split(' ')[1], provider: companyName.toLowerCase().replace(/\s+/g, '') + '.com' }),
    phone: faker.phone.number('###-###-####'),
    company: companyName,
    taxId: `${faker.number.int({ min: 10, max: 99 })}-${faker.number.int({ min: 1000000, max: 9999999 })}`,
    isB2B: true,
    companyType: companyType.type
  };
}

function generateB2CCustomer() {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  
  return {
    name: `${firstName} ${lastName}`,
    email: faker.internet.email({ firstName, lastName }),
    phone: faker.phone.number('###-###-####'),
    company: undefined,
    taxId: undefined,
    isB2B: false
  };
}

function generateMiamiAddress() {
  const location = faker.helpers.arrayElement(miamiAreas);
  const area = location.areas.length > 0 ? faker.helpers.arrayElement(location.areas) : '';
  
  return {
    street: `${faker.number.int({ min: 100, max: 9999 })} ${faker.location.street()}`,
    city: location.city,
    state: location.state,
    country: 'USA',
    postalCode: faker.number.int({ min: 33101, max: 33299 }).toString()
  };
}

function getOrderPattern(date) {
  const month = date.getMonth();
  const day = date.getDate();
  
  // Holiday season (November-December)
  if (month === 10 || month === 11) {
    return faker.helpers.weightedArrayElement([
      { value: 'holiday', weight: 40 },
      { value: 'regular', weight: 30 },
      { value: 'bulk', weight: 20 },
      { value: 'rush', weight: 10 }
    ]);
  }
  
  // Back to school (July-August)
  if (month === 6 || month === 7) {
    return faker.helpers.weightedArrayElement([
      { value: 'bulk', weight: 30 },
      { value: 'regular', weight: 40 },
      { value: 'rush', weight: 20 },
      { value: 'holiday', weight: 10 }
    ]);
  }
  
  // Regular months
  return faker.helpers.weightedArrayElement([
    { value: 'regular', weight: 60 },
    { value: 'bulk', weight: 20 },
    { value: 'rush', weight: 15 },
    { value: 'partial', weight: 5 }
  ]);
}

async function generateSalesOrders() {
  try {
    // Connect to MongoDB to get products, warehouses, and users
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Get all products
    const products = await db.collection('products').find({ status: 'active' }).toArray();
    console.log(`Found ${products.length} active products`);
    
    // Get all warehouses
    const warehouses = await db.collection('warehouses').find({ status: 'active' }).toArray();
    console.log(`Found ${warehouses.length} active warehouses`);
    
    // Get users (all users since role field doesn't exist)
    const users = await db.collection('users').find({}).toArray();
    console.log(`Found ${users.length} users`);
    
    if (products.length === 0 || warehouses.length === 0 || users.length === 0) {
      throw new Error('Missing required data: products, warehouses, or users');
    }
    
    const salesOrders = [];
    const startDate = new Date('2025-01-01');
    const endDate = new Date('2025-07-23');
    
    // Target status distribution
    const statusTargets = {
      draft: { min: 5, max: 10, count: 0 },
      confirmed: { min: 10, max: 15, count: 0 },
      processing: { min: 15, max: 20, count: 0 },
      packed: { min: 5, max: 10, count: 0 },
      shipped: { min: 10, max: 15, count: 0 },
      delivered: { min: 60, max: 80, count: 0 },
      completed: { min: 20, max: 30, count: 0 },
      cancelled: { min: 5, max: 10, count: 0 },
      refunded: { min: 3, max: 5, count: 0 }
    };
    
    // Generate 150 sales orders
    for (let i = 0; i < 150; i++) {
      // Determine customer type (40% B2B, 60% B2C)
      const isB2B = faker.datatype.boolean({ probability: 0.4 });
      const customer = isB2B ? generateB2BCustomer() : generateB2CCustomer();
      
      // Generate order date
      const orderDate = faker.date.between({ from: startDate, to: endDate });
      const orderPattern = getOrderPattern(orderDate);
      
      // Determine status based on targets
      let status = 'delivered'; // default
      for (const [statusKey, target] of Object.entries(statusTargets)) {
        if (target.count < target.min) {
          status = statusKey;
          target.count++;
          break;
        }
      }
      
      // If all minimums met, use weighted distribution
      if (status === 'delivered') {
        status = faker.helpers.weightedArrayElement([
          { value: 'delivered', weight: 40 },
          { value: 'completed', weight: 15 },
          { value: 'processing', weight: 10 },
          { value: 'confirmed', weight: 8 },
          { value: 'shipped', weight: 8 },
          { value: 'cancelled', weight: 5 },
          { value: 'packed', weight: 5 },
          { value: 'draft', weight: 5 },
          { value: 'refunded', weight: 4 }
        ]);
        statusTargets[status].count++;
      }
      
      // Select warehouse
      const warehouse = faker.helpers.arrayElement(warehouses);
      
      // Select sales person
      const salesPerson = faker.helpers.arrayElement(users);
      
      // Generate items based on order pattern
      let itemCount;
      let productSelection;
      
      switch (orderPattern) {
        case 'bulk':
          itemCount = faker.number.int({ min: 5, max: 15 });
          // For bulk orders, often same category
          const category = faker.helpers.arrayElement(['Laptops', 'Smartphones', 'Tablets', 'Accessories']);
          productSelection = products.filter(p => p.category?.name === category);
          break;
        case 'rush':
          itemCount = faker.number.int({ min: 1, max: 3 });
          productSelection = products;
          break;
        case 'holiday':
          itemCount = faker.number.int({ min: 3, max: 8 });
          // Popular items for holidays
          productSelection = products.filter(p => 
            ['Smartphones', 'Tablets', 'Audio', 'Wearables'].includes(p.category?.name)
          );
          break;
        default:
          itemCount = faker.number.int({ min: 1, max: 5 });
          productSelection = products;
      }
      
      if (productSelection.length === 0) productSelection = products;
      
      // Generate order items
      const items = [];
      let subtotal = 0;
      let totalCost = 0;
      
      for (let j = 0; j < itemCount; j++) {
        const product = faker.helpers.arrayElement(productSelection);
        const quantity = orderPattern === 'bulk' 
          ? faker.number.int({ min: 5, max: 20 })
          : faker.number.int({ min: 1, max: 3 });
        
        const unitPrice = product.pricing.retail;
        const costPrice = product.pricing.cost;
        
        // Apply discounts for bulk orders or B2B
        let discount = 0;
        let discountType = 'percentage';
        
        if (orderPattern === 'bulk' || (isB2B && quantity > 5)) {
          discount = faker.number.int({ min: 5, max: 15 });
        } else if (orderPattern === 'holiday') {
          discount = faker.number.int({ min: 10, max: 25 });
        }
        
        const discountAmount = discountType === 'percentage' 
          ? (unitPrice * quantity * discount) / 100
          : discount;
        
        const taxRate = 0.07; // Florida sales tax
        const itemSubtotal = (unitPrice * quantity) - discountAmount;
        const taxAmount = itemSubtotal * taxRate;
        const total = itemSubtotal + taxAmount;
        
        // Determine shipped quantity based on status
        let shippedQuantity = 0;
        if (['shipped', 'delivered', 'completed'].includes(status)) {
          shippedQuantity = quantity;
        } else if (status === 'processing' || status === 'packed') {
          shippedQuantity = 0;
        } else if (orderPattern === 'partial') {
          shippedQuantity = Math.floor(quantity * faker.number.float({ min: 0.3, max: 0.7 }));
        }
        
        items.push({
          productId: product._id,
          product: {
            name: product.name,
            sku: product.sku,
            category: product.category?.name || 'Uncategorized'
          },
          quantity,
          shippedQuantity,
          unitPrice,
          costPrice,
          discount,
          discountType,
          tax: taxRate * 100,
          taxAmount,
          total,
          warehouseLocation: faker.helpers.arrayElement(['A1-B2', 'C3-D4', 'E5-F6', 'G7-H8'])
        });
        
        subtotal += itemSubtotal;
        totalCost += costPrice * quantity;
      }
      
      // Calculate financial totals
      const totalDiscount = items.reduce((sum, item) => {
        return sum + (item.discountType === 'percentage' 
          ? (item.unitPrice * item.quantity * item.discount) / 100
          : item.discount);
      }, 0);
      
      const totalTax = items.reduce((sum, item) => sum + item.taxAmount, 0);
      
      // Shipping costs
      let shippingCost = 0;
      if (orderPattern === 'rush') {
        shippingCost = faker.number.float({ min: 25, max: 50, multipleOf: 0.01 });
      } else if (subtotal < 100) {
        shippingCost = faker.number.float({ min: 10, max: 20, multipleOf: 0.01 });
      } else if (subtotal < 500) {
        shippingCost = faker.number.float({ min: 15, max: 25, multipleOf: 0.01 });
      } // Free shipping for orders over $500
      
      const handlingFee = orderPattern === 'rush' ? 15 : 0;
      const grandTotal = subtotal + totalTax + shippingCost + handlingFee;
      const profitMargin = ((grandTotal - totalCost) / grandTotal) * 100;
      
      // Generate dates based on status
      const dates = { orderDate };
      
      if (!['draft', 'cancelled'].includes(status)) {
        dates.confirmedDate = faker.date.between({ 
          from: orderDate, 
          to: faker.date.soon({ days: 1, refDate: orderDate })
        });
      }
      
      if (['shipped', 'delivered', 'completed', 'refunded'].includes(status)) {
        dates.shippedDate = faker.date.between({
          from: dates.confirmedDate || orderDate,
          to: faker.date.soon({ days: 3, refDate: dates.confirmedDate || orderDate })
        });
      }
      
      if (['delivered', 'completed', 'refunded'].includes(status)) {
        dates.deliveredDate = faker.date.between({
          from: dates.shippedDate,
          to: faker.date.soon({ days: 5, refDate: dates.shippedDate })
        });
      }
      
      if (orderPattern === 'rush') {
        dates.expectedDelivery = faker.date.soon({ days: 2, refDate: orderDate });
      } else {
        dates.expectedDelivery = faker.date.soon({ days: 7, refDate: orderDate });
      }
      
      // Payment terms
      let paymentTerms;
      if (isB2B) {
        paymentTerms = faker.helpers.arrayElement(['Net 30', 'Net 45', 'Net 60', '2/10 Net 30']);
      } else {
        paymentTerms = 'Due on Receipt';
      }
      
      dates.dueDate = paymentTerms === 'Due on Receipt' 
        ? orderDate
        : faker.date.soon({ 
            days: parseInt(paymentTerms.match(/\d+$/)[0]), 
            refDate: dates.confirmedDate || orderDate 
          });
      
      // Payment status and transactions
      let paymentStatus = 'pending';
      const transactions = [];
      
      if (['delivered', 'completed'].includes(status)) {
        paymentStatus = 'paid';
        transactions.push({
          date: dates.deliveredDate || dates.confirmedDate,
          amount: grandTotal,
          method: faker.helpers.arrayElement(['card', 'bank_transfer', 'online', 'check']),
          reference: `PAY-${faker.string.alphanumeric({ length: 10, casing: 'upper' })}`
        });
      } else if (status === 'processing' && faker.datatype.boolean({ probability: 0.3 })) {
        // Partial payment
        paymentStatus = 'partial';
        const partialAmount = grandTotal * faker.number.float({ min: 0.3, max: 0.7 });
        transactions.push({
          date: dates.confirmedDate,
          amount: partialAmount,
          method: faker.helpers.arrayElement(['card', 'bank_transfer']),
          reference: `PAY-${faker.string.alphanumeric({ length: 10, casing: 'upper' })}`
        });
      } else if (status === 'refunded') {
        paymentStatus = 'refunded';
        // Original payment
        transactions.push({
          date: dates.confirmedDate,
          amount: grandTotal,
          method: faker.helpers.arrayElement(['card', 'online']),
          reference: `PAY-${faker.string.alphanumeric({ length: 10, casing: 'upper' })}`
        });
        // Refund transaction
        transactions.push({
          date: faker.date.recent({ days: 10 }),
          amount: -grandTotal,
          method: 'refund',
          reference: `REF-${faker.string.alphanumeric({ length: 10, casing: 'upper' })}`,
          notes: 'Customer refund processed'
        });
      }
      
      // Check for overdue
      if (paymentStatus !== 'paid' && dates.dueDate < new Date() && !['cancelled', 'refunded'].includes(status)) {
        paymentStatus = 'overdue';
      }
      
      // Generate shipping info
      const shippingAddress = generateMiamiAddress();
      const useSameAddress = faker.datatype.boolean({ probability: 0.8 });
      const billingAddress = useSameAddress ? shippingAddress : generateMiamiAddress();
      
      // Returns for refunded orders
      const returns = [];
      if (status === 'refunded') {
        returns.push({
          date: faker.date.recent({ days: 5 }),
          items: items.slice(0, faker.number.int({ min: 1, max: Math.min(3, items.length) })).map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            reason: faker.helpers.arrayElement(['Defective', 'Wrong item', 'Not as described', 'Changed mind']),
            condition: faker.helpers.arrayElement(['good', 'damaged', 'defective']),
            refundAmount: item.total
          })),
          status: 'completed',
          refundMethod: 'original_payment',
          notes: 'Customer return processed'
        });
      }
      
      // Create sales order
      const salesOrder = {
        orderNumber: `SO-2025-${String(i + 1).padStart(5, '0')}`,
        customer,
        warehouseId: warehouse._id,
        warehouse: {
          name: warehouse.name,
          code: warehouse.code
        },
        salesPersonId: salesPerson._id,
        salesPerson: {
          name: salesPerson.name,
          email: salesPerson.email
        },
        status,
        items,
        dates,
        financial: {
          subtotal,
          totalDiscount,
          totalTax,
          shippingCost,
          handlingFee,
          otherCharges: 0,
          grandTotal,
          paidAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
          balanceAmount: grandTotal - transactions.reduce((sum, t) => sum + t.amount, 0),
          currency: 'USD',
          exchangeRate: 1,
          profitMargin,
          totalCost
        },
        payment: {
          method: isB2B ? 'credit' : faker.helpers.arrayElement(['card', 'online', 'cash']),
          terms: paymentTerms,
          status: paymentStatus,
          transactions
        },
        shipping: {
          method: orderPattern === 'rush' ? 'Express' : 'Standard',
          carrier: faker.helpers.arrayElement(['UPS', 'FedEx', 'USPS', 'DHL']),
          trackingNumber: ['shipped', 'delivered', 'completed'].includes(status) 
            ? faker.string.alphanumeric({ length: 12, casing: 'upper' })
            : undefined,
          weight: faker.number.float({ min: 0.5, max: 20, multipleOf: 0.1 }),
          weightUnit: 'kg',
          packages: Math.ceil(items.length / 3),
          address: shippingAddress,
          billingAddress
        },
        fulfillment: {
          type: 'warehouse',
          priority: orderPattern === 'rush' ? 'urgent' : faker.helpers.arrayElement(['low', 'normal', 'high']),
          instructions: orderPattern === 'rush' ? 'Rush delivery - handle with priority' : undefined
        },
        source: isB2B ? 'sales_rep' : faker.helpers.arrayElement(['online', 'pos', 'phone']),
        channel: isB2B ? 'B2B' : 'B2C',
        notes: generateOrderNotes(orderPattern, customer),
        internalNotes: generateInternalNotes(status, orderPattern),
        tags: generateTags(orderPattern, customer, status),
        createdBy: salesPerson._id,
        createdAt: orderDate,
        updatedBy: salesPerson._id,
        updatedAt: faker.date.recent({ days: 1 }),
        returns
      };
      
      salesOrders.push(salesOrder);
    }
    
    // Log status distribution
    console.log('\nStatus distribution:');
    Object.entries(statusTargets).forEach(([status, target]) => {
      console.log(`  ${status}: ${target.count} (target: ${target.min}-${target.max})`);
    });
    
    // Log customer type distribution
    const b2bCount = salesOrders.filter(o => o.customer.isB2B).length;
    console.log(`\nCustomer distribution:`);
    console.log(`  B2B: ${b2bCount} (${Math.round(b2bCount / 150 * 100)}%)`);
    console.log(`  B2C: ${150 - b2bCount} (${Math.round((150 - b2bCount) / 150 * 100)}%)`);
    
    // Save to file
    const outputDir = path.join(__dirname, '..', 'generated-data');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputPath = path.join(outputDir, 'sales-orders.json');
    fs.writeFileSync(outputPath, JSON.stringify(salesOrders, null, 2));
    
    console.log(`\nGenerated ${salesOrders.length} sales orders`);
    console.log(`Saved to: ${outputPath}`);
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('Error generating sales orders:', error);
    process.exit(1);
  }
}

function generateOrderNotes(pattern, customer) {
  const notes = [];
  
  if (pattern === 'rush') {
    notes.push('Rush delivery requested');
  }
  
  if (customer.isB2B) {
    notes.push(`Corporate account: ${customer.company}`);
  }
  
  if (pattern === 'holiday') {
    notes.push('Holiday season order');
  }
  
  if (pattern === 'bulk') {
    notes.push('Bulk order - verify stock availability');
  }
  
  return notes.length > 0 ? notes.join('. ') : undefined;
}

function generateInternalNotes(status, pattern) {
  if (status === 'cancelled') {
    return faker.helpers.arrayElement([
      'Customer cancelled - out of stock',
      'Payment declined',
      'Duplicate order',
      'Customer request'
    ]);
  }
  
  if (status === 'refunded') {
    return 'Return processed - quality issue reported';
  }
  
  if (pattern === 'rush' && status === 'processing') {
    return 'Priority fulfillment - expedite processing';
  }
  
  return undefined;
}

function generateTags(pattern, customer, status) {
  const tags = [];
  
  if (pattern === 'rush') tags.push('rush');
  if (pattern === 'bulk') tags.push('bulk');
  if (pattern === 'holiday') tags.push('holiday');
  
  if (customer.isB2B) {
    tags.push('b2b');
    if (customer.companyType === 'University' || customer.companyType === 'School') {
      tags.push('education');
    } else if (customer.companyType === 'Hotel') {
      tags.push('hospitality');
    }
  } else {
    tags.push('b2c');
  }
  
  if (status === 'refunded') tags.push('return');
  if (status === 'cancelled') tags.push('cancelled');
  
  return tags;
}

// Run the generator
generateSalesOrders();
