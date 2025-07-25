const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:oK1He1DJvOhkPNye@cluster0.km4yypv.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';

async function checkChannelField() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collection = db.collection('salesorders');
    
    // Check if channel field exists in documents
    console.log('\n🔍 Checking channel field in sales orders...');
    
    // Count documents with channel field
    const withChannel = await collection.countDocuments({ channel: { $exists: true } });
    const total = await collection.countDocuments({});
    
    console.log(`\n📊 Channel field statistics:`);
    console.log(`- Total documents: ${total}`);
    console.log(`- Documents with channel field: ${withChannel}`);
    console.log(`- Documents without channel field: ${total - withChannel}`);
    
    // Get sample of documents to see structure
    console.log('\n📋 Sample documents:');
    const samples = await collection.find({}).limit(5).toArray();
    
    samples.forEach((doc, index) => {
      console.log(`\nDocument ${index + 1}:`);
      console.log(`- Order Number: ${doc.orderNumber}`);
      console.log(`- Channel: ${doc.channel || 'NOT SET'}`);
      console.log(`- Status: ${doc.status}`);
      console.log(`- Customer: ${doc.customer?.name || 'N/A'}`);
    });
    
    // Check distinct channel values
    const channels = await collection.distinct('channel');
    console.log('\n🏷️ Distinct channel values:', channels);
    
    // If no channel field, let's check what fields exist
    if (withChannel === 0) {
      console.log('\n⚠️ NO DOCUMENTS HAVE CHANNEL FIELD!');
      console.log('This is why Customer Segments aggregation returns empty results.');
      console.log('\nChecking available fields in first document:');
      const firstDoc = await collection.findOne({});
      if (firstDoc) {
        const fields = Object.keys(firstDoc);
        console.log('Fields:', fields.join(', '));
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkChannelField();
