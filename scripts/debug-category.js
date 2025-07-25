const { MongoClient, ObjectId } = require('mongodb');

async function debugCategory() {
  const uri = 'mongodb://localhost:27017';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('test');
    const salesorders = db.collection('salesorders');
    const products = db.collection('products');

    // 1. Check if we have sales orders
    const orderCount = await salesorders.countDocuments();
    console.log(`\n1. Total sales orders: ${orderCount}`);

    // 2. Get a sample order and check its structure
    const sampleOrder = await salesorders.findOne({
      status: { $nin: ['draft', 'cancelled'] }
    });
    
    if (sampleOrder) {
      console.log('\n2. Sample order status:', sampleOrder.status);
      console.log('   Order date:', sampleOrder.dates?.orderDate);
      console.log('   Number of items:', sampleOrder.items?.length || 0);
      
      if (sampleOrder.items && sampleOrder.items.length > 0) {
        console.log('\n3. First item structure:');
        const firstItem = sampleOrder.items[0];
        console.log('   productId:', firstItem.productId);
        console.log('   quantity:', firstItem.quantity);
        console.log('   unitPrice:', firstItem.unitPrice);
        console.log('   pricing:', firstItem.pricing);
        
        // Check if productId exists in products collection
        if (firstItem.productId) {
          const product = await products.findOne({ _id: firstItem.productId });
          if (product) {
            console.log('\n4. Product found:');
            console.log('   name:', product.name);
            console.log('   category:', JSON.stringify(product.category, null, 2));
          } else {
            console.log('\n4. Product NOT found with ID:', firstItem.productId);
          }
        }
      }
    }

    // 5. Check product categories structure
    console.log('\n5. Checking product categories:');
    const sampleProducts = await products.find({}).limit(3).toArray();
    sampleProducts.forEach((p, i) => {
      console.log(`\n   Product ${i + 1}:`);
      console.log(`   - name: ${p.name}`);
      console.log(`   - category:`, JSON.stringify(p.category, null, 2));
    });

  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

debugCategory();
