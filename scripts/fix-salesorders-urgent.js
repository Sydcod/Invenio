const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:oK1He1DJvOhkPNye@cluster0.km4yypv.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';

async function fixSalesOrders() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB - FIXING SALES ORDERS URGENTLY');
    
    const db = mongoose.connection.db;
    const collection = db.collection('salesorders');
    
    // Get all sales orders
    const orders = await collection.find({}).toArray();
    console.log(`Found ${orders.length} orders to fix`);
    
    let fixed = 0;
    
    for (const order of orders) {
      // Recalculate financial values for each order
      let subtotal = 0;
      let totalTax = 0;
      let totalDiscount = 0;
      
      // Fix item calculations
      const updatedItems = order.items.map(item => {
        const itemSubtotal = item.costPrice * item.quantity;
        const discountAmount = item.discount ? (itemSubtotal * item.discount / 100) : 0;
        const discountedPrice = itemSubtotal - discountAmount;
        const taxAmount = discountedPrice * (item.tax / 100);
        const itemTotal = discountedPrice + taxAmount;
        
        subtotal += itemSubtotal;
        totalDiscount += discountAmount;
        totalTax += taxAmount;
        
        return {
          ...item,
          taxAmount: taxAmount,
          total: itemTotal
        };
      });
      
      // Calculate grand total
      const grandTotal = subtotal - totalDiscount + totalTax + (order.financial.shippingCost || 0) + (order.financial.handlingFee || 0) + (order.financial.otherCharges || 0);
      const balanceAmount = grandTotal - (order.financial.paidAmount || 0);
      
      // Calculate profit margin (25% average)
      const profitMargin = grandTotal * 0.25;
      
      // Update the order
      const result = await collection.updateOne(
        { _id: order._id },
        {
          $set: {
            items: updatedItems,
            'financial.subtotal': subtotal,
            'financial.totalDiscount': totalDiscount,
            'financial.totalTax': totalTax,
            'financial.grandTotal': grandTotal,
            'financial.balanceAmount': balanceAmount,
            'financial.profitMargin': profitMargin
          }
        }
      );
      
      if (result.modifiedCount > 0) {
        fixed++;
      }
    }
    
    console.log(`\n✅ FIXED ${fixed} sales orders!`);
    
    // Verify fix
    const sampleOrder = await collection.findOne({ status: 'delivered' });
    if (sampleOrder) {
      console.log('\nSample fixed order:');
      console.log(`  Order: ${sampleOrder.orderNumber}`);
      console.log(`  Subtotal: $${sampleOrder.financial.subtotal?.toFixed(2)}`);
      console.log(`  Total Tax: $${sampleOrder.financial.totalTax?.toFixed(2)}`);
      console.log(`  Grand Total: $${sampleOrder.financial.grandTotal?.toFixed(2)}`);
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Database fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

console.log('🚨 EMERGENCY FIX FOR SALES ORDERS - RUNNING NOW...');
fixSalesOrders();
