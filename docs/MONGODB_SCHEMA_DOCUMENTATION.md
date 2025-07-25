# MongoDB Schema Documentation - Invenio v3

## Overview

This document provides comprehensive documentation of the MongoDB schema, indexes, and aggregation patterns for the Invenio v3 application. The database name is `test` and contains the following collections:

- **salesorders** - Sales order transactions
- **products** - Product catalog 
- **purchaseorders** - Purchase order transactions
- **warehouses** - Warehouse locations and inventory
- **suppliers** - Supplier/vendor information
- **categories** - Product categories
- **customers** - Customer information
- **users** - Application users
- **accounts** - User accounts (NextAuth)
- **verification_tokens** - Email verification tokens

## Critical Data Type Notes

### Date Fields - IMPORTANT
**⚠️ WARNING: Most date fields in the database are stored as STRINGS, not Date objects!**

This is critical when writing aggregation pipelines. You must convert string dates to Date objects before using date comparison operators like `$gte` and `$lte`.

Example conversion:
```javascript
{
  $addFields: {
    convertedDate: {
      $dateFromString: {
        dateString: "$dates.orderDate",
        onError: null,
        onNull: null
      }
    }
  }
}
```

## Collection Schemas

### 1. Sales Orders (salesorders)

Sales orders contain complete order information including embedded product data (denormalized).

#### Schema Structure
```javascript
{
  _id: ObjectId,
  orderNumber: String,  // Format: "SO-YYYY-NNNNN"
  
  // Customer Information (Embedded)
  customer: {
    name: String,
    email: String,
    phone: String,
    company: String,      // Optional for B2B
    taxId: String,        // Optional for B2B
    isB2B: Boolean,
    companyType: String   // Optional for B2B
  },
  
  // Warehouse & Sales Person
  warehouseId: ObjectId,
  warehouse: {
    name: String,
    code: String
  },
  salesPersonId: ObjectId,
  salesPerson: {
    name: String,
    email: String
  },
  
  status: String, // draft, confirmed, processing, packed, shipped, delivered, completed, cancelled, refunded
  
  // Order Items (Embedded Product Data)
  items: [{
    productId: ObjectId,
    product: {
      name: String,
      sku: String,
      category: String    // Simple string, NOT nested object
    },
    quantity: Number,
    shippedQuantity: Number,
    costPrice: Number,
    unitPrice: Number,
    discount: Number,
    discountType: String, // "percentage" or "fixed"
    tax: Number,
    taxAmount: Number,
    total: Number,
    baseTotal: Number,
    discountAmount: Number,
    warehouseLocation: String
  }],
  
  // Dates (ALL STORED AS STRINGS!)
  dates: {
    orderDate: String,        // ISO date string
    confirmedDate: String,
    shippedDate: String,
    deliveredDate: String,
    expectedDelivery: String,
    dueDate: String
  },
  
  // Financial Summary
  financial: {
    subtotal: Number,
    totalDiscount: Number,
    totalTax: Number,
    shippingCost: Number,
    handlingFee: Number,
    otherCharges: Number,
    grandTotal: Number,
    paidAmount: Number,
    balanceAmount: Number,
    currency: String,
    exchangeRate: Number,
    profitMargin: Number,
    totalCost: Number
  },
  
  // Payment Information
  payment: {
    method: String,
    terms: String,        // "Due on Receipt", "Net 30", etc.
    status: String,       // "pending", "paid", "partial", "overdue"
    transactions: [{
      date: String,
      amount: Number,
      method: String,
      reference: String
    }]
  },
  
  // Shipping Information
  shipping: {
    method: String,
    carrier: String,
    trackingNumber: String,
    weight: Number,
    weightUnit: String,
    packages: Number,
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String
    },
    billingAddress: {
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String
    }
  },
  
  // Fulfillment
  fulfillment: {
    type: String,
    priority: String,
    pickedBy: ObjectId,
    packedBy: ObjectId,
    instructions: String
  },
  
  source: String,       // "website", "phone", "email", etc.
  channel: String,      // "B2B" or "B2C"
  notes: String,
  tags: [String],
  
  // Audit Fields
  createdBy: ObjectId,
  createdAt: String,    // ISO date string
  updatedBy: ObjectId,
  updatedAt: String,    // ISO date string
  
  returns: Array,
  customerId: ObjectId
}
```

