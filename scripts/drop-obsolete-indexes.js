/**
 * MongoDB Shell Script to Drop Obsolete organizationId Indexes
 * Run this script using: mongosh "your-connection-string" --file drop-obsolete-indexes.js
 */

// Switch to test database
use('test');

print('=== Starting Index Cleanup ===\n');

// Categories Collection
print('Dropping indexes from categories collection...');
try {
  db.categories.dropIndex('organizationId_1');
  db.categories.dropIndex('organizationId_1_parentId_1');
  db.categories.dropIndex('organizationId_1_path_1');
  db.categories.dropIndex('organizationId_1_name_1');
  db.categories.dropIndex('organizationId_1_seo.slug_1');
  db.categories.dropIndex('organizationId_1_isActive_1_sortOrder_1');
  print('✓ Dropped 6 indexes from categories');
} catch (e) {
  print('✗ Error dropping categories indexes: ' + e.message);
}

// Products Collection
print('\nDropping indexes from products collection...');
try {
  db.products.dropIndex('organizationId_1');
  db.products.dropIndex('organizationId_1_sku_1');
  db.products.dropIndex('organizationId_1_status_1_name_1');
  db.products.dropIndex('organizationId_1_category.id_1');
  db.products.dropIndex('organizationId_1_brand_1');
  db.products.dropIndex('organizationId_1_barcode_1');
  db.products.dropIndex('organizationId_1_upc_1');
  db.products.dropIndex('organizationId_1_inventory.currentStock_1');
  db.products.dropIndex('organizationId_1_inventory.reorderPoint_1');
  db.products.dropIndex('organizationId_1_tags_1');
  print('✓ Dropped 10 indexes from products');
} catch (e) {
  print('✗ Error dropping products indexes: ' + e.message);
}

// Warehouses Collection
print('\nDropping indexes from warehouses collection...');
try {
  db.warehouses.dropIndex('organizationId_1');
  db.warehouses.dropIndex('organizationId_1_code_1');
  db.warehouses.dropIndex('organizationId_1_status_1_type_1');
  db.warehouses.dropIndex('organizationId_1_settings.isDefault_1');
  db.warehouses.dropIndex('organizationId_1_address.city_1_address.country_1');
  db.warehouses.dropIndex('organizationId_1_tags_1');
  print('✓ Dropped 6 indexes from warehouses');
} catch (e) {
  print('✗ Error dropping warehouses indexes: ' + e.message);
}

// Purchase Orders Collection
print('\nDropping indexes from purchaseorders collection...');
try {
  db.purchaseorders.dropIndex('organizationId_1');
  db.purchaseorders.dropIndex('organizationId_1_orderNumber_1');
  db.purchaseorders.dropIndex('organizationId_1_status_1_dates.orderDate_-1');
  db.purchaseorders.dropIndex('organizationId_1_supplierId_1_status_1');
  db.purchaseorders.dropIndex('organizationId_1_warehouseId_1');
  db.purchaseorders.dropIndex('organizationId_1_payment.status_1');
  db.purchaseorders.dropIndex('organizationId_1_dates.expectedDelivery_1');
  db.purchaseorders.dropIndex('organizationId_1_items.productId_1');
  print('✓ Dropped 8 indexes from purchaseorders');
} catch (e) {
  print('✗ Error dropping purchaseorders indexes: ' + e.message);
}

print('\n=== Index Cleanup Complete ===');

// Verify remaining indexes
print('\nRemaining indexes per collection:');
print('Categories: ' + db.categories.getIndexes().length + ' indexes');
print('Products: ' + db.products.getIndexes().length + ' indexes');
print('Warehouses: ' + db.warehouses.getIndexes().length + ' indexes');
print('Purchase Orders: ' + db.purchaseorders.getIndexes().length + ' indexes');
print('Sales Orders: ' + db.salesorders.getIndexes().length + ' indexes');
print('Suppliers: ' + db.suppliers.getIndexes().length + ' indexes');
