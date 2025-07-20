# MongoDB Schema Analysis Report for Invenio App

**Date**: 2025-07-20  
**Database**: test  
**Connection**: `mongodb+srv://admin:oK1He1DJvOhkPNye@cluster0.km4yypv.mongodb.net/test`

## Executive Summary

The MongoDB test database contains obsolete indexes with `organizationId` references that need to be cleaned up since the application no longer uses organization-based multi-tenancy. This report provides a comprehensive analysis and action plan for aligning the database schema with the current application architecture.

## Current State Analysis

### Collections Overview

| Collection | Document Count | Index Count | Obsolete Indexes |
|------------|----------------|-------------|------------------|
| users | 2 | 9 | 4 |
| products | 0 | 21 | 11 |
| warehouses | 0 | 12 | 6 |
| suppliers | 0 | 7 | 0 |
| salesorders | 0 | 11 | 0 |
| purchaseorders | 0 | 16 | 8 |
| categories | 0 | 12 | 6 |
| accounts | N/A | N/A | N/A |
| verification_tokens | N/A | N/A | N/A |

### Detailed Index Analysis

#### 1. Users Collection
**Current Indexes:**
- ✅ `_id_` (system)
- ❌ `organizationId_1` - **OBSOLETE**
- ❌ `email_1_organizationId_1` - **OBSOLETE**
- ❌ `status_1_organizationId_1` - **OBSOLETE**
- ❌ `role.name_1_organizationId_1` - **OBSOLETE**
- ✅ `lastLoginAt_-1`
- ✅ `email_1`
- ✅ `status_1`
- ✅ `role.name_1`

**Required Indexes (per model):**
- `{ email: 1 }` - unique ✅
- `{ status: 1 }` ✅
- `{ 'role.name': 1 }` ✅
- `{ lastLoginAt: -1 }` ✅

#### 2. Products Collection
**Current Indexes:**
- ✅ `_id_` (system)
- ❌ `organizationId_1` - **OBSOLETE**
- ❌ `organizationId_1_sku_1` - **OBSOLETE**
- ❌ `organizationId_1_status_1_name_1` - **OBSOLETE**
- ❌ `organizationId_1_category.id_1` - **OBSOLETE**
- ❌ `organizationId_1_brand_1` - **OBSOLETE**
- ❌ `organizationId_1_barcode_1` - **OBSOLETE**
- ❌ `organizationId_1_upc_1` - **OBSOLETE**
- ❌ `organizationId_1_inventory.currentStock_1` - **OBSOLETE**
- ❌ `organizationId_1_inventory.reorderPoint_1` - **OBSOLETE**
- ❌ `organizationId_1_tags_1` - **OBSOLETE**
- ✅ `name_text_description_text_sku_text_brand_text`
- ✅ `sku_1`
- ✅ `status_1_name_1`
- ✅ `category.id_1`
- ✅ `brand_1`
- ✅ `barcode_1`
- ✅ `upc_1`
- ✅ `inventory.currentStock_1`
- ✅ `inventory.reorderPoint_1`
- ✅ `tags_1`

**Required Indexes (per model):**
- `{ sku: 1 }` - unique ✅ (needs unique constraint)
- `{ status: 1, name: 1 }` ✅
- `{ 'category.id': 1 }` ✅
- `{ brand: 1 }` ✅
- `{ barcode: 1 }` - sparse ✅ (needs sparse option)
- `{ upc: 1 }` - sparse ✅ (needs sparse option)
- `{ 'inventory.currentStock': 1 }` ✅
- `{ 'inventory.reorderPoint': 1 }` ✅
- `{ tags: 1 }` ✅
- Text index ✅

#### 3. Warehouses Collection
**Current Indexes:**
- ✅ `_id_` (system)
- ❌ `organizationId_1` - **OBSOLETE**
- ❌ `organizationId_1_code_1` - **OBSOLETE**
- ❌ `organizationId_1_status_1_type_1` - **OBSOLETE**
- ❌ `organizationId_1_settings.isDefault_1` - **OBSOLETE**
- ❌ `organizationId_1_address.city_1_address.country_1` - **OBSOLETE**
- ❌ `organizationId_1_tags_1` - **OBSOLETE**
- ✅ `code_1`
- ✅ `status_1_type_1`
- ✅ `settings.isDefault_1`
- ✅ `address.city_1_address.country_1`
- ✅ `tags_1`

**Required Indexes (per model):**
- `{ code: 1 }` - unique ✅ (needs unique constraint)
- `{ status: 1, type: 1 }` ✅
- `{ 'settings.isDefault': 1 }` ✅
- `{ 'address.city': 1, 'address.country': 1 }` ✅
- `{ tags: 1 }` ✅

#### 4. Suppliers Collection
**Current Indexes:** All correct, no obsolete indexes! ✅

