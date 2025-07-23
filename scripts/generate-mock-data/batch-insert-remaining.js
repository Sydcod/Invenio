/**
 * Batch insert remaining reference data
 * This script displays the data in chunks for manual insertion via MCP
 */

const fs = require('fs').promises;
const path = require('path');

async function batchInsertRemaining() {
  const DATA_DIR = path.join(process.cwd(), 'scripts', 'generate-mock-data', 'generated-data');
  
  console.log('🚀 Batch Insert Remaining Reference Data\n');
  
  try {
    // Read all remaining data
    const level2 = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'categories-level2-mcp.json'), 'utf8'));
    const warehouses = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'warehouses-mcp.json'), 'utf8'));
    
    // Split Level 2 categories into chunks of 10
    const chunk1 = level2.slice(0, 10);
    const chunk2 = level2.slice(10, 21);
    
    console.log('📦 Data Chunks Prepared:');
    console.log(`  - Categories Chunk 1: ${chunk1.length} items`);
    console.log(`  - Categories Chunk 2: ${chunk2.length} items`);
    console.log(`  - Warehouses: ${warehouses.length} items`);
    
    // Save chunks for easier insertion
    await fs.writeFile(
      path.join(DATA_DIR, 'insert-chunk1.json'),
      JSON.stringify(chunk1, null, 2)
    );
    await fs.writeFile(
      path.join(DATA_DIR, 'insert-chunk2.json'), 
      JSON.stringify(chunk2, null, 2)
    );
    await fs.writeFile(
      path.join(DATA_DIR, 'insert-warehouses.json'),
      JSON.stringify(warehouses, null, 2)
    );
    
    console.log('\n✅ Chunks saved for insertion!');
    console.log('\n📋 Insertion Order:');
    console.log('1. insert-chunk1.json - First 10 Level 2 categories');
    console.log('2. insert-chunk2.json - Remaining 11 Level 2 categories');
    console.log('3. insert-warehouses.json - All 5 warehouses');
    
    // Display first few items from each chunk
    console.log('\n🔍 Preview - Chunk 1 (first 3):');
    chunk1.slice(0, 3).forEach(item => {
      console.log(`  - ${item.name} (${item._id})`);
    });
    
    console.log('\n🔍 Preview - Chunk 2 (first 3):');
    chunk2.slice(0, 3).forEach(item => {
      console.log(`  - ${item.name} (${item._id})`);
    });
    
    console.log('\n🔍 Preview - Warehouses:');
    warehouses.forEach(item => {
      console.log(`  - ${item.name} (${item._id})`);
    });
    
    return { chunk1, chunk2, warehouses };
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  batchInsertRemaining().catch(console.error);
}

module.exports = { batchInsertRemaining };
