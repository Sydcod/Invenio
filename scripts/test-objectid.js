const { MongoClient, ObjectId } = require('mongodb');

async function testObjectId() {
  const client = new MongoClient('mongodb+srv://cluster0.u5xlf.mongodb.net/', {
    auth: {
      username: 'sydcod',
      password: 'pYO9DzSEKiRzxLfy'
    }
  });
  
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas');
    
    const db = client.db('invenio');
    const categories = await db.collection('categories').find({}).toArray();
    
    console.log('\nFirst category raw data:');
    console.log(JSON.stringify(categories[0], null, 2));
    
    console.log('\n\nChecking parentId types:');
    categories.forEach(cat => {
      if (cat.parentId) {
        console.log(`${cat.name}:`);
        console.log(`  - parentId type: ${typeof cat.parentId}`);
        console.log(`  - parentId value: ${JSON.stringify(cat.parentId)}`);
        console.log(`  - Is ObjectId? ${cat.parentId instanceof ObjectId}`);
        console.log(`  - parentId.toString(): ${cat.parentId.toString()}`);
      }
    });
    
    console.log('\n\nChecking _id types:');
    categories.slice(0, 3).forEach(cat => {
      console.log(`${cat.name}:`);
      console.log(`  - _id type: ${typeof cat._id}`);
      console.log(`  - _id value: ${JSON.stringify(cat._id)}`);
      console.log(`  - Is ObjectId? ${cat._id instanceof ObjectId}`);
      console.log(`  - _id.toString(): ${cat._id.toString()}`);
    });
    
    // Test building hierarchy
    console.log('\n\nBuilding test hierarchy:');
    const categoryMap = new Map();
    const rootCategories = [];
    
    // First pass
    categories.forEach(cat => {
      const id = cat._id.toString();
      categoryMap.set(id, {
        ...cat,
        _id: id,
        parentId: cat.parentId ? cat.parentId.toString() : null,
        children: []
      });
      console.log(`Added to map: ${cat.name} with ID ${id}`);
    });
    
    // Second pass
    categoryMap.forEach(cat => {
      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId);
        if (parent) {
          parent.children.push(cat);
          console.log(`Added ${cat.name} as child of ${parent.name}`);
        } else {
          console.log(`Parent not found for ${cat.name}, parentId: ${cat.parentId}`);
        }
      } else {
        rootCategories.push(cat);
      }
    });
    
    console.log('\n\nRoot categories:', rootCategories.map(c => c.name));
    rootCategories.forEach(root => {
      console.log(`\n${root.name} has ${root.children.length} children:`);
      root.children.forEach(child => {
        console.log(`  - ${child.name} (has ${child.children.length} children)`);
      });
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

testObjectId();
