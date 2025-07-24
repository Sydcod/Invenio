const { MongoClient } = require('mongodb');

async function checkProductsData() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('test');
    const products = db.collection('products');
    
    // Count total products
    const count = await products.countDocuments();
    console.log(`Total products in database: ${count}`);
    
    if (count > 0) {
      // Show sample products
      console.log('\nSample products:');
      const samples = await products.find({}).limit(5).toArray();
      samples.forEach((product, index) => {
        console.log(`\n${index + 1}. ${product.name}`);
        console.log(`   SKU: ${product.sku}`);
        console.log(`   Brand: ${product.brand}`);
        console.log(`   Category: ${product.category?.name || 'N/A'}`);
        console.log(`   Stock: ${product.inventory?.currentStock || 0}`);
        console.log(`   Price: $${product.pricing?.basePrice || 0}`);
      });
      
      // Show stock summary
      const stockSummary = await products.aggregate([
        {
          $group: {
            _id: null,
            totalStock: { $sum: '$inventory.currentStock' },
            totalValue: { $sum: { $multiply: ['$inventory.currentStock', '$pricing.cost'] } },
            avgStock: { $avg: '$inventory.currentStock' }
          }
        }
      ]).toArray();
      
      if (stockSummary.length > 0) {
        console.log('\nInventory Summary:');
        console.log(`Total Stock Units: ${stockSummary[0].totalStock || 0}`);
        console.log(`Total Stock Value: $${(stockSummary[0].totalValue || 0).toFixed(2)}`);
        console.log(`Average Stock per Product: ${(stockSummary[0].avgStock || 0).toFixed(0)}`);
      }
    } else {
      console.log('\nNo products found in database!');
      console.log('You need to run the product generation script first.');
      console.log('Run: node scripts/generate-products-realistic.js');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkProductsData();
