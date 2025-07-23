/**
 * Insert Reference Data into MongoDB using MCP Server
 * This script reads the generated JSON files and inserts them into MongoDB
 */

const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'scripts', 'generate-mock-data', 'generated-data');

async function loadJSON(filename) {
  const filepath = path.join(DATA_DIR, filename);
  const content = await fs.readFile(filepath, 'utf8');
  return JSON.parse(content);
}

async function insertData() {
  console.log('🚀 Starting Reference Data Insertion via MCP Server');
  console.log('='.repeat(50));
  
  try {
    // Load the generated data
    console.log('\n📁 Loading generated JSON files...');
    const categories = await loadJSON('categories-sample.json');
    const warehouses = await loadJSON('warehouses-sample.json');
    const suppliers = await loadJSON('suppliers-sample.json');
    
    console.log(`  ✓ Loaded ${categories.length} categories`);
    console.log(`  ✓ Loaded ${warehouses.length} warehouses`);
    console.log(`  ✓ Loaded ${suppliers.length} suppliers`);
    
    // Convert MongoDB Extended JSON format to regular format
    const convertDoc = (doc) => {
      const converted = { ...doc };
      if (doc._id && doc._id.$oid) {
        converted._id = doc._id.$oid;
      }
      // Convert any nested ObjectId references
      Object.keys(converted).forEach(key => {
        if (converted[key] && converted[key].$oid) {
          converted[key] = converted[key].$oid;
        }
      });
      return converted;
    };
    
    // Convert all documents
    const categoriesDocs = categories.map(convertDoc);
    const warehousesDocs = warehouses.map(convertDoc);
    const suppliersDocs = suppliers.map(convertDoc);
    
    console.log('\n📤 Inserting data via MCP server...');
    console.log('\nNOTE: Please use the MCP MongoDB server to insert this data:');
    console.log('1. Insert categories into "categories" collection');
    console.log('2. Insert warehouses into "warehouses" collection');
    console.log('3. Insert suppliers into "suppliers" collection');
    
    // Save converted documents for MCP insertion
    await fs.writeFile(
      path.join(DATA_DIR, 'categories-mcp-ready.json'),
      JSON.stringify(categoriesDocs, null, 2)
    );
    await fs.writeFile(
      path.join(DATA_DIR, 'warehouses-mcp-ready.json'),
      JSON.stringify(warehousesDocs, null, 2)
    );
    await fs.writeFile(
      path.join(DATA_DIR, 'suppliers-mcp-ready.json'),
      JSON.stringify(suppliersDocs, null, 2)
    );
    
    console.log('\n✅ MCP-ready files created!');
    console.log(`  ✓ categories-mcp-ready.json`);
    console.log(`  ✓ warehouses-mcp-ready.json`);
    console.log(`  ✓ suppliers-mcp-ready.json`);
    
    console.log('\n📋 Sample MCP Commands:');
    console.log('mcp0_insert-many database:"test" collection:"categories" documents:[...categories data...]');
    console.log('mcp0_insert-many database:"test" collection:"warehouses" documents:[...warehouses data...]');
    console.log('mcp0_insert-many database:"test" collection:"suppliers" documents:[...suppliers data...]');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run if executed directly
if (require.main === module) {
  insertData().catch(console.error);
}
