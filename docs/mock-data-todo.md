# Mock Data Generation TODO List

## Overview
Generate realistic electronics inventory mock data for Miami-based store covering full year 2025.

## Pre-requisites
- [x] MongoDB connection verified (test database)
- [x] MCP server configured and working
- [x] Backup existing data (if needed)
- [x] Review sample data quality

## Phase 0: Database Cleanup & Preparation

### 0.1 Clean Obsolete Indexes
**⚠️ IMPORTANT: Many collections still have obsolete organizationId indexes**

#### Categories Collection
- [x] Drop obsolete indexes:
  - `organizationId_1`
  - `organizationId_1_parentId_1`
  - `organizationId_1_path_1`
  - `organizationId_1_name_1`
  - `organizationId_1_seo.slug_1`
  - `organizationId_1_isActive_1_sortOrder_1`

#### Products Collection  
- [x] Drop obsolete indexes:
  - `organizationId_1`
  - `organizationId_1_sku_1`
  - `organizationId_1_status_1_name_1`
  - `organizationId_1_category.id_1`
  - `organizationId_1_brand_1`
  - `organizationId_1_barcode_1`
  - `organizationId_1_upc_1`
  - `organizationId_1_inventory.currentStock_1`
  - `organizationId_1_inventory.reorderPoint_1`
  - `organizationId_1_tags_1`

#### Warehouses Collection
- [x] Drop obsolete indexes:
  - `organizationId_1`
  - `organizationId_1_code_1`
  - `organizationId_1_status_1_type_1`
  - `organizationId_1_settings.isDefault_1`
  - `organizationId_1_address.city_1_address.country_1`
  - `organizationId_1_tags_1`

#### Purchase Orders Collection
- [x] Drop obsolete indexes:
  - `organizationId_1`
  - `organizationId_1_orderNumber_1`
  - `organizationId_1_status_1_dates.orderDate_-1`
  - `organizationId_1_supplierId_1_status_1`
  - `organizationId_1_warehouseId_1`
  - `organizationId_1_payment.status_1`
  - `organizationId_1_dates.expectedDelivery_1`
  - `organizationId_1_items.productId_1`

### 0.2 Verify Required Indexes Exist
- [x] Ensure all unique constraints are in place (sku, orderNumber, etc.)
- [x] Verify text search indexes for products
- [x] Check compound indexes for performance

### 0.3 Clear Sample Collections
- [x] Drop `*_sample` collections created during testing

## Phase 1: Reference Data Generation

### 1.1 Categories (~30 total)
**Structure: Electronics → Subcategories → Leaf Categories**

- [x] Generate root category: Electronics
- [x] Generate 6-8 main subcategories:
  - Computers & Tablets
  - TV & Home Theater  
  - Mobile & Accessories
  - Gaming
  - Smart Home
  - Audio
  - Cameras & Photography
  - Office Electronics
- [x] Generate 20-25 leaf categories (products go here)
- [x] Ensure proper hierarchy (parentId references)
- [x] Set appropriate SEO slugs and metadata
- [x] Miami-specific descriptions

### 1.2 Warehouses (4-5 locations)
**All in Miami/South Florida area**

- [x] Main Distribution Center (Miami - 33172)
  - 100,000 sqft, primary hub
  - 4 zones (secure, standard, processing, returns)
- [x] Aventura Retail Warehouse (33180)
  - 25,000 sqft, customer pickup available
- [x] Coral Gables Store Warehouse (33134)  
  - 20,000 sqft, premium location
- [x] Homestead Storage Facility (33030)
  - 75,000 sqft, overflow storage
- [x] Optional: Brickell Express Hub (33131)
  - 10,000 sqft, same-day delivery

**For each warehouse:**
- [x] Complete address with Miami ZIP codes
- [x] Operating hours (retail vs distribution)
- [x] Manager contact info
- [x] Capabilities and certifications
- [x] Performance metrics

### 1.3 Suppliers (15-20 total)

#### Manufacturers (7-10)
- [x] Apple Inc.
- [x] Samsung Electronics
- [x] Dell Technologies
- [x] HP Inc.
- [x] Lenovo
- [x] LG Electronics
- [x] Sony Corporation
- [x] Microsoft
- [x] Nintendo
- [x] ASUS

#### Distributors (4-5)
- [x] Tech Data Corporation (FL-based)
- [x] Ingram Micro
- [x] Synnex Corporation
- [x] D&H Distributing

#### Local Wholesalers (3-4)
- [x] Miami Electronics Wholesale
- [x] Florida Tech Distributors
- [x] Southeast Electronics Supply
- [x] Dade County Tech Suppliers

**For each supplier:**
- [x] Payment terms (Net 30/45/60)
- [x] Credit limits
- [x] Lead times
- [x] Performance ratings
- [x] Certifications

## Phase 2: Product Generation (250-300 items)

### 2.1 Product Distribution by Category
- [x] Laptops (30-40 products)
- [x] Desktop Computers (15-20)
- [x] Tablets (15-20)
- [x] Televisions (25-30)
- [x] Smartphones (20-25)
- [x] Gaming Consoles & Games (30-40)
- [x] Smart Home Devices (25-30)
- [x] Audio Equipment (30-35)
- [x] Computer Accessories (20-25)
- [x] Cameras (15-20)
- [x] Office Electronics (15-20)

