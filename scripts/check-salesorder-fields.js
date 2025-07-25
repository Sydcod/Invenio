const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:oK1He1DJvOhkPNye@cluster0.km4yypv.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';

async function checkSalesOrderFields() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collection = db.collection('salesorders');
    
    // Get first document's keys
    const sampleDoc = await collection.findOne({});
    
    console.log('\n📋 Sales Order Fields:');
    console.log('Top-level fields:', Object.keys(sampleDoc));
    
    // Check for date-related fields
    console.log('\n📅 Date-related fields:');
    Object.keys(sampleDoc).forEach(key => {
      if (key.toLowerCase().includes('date') || key.toLowerCase().includes('time')) {
        console.log(`- ${key}: ${sampleDoc[key]}`);
      }
    });
    
    // Check for amount/price/total fields
    console.log('\n💰 Amount-related fields:');
    Object.keys(sampleDoc).forEach(key => {
      if (key.toLowerCase().includes('amount') || 
          key.toLowerCase().includes('price') || 
          key.toLowerCase().includes('total') ||
          key.toLowerCase().includes('value')) {
        console.log(`- ${key}: ${sampleDoc[key]}`);
      }
    });
    
    // Check items array if exists
    if (sampleDoc.items && Array.isArray(sampleDoc.items)) {
      console.log('\n📦 Items array structure:');
      console.log('Number of items:', sampleDoc.items.length);
      if (sampleDoc.items.length > 0) {
        console.log('First item fields:', Object.keys(sampleDoc.items[0]));
        console.log('First item:', JSON.stringify(sampleDoc.items[0], null, 2));
      }
    }
    
    // Check for any nested date or amount fields
    console.log('\n🔍 Full document structure (limited depth):');
    console.log(JSON.stringify(sampleDoc, null, 2).substring(0, 2000) + '...');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkSalesOrderFields();
