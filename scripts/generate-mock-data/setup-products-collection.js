const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:oK1He1DJvOhkPNye@cluster0.km4yypv.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';
const DB_NAME = 'test';
const COLLECTION_NAME = 'products';

async function setupProductsCollection() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected successfully to MongoDB');

    const db = client.db(DB_NAME);
    
    // Create collection if it doesn't exist
    const collections = await db.listCollections({ name: COLLECTION_NAME }).toArray();
    if (collections.length === 0) {
      await db.createCollection(COLLECTION_NAME);
      console.log(`Created collection: ${COLLECTION_NAME}`);
    } else {
      console.log(`Collection ${COLLECTION_NAME} already exists`);
    }

    const collection = db.collection(COLLECTION_NAME);

    // Clear existing products (preserving indexes)
    const deleteResult = await collection.deleteMany({});
    console.log(`Cleared ${deleteResult.deletedCount} existing products`);

    // Create indexes based on the Product model schema
    console.log('\nCreating indexes...');

    // Unique index on SKU
    await collection.createIndex({ sku: 1 }, { unique: true });
    console.log('Created unique index on sku');

    // Compound index on status and name
    await collection.createIndex({ status: 1, name: 1 });
    console.log('Created compound index on status, name');

    // Category ID index
    await collection.createIndex({ 'category.id': 1 });
    console.log('Created index on category.id');

    // Brand index
    await collection.createIndex({ brand: 1 });
    console.log('Created index on brand');

    // Barcode index (sparse)
    await collection.createIndex({ barcode: 1 }, { sparse: true });
    console.log('Created sparse index on barcode');

    // UPC index (sparse)
    await collection.createIndex({ upc: 1 }, { sparse: true });
    console.log('Created sparse index on upc');

    // Inventory indexes
    await collection.createIndex({ 'inventory.currentStock': 1 });
    console.log('Created index on inventory.currentStock');

    await collection.createIndex({ 'inventory.reorderPoint': 1 });
    console.log('Created index on inventory.reorderPoint');

    // Tags index
    await collection.createIndex({ tags: 1 });
    console.log('Created index on tags');

    // Text index for search
    await collection.createIndex(
      { name: 'text', description: 'text', sku: 'text', brand: 'text' },
      { weights: { name: 10, brand: 5, sku: 3, description: 1 } }
    );
    console.log('Created text index for search');

    // List all indexes
    console.log('\nAll indexes on products collection:');
    const indexes = await collection.indexes();
    indexes.forEach(index => {
      console.log(`- ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log('\nProducts collection setup complete!');

  } catch (err) {
    console.error('Error setting up products collection:', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

setupProductsCollection();