### 2.2 For Each Product Generate:
- [x] Realistic SKUs (brand-category-unique)
- [x] Detailed descriptions
- [x] Pricing with appropriate margins (30-40%)
- [x] Miami sales tax (7%)
- [x] Inventory levels considering:
  - High-value items: lower stock (5-30)
  - Mid-range items: medium stock (20-100)
  - Accessories: higher stock (50-500)
- [x] Multiple supplier relationships
- [x] Weight and dimensions
- [x] Barcodes/UPC codes
- [ ] Seasonal variations:
  - AC units higher in summer
  - Gaming consoles for holidays
  - Back-to-school laptops

### 2.3 Special Product Scenarios
- [x] 10-15% products low on stock
- [x] 5-10% products out of stock
- [x] Some discontinued items
- [x] Draft products (not yet launched)
- [ ] Featured/promotional items

## Phase 3: Order Generation

### 3.1 Purchase Orders (100 total)
**Date Range: January 2025 - July 2025**

#### Status Distribution:
- [ ] Pending (10-15)
- [ ] Approved (5-10)
- [ ] Ordered (10-15)
- [ ] Partial (5-10)
- [ ] Received (40-50)
- [ ] Cancelled (5-10)

#### Order Patterns:
- [ ] Regular restocking orders
- [ ] Bulk orders for sales events
- [ ] Emergency stock replenishment
- [ ] New product launches
- [ ] Seasonal preparation orders

### 3.2 Sales Orders (150 total)
**Date Range: January 2025 - July 2025**

#### Customer Types:
- [ ] B2B Companies (40%)
  - Tech startups
  - Schools/Universities
  - Hotels/Resorts
  - Small businesses
- [ ] B2C Individual customers (60%)

#### Status Distribution:
- [ ] Draft (5-10)
- [ ] Confirmed (10-15)
- [ ] Processing (15-20)
- [ ] Packed (5-10)
- [ ] Shipped (10-15)
- [ ] Delivered (60-80)
- [ ] Completed (20-30)
- [ ] Cancelled (5-10)
- [ ] Refunded (3-5)

#### Special Scenarios:
- [ ] Rush/Express deliveries
- [ ] Partial shipments
- [ ] Returns and refunds
- [ ] Overdue payments
- [ ] Bulk corporate orders
- [ ] Holiday season spikes

## Phase 4: Data Relationships & Integrity

### 4.1 Ensure Referential Integrity
- [ ] All category IDs in products exist
- [ ] All supplier IDs in products exist
- [ ] All warehouse IDs in orders exist
- [ ] All product IDs in order items exist
- [ ] User IDs reference existing users

### 4.2 Business Logic Validation
- [ ] Available stock = current stock - reserved stock
- [ ] Order totals calculate correctly
- [ ] Tax calculations (7% Miami)
- [ ] Profit margins realistic
- [ ] Dates are logical (order < delivery)

### 4.3 Update Aggregated Fields
- [ ] Product counts in categories
- [ ] Stock values in products
- [ ] Total purchases in suppliers
- [ ] Performance metrics

## Phase 5: Implementation Steps

### 5.1 Data Generation Script
- [ ] Create modular generators for each entity
- [ ] Use faker.js for realistic data
- [ ] Implement business rules
- [ ] Add data validation

### 5.2 Output Format
- [ ] Generate JSON files first
- [ ] One file per collection
- [ ] Include metadata (counts, date ranges)
- [ ] Pretty-print for review

### 5.3 Database Insertion
- [ ] Use MCP tools for batch insertion
- [ ] Insert in dependency order:
  1. Categories
  2. Warehouses  
  3. Suppliers
  4. Products
  5. Purchase Orders
  6. Sales Orders
- [ ] Batch sizes: 100-500 documents
- [ ] Handle errors gracefully
- [ ] Log insertion progress

## Phase 6: Verification & Testing

### 6.1 Data Quality Checks
- [ ] All required fields populated
- [ ] No orphaned references
- [ ] Realistic value ranges
- [ ] Proper date distributions

### 6.2 Application Testing
- [ ] Dashboard loads correctly
- [ ] All filters work
- [ ] Search functionality
- [ ] Order creation/editing
- [ ] Reports generate properly

### 6.3 Performance Testing
- [ ] Page load times acceptable
- [ ] Search queries performant
- [ ] Aggregations run smoothly

## Phase 7: Documentation

### 7.1 Create Documentation
- [ ] Data dictionary
- [ ] Business rules applied
- [ ] Known test scenarios
- [ ] Sample queries

### 7.2 Usage Guide
- [ ] How to regenerate data
- [ ] How to modify scenarios
- [ ] Troubleshooting tips

## Notes & Considerations

1. **No User Creation**: Use existing 2 users in system
2. **Miami Focus**: All addresses, phone numbers in Miami area
3. **Current Time**: July 2025 - ensure recent orders prominent
4. **Realistic Patterns**: 
   - Summer: More ACs, outdoor electronics
   - Business hours: More B2B orders on weekdays
   - Payment terms: B2B gets Net 30/45/60
5. **Error Scenarios**: Include some problem orders for testing

## Success Criteria

- [ ] All collections populated with quality data
- [ ] Application fully functional with mock data
- [ ] Realistic business scenarios represented
- [ ] Performance remains acceptable
- [ ] Data can be easily regenerated

---

**Estimated Time**: 2-4 hours for full implementation
**Priority**: High - needed for testing and demos