#### Indexes
```javascript
orderNumber_1: { orderNumber: 1 }
status_1_dates.orderDate_-1: { status: 1, "dates.orderDate": -1 }
customerId_1_status_1: { customerId: 1, status: 1 }
warehouseId_1: { warehouseId: 1 }
salesPersonId_1: { salesPersonId: 1 }
payment.status_1: { "payment.status": 1 }
fulfillment.priority_1_status_1: { "fulfillment.priority": 1, status: 1 }
dates.expectedDelivery_1: { "dates.expectedDelivery": 1 }
customer.email_1: { "customer.email": 1 }
source_1: { source: 1 }
```

### 2. Products (products)

Product catalog with inventory tracking and supplier information.

#### Schema Structure
```javascript
{
  _id: String,          // Note: _id is String, not ObjectId
  sku: String,          // Unique SKU
  name: String,
  description: String,
  
  // Category (Nested Object Structure)
  category: {
    id: String,
    name: String,
    path: String
  },
  
  brand: String,
  type: String,
  status: String,       // "active", "inactive", "discontinued"
  
  // Pricing
  pricing: {
    cost: Number,
    price: Number,
    compareAtPrice: Number,
    currency: String,
    taxable: Boolean,
    taxRate: Number
  },
  
  // Inventory
  inventory: {
    trackQuantity: Boolean,
    currentStock: Number,
    availableStock: Number,
    reservedStock: Number,
    incomingStock: Number,
    reorderPoint: Number,
    reorderQuantity: Number,
    minStockLevel: Number,
    stockValue: Number,
    averageCost: Number,
    lastCostUpdate: String,   // ISO date string
    stockMethod: String,
    locations: [{
      warehouseId: String,
      warehouseName: String,
      quantity: Number,
      isDefault: Boolean
    }]
  },
  
  // Suppliers
  suppliers: [{
    vendorId: String,
    vendorName: String,
    supplierSku: String,
    cost: Number,
    leadTime: Number,
    minOrderQuantity: Number,
    isPrimary: Boolean
  }],
  
  // Physical Attributes
  weight: {
    value: Number,
    unit: String
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: String
  },
  
  barcode: String,
  upc: String,
  tags: [String],
  isActive: Boolean,
  
  // Audit Fields
  createdBy: String,
  updatedBy: String,
  createdAt: String,    // ISO date string
  updatedAt: String     // ISO date string
}
```

#### Indexes
```javascript
sku_1: { sku: 1 }
status_1_name_1: { status: 1, name: 1 }
category.id_1: { "category.id": 1 }
brand_1: { brand: 1 }
barcode_1: { barcode: 1 }
upc_1: { upc: 1 }
inventory.currentStock_1: { "inventory.currentStock": 1 }
inventory.reorderPoint_1: { "inventory.reorderPoint": 1 }
tags_1: { tags: 1 }
name_text_description_text_sku_text_brand_text: { // Text search index
  name: "text",
  description: "text",
  sku: "text",
  brand: "text"
}
```

### 3. Purchase Orders (purchaseorders)

Purchase orders for procurement with embedded product data.

#### Schema Structure
```javascript
{
  _id: ObjectId,
  orderNumber: String,  // Format: "PO-YYYY-NNNNN"
  
  // Supplier Information
  supplierId: ObjectId,
  supplier: {
    name: String,
    code: String
  },
  
  // Warehouse
  warehouseId: ObjectId,
  warehouse: {
    name: String,
    code: String
  },
  
  status: String,       // "draft", "approved", "ordered", "partial", "received", "cancelled"
  
  // Order Items
  items: [{
    productId: ObjectId,
    product: {
      name: String,
      sku: String,
      category: String
    },
    quantity: Number,
    receivedQuantity: Number,
    unitCost: Number,
    discount: Number,
    discountType: String,
    tax: Number,
    taxAmount: Number,
    total: Number,
    expectedDelivery: String,
    notes: String,
    receivedDate: String
  }],
  
  // Dates (ALL STRINGS!)
  dates: {
    orderDate: String,
    expectedDelivery: String,
    actualDelivery: String,
    dueDate: String
  },
  
  // Financial
  financial: {
    subtotal: Number,
    totalDiscount: Number,
    totalTax: Number,
    shippingCost: Number,
    otherCharges: Number,
    grandTotal: Number,
    paidAmount: Number,
    balanceAmount: Number,
    currency: String,
    exchangeRate: Number
  },
  
  // Payment
  payment: {
    terms: String,
    method: String,
    status: String,
    transactions: [{
      date: String,
      amount: Number,
      method: String,
      reference: String,
      notes: String
    }]
  },
  
  // Shipping
  shipping: {
    method: String,
    trackingNumber: String,
    carrier: String,
    estimatedArrival: String,
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    }
  },
  
  // Approval
  approval: {
    required: Boolean,
    approvedBy: ObjectId,
    approvedAt: String,
    rejectedBy: ObjectId
  },
  
  notes: String,
  internalNotes: String,
  tags: [String],
  
  // Audit
  createdBy: ObjectId,
  createdAt: String,
  updatedBy: ObjectId,
  updatedAt: String
}
```

