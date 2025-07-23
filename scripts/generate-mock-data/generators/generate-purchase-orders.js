const fs = require('fs');
const path = require('path');
const { faker } = require('@faker-js/faker');
const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:oK1He1DJvOhkPNye@cluster0.km4yypv.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';

// Order patterns for realistic generation
const ORDER_PATTERNS = {
  REGULAR_RESTOCKING: 'regular_restocking',
  BULK_SALES_EVENT: 'bulk_sales_event',
  EMERGENCY_REPLENISHMENT: 'emergency_replenishment',
  NEW_PRODUCT_LAUNCH: 'new_product_launch',
  SEASONAL_PREPARATION: 'seasonal_preparation'
};

// Payment terms based on supplier relationships
const PAYMENT_TERMS = ['Net 30', 'Net 45', 'Net 60', '2/10 Net 30', 'Due on Receipt', 'Net 15'];

// Shipping methods
const SHIPPING_METHODS = ['Ground', 'Express', 'Overnight', 'Freight', '2-Day Air', 'Standard'];

// Generate order number
function generateOrderNumber(index) {
  const year = '2025';
  const sequence = String(index).padStart(5, '0');
  return `PO-${year}-${sequence}`;
}

// Get random items from array
function getRandomItems(arr, count) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, arr.length));
}

// Generate order items based on pattern
function generateOrderItems(products, pattern, supplier) {
  let itemCount;
  let quantityRange;
  
  switch (pattern) {
    case ORDER_PATTERNS.REGULAR_RESTOCKING:
      itemCount = faker.number.int({ min: 3, max: 8 });
      quantityRange = { min: 10, max: 50 };
      break;
    case ORDER_PATTERNS.BULK_SALES_EVENT:
      itemCount = faker.number.int({ min: 5, max: 15 });
      quantityRange = { min: 50, max: 200 };
      break;
    case ORDER_PATTERNS.EMERGENCY_REPLENISHMENT:
      itemCount = faker.number.int({ min: 1, max: 3 });
      quantityRange = { min: 20, max: 100 };
      break;
    case ORDER_PATTERNS.NEW_PRODUCT_LAUNCH:
      itemCount = faker.number.int({ min: 1, max: 5 });
      quantityRange = { min: 100, max: 500 };
      break;
    case ORDER_PATTERNS.SEASONAL_PREPARATION:
      itemCount = faker.number.int({ min: 10, max: 20 });
      quantityRange = { min: 30, max: 150 };
      break;
    default:
      itemCount = faker.number.int({ min: 3, max: 10 });
      quantityRange = { min: 10, max: 100 };
  }
  
  // Filter products by supplier brand if applicable
  let availableProducts = products;
  if (supplier.name.includes('Apple') || supplier.name.includes('Samsung') || 
      supplier.name.includes('Sony') || supplier.name.includes('Microsoft') ||
      supplier.name.includes('Lenovo') || supplier.name.includes('LG')) {
    const brandName = supplier.name.split(' ')[0];
    availableProducts = products.filter(p => p.brand && p.brand.includes(brandName));
  }
  
  // If no brand-specific products, use all products
  if (availableProducts.length === 0) {
    availableProducts = products;
  }
  
  const selectedProducts = getRandomItems(availableProducts, itemCount);
  
  return selectedProducts.map(product => {
    const quantity = faker.number.int(quantityRange);
    const unitCost = product.cost || faker.number.float({ min: 50, max: 1000, precision: 0.01 });
    const discount = faker.helpers.arrayElement([0, 0, 0, 5, 10, 15]); // Most orders no discount
    const discountType = discount > 0 ? faker.helpers.arrayElement(['percentage', 'fixed']) : 'percentage';
    const tax = 7; // 7% tax rate for Florida
    
    const subtotal = quantity * unitCost;
    const discountAmount = discountType === 'percentage' ? (subtotal * discount / 100) : discount;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * tax / 100;
    const total = taxableAmount + taxAmount;
    
    // Received quantity based on order status
    let receivedQuantity = 0;
    const expectedDelivery = faker.date.between({ 
      from: new Date('2025-01-15'), 
      to: new Date('2025-08-15') 
    });
    
    return {
      productId: product._id,
      product: {
        name: product.name,
        sku: product.sku,
        category: product.category?.name || 'Electronics'
      },
      quantity,
      receivedQuantity,
      unitCost,
      discount,
      discountType,
      tax,
      taxAmount,
      total,
      expectedDelivery,
      notes: pattern === ORDER_PATTERNS.EMERGENCY_REPLENISHMENT ? 'Urgent - Low stock alert' : undefined
    };
  });
}

