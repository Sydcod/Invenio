/**
 * Script to load all reference data files and display them for MCP insertion
 */

const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'scripts', 'generate-mock-data', 'generated-data');

async function loadAndDisplayData() {
  console.log('📂 Loading reference data for insertion...\n');
  
  try {
    // Load all MCP-ready files
    const level1 = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'categories-level1-mcp.json'), 'utf8'));
    const level2 = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'categories-level2-mcp.json'), 'utf8'));
    const warehouses = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'warehouses-mcp.json'), 'utf8'));
    
    console.log('📋 Data Summary:');
    console.log(`  - Level 1 Categories: ${level1.length} items`);
    console.log(`  - Level 2 Categories: ${level2.length} items`);
    console.log(`  - Warehouses: ${warehouses.length} items`);
    
    console.log('\n✅ Data loaded successfully!');
    console.log('\nUse the MCP MongoDB server to insert this data:');
    console.log('1. Categories Level 1 (10 items) - already have parent reference');
    console.log('2. Categories Level 2 (21 items) - already have parent references');
    console.log('3. Warehouses (5 items)');
    
    // Return data for programmatic use
    return {
      categories: {
        level1,
        level2
      },
      warehouses
    };
    
  } catch (error) {
    console.error('❌ Error loading data:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  loadAndDisplayData().catch(console.error);
}

module.exports = { loadAndDisplayData };
