const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:oK1He1DJvOhkPNye@cluster0.km4yypv.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';

async function checkDatesObject() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collection = db.collection('salesorders');
    
    // Get multiple documents to check dates structure
    const docs = await collection.find({}).limit(5).toArray();
    
    console.log('\n📅 Dates Object Structure:');
    docs.forEach((doc, index) => {
      console.log(`\nOrder ${index + 1} (${doc.orderNumber}):`);
      console.log('dates:', JSON.stringify(doc.dates, null, 2));
      
      // Calculate total from items
      if (doc.items && Array.isArray(doc.items)) {
        const orderTotal = doc.items.reduce((sum, item) => sum + (item.total || 0), 0);
        console.log('Calculated total from items:', orderTotal.toFixed(2));
      }
    });
    
    // Check if dates.ordered exists in all documents
    const docsWithOrderedDate = await collection.countDocuments({ 'dates.ordered': { $exists: true } });
    const totalDocs = await collection.countDocuments();
    
    console.log(`\n📊 Date field statistics:`);
    console.log(`Documents with dates.ordered: ${docsWithOrderedDate}/${totalDocs}`);
    
    // Get date range using dates.ordered
    const dateRange = await collection.aggregate([
      { $match: { 'dates.ordered': { $exists: true } } },
      {
        $group: {
          _id: null,
          minDate: { $min: '$dates.ordered' },
          maxDate: { $max: '$dates.ordered' },
          count: { $sum: 1 }
        }
      }
    ]).toArray();
    
    if (dateRange.length > 0) {
      console.log('\n📅 Order Date Range (dates.ordered):');
      console.log('Earliest order:', dateRange[0].minDate);
      console.log('Latest order:', dateRange[0].maxDate);
      console.log('Orders with dates.ordered:', dateRange[0].count);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkDatesObject();
