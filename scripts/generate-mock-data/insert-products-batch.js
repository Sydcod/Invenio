const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = 'mongodb+srv://admin:oK1He1DJvOhkPNye@cluster0.km4yypv.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';
const DB_NAME = 'test';
const COLLECTION_NAME = 'products';

async function insertBatch(filePath) {
  console.log(`Attempting to insert data from: ${filePath}`);
  console.log(`Using MongoDB URI: ${MONGODB_URI}`);

  if (!filePath) {
    console.error('Error: Please provide a path to the JSON file.');
    process.exit(1);
  }

  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`Error: File not found at ${absolutePath}`);
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await client.connect();
    console.log('Connected successfully to MongoDB');

    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    const fileContent = fs.readFileSync(absolutePath, 'utf-8');
    const documents = JSON.parse(fileContent);

    if (!Array.isArray(documents) || documents.length === 0) {
        console.log('No documents to insert or the file does not contain an array.');
        return;
    }

    console.log(`Inserting ${documents.length} documents from ${path.basename(absolutePath)} into ${DB_NAME}.${COLLECTION_NAME}...`);
    const result = await collection.insertMany(documents, { ordered: true });
    console.log(`${result.insertedCount} documents were inserted successfully.`);

  } catch (err) {
    console.error('\n--- AN ERROR OCCURRED ---');
    console.error(`Error connecting to MongoDB or inserting documents:`);
    console.error(err);
    console.error('-------------------------\n');
  } finally {
    await client.close();
    console.log('MongoDB connection closed.');
  }
}

const filePath = process.argv[2];
insertBatch(filePath);
