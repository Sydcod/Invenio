const { MongoClient, ObjectId } = require('mongodb');

async function testCategories() {
  const uri = 'mongodb+srv://sydcod:pYO9DzSEKiRzxLfy@cluster0.u5xlf.mongodb.net/invenio?retryWrites=true&w=majority';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas');
    
    const db = client.db('invenio');
    const categories = await db.collection('categories').find({}).toArray();
    
    console.log('\n=== RAW CATEGORY DATA ===');
    console.log('Total categories:', categories.length);
    
    // Show first few categories raw
    console.log('\nFirst 3 categories (raw):');
    categories.slice(0, 3).forEach(cat => {
      console.log(`\n${cat.name}:`);
      console.log('  _id:', cat._id);
      console.log('  _id type:', typeof cat._id);
      console.log('  _id toString:', cat._id.toString());
      console.log('  parentId:', cat.parentId);
      console.log('  parentId type:', typeof cat.parentId);
      if (cat.parentId) {
        console.log('  parentId toString:', cat.parentId.toString());
      }
    });
    
    // Build hierarchy the simple way
    console.log('\n\n=== BUILDING HIERARCHY ===');
    const categoryMap = new Map();
    const rootCategories = [];
    
    // First pass: add all to map with string IDs
    categories.forEach(cat => {
      const catData = {
        ...cat,
        _id: cat._id.toString(),
        parentId: cat.parentId ? cat.parentId.toString() : null,
        children: []
      };
      categoryMap.set(catData._id, catData);
    });
    
    console.log('\nCategory map size:', categoryMap.size);
    
    // Second pass: build tree
    categoryMap.forEach(cat => {
      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId);
        if (parent) {
          parent.children.push(cat);
          console.log(`Added "${cat.name}" as child of "${parent.name}"`);
        } else {
          console.log(`ERROR: Parent not found for "${cat.name}", parentId: ${cat.parentId}`);
        }
      } else {
        rootCategories.push(cat);
        console.log(`"${cat.name}" is a root category`);
      }
    });
    
    // Show results
    console.log('\n\n=== HIERARCHY RESULTS ===');
    console.log('Root categories:', rootCategories.length);
    rootCategories.forEach(root => {
      console.log(`\n${root.name} (${root.children.length} children):`);
      root.children.forEach(child => {
        console.log(`  - ${child.name} (${child.children.length} children)`);
        child.children.forEach(grandchild => {
          console.log(`    - ${grandchild.name}`);
        });
      });
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

testCategories();
