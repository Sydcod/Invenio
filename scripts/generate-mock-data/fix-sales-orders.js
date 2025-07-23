const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:oK1He1DJvOhkPNye@cluster0.km4yypv.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';

async function fixSalesOrders() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Get all sales orders
    const orders = await db.collection('salesorders').find({}).toArray();
    console.log(`Found ${orders.length} sales orders to fix`);
    
    let updated = 0;
    
    for (const order of orders) {
      let hasChanges = false;
      
      // Fix items - add unitPrice and calculate totals
      if (order.items && order.items.length > 0) {
        order.items = order.items.map(item => {
          // Calculate unit price from cost price with markup
          // Typical retail markup is 25-50% depending on product type
          const markupPercent = 30 + Math.random() * 20; // 30-50% markup
          const unitPrice = item.costPrice * (1 + markupPercent / 100);
          
          // Calculate item total before discount
          const baseTotal = unitPrice * item.quantity;
          
          // Apply discount
          let discount = 0;
          if (item.discount && item.discountType === 'percentage') {
            discount = baseTotal * (item.discount / 100);
          } else if (item.discount && item.discountType === 'fixed') {
            discount = item.discount;
          }
          
          const itemSubtotal = baseTotal - discount;
          
          // Calculate tax
          const taxAmount = itemSubtotal * (item.tax / 100);
          const itemTotal = itemSubtotal + taxAmount;
          
          return {
            ...item,
            unitPrice: Math.round(unitPrice * 100) / 100,
            baseTotal: Math.round(baseTotal * 100) / 100,
            discountAmount: Math.round(discount * 100) / 100,
            taxAmount: Math.round(taxAmount * 100) / 100,
            total: Math.round(itemTotal * 100) / 100
          };
        });
        
        hasChanges = true;
      }
      
      // Calculate financial totals
      if (order.items && order.items.length > 0) {
        const subtotal = order.items.reduce((sum, item) => {
          return sum + (item.unitPrice * item.quantity);
        }, 0);
        
        const totalDiscount = order.items.reduce((sum, item) => {
          return sum + (item.discountAmount || 0);
        }, 0);
        
        const discountedSubtotal = subtotal - totalDiscount;
        
        // Calculate tax (7% Florida tax on discounted subtotal)
        const totalTax = discountedSubtotal * 0.07;
        
        // Shipping cost based on order type and value
        let shippingCost = order.financial?.shippingCost || 0;
        if (shippingCost === 0) {
          // Calculate shipping if not set
          if (order.priority === 'high' || order.shipping?.method === 'express') {
            shippingCost = 25 + Math.random() * 25; // $25-50 for rush
          } else if (discountedSubtotal > 500) {
            shippingCost = 0; // Free shipping on large orders
          } else if (discountedSubtotal > 100) {
            shippingCost = 10;
          } else {
            shippingCost = 15;
          }
        }
        
        const handlingFee = order.financial?.handlingFee || 0;
        const otherCharges = order.financial?.otherCharges || 0;
        
        const grandTotal = discountedSubtotal + totalTax + shippingCost + handlingFee + otherCharges;
        
        // Calculate profit margin
        const totalCost = order.items.reduce((sum, item) => {
          return sum + (item.costPrice * item.quantity);
        }, 0);
        const profitMargin = ((grandTotal - totalCost - shippingCost) / grandTotal) * 100;
        
        // Update financial object
        order.financial = {
          ...order.financial,
          subtotal: Math.round(subtotal * 100) / 100,
          totalDiscount: Math.round(totalDiscount * 100) / 100,
          totalTax: Math.round(totalTax * 100) / 100,
          shippingCost: Math.round(shippingCost * 100) / 100,
          handlingFee: handlingFee,
          otherCharges: otherCharges,
          grandTotal: Math.round(grandTotal * 100) / 100,
          totalCost: Math.round(totalCost * 100) / 100,
          profitMargin: Math.round(profitMargin * 100) / 100,
          currency: order.financial?.currency || 'USD',
          exchangeRate: order.financial?.exchangeRate || 1
        };
        
        // Update payment amounts based on status
        if (order.payment) {
          if (order.status === 'delivered' || order.status === 'completed') {
            order.financial.paidAmount = order.financial.grandTotal;
            order.financial.balanceAmount = 0;
            order.payment.status = 'paid';
          } else if (order.status === 'cancelled' || order.status === 'refunded') {
            order.financial.paidAmount = 0;
            order.financial.balanceAmount = 0;
            if (order.status === 'refunded') {
              order.payment.status = 'refunded';
            }
          } else if (order.status === 'processing' || order.status === 'shipped') {
            // Partial payment for some orders
            if (Math.random() > 0.7) {
              order.financial.paidAmount = Math.round(order.financial.grandTotal * 0.5 * 100) / 100;
              order.financial.balanceAmount = order.financial.grandTotal - order.financial.paidAmount;
              order.payment.status = 'partial';
            } else {
              order.financial.paidAmount = order.financial.grandTotal;
              order.financial.balanceAmount = 0;
              order.payment.status = 'paid';
            }
          } else {
            order.financial.paidAmount = 0;
            order.financial.balanceAmount = order.financial.grandTotal;
            order.payment.status = 'pending';
          }
        }
        
        hasChanges = true;
      }
      
      // Update the order if changes were made
      if (hasChanges) {
        await db.collection('salesorders').updateOne(
          { _id: order._id },
          { 
            $set: { 
              items: order.items,
              financial: order.financial,
              'payment.status': order.payment?.status
            } 
          }
        );
        updated++;
        
        if (updated % 10 === 0) {
          console.log(`Updated ${updated} orders...`);
        }
      }
    }
    
    console.log(`\nFixed ${updated} sales orders`);
    
    // Verify the fix by checking a few orders
    console.log('\nVerification - Sample orders with fixed totals:');
    const samples = await db.collection('salesorders')
      .find({ 'financial.grandTotal': { $gt: 0 } })
      .limit(5)
      .project({ 
        orderNumber: 1, 
        'customer.name': 1,
        'customer.company': 1,
        'financial.subtotal': 1,
        'financial.totalDiscount': 1,
        'financial.totalTax': 1,
        'financial.shippingCost': 1,
        'financial.grandTotal': 1,
        'items': { $size: '$items' },
        status: 1
      })
      .toArray();
    
    samples.forEach(order => {
      console.log(`\nOrder ${order.orderNumber}:`);
      console.log(`  Customer: ${order.customer.name} ${order.customer.company ? `(${order.customer.company})` : ''}`);
      console.log(`  Status: ${order.status}`);
      console.log(`  Items: ${order.items}`);
      console.log(`  Subtotal: $${order.financial.subtotal}`);
      console.log(`  Discount: $${order.financial.totalDiscount}`);
      console.log(`  Tax: $${order.financial.totalTax}`);
      console.log(`  Shipping: $${order.financial.shippingCost}`);
      console.log(`  Grand Total: $${order.financial.grandTotal}`);
    });
    
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    
  } catch (error) {
    console.error('Error fixing sales orders:', error);
    process.exit(1);
  }
}

// Run the fix
fixSalesOrders();
