/**
 * Execute Phase 1: Generate and Insert Reference Data
 * This script generates full reference data and saves JSON files
 */

const fs = require('fs').promises;
const path = require('path');
const { generateCategories } = require('./generators/generate-categories-full');
const { generateWarehouses } = require('./generators/generate-warehouses-full');

const DATA_DIR = path.join(process.cwd(), 'scripts', 'generate-mock-data', 'generated-data');

// Ensure data directory exists
async function ensureDirectory() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

async function saveJSON(filename, data) {
  const filepath = path.join(DATA_DIR, filename);
  await fs.writeFile(filepath, JSON.stringify(data, null, 2));
  return filepath;
}

async function executePhase1() {
  console.log('🚀 Starting Phase 1: Reference Data Generation');
  console.log('='.repeat(50));
  
  try {
    await ensureDirectory();
    
    // Generate categories
    console.log('\n📁 Generating Categories...');
    const categories = generateCategories();
    console.log(`  ✓ Generated ${categories.length} categories`);
    const categoriesFile = await saveJSON('categories-full.json', categories);
    console.log(`  ✓ Saved to ${path.basename(categoriesFile)}`);
    
    // Generate warehouses
    console.log('\n🏭 Generating Warehouses...');
    const warehouses = generateWarehouses();
    console.log(`  ✓ Generated ${warehouses.length} warehouses`);
    const warehousesFile = await saveJSON('warehouses-full.json', warehouses);
    console.log(`  ✓ Saved to ${path.basename(warehousesFile)}`);
    
    // Create summary report
    const summary = {
      phase: 'Phase 1 - Reference Data',
      generatedAt: new Date(),
      statistics: {
        categories: {
          total: categories.length,
          byLevel: {
            level0: categories.filter(c => c.level === 0).length,
            level1: categories.filter(c => c.level === 1).length,
            level2: categories.filter(c => c.level === 2).length
          }
        },
        warehouses: {
          total: warehouses.length,
          byType: {
            distribution: warehouses.filter(w => w.type === 'distribution').length,
            retail: warehouses.filter(w => w.type === 'retail').length,
            storage: warehouses.filter(w => w.type === 'storage').length,
            fulfillment: warehouses.filter(w => w.type === 'fulfillment').length,
            boutique: warehouses.filter(w => w.type === 'boutique').length
          }
        }
      },
      files: {
        categories: 'categories-full.json',
        warehouses: 'warehouses-full.json'
      }
    };
    
    await saveJSON('phase1-summary.json', summary);
    
    console.log('\n📊 Summary:');
    console.log(JSON.stringify(summary.statistics, null, 2));
    
    console.log('\n✅ Phase 1 Complete!');
    console.log('\nNext steps:');
    console.log('1. Review the generated JSON files');
    console.log('2. Use MCP server to insert data into MongoDB');
    console.log('3. Proceed to Phase 2: Supplier and Product generation');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

// Run if executed directly
if (require.main === module) {
  executePhase1().catch(console.error);
}
