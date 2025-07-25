const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:oK1He1DJvOhkPNye@cluster0.km4yypv.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';

async function checkSalesOrderStructure() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collection = db.collection('salesorders');
    
    // Get a sample document
    const sampleDoc = await collection.findOne({});
    
    console.log('\n📄 Sample Sales Order Document:');
    console.log(JSON.stringify(sampleDoc, null, 2));
    
    // Check field names in all documents
    const fieldAnalysis = await collection.aggregate([
      { $limit: 10 },
      {
        $project: {
          fields: { $objectToArray: '$$ROOT' }
        }
      },
      { $unwind: '$fields' },
      {
        $group: {
          _id: '$fields.k',
          count: { $sum: 1 },
          sampleValue: { $first: '$fields.v' }
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray();
    
    console.log('\n🔍 Field Analysis (from 10 documents):');
    fieldAnalysis.forEach(field => {
      const valueType = typeof field.sampleValue;
      const value = valueType === 'object' ? JSON.stringify(field.sampleValue) : field.sampleValue;
      console.log(`- ${field._id}: appears in ${field.count} docs, sample value: ${value} (${valueType})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkSalesOrderStructure();
