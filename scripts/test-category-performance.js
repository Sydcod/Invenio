const { MongoClient } = require('mongodb');

async function testCategoryPerformance() {
  const uri = 'mongodb://localhost:27017';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('test');
    const salesorders = db.collection('salesorders');

    console.log('=== Testing Category Performance Aggregation ===\n');

    // First, let's check the structure of items in sales orders
    console.log('1. Sample sales order item structure:');
    const sampleOrder = await salesorders.findOne({
      status: { $nin: ['draft', 'cancelled'] }
    });
    
    if (sampleOrder && sampleOrder.items && sampleOrder.items.length > 0) {
      console.log('Sample item:', JSON.stringify(sampleOrder.items[0], null, 2));
    }

    // Test the category performance aggregation
    console.log('\n2. Running Category Performance aggregation:');
    const categoryPerf = await salesorders.aggregate([
      {
        $addFields: {
          'dates.orderDate': { $dateFromString: { dateString: '$dates.orderDate' } }
        }
      },
      {
        $match: {
          'dates.orderDate': {
            $gte: new Date('2025-07-01'),
            $lte: new Date('2025-07-31T23:59:59.999Z')
          },
          status: { $nin: ['draft', 'cancelled'] }
        }
      },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: '$product.category.name',
          revenue: { 
            $sum: { 
              $multiply: ['$items.quantity', '$items.unitPrice'] 
            } 
          },
          quantity: { $sum: '$items.quantity' },
          orders: { $addToSet: '$_id' }
        }
      },
      {
        $project: {
          category: '$_id',
          revenue: { $round: ['$revenue', 2] },
          quantity: 1,
          orderCount: { $size: '$orders' },
          _id: 0
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 }
    ]).toArray();
    
    console.log('Category Performance results:', categoryPerf);

    // Let's also check if products have categories
    console.log('\n3. Checking product categories:');
    const products = db.collection('products');
    const productWithCategory = await products.findOne({ 'category.name': { $exists: true } });
    
    if (productWithCategory) {
      console.log('Sample product category:', productWithCategory.category);
    } else {
      console.log('No products found with category.name field');
      
      // Check alternative category structure
      const anyProduct = await products.findOne({});
      if (anyProduct) {
        console.log('Sample product structure:', {
          name: anyProduct.name,
          category: anyProduct.category
        });
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

testCategoryPerformance();