#### Indexes
```javascript
orderNumber_1: { orderNumber: 1 }
status_1_dates.orderDate_-1: { status: 1, "dates.orderDate": -1 }
supplierId_1_status_1: { supplierId: 1, status: 1 }
warehouseId_1: { warehouseId: 1 }
payment.status_1: { "payment.status": 1 }
dates.expectedDelivery_1: { "dates.expectedDelivery": 1 }
items.productId_1: { "items.productId": 1 }
```

### 4. Warehouses (warehouses)

Warehouse locations with capacity and operational information.

#### Schema Structure
```javascript
{
  _id: String,          // Note: String ID
  name: String,
  code: String,         // Unique warehouse code
  type: String,         // "distribution", "retail", "showroom", etc.
  status: String,       // "active", "inactive"
  
  // Address
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Capacity
  capacity: {
    totalSpace: Number,
    usedSpace: Number,
    availableSpace: Number,
    unit: String,
    zones: {
      storage: Number,
      shipping: Number,
      receiving: Number,
      packing: Number,
      staging: Number,
      automated: Number,
      manual: Number,
      highValue: Number,
      standard: Number,
      premium: Number,
      backstock: Number,
      display: Number,
      overflow: Number,
      service: Number,
      showroom: Number
    }
  },
  
  // Contact
  contact: {
    phone: String,
    email: String,
    manager: {
      name: String,
      email: String,
      phone: String,
      mobile: String
    }
  },
  
  // Operating Hours
  operatingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String, closed: Boolean }
  },
  
  // Settings
  settings: {
    isDefault: Boolean,
    autoReorder: Boolean,
    allowNegativeStock: Boolean,
    reorderPoint: Number,
    reorderQuantity: Number,
    minOrderValue: Number,
    maxOrderValue: Number
  },
  
  features: [String],
  certifications: [String],
  
  createdAt: String,
  updatedAt: String
}
```

#### Indexes
```javascript
code_1: { code: 1 }
status_1_type_1: { status: 1, type: 1 }
settings.isDefault_1: { "settings.isDefault": 1 }
address.city_1_address.country_1: { "address.city": 1, "address.country": 1 }
tags_1: { tags: 1 }
```

### 5. Suppliers (suppliers)

Supplier/vendor information with performance metrics.

#### Schema Structure
```javascript
{
  _id: String,          // Note: String ID
  code: String,
  name: String,
  type: String,
  status: String,
  isPreferred: Boolean,
  
  // Contact
  contact: {
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String
    },
    primaryContact: {
      name: String,
      email: String,
      phone: String,
      position: String
    },
    website: String
  },
  
  // Financial
  financial: {
    taxId: String,
    currency: String,
    paymentTerms: String,
    creditLimit: Number,
    currentBalance: Number,
    totalPurchases: Number
  },
  
  // Products
  products: {
    categories: [String],
    brandNames: [String],
    totalProducts: Number
  },
  
  // Performance
  performance: {
    rating: Number,
    qualityScore: Number,
    onTimeDeliveryRate: Number,
    responseTime: Number,
    totalOrders: Number,
    returnRate: Number
  },
  
  // Shipping
  shipping: {
    leadTime: Number,
    methods: [String],
    locations: [String],
    freeShippingThreshold: Number
  },
  
  // Compliance
  compliance: {
    certifications: [String],
    licenses: [{
      type: String,
      number: String,
      expiry: String
    }],
    insuranceExpiry: String
  },
  
  notes: String,
  tags: [String],
  
  createdAt: String,
  updatedAt: String
}
```