// Calculate financial totals
function calculateFinancials(items, shippingCost = 0, otherCharges = 0) {
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTax = 0;
  
  items.forEach(item => {
    const itemSubtotal = item.quantity * item.unitCost;
    const discountAmount = item.discountType === 'percentage' 
      ? (itemSubtotal * item.discount / 100) 
      : item.discount;
    
    subtotal += itemSubtotal;
    totalDiscount += discountAmount;
    totalTax += item.taxAmount;
  });
  
  const grandTotal = subtotal - totalDiscount + totalTax + shippingCost + otherCharges;
  
  return {
    subtotal,
    totalDiscount,
    totalTax,
    shippingCost,
    otherCharges,
    grandTotal,
    paidAmount: 0,
    balanceAmount: grandTotal,
    currency: 'USD',
    exchangeRate: 1
  };
}

// Generate purchase order based on pattern and status
function generatePurchaseOrder(index, suppliers, warehouses, products, users) {
  const orderDate = faker.date.between({ 
    from: new Date('2025-01-01'), 
    to: new Date('2025-07-23') 
  });
  
  // Select pattern based on realistic distribution
  const patternRoll = Math.random();
  let pattern;
  if (patternRoll < 0.4) pattern = ORDER_PATTERNS.REGULAR_RESTOCKING;
  else if (patternRoll < 0.6) pattern = ORDER_PATTERNS.BULK_SALES_EVENT;
  else if (patternRoll < 0.75) pattern = ORDER_PATTERNS.SEASONAL_PREPARATION;
  else if (patternRoll < 0.85) pattern = ORDER_PATTERNS.EMERGENCY_REPLENISHMENT;
  else pattern = ORDER_PATTERNS.NEW_PRODUCT_LAUNCH;
  
  // Select status based on distribution
  const statusRoll = Math.random();
  let status;
  if (statusRoll < 0.45) status = 'received'; // 40-50
  else if (statusRoll < 0.6) status = 'ordered'; // 10-15
  else if (statusRoll < 0.75) status = 'pending'; // 10-15
  else if (statusRoll < 0.85) status = 'partial'; // 5-10
  else if (statusRoll < 0.95) status = 'approved'; // 5-10
  else status = 'cancelled'; // 5-10
  
  const supplier = faker.helpers.arrayElement(suppliers);
  const warehouse = faker.helpers.arrayElement(warehouses);
  const items = generateOrderItems(products, pattern, supplier);
  
  // Update received quantities based on status
  if (status === 'received' || status === 'completed') {
    items.forEach(item => {
      item.receivedQuantity = item.quantity;
      const receivedDate = new Date('2025-07-23');
      item.receivedDate = orderDate < receivedDate
        ? faker.date.between({ from: orderDate, to: receivedDate })
        : orderDate;
    });
  } else if (status === 'partial') {
    items.forEach((item, idx) => {
      if (idx % 2 === 0) { // Half items received
        item.receivedQuantity = faker.number.int({ 
          min: Math.floor(item.quantity * 0.3), 
          max: Math.floor(item.quantity * 0.8) 
        });
        item.receivedDate = faker.date.between({ 
          from: orderDate, 
          to: new Date('2025-07-23') 
        });
      }
    });
  }
  
  // Calculate shipping cost based on pattern
  const shippingCost = pattern === ORDER_PATTERNS.EMERGENCY_REPLENISHMENT
    ? faker.number.float({ min: 100, max: 500, precision: 0.01 })
    : faker.number.float({ min: 25, max: 150, precision: 0.01 });
    
  const otherCharges = faker.number.float({ min: 0, max: 50, precision: 0.01 });
  const financial = calculateFinancials(items, shippingCost, otherCharges);
  
  // Payment information
  const paymentTerms = faker.helpers.arrayElement(PAYMENT_TERMS);
  const dueDate = new Date(orderDate);
  if (paymentTerms.includes('30')) dueDate.setDate(dueDate.getDate() + 30);
  else if (paymentTerms.includes('45')) dueDate.setDate(dueDate.getDate() + 45);
  else if (paymentTerms.includes('60')) dueDate.setDate(dueDate.getDate() + 60);
  else if (paymentTerms.includes('15')) dueDate.setDate(dueDate.getDate() + 15);
  
  // Payment transactions based on status
  const transactions = [];
  let paymentStatus = 'pending';
  
  if (status === 'received' || status === 'completed') {
    const fullPayment = Math.random() < 0.7; // 70% fully paid
    if (fullPayment) {
      transactions.push({
        date: faker.date.between({ from: orderDate, to: new Date('2025-07-23') }),
        amount: financial.grandTotal,
        method: faker.helpers.arrayElement(['Wire Transfer', 'ACH', 'Check', 'Credit Card']),
        reference: `PAY-${faker.string.alphanumeric(8).toUpperCase()}`
      });
      financial.paidAmount = financial.grandTotal;
      financial.balanceAmount = 0;
      paymentStatus = 'paid';
    } else {
      // Partial payment
      const paidPercentage = faker.number.float({ min: 0.3, max: 0.8 });
      const paidAmount = financial.grandTotal * paidPercentage;
      transactions.push({
        date: faker.date.between({ from: orderDate, to: new Date('2025-07-23') }),
        amount: paidAmount,
        method: faker.helpers.arrayElement(['Wire Transfer', 'ACH', 'Check']),
        reference: `PAY-${faker.string.alphanumeric(8).toUpperCase()}`,
        notes: 'Partial payment'
      });
      financial.paidAmount = paidAmount;
      financial.balanceAmount = financial.grandTotal - paidAmount;
      paymentStatus = 'partial';
    }
  }
  
  // Check if overdue
  if (new Date() > dueDate && paymentStatus !== 'paid') {
    paymentStatus = 'overdue';
  }
  
  // Approval information for approved/ordered/received orders
  const approval = {
    required: ['pending', 'approved', 'ordered', 'partial', 'received'].includes(status),
    approvedBy: undefined,
    approvedAt: undefined,
    rejectedBy: undefined,
    rejectedAt: undefined,
    comments: undefined
  };
  
  if (status !== 'pending' && status !== 'cancelled' && approval.required) {
    approval.approvedBy = faker.helpers.arrayElement(users)._id;
    const maxApprovalDate = new Date(orderDate);
    maxApprovalDate.setDate(maxApprovalDate.getDate() + 3);
    const latestDate = new Date('2025-07-23');
    approval.approvedAt = faker.date.between({ 
      from: orderDate, 
      to: maxApprovalDate > latestDate ? latestDate : maxApprovalDate
    });
  }
  
  if (status === 'cancelled') {
    approval.rejectedBy = faker.helpers.arrayElement(users)._id;
    const maxRejectionDate = new Date(orderDate);
    maxRejectionDate.setDate(maxRejectionDate.getDate() + 3);
    const latestDate = new Date('2025-07-23');
    approval.rejectedAt = faker.date.between({ 
      from: orderDate, 
      to: maxRejectionDate > latestDate ? latestDate : maxRejectionDate
    });
    approval.comments = faker.helpers.arrayElement([
      'Budget constraints',
      'Found better pricing elsewhere',
      'Product specifications changed',
      'Supplier unable to fulfill'
    ]);
  }
  
  // Shipping information
  const minDeliveryDate = new Date(orderDate);
  minDeliveryDate.setDate(minDeliveryDate.getDate() + 7);
  const maxDeliveryDate = new Date(orderDate);
  maxDeliveryDate.setDate(maxDeliveryDate.getDate() + 30);
  const latestDate = new Date('2025-07-23');
  
  // Ensure delivery dates don't exceed our upper bound
  if (minDeliveryDate > latestDate) {
    minDeliveryDate.setTime(latestDate.getTime());
  }
  if (maxDeliveryDate > latestDate) {
    maxDeliveryDate.setTime(latestDate.getTime());
  }
  
  const expectedDelivery = minDeliveryDate < maxDeliveryDate
    ? faker.date.between({ from: minDeliveryDate, to: maxDeliveryDate })
    : minDeliveryDate;
  
  const actualDelivery = (status === 'received' || status === 'completed') 
    ? faker.date.between({ from: expectedDelivery, to: expectedDelivery > latestDate ? expectedDelivery : latestDate })
    : undefined;
  
  const shippingInfo = {
    method: faker.helpers.arrayElement(SHIPPING_METHODS),
    trackingNumber: status !== 'pending' && status !== 'draft' 
      ? faker.string.alphanumeric(12).toUpperCase() 
      : undefined,
    carrier: faker.helpers.arrayElement(['FedEx', 'UPS', 'DHL', 'USPS', 'Freight Forward']),
    estimatedArrival: expectedDelivery,
    address: warehouse.address
  };
  
  // Generate notes based on pattern
  let notes = '';
  switch (pattern) {
    case ORDER_PATTERNS.EMERGENCY_REPLENISHMENT:
      notes = 'URGENT: Critical stock levels. Expedited shipping required.';
      break;
    case ORDER_PATTERNS.BULK_SALES_EVENT:
      notes = `Bulk order for ${faker.helpers.arrayElement(['Black Friday', 'Summer Sale', 'Spring Clearance', 'Holiday Season'])} event.`;
      break;
    case ORDER_PATTERNS.NEW_PRODUCT_LAUNCH:
      notes = 'Initial stock order for new product launch. Marketing campaign scheduled.';
      break;
    case ORDER_PATTERNS.SEASONAL_PREPARATION:
      notes = `Seasonal inventory preparation for ${faker.helpers.arrayElement(['Summer', 'Back-to-School', 'Holiday', 'Spring'])} season.`;
      break;
    default:
      notes = 'Regular inventory replenishment order.';
  }
  
  return {
    orderNumber: generateOrderNumber(index + 1),
    supplierId: supplier._id,
    supplier: {
      name: supplier.name,
      code: supplier.code,
      contactPerson: supplier.contactPerson,
      email: supplier.email,
      phone: supplier.phone
    },
    warehouseId: warehouse._id,
    warehouse: {
      name: warehouse.name,
      code: warehouse.code
    },
    status,
    items,
    dates: {
      orderDate,
      expectedDelivery,
      actualDelivery,
      dueDate
    },
    financial,
    payment: {
      terms: paymentTerms,
      method: transactions.length > 0 ? transactions[0].method : undefined,
      status: paymentStatus,
      transactions
    },
    shipping: shippingInfo,
    approval,
    notes,
    internalNotes: pattern === ORDER_PATTERNS.EMERGENCY_REPLENISHMENT 
      ? 'Priority handling required. Contact supplier for expedited processing.' 
      : undefined,
    tags: [pattern.replace(/_/g, '-'), `supplier-${supplier.code.toLowerCase()}`, `${orderDate.getFullYear()}-Q${Math.floor(orderDate.getMonth() / 3) + 1}`],
    createdBy: faker.helpers.arrayElement(users)._id,
    createdAt: orderDate,
    updatedBy: faker.helpers.arrayElement(users)._id,
    updatedAt: orderDate < new Date('2025-07-23')
      ? faker.date.between({ from: orderDate, to: new Date('2025-07-23') })
      : orderDate
  };
}

