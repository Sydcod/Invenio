/**
 * Reference Data Generator
 * Generates categories, warehouses, and suppliers for Phase 1
 */

const { mkdir, writeFile } = require('fs/promises');
const { join } = require('path');
const { Types } = require('mongoose');

// We'll include the generator functions inline for now
// to avoid module resolution issues

const OUTPUT_DIR = join(process.cwd(), 'scripts', 'generate-mock-data', 'generated-data');

async function ensureOutputDir() {
  try {
    await mkdir(OUTPUT_DIR, { recursive: true });
    console.log(`✓ Output directory created: ${OUTPUT_DIR}`);
  } catch (error) {
    console.error('Error creating output directory:', error);
  }
}

async function saveJSON(data, filename) {
  const filepath = join(OUTPUT_DIR, filename);
  await writeFile(filepath, JSON.stringify(data, null, 2));
  console.log(`✓ Saved ${filename} (${data.length} items)`);
  return filepath;
}

async function generateSampleData() {
  console.log('🚀 Starting Reference Data Generation (Phase 1)');
  console.log('='.repeat(50));
  
  await ensureOutputDir();

  // Generate Categories
  console.log('\n📁 Generating Categories...');
  const categories = generateCategories();
  console.log(`  Generated ${categories.length} categories`);
  console.log(`  - Root: ${categories.filter(c => c.level === 0).length}`);
  console.log(`  - Subcategories: ${categories.filter(c => c.level === 1).length}`);
  console.log(`  - Leaf categories: ${categories.filter(c => c.level === 2).length}`);
  
  // Generate Warehouses
  console.log('\n🏭 Generating Warehouses...');
  const warehouses = generateWarehouses();
  console.log(`  Generated ${warehouses.length} warehouses`);
  warehouses.forEach(wh => {
    console.log(`  - ${wh.name} (${wh.type}) - ${wh.address.city}, FL`);
  });
  
  // Generate Suppliers
  console.log('\n🚚 Generating Suppliers...');
  const suppliers = generateSuppliers();
  console.log(`  Generated ${suppliers.length} suppliers`);
  console.log(`  - Manufacturers: ${suppliers.filter(s => s.type === 'manufacturer').length}`);
  console.log(`  - Distributors: ${suppliers.filter(s => s.type === 'distributor').length}`);
  console.log(`  - Wholesalers: ${suppliers.filter(s => s.type === 'wholesaler').length}`);

  // Save to JSON files
  console.log('\n💾 Saving JSON files...');
  await saveJSON(categories, 'categories.json');
  await saveJSON(warehouses, 'warehouses.json');
  await saveJSON(suppliers, 'suppliers.json');

  // Create summary report
  const summary = {
    generated: new Date().toISOString(),
    counts: {
      categories: {
        total: categories.length,
        root: categories.filter(c => c.level === 0).length,
        subcategories: categories.filter(c => c.level === 1).length,
        leafCategories: categories.filter(c => c.level === 2).length
      },
      warehouses: {
        total: warehouses.length,
        distribution: warehouses.filter(w => w.type === 'distribution').length,
        retail: warehouses.filter(w => w.type === 'retail').length,
        storage: warehouses.filter(w => w.type === 'storage').length,
        fulfillment: warehouses.filter(w => w.type === 'fulfillment').length
      },
      suppliers: {
        total: suppliers.length,
        manufacturers: suppliers.filter(s => s.type === 'manufacturer').length,
        distributors: suppliers.filter(s => s.type === 'distributor').length,
        wholesalers: suppliers.filter(s => s.type === 'wholesaler').length,
        preferred: suppliers.filter(s => s.isPreferred).length
      }
    },
    samples: {
      category: categories[1], // Show a subcategory as sample
      warehouse: warehouses[0], // Show main distribution center
      supplier: suppliers[0] // Show Apple as sample
    }
  };

  await saveJSON(summary, 'phase1-summary.json');

  console.log('\n✅ Phase 1 Reference Data Generation Complete!');
  console.log('='.repeat(50));
  console.log('\nNext steps:');
  console.log('1. Review the generated JSON files in:', OUTPUT_DIR);
  console.log('2. Run the insertion script to add data to MongoDB via MCP server');
  console.log('3. Proceed to Phase 2: Product Data Generation');
}

// Run if executed directly
if (require.main === module) {
  generateSampleData().catch(console.error);
}
