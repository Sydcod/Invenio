/**
 * Node.js script to drop obsolete organizationId indexes
 * Run with: node scripts/drop-indexes.js
 */

const { MongoClient } = require('mongodb');

// Get connection string from environment or use default
const connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';

async function dropIndexes() {
  const client = new MongoClient(connectionString);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('test');
    console.log('\n=== Starting Index Cleanup ===\n');
    
    let totalDropped = 0;
    
    // Categories Collection
    console.log('Dropping indexes from categories collection...');
    const categoriesToDrop = [
      'organizationId_1',
      'organizationId_1_parentId_1',
      'organizationId_1_path_1',
      'organizationId_1_name_1',
      'organizationId_1_seo.slug_1',
      'organizationId_1_isActive_1_sortOrder_1'
    ];
    
    for (const indexName of categoriesToDrop) {
      try {
        await db.collection('categories').dropIndex(indexName);
        console.log(`  ✓ Dropped ${indexName}`);
        totalDropped++;
      } catch (error) {
        if (error.code === 27) {
          console.log(`  - ${indexName} not found (already dropped)`);
        } else {
          console.log(`  ✗ Error dropping ${indexName}: ${error.message}`);
        }
      }
    }
    
    // Products Collection
    console.log('\nDropping indexes from products collection...');
    const productsToDrop = [
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
    ];
    
    for (const indexName of productsToDrop) {
      try {
        await db.collection('products').dropIndex(indexName);
        console.log(`  ✓ Dropped ${indexName}`);
        totalDropped++;
      } catch (error) {
        if (error.code === 27) {
          console.log(`  - ${indexName} not found (already dropped)`);
        } else {
          console.log(`  ✗ Error dropping ${indexName}: ${error.message}`);
        }
      }
    }
    
    // Warehouses Collection
    console.log('\nDropping indexes from warehouses collection...');
    const warehousesToDrop = [
      'organizationId_1',
      'organizationId_1_code_1',
      'organizationId_1_status_1_type_1',
      'organizationId_1_settings.isDefault_1',
      'organizationId_1_address.city_1_address.country_1',
      'organizationId_1_tags_1'
    ];
    
    for (const indexName of warehousesToDrop) {
      try {
        await db.collection('warehouses').dropIndex(indexName);
        console.log(`  ✓ Dropped ${indexName}`);
        totalDropped++;
      } catch (error) {
        if (error.code === 27) {
          console.log(`  - ${indexName} not found (already dropped)`);
        } else {
          console.log(`  ✗ Error dropping ${indexName}: ${error.message}`);
        }
      }
    }
    
    // Purchase Orders Collection
    console.log('\nDropping indexes from purchaseorders collection...');
    const purchaseOrdersToDrop = [
      'organizationId_1',
      'organizationId_1_orderNumber_1',
      'organizationId_1_status_1_dates.orderDate_-1',
      'organizationId_1_supplierId_1_status_1',
      'organizationId_1_warehouseId_1',
      'organizationId_1_payment.status_1',
      'organizationId_1_dates.expectedDelivery_1',
      'organizationId_1_items.productId_1'
    ];
    
    for (const indexName of purchaseOrdersToDrop) {
      try {
        await db.collection('purchaseorders').dropIndex(indexName);
        console.log(`  ✓ Dropped ${indexName}`);
        totalDropped++;
      } catch (error) {
        if (error.code === 27) {
          console.log(`  - ${indexName} not found (already dropped)`);
        } else {
          console.log(`  ✗ Error dropping ${indexName}: ${error.message}`);
        }
      }
    }
    
    console.log(`\n=== Index Cleanup Complete ===`);
    console.log(`Total indexes dropped: ${totalDropped}`);
    
    // Show remaining indexes
    console.log('\nRemaining indexes per collection:');
    const collections = ['categories', 'products', 'warehouses', 'purchaseorders', 'salesorders', 'suppliers'];
    
    for (const collName of collections) {
      const indexes = await db.collection(collName).indexes();
      console.log(`${collName}: ${indexes.length} indexes`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the script
dropIndexes().catch(console.error);
