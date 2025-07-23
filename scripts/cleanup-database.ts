/**
 * Database Cleanup Script - Phase 0
 * Removes obsolete organizationId indexes and sample collections
 */

interface CleanupTask {
  collection: string;
  indexesToDrop: string[];
  description: string;
}

const cleanupTasks: CleanupTask[] = [
  {
    collection: 'categories',
    indexesToDrop: [
      'organizationId_1',
      'organizationId_1_parentId_1',
      'organizationId_1_path_1',
      'organizationId_1_name_1',
      'organizationId_1_seo.slug_1',
      'organizationId_1_isActive_1_sortOrder_1'
    ],
    description: 'Categories collection organizationId indexes'
  },
  {
    collection: 'products',
    indexesToDrop: [
      'organizationId_1',
      'organizationId_1_sku_1',
      'organizationId_1_status_1_name_1',
      'organizationId_1_category.id_1',
      'organizationId_1_brand_1',
      'organizationId_1_barcode_1',
      'organizationId_1_upc_1',
      'organizationId_1_inventory.currentStock_1',
      'organizationId_1_inventory.reorderPoint_1',
      'organizationId_1_tags_1'
    ],
    description: 'Products collection organizationId indexes'
  },
  {
    collection: 'warehouses',
    indexesToDrop: [
      'organizationId_1',
      'organizationId_1_code_1',
      'organizationId_1_status_1_type_1',
      'organizationId_1_settings.isDefault_1',
      'organizationId_1_address.city_1_address.country_1',
      'organizationId_1_tags_1'
    ],
    description: 'Warehouses collection organizationId indexes'
  },
  {
    collection: 'purchaseorders',
    indexesToDrop: [
      'organizationId_1',
      'organizationId_1_orderNumber_1',
      'organizationId_1_status_1_dates.orderDate_-1',
      'organizationId_1_supplierId_1_status_1',
      'organizationId_1_warehouseId_1',
      'organizationId_1_payment.status_1',
      'organizationId_1_dates.expectedDelivery_1',
      'organizationId_1_items.productId_1'
    ],
    description: 'Purchase Orders collection organizationId indexes'
  }
];

const sampleCollections = [
  'categories_sample',
  'warehouses_sample',
  'suppliers_sample',
  'products_sample',
  'salesorders_sample',
  'purchaseorders_sample'
];

// Log cleanup plan
console.log('=== Database Cleanup Plan ===\n');

console.log('1. Indexes to Drop:');
let totalIndexes = 0;
cleanupTasks.forEach(task => {
  console.log(`\n${task.collection}:`);
  task.indexesToDrop.forEach(index => {
    console.log(`  - ${index}`);
    totalIndexes++;
  });
});
console.log(`\nTotal indexes to drop: ${totalIndexes}`);

console.log('\n2. Sample Collections to Drop:');
sampleCollections.forEach(col => {
  console.log(`  - ${col}`);
});

console.log('\n=== End of Cleanup Plan ===');
console.log('\nThis script is for documentation. Use MCP tools to execute the cleanup.');

export { cleanupTasks, sampleCollections };
