const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:oK1He1DJvOhkPNye@cluster0.km4yypv.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';

async function insertPurchaseOrders() {
  try {
    // Read the generated purchase orders
    const dataPath = path.join(__dirname, 'generated-data', 'purchase-orders.json');
    
    if (!fs.existsSync(dataPath)) {
      console.error(`File not found: ${dataPath}`);
      process.exit(1);
    }
    
    const purchaseOrders = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    console.log(`Loaded ${purchaseOrders.length} purchase orders from file.`);
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collection = db.collection('purchaseorders');
    
    // Clear existing purchase orders (optional - comment out to append)
    const deleteResult = await collection.deleteMany({});
    console.log(`Cleared ${deleteResult.deletedCount} existing purchase orders.`);
    
    // Convert string IDs to ObjectIds
    const ordersWithObjectIds = purchaseOrders.map(order => ({
      ...order,
      supplierId: new mongoose.Types.ObjectId(order.supplierId),
      warehouseId: new mongoose.Types.ObjectId(order.warehouseId),
      items: order.items.map(item => ({
        ...item,
        productId: new mongoose.Types.ObjectId(item.productId)
      })),
      createdBy: new mongoose.Types.ObjectId(order.createdBy),
      updatedBy: new mongoose.Types.ObjectId(order.updatedBy),
      approval: order.approval ? {
        ...order.approval,
        approvedBy: order.approval.approvedBy ? new mongoose.Types.ObjectId(order.approval.approvedBy) : undefined,
        rejectedBy: order.approval.rejectedBy ? new mongoose.Types.ObjectId(order.approval.rejectedBy) : undefined
      } : undefined
    }));
    
    // Insert in batches to avoid overwhelming the database
    const batchSize = 20;
    let inserted = 0;
    
    for (let i = 0; i < ordersWithObjectIds.length; i += batchSize) {
      const batch = ordersWithObjectIds.slice(i, i + batchSize);
      const result = await collection.insertMany(batch);
      inserted += result.insertedCount;
      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}: ${result.insertedCount} documents`);
    }
    
    console.log(`\nSuccessfully inserted ${inserted} purchase orders into MongoDB.`);
    
    // Verify the data by counting status distribution
    const statusCounts = await collection.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).toArray();
    
    console.log('\nStatus distribution in database:');
    statusCounts.forEach(({ _id, count }) => {
      console.log(`  ${_id}: ${count}`);
    });
    
    // Show sample order details
    const sampleOrder = await collection.findOne({ status: 'received' });
    if (sampleOrder) {
      console.log('\nSample purchase order:');
      console.log(`  Order Number: ${sampleOrder.orderNumber}`);
      console.log(`  Supplier: ${sampleOrder.supplier.name}`);
      console.log(`  Warehouse: ${sampleOrder.warehouse.name}`);
      console.log(`  Status: ${sampleOrder.status}`);
      console.log(`  Items: ${sampleOrder.items.length}`);
      console.log(`  Grand Total: $${sampleOrder.financial.grandTotal.toFixed(2)}`);
      console.log(`  Payment Status: ${sampleOrder.payment.status}`);
    }
    
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB.');
    
  } catch (error) {
    console.error('Error inserting purchase orders:', error);
    process.exit(1);
  }
}

// Run the insertion
insertPurchaseOrders();
