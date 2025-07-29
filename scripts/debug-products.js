require('dotenv').config();
const mongoose = require('mongoose');

async function debugProducts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('Connected to MongoDB');
    
    // Define a simple Product schema if not already defined
    const ProductSchema = new mongoose.Schema({}, { strict: false });
    const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema, 'products');
    
    // Count active products
    const activeCount = await Product.countDocuments({ status: 'Active' });
    console.log('\nActive products count:', activeCount);
    
    // Get a sample active product
    const sampleActive = await Product.findOne({ status: 'Active' });
    console.log('\nSample active product:', JSON.stringify(sampleActive, null, 2));
    
    // Check all statuses
    const allStatuses = await Product.distinct('status');
    console.log('\nAll product statuses:', allStatuses);
    
    // Count by status
    for (const status of allStatuses) {
      const count = await Product.countDocuments({ status });
      console.log(`Products with status "${status}":`, count);
    }
    
    // Check for products with inventory data
    const withInventory = await Product.countDocuments({ 
      'inventory.quantity': { $exists: true, $gt: 0 }
    });
    console.log('\nProducts with inventory quantity > 0:', withInventory);
    
    // Check for products with pricing data
    const withPricing = await Product.countDocuments({ 
      'pricing.unitPrice': { $exists: true, $gt: 0 }
    });
    console.log('Products with unit price > 0:', withPricing);
    
    // Get total inventory value calculation
    const inventoryValue = await Product.aggregate([
      { $match: { status: 'Active' } },
      {
        $group: {
          _id: null,
          totalValue: {
            $sum: {
              $multiply: ['$inventory.quantity', '$pricing.unitPrice']
            }
          },
          totalProducts: { $sum: 1 }
        }
      }
    ]);
    console.log('\nInventory value calculation:', inventoryValue);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

debugProducts();