async function generatePurchaseOrders() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Fetch required data
    const db = mongoose.connection.db;
    const suppliers = await db.collection('suppliers').find({}).toArray();
    const warehouses = await db.collection('warehouses').find({}).toArray();
    const products = await db.collection('products').find({}).toArray();
    const users = await db.collection('users').find({}).toArray();
    
    console.log(`Found ${suppliers.length} suppliers, ${warehouses.length} warehouses, ${products.length} products, ${users.length} users`);
    
    // Generate 100 purchase orders
    const purchaseOrders = [];
    const orderCount = 100;
    
    for (let i = 0; i < orderCount; i++) {
      const order = generatePurchaseOrder(i, suppliers, warehouses, products, users);
      purchaseOrders.push(order);
    }
    
    // Count status distribution
    const statusCounts = purchaseOrders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\nGenerated Purchase Orders Status Distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    // Save to file
    const outputDir = path.join(__dirname, '..', 'generated-data');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputPath = path.join(outputDir, 'purchase-orders.json');
    fs.writeFileSync(outputPath, JSON.stringify(purchaseOrders, null, 2));
    
    console.log(`\nGenerated ${orderCount} purchase orders and saved to ${outputPath}`);
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('Error generating purchase orders:', error);
    process.exit(1);
  }
}

// Run the generator
generatePurchaseOrders();