#### 5. SalesOrders Collection
**Current Indexes:** All correct, no obsolete indexes! ✅

#### 6. PurchaseOrders Collection
**Current Indexes:**
- ✅ `_id_` (system)
- ❌ `organizationId_1` - **OBSOLETE**
- ❌ `organizationId_1_orderNumber_1` - **OBSOLETE**
- ❌ `organizationId_1_status_1_dates.orderDate_-1` - **OBSOLETE**
- ❌ `organizationId_1_supplierId_1_status_1` - **OBSOLETE**
- ❌ `organizationId_1_warehouseId_1` - **OBSOLETE**
- ❌ `organizationId_1_payment.status_1` - **OBSOLETE**
- ❌ `organizationId_1_dates.expectedDelivery_1` - **OBSOLETE**
- ❌ `organizationId_1_items.productId_1` - **OBSOLETE**
- ✅ All other indexes are correct

#### 7. Categories Collection
**Current Indexes:**
- ✅ `_id_` (system)
- ❌ `organizationId_1` - **OBSOLETE**
- ❌ `organizationId_1_parentId_1` - **OBSOLETE**
- ❌ `organizationId_1_path_1` - **OBSOLETE**
- ❌ `organizationId_1_name_1` - **OBSOLETE**
- ❌ `organizationId_1_seo.slug_1` - **OBSOLETE**
- ❌ `organizationId_1_isActive_1_sortOrder_1` - **OBSOLETE**
- ✅ All other indexes are correct

## Action Plan

### Phase 1: Clean Up Obsolete Indexes
Remove all indexes containing `organizationId`:

```javascript
// Users collection
db.users.dropIndex("organizationId_1")
db.users.dropIndex("email_1_organizationId_1")
db.users.dropIndex("status_1_organizationId_1")
db.users.dropIndex("role.name_1_organizationId_1")

// Products collection
db.products.dropIndex("organizationId_1")
db.products.dropIndex("organizationId_1_sku_1")
// ... (11 indexes total)

// Warehouses collection
db.warehouses.dropIndex("organizationId_1")
// ... (6 indexes total)

// PurchaseOrders collection
db.purchaseorders.dropIndex("organizationId_1")
// ... (8 indexes total)

// Categories collection
db.categories.dropIndex("organizationId_1")
// ... (6 indexes total)
```

### Phase 2: Update Index Constraints
Add missing constraints to existing indexes:

```javascript
// Products
db.products.dropIndex("sku_1")
db.products.createIndex({ sku: 1 }, { unique: true })
db.products.dropIndex("barcode_1")
db.products.createIndex({ barcode: 1 }, { sparse: true })
db.products.dropIndex("upc_1")
db.products.createIndex({ upc: 1 }, { sparse: true })

// Warehouses
db.warehouses.dropIndex("code_1")
db.warehouses.createIndex({ code: 1 }, { unique: true })

// Categories
db.categories.dropIndex("seo.slug_1")
db.categories.createIndex({ 'seo.slug': 1 }, { unique: true, sparse: true })

// Purchase/Sales Orders
db.purchaseorders.dropIndex("orderNumber_1")
db.purchaseorders.createIndex({ orderNumber: 1 }, { unique: true })
db.salesorders.dropIndex("orderNumber_1")
db.salesorders.createIndex({ orderNumber: 1 }, { unique: true })
```

### Phase 3: Schema Validation (Optional)
Consider adding JSON Schema validation to enforce data integrity:

```javascript
db.runCommand({
  collMod: "products",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["sku", "name", "status"],
      properties: {
        sku: { bsonType: "string" },
        name: { bsonType: "string" },
        status: { enum: ["active", "inactive", "discontinued"] },
        // ... other fields
      }
    }
  }
})
```

### Phase 4: Generate Mock Data

#### User Mock Data
```javascript
{
  email: "admin@invenio.com",
  name: "Admin User",
  hashedPassword: "$2b$10$...", // bcrypt hash
  status: "active",
  role: {
    name: "admin",
    permissions: {
      canManageUsers: true,
      canManageInventory: true,
      canManageOrders: true,
      canViewReports: true,
      canManageFinance: true,
      canManageSettings: true
    },
    customPermissions: {
      canExportData: true,
      canBulkEdit: true,
      canAccessAPI: true
    }
  },
  settings: {
    theme: "light",
    language: "en",
    notifications: {
      email: true,
      push: true,
      sms: false
    }
  },
  createdAt: new Date(),
  updatedAt: new Date()
}
```

