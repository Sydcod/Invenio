/**
 * Final insertion script - reads and displays remaining data to insert
 */

const fs = require('fs').promises;
const path = require('path');

async function executeFinalInserts() {
  const DATA_DIR = path.join(process.cwd(), 'scripts', 'generate-mock-data', 'generated-data');
  
  console.log('📤 Executing final data insertions...\n');
  
  try {
    // Read Level 2 categories
    const level2 = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'categories-level2-mcp.json'), 'utf8'));
    console.log(`✓ Loaded ${level2.length} Level 2 categories`);
    
    // Read warehouses
    const warehouses = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'warehouses-mcp.json'), 'utf8'));
    console.log(`✓ Loaded ${warehouses.length} warehouses`);
    
    // Display some sample data to verify
    console.log('\n📋 Sample Level 2 Categories:');
    level2.slice(0, 3).forEach(cat => {
      console.log(`  - ${cat.name} (${cat.slug}) - Parent: ${cat.parentId}`);
    });
    
    console.log('\n🏭 Warehouses to Insert:');
    warehouses.forEach(wh => {
      console.log(`  - ${wh.name} (${wh.code}) - Type: ${wh.type}`);
    });
    
    console.log('\n✅ Data ready for insertion!');
    console.log('\nTotal items to insert:');
    console.log(`  - Level 2 Categories: ${level2.length}`);
    console.log(`  - Warehouses: ${warehouses.length}`);
    
    // Return data for programmatic use
    return { level2, warehouses };
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  executeFinalInserts().catch(console.error);
}

module.exports = { executeFinalInserts };
