/**
 * Split Batch 2 Suppliers for Easier Insertion
 */

const fs = require('fs');
const path = require('path');

// Load batch 2 suppliers
const batch2Path = path.join(__dirname, 'generated-data', 'suppliers-batch2-others.json');
const batch2Suppliers = JSON.parse(fs.readFileSync(batch2Path, 'utf8'));

// Output directory
const outputDir = path.join(__dirname, 'generated-data');

// Split into two sub-batches (4 distributors and 6 wholesalers/dropshippers)
const distributors = batch2Suppliers.filter(s => s.type === 'distributor'); // 4
const others = batch2Suppliers.filter(s => s.type !== 'distributor'); // 6 (5 wholesalers + 1 dropshipper)

// Save distributors
fs.writeFileSync(
  path.join(outputDir, 'suppliers-batch2a-distributors.json'),
  JSON.stringify(distributors, null, 2)
);

// Save wholesalers and dropshippers
fs.writeFileSync(
  path.join(outputDir, 'suppliers-batch2b-wholesalers.json'),
  JSON.stringify(others, null, 2)
);

console.log('\n✅ Batch 2 Split Complete!\n');
console.log('Batch 2a (Distributors):');
console.log(`- File: suppliers-batch2a-distributors.json`);
console.log(`- Count: ${distributors.length} documents`);
console.log(`- Suppliers: ${distributors.map(s => s.code).join(', ')}\n`);

console.log('Batch 2b (Wholesalers & Dropshippers):');
console.log(`- File: suppliers-batch2b-wholesalers.json`);
console.log(`- Count: ${others.length} documents`);
console.log(`- Suppliers: ${others.map(s => s.code).join(', ')}`);
