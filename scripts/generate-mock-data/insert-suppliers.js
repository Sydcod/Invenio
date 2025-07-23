/**
 * Supplier Insertion Script
 * Splits suppliers into batches for easier MCP insertion
 */

const fs = require('fs');
const path = require('path');

// Load the MCP-ready suppliers
const suppliersPath = path.join(__dirname, 'generated-data', 'suppliers-mcp-ready.json');
const suppliers = JSON.parse(fs.readFileSync(suppliersPath, 'utf8'));

// Output directory
const outputDir = path.join(__dirname, 'generated-data');

// Split suppliers by type for organized insertion
const manufacturerSuppliers = suppliers.filter(s => s.type === 'manufacturer');
const distributorSuppliers = suppliers.filter(s => s.type === 'distributor');
const wholesalerSuppliers = suppliers.filter(s => s.type === 'wholesaler');
const dropshipperSuppliers = suppliers.filter(s => s.type === 'dropshipper');

// Save to separate files for batch insertion
const batch1 = [...manufacturerSuppliers]; // 8 manufacturers
const batch2 = [...distributorSuppliers, ...wholesalerSuppliers, ...dropshipperSuppliers]; // 4 distributors + 5 wholesalers + 1 dropshipper = 10

// Save batch 1
fs.writeFileSync(
  path.join(outputDir, 'suppliers-batch1-manufacturers.json'),
  JSON.stringify(batch1, null, 2)
);

// Save batch 2
fs.writeFileSync(
  path.join(outputDir, 'suppliers-batch2-others.json'),
  JSON.stringify(batch2, null, 2)
);

// Create insertion summary
const insertionSummary = {
  timestamp: new Date().toISOString(),
  totalSuppliers: suppliers.length,
  batch1: {
    filename: 'suppliers-batch1-manufacturers.json',
    count: batch1.length,
    types: ['manufacturer'],
    suppliers: batch1.map(s => `${s.code} - ${s.name}`)
  },
  batch2: {
    filename: 'suppliers-batch2-others.json',
    count: batch2.length,
    types: ['distributor', 'wholesaler', 'dropshipper'],
    suppliers: batch2.map(s => `${s.code} - ${s.name}`)
  },
  insertionOrder: [
    'Run MongoDB insert-many with suppliers-batch1-manufacturers.json to suppliers collection',
    'Run MongoDB insert-many with suppliers-batch2-others.json to suppliers collection'
  ]
};

// Save summary
fs.writeFileSync(
  path.join(outputDir, 'suppliers-insertion-summary.json'),
  JSON.stringify(insertionSummary, null, 2)
);

// Print results
console.log('\n✅ Supplier Data Prepared for Insertion!\n');
console.log('Batch 1 (Manufacturers):');
console.log(`- File: suppliers-batch1-manufacturers.json`);
console.log(`- Count: ${batch1.length} documents`);
console.log(`- Suppliers: ${batch1.map(s => s.code).join(', ')}\n`);

console.log('Batch 2 (Distributors, Wholesalers, Dropshippers):');
console.log(`- File: suppliers-batch2-others.json`);
console.log(`- Count: ${batch2.length} documents`);
console.log(`- Suppliers: ${batch2.map(s => s.code).join(', ')}\n`);

console.log('Preview of first supplier from each batch:');
console.log('\nBatch 1 sample:', JSON.stringify({
  _id: batch1[0]._id,
  code: batch1[0].code,
  name: batch1[0].name,
  type: batch1[0].type,
  creditLimit: batch1[0].financial.creditLimit
}, null, 2));

console.log('\nBatch 2 sample:', JSON.stringify({
  _id: batch2[0]._id,
  code: batch2[0].code,
  name: batch2[0].name,
  type: batch2[0].type,
  creditLimit: batch2[0].financial.creditLimit
}, null, 2));