### 6. Categories (categories)

Product category hierarchy.

#### Schema Structure
```javascript
{
  _id: String,
  name: String,
  slug: String,
  description: String,
  
  // Hierarchy
  parentId: String | null,
  path: String,         // e.g., "electronics/computers/laptops"
  level: Number,
  
  // Display
  sortOrder: Number,
  imageUrl: String,
  isActive: Boolean,
  isFeatured: Boolean,
  
  // SEO
  metaTitle: String,
  metaDescription: String,
  keywords: [String],
  
  // Attributes
  attributes: {
    showInMenu: Boolean,
    showInHomepage: Boolean,
    bannerColor: String
  }
}
```

### 7. Customers (customers)

Customer records with metrics and preferences.

#### Schema Structure
```javascript
{
  _id: ObjectId,
  customerNumber: String,
  type: String,         // "B2B" or "B2C"
  name: String,
  email: String,
  phone: String,
  
  // B2B Fields
  company: String | null,
  taxId: String | null,
  industry: String | null,
  
  // Addresses
  billingAddress: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String
  },
  shippingAddresses: [{
    isDefault: Boolean,
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String
  }],
  
  // Financial
  creditLimit: Number,
  currentBalance: Number,
  paymentTerms: String,
  preferredPaymentMethod: String,
  
  // Metrics
  metrics: {
    totalOrders: Number,
    totalSpent: Number,
    averageOrderValue: Number,
    lastOrderDate: Date,      // Note: Actually stored as Date type
    firstOrderDate: Date,     // Note: Actually stored as Date type
    totalReturns: Number,
    totalRefunds: Number,
    lifetimeValue: Number
  },
  
  // Preferences
  preferences: {
    communication: {
      emailMarketing: Boolean,
      smsMarketing: Boolean,
      phoneMarketing: Boolean
    },
    shipping: {
      preferredMethod: String
    },
    invoicing: {
      sendInvoiceBy: String,
      consolidateInvoices: Boolean
    }
  },
  
  // Loyalty
  loyalty: {
    points: Number,
    tier: String
  },
  
  status: String,
  rating: Number,
  tags: [String],
  source: String,
  
  _orderIds: [ObjectId],
  
  // Audit
  createdBy: ObjectId,
  updatedBy: ObjectId,
  createdAt: String,
  updatedAt: String
}
```

### 8. Users (users)

Application users (NextAuth).

#### Schema Structure
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  image: String,
  emailVerified: null,
  createdAt: Date       // Note: Actually stored as Date type
}
```

## Common Aggregation Patterns

### 1. Date Range Filtering with String Dates

Always convert string dates before filtering:

```javascript
// Helper stage to convert string dates
const dateConversionStage = {
  $addFields: {
    convertedOrderDate: {
      $dateFromString: {
        dateString: "$dates.orderDate",
        onError: null,
        onNull: null
      }
    }
  }
};

