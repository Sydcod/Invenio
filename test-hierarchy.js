const { MongoClient } = require('mongodb');

async function testHierarchy() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('invenio');
    const categories = await db.collection('categories').find({}).toArray();
    
    console.log('Total categories:', categories.length);
    
    // Build hierarchy
    const categoryMap = new Map();
    const rootCategories = [];
    
    // First pass: create all categories in map
    categories.forEach(cat => {
      categoryMap.set(cat._id.toString(), {
        ...cat,
        _id: cat._id.toString(),
        parentId: cat.parentId ? cat.parentId.toString() : null,
        children: []
      });
    });
    
    console.log('\nCategory Map size:', categoryMap.size);
    
    // Debug: log all categories with their IDs
    console.log('\nAll categories:');
    categoryMap.forEach((cat, id) => {
      console.log(`${cat.name} - ID: ${id}, ParentID: ${cat.parentId}, Level: ${cat.level}`);
    });
    
    // Second pass: build tree structure
    categoryMap.forEach(cat => {
      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId);
        if (parent) {
          parent.children.push(cat);
          console.log(`\nAdded ${cat.name} as child of ${parent.name}`);
        } else {
          console.log(`\nWARNING: Parent not found for ${cat.name}, parentId: ${cat.parentId}`);
        }
      } else {
        rootCategories.push(cat);
      }
    });
    
    console.log('\n\nRoot categories:', rootCategories.map(c => c.name));
    console.log('\nElectronics children:', rootCategories[0]?.children?.map(c => c.name));
    console.log('\nComputers & Tablets children:', rootCategories[0]?.children?.find(c => c.name === 'Computers & Tablets')?.children?.map(c => c.name));
    
    // Output the final tree structure
    console.log('\n\nFinal Tree Structure:');
    function printTree(cat, level = 0) {
      const indent = '  '.repeat(level);
      console.log(`${indent}${cat.name} (Level ${cat.level}, ${cat.children.length} children)`);
      cat.children.forEach(child => printTree(child, level + 1));
    }
    
    rootCategories.forEach(root => printTree(root));
    
  } finally {
    await client.close();
  }
}

testHierarchy()
  .then(() => console.log('\nDone!'))
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
