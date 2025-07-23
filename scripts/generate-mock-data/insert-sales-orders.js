const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:oK1He1DJvOhkPNye@cluster0.km4yypv.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';

async function insertSalesOrders() {
  try {
    // Read the generated sales orders
    const dataPath = path.join(__dirname, 'generated-data', 'sales-orders.json');
    
    if (!fs.existsSync(dataPath)) {
      console.error(`File not found: ${dataPath}`);
      process.exit(1);
    }
    
    const salesOrders = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    console.log(`Loaded ${salesOrders.length} sales orders from file.`);
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collection = db.collection('salesorders');
    
    // Clear existing sales orders (optional - comment out to append)
    const deleteResult = await collection.deleteMany({});
    console.log(`Cleared ${deleteResult.deletedCount} existing sales orders.`);
    
    // Convert string IDs to ObjectIds
    const ordersWithObjectIds = salesOrders.map(order => ({
      ...order,
      warehouseId: new mongoose.Types.ObjectId(order.warehouseId),
      salesPersonId: order.salesPersonId ? new mongoose.Types.ObjectId(order.salesPersonId) : undefined,
      items: order.items.map(item => ({
        ...item,
        productId: new mongoose.Types.ObjectId(item.productId)
      })),
      createdBy: new mongoose.Types.ObjectId(order.createdBy),
      updatedBy: new mongoose.Types.ObjectId(order.updatedBy),
      fulfillment: order.fulfillment ? {
        ...order.fulfillment,
        pickedBy: order.fulfillment.pickedBy ? new mongoose.Types.ObjectId(order.fulfillment.pickedBy) : undefined,
        packedBy: order.fulfillment.packedBy ? new mongoose.Types.ObjectId(order.fulfillment.packedBy) : undefined
      } : undefined,
      returns: order.returns ? order.returns.map(ret => ({
        ...ret,
        items: ret.items.map(item => ({
          ...item,
          productId: new mongoose.Types.ObjectId(item.productId)
        }))
      })) : undefined
    }));
    
    // Insert in batches to avoid overwhelming the database
    const batchSize = 25;
    let inserted = 0;
    
    for (let i = 0; i < ordersWithObjectIds.length; i += batchSize) {
      const batch = ordersWithObjectIds.slice(i, i + batchSize);
      const result = await collection.insertMany(batch);
      inserted += result.insertedCount;
      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}: ${result.insertedCount} documents`);
    }
    
    console.log(`\nSuccessfully inserted ${inserted} sales orders into MongoDB.`);
    
    // Verify the data by counting status distribution
    const statusCounts = await collection.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).toArray();
    
    console.log('\nStatus distribution in database:');
    statusCounts.forEach(({ _id, count }) => {
      console.log(`  ${_id}: ${count}`);
    });
    
    // Count customer types
    const b2bCount = await collection.countDocuments({ 'customer.company': { $exists: true, $ne: null } });
    const b2cCount = await collection.countDocuments({ 'customer.company': { $exists: false } });
    
    console.log('\nCustomer type distribution:');
    console.log(`  B2B: ${b2bCount} (${Math.round(b2bCount / inserted * 100)}%)`);
    console.log(`  B2C: ${b2cCount} (${Math.round(b2cCount / inserted * 100)}%)`);
    
    // Show sample order details
    const sampleOrder = await collection.findOne({ status: 'delivered' });
    if (sampleOrder) {
      console.log('\nSample sales order:');
      console.log(`  Order Number: ${sampleOrder.orderNumber}`);
      console.log(`  Customer: ${sampleOrder.customer.name} ${sampleOrder.customer.company ? `(${sampleOrder.customer.company})` : '(B2C)'}`);
      console.log(`  Warehouse: ${sampleOrder.warehouse.name}`);
      console.log(`  Status: ${sampleOrder.status}`);
      console.log(`  Items: ${sampleOrder.items.length}`);
      console.log(`  Grand Total: $${sampleOrder.financial.grandTotal.toFixed(2)}`);
      console.log(`  Payment Status: ${sampleOrder.payment.status}`);
      console.log(`  Channel: ${sampleOrder.channel || 'N/A'}`);
    }
    
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB.');
    
  } catch (error) {
    console.error('Error inserting sales orders:', error);
    process.exit(1);
  }
}

// Run the insertion
insertSalesOrders();
