const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:oK1He1DJvOhkPNye@cluster0.km4yypv.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';
const DB_NAME = 'test';
const COLLECTION_NAME = 'products';

async function clearProducts() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected successfully to MongoDB');

    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Delete all documents but preserve indexes
    const result = await collection.deleteMany({});
    console.log(`Cleared ${result.deletedCount} products from the collection.`);
    console.log('Indexes have been preserved.');

  } catch (err) {
    console.error('Error clearing products:', err);
  } finally {
    await client.close();
  }
}

clearProducts();
