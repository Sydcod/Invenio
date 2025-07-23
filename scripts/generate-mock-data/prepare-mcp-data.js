/**
 * Prepare data for MCP insertion
 * Loads the full JSON files and prepares them for MCP server insertion
 */

const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'scripts', 'generate-mock-data', 'generated-data');

async function loadJSON(filename) {
  const filepath = path.join(DATA_DIR, filename);
  const content = await fs.readFile(filepath, 'utf8');
  return JSON.parse(content);
}

async function prepareData() {
  console.log('📦 Preparing data for MCP insertion...');
  
  try {
    // Load full data
    const categories = await loadJSON('categories-full.json');
    const warehouses = await loadJSON('warehouses-full.json');
    
    // Convert ObjectIds from MongoDB format to strings
    const convertObjectIds = (doc) => {
      const converted = {};
      Object.entries(doc).forEach(([key, value]) => {
        if (value && typeof value === 'object') {
          if (value.$oid) {
            converted[key] = value.$oid;
          } else if (Array.isArray(value)) {
            converted[key] = value.map(item => 
              typeof item === 'object' ? convertObjectIds(item) : item
            );
          } else if (value instanceof Date || (value && value.$date)) {
            converted[key] = value;
          } else {
            converted[key] = convertObjectIds(value);
          }
        } else {
          converted[key] = value;
        }
      });
      return converted;
    };
    
    // Convert all documents
    const categoriesReady = categories.map(convertObjectIds);
    const warehousesReady = warehouses.map(convertObjectIds);
    
    // Save MCP-ready files (smaller chunks for easier insertion)
    // Split categories by level for easier insertion
    const level0 = categoriesReady.filter(c => c.level === 0);
    const level1 = categoriesReady.filter(c => c.level === 1);
    const level2 = categoriesReady.filter(c => c.level === 2);
    
    await fs.writeFile(
      path.join(DATA_DIR, 'categories-level0-mcp.json'),
      JSON.stringify(level0, null, 2)
    );
    await fs.writeFile(
      path.join(DATA_DIR, 'categories-level1-mcp.json'),
      JSON.stringify(level1, null, 2)
    );
    await fs.writeFile(
      path.join(DATA_DIR, 'categories-level2-mcp.json'),
      JSON.stringify(level2, null, 2)
    );
    await fs.writeFile(
      path.join(DATA_DIR, 'warehouses-mcp.json'),
      JSON.stringify(warehousesReady, null, 2)
    );
    
    console.log('\n✅ Data prepared for MCP insertion!');
    console.log('\nFiles created:');
    console.log(`  - categories-level0-mcp.json (${level0.length} items)`);
    console.log(`  - categories-level1-mcp.json (${level1.length} items)`);
    console.log(`  - categories-level2-mcp.json (${level2.length} items)`);
    console.log(`  - warehouses-mcp.json (${warehousesReady.length} items)`);
    
    console.log('\n📋 Summary:');
    console.log(`Total categories: ${categoriesReady.length}`);
    console.log(`Total warehouses: ${warehousesReady.length}`);
    
    return {
      categories: {
        level0,
        level1,
        level2
      },
      warehouses: warehousesReady
    };
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Export for use in other scripts
module.exports = { prepareData };

// Run if executed directly
if (require.main === module) {
  prepareData().catch(console.error);
}