#### Category Mock Data
```javascript
[
  {
    name: "Electronics",
    parentId: null,
    level: 0,
    path: "/electronics",
    metadata: { icon: "computer", color: "#1E40AF" },
    isActive: true,
    sortOrder: 1
  },
  {
    name: "Laptops",
    parentId: ObjectId("..."), // Electronics ID
    level: 1,
    path: "/electronics/laptops",
    metadata: { icon: "laptop", color: "#1E40AF" },
    isActive: true,
    sortOrder: 1
  }
]
```

#### Product Mock Data
```javascript
{
  sku: "LAP-DELL-001",
  name: "Dell XPS 13 Laptop",
  category: {
    id: ObjectId("..."), // Laptops category
    name: "Laptops",
    path: "/electronics/laptops"
  },
  brand: "Dell",
  status: "active",
  type: "physical",
  description: "High-performance ultrabook...",
  inventory: {
    trackInventory: true,
    currentStock: 25,
    reservedStock: 3,
    availableStock: 22,
    reorderPoint: 5,
    reorderQuantity: 20,
    lowStockThreshold: 10
  },
  pricing: {
    costPrice: 800,
    sellingPrice: 1299.99,
    compareAtPrice: 1499.99,
    profitMargin: 38.46,
    taxRate: 8.875
  },
  shipping: {
    weight: 2.8,
    weightUnit: "lb",
    dimensions: {
      length: 11.9,
      width: 7.8,
      height: 0.6,
      unit: "in"
    }
  }
}
```

#### Warehouse Mock Data
```javascript
{
  code: "WH-001",
  name: "Main Warehouse",
  type: "storage",
  status: "active",
  address: {
    street: "123 Storage Way",
    city: "Dallas",
    state: "TX",
    country: "USA",
    postalCode: "75201",
    coordinates: {
      latitude: 32.7767,
      longitude: -96.7970
    }
  },
  contact: {
    phone: "+1-214-555-0100",
    email: "main@invenio.com",
    manager: "John Smith"
  },
  capacity: {
    totalSpace: 50000,
    usedSpace: 35000,
    unit: "sqft"
  },
  settings: {
    isDefault: true,
    allowNegativeStock: false,
    autoReorder: true
  },
  operatingHours: {
    monday: { open: "08:00", close: "18:00", isOpen: true },
    // ... other days
  }
}
```

#### Sales Order Mock Data
```javascript
{
  orderNumber: "SO-2025-001",
  customer: {
    name: "Acme Corporation",
    email: "orders@acme.com",
    phone: "+1-555-0123",
    company: "Acme Corp",
    taxId: "12-3456789"
  },
  warehouseId: ObjectId("..."),
  status: "confirmed",
  items: [{
    productId: ObjectId("..."),
    quantity: 2,
    shippedQuantity: 0,
    unitPrice: 1299.99,
    costPrice: 800,
    discount: 10,
    discountType: "percentage",
    tax: 8.875,
    taxAmount: 207.15,
    total: 2337.13
  }],
  dates: {
    orderDate: new Date("2025-01-20"),
    confirmedDate: new Date("2025-01-20"),
    expectedDelivery: new Date("2025-01-25")
  },
  financial: {
    subtotal: 2599.98,
    totalDiscount: 260.00,
    totalTax: 207.15,
    shippingCost: 0,
    grandTotal: 2547.13,
    paidAmount: 0,
    balanceAmount: 2547.13,
    currency: "USD"
  },
  payment: {
    method: "credit",
    terms: "Net 30",
    status: "pending"
  },
  shipping: {
    method: "standard",
    address: {
      street: "456 Business Ave",
      city: "Houston",
      state: "TX",
      country: "USA",
      postalCode: "77002"
    }
  }
}
```

## Recommendations

1. **Immediate Actions**:
   - Drop all organizationId indexes (39 total)
   - Update index constraints for unique/sparse fields
   - Clear any existing documents with organizationId fields

2. **Data Generation Strategy**:
   - Start with reference data (users, categories, warehouses, suppliers)
   - Generate products with proper category references
   - Create orders with valid product and warehouse references
   - Ensure all references use valid ObjectIds

3. **Testing Approach**:
   - Create at least 50-100 products across different categories
   - Generate 20-30 purchase orders with varying statuses
   - Create 30-50 sales orders to test order workflows
   - Include edge cases (returns, cancellations, partial shipments)

4. **Performance Considerations**:
   - The text index on products is working correctly
   - All required indexes exist (after cleanup)
   - Consider adding indexes for common query patterns

5. **Data Integrity**:
   - Implement schema validation for critical fields
   - Ensure referential integrity in mock data
   - Test cascade operations (e.g., product deletion impact)

## Conclusion

The database schema requires cleanup of 39 obsolete indexes containing organizationId references. Once cleaned, the schema will align perfectly with the current application architecture. The existing data (2 users) appears to be from authentication testing and can be preserved. Mock data generation should follow the hierarchical structure: Users → Categories/Warehouses/Suppliers → Products → Orders.