// Then use in match
{
  $match: {
    convertedOrderDate: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }
}
```

### 2. Sales Analytics Aggregations

#### Total Revenue by Category
```javascript
[
  // Convert dates first
  { $addFields: { convertedDate: { $dateFromString: { dateString: "$dates.orderDate" }}}},
  { $match: { convertedDate: { $gte: startDate, $lte: endDate }}},
  { $match: { status: { $nin: ['draft', 'cancelled'] }}},
  { $unwind: '$items' },
  {
    $group: {
      _id: '$items.product.category',  // Note: category is a string
      revenue: { $sum: { $multiply: ['$items.quantity', '$items.unitPrice'] }},
      quantity: { $sum: '$items.quantity' },
      orderCount: { $addToSet: '$_id' }
    }
  },
  {
    $project: {
      name: '$_id',    // Frontend expects 'name' field
      revenue: 1,
      quantity: 1,
      orderCount: { $size: '$orderCount' }
    }
  }
]
```

#### Sales Trend Over Time
```javascript
[
  { $addFields: { convertedDate: { $dateFromString: { dateString: "$dates.orderDate" }}}},
  { $match: { convertedDate: { $gte: startDate, $lte: endDate }}},
  { $match: { status: { $nin: ['draft', 'cancelled'] }}},
  {
    $group: {
      _id: {
        $dateToString: {
          format: '%Y-%m-%d',
          date: '$convertedDate'
        }
      },
      revenue: { $sum: '$financial.grandTotal' },
      orders: { $sum: 1 }
    }
  },
  { $sort: { _id: 1 }}
]
```

### 3. Inventory Analytics

#### Low Stock Products
```javascript
[
  { $match: { status: 'active' }},
  {
    $match: {
      $expr: {
        $lte: ['$inventory.currentStock', '$inventory.reorderPoint']
      }
    }
  },
  {
    $project: {
      sku: 1,
      name: 1,
      currentStock: '$inventory.currentStock',
      reorderPoint: '$inventory.reorderPoint',
      stockShortage: {
        $subtract: ['$inventory.reorderPoint', '$inventory.currentStock']
      }
    }
  }
]
```

## Key Relationships

1. **Sales Orders → Products**: Via `items.productId` (ObjectId reference)
2. **Sales Orders → Warehouses**: Via `warehouseId` (ObjectId reference)
3. **Sales Orders → Users**: Via `salesPersonId` (ObjectId reference)
4. **Sales Orders → Customers**: Via `customerId` (ObjectId reference)
5. **Purchase Orders → Products**: Via `items.productId` (ObjectId reference)
6. **Purchase Orders → Suppliers**: Via `supplierId` (ObjectId reference)
7. **Purchase Orders → Warehouses**: Via `warehouseId` (ObjectId reference)
8. **Products → Categories**: Via `category.id` (String reference)
9. **Products → Suppliers**: Via `suppliers.vendorId` (String reference)
10. **Products → Warehouses**: Via `inventory.locations.warehouseId` (String reference)

## Important Notes and Gotchas

1. **Mixed ID Types**: Some collections use ObjectId for _id (salesorders, purchaseorders, users, customers), while others use String (products, warehouses, suppliers, categories).

2. **Embedded vs Referenced Data**: Sales and purchase orders embed product data at the time of order creation (denormalized for performance), meaning product details in orders may differ from current product catalog.

3. **Category Data Structure Mismatch**: 
   - In products collection: category is a nested object with {id, name, path}
   - In salesorders/purchaseorders items: category is a simple string

4. **Date Storage Inconsistency**:
   - Most dates are stored as strings (ISO format)
   - Some dates in customers.metrics are stored as Date type
   - users.createdAt is stored as Date type

5. **Financial Calculations**: Always use the financial summary fields for totals rather than recalculating from items, as they include all adjustments, taxes, and fees.

6. **Status Values**: Each collection has specific valid status values that should be validated in application logic.

7. **Warehouse Stock**: Product inventory is tracked both at product level and distributed across warehouse locations.

## Performance Considerations

1. **Indexes**: Most queries should hit indexes. Common patterns:
   - Status + Date sorting for orders
   - Product lookups by SKU
   - Warehouse default settings
   - Customer email lookups

2. **Text Search**: Products collection has a text index on name, description, SKU, and brand for full-text search.

3. **Aggregation Pipeline Optimization**:
   - Apply date conversion early in pipeline
   - Use $match stages as early as possible
   - Limit results before expensive operations like $lookup
   - Project only needed fields to reduce memory usage

4. **Date Range Queries**: Always ensure date conversion happens before date range matching to avoid missing records.

## Common Mistakes to Avoid

1. **Forgetting Date Conversion**: Always convert string dates before filtering
2. **Wrong Category Field Path**: Use `product.category` not `product.category.name` in sales orders
3. **ID Type Mismatches**: Check whether collection uses ObjectId or String for _id
4. **Missing Status Filters**: Remember to exclude draft/cancelled orders in analytics
5. **Incorrect Financial Calculations**: Use pre-calculated financial fields, not item-level math
6. **Frontend Field Expectations**: Charts expect specific field names (e.g., 'name' not 'category')

---

*Last Updated: 2025-07-25*
*Database: test*
*Environment: Development*
