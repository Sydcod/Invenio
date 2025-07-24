# Invenio Reports Implementation Plan

## Overview
This document provides a comprehensive implementation plan for the Invenio Reports area, covering all aspects from database queries to frontend implementation.

## Table of Contents
1. [Database Schema Overview](#database-schema-overview)
2. [Report Categories & Specifications](#report-categories--specifications)
3. [Technical Architecture](#technical-architecture)
4. [Implementation Steps](#implementation-steps)
5. [API Design](#api-design)
6. [Frontend Implementation](#frontend-implementation)
7. [MongoDB Aggregation Queries](#mongodb-aggregation-queries)
8. [Performance Considerations](#performance-considerations)

---

## Database Schema Overview

### Collections in `test` database:
- **salesorders** - Sales transactions with customer data, items, pricing, fulfillment
- **purchaseorders** - Purchase orders with supplier data, receiving, payments
- **products** - Product catalog with inventory, pricing, suppliers
- **customers** - Customer data (embedded in sales orders)
- **suppliers** - Vendor information
- **warehouses** - Inventory locations
- **users** - System users for sales attribution
- **categories** - Product categorization

### Key Data Structures:

#### Sales Orders
```json
{
  "_id": ObjectId,
  "orderNumber": String,
  "customer": {
    "name": String,
    "email": String,
    "phone": String,
    "company": String,
    "taxId": String,
    "isB2B": Boolean,
    "companyType": String
  },
  "status": String, // "Delivered", "Completed", "Processing", etc.
  "items": [{
    "productId": ObjectId,
    "product": { "name", "sku", "category" },
    "quantity": Number,
    "unitPrice": Number,
    "discount": Number,
    "taxAmount": Number,
    "total": Number
  }],
  "financial": {
    "subtotal": Number,
    "totalDiscount": Number,
    "totalTax": Number,
    "shippingCost": Number,
    "grandTotal": Number
  },
  "payment": {
    "method": String,
    "terms": String, // "Net 30", "Due on Receipt", etc.
    "status": String
  },
  "dates": {
    "orderDate": String,
    "deliveryDate": String,
    "dueDate": String
  }
}
```

#### Purchase Orders
```json
{
  "_id": ObjectId,
  "orderNumber": String,
  "supplierId": ObjectId,
  "supplier": { "name", "code" },
  "status": String, // "Received", "Pending", "Ordered", etc.
  "items": [{
    "productId": ObjectId,
    "quantity": Number,
    "receivedQuantity": Number,
    "unitCost": Number,
    "total": Number
  }],
  "financial": {
    "subtotal": Number,
    "grandTotal": Number,
    "paidAmount": Number,
    "balanceAmount": Number
  },
  "payment": {
    "terms": String,
    "status": String
  }
}
```

#### Products
```json
{
  "_id": String,
  "sku": String,
  "name": String,
  "brand": String,
  "category": { "id", "name", "path" },
  "pricing": {
    "cost": Number,
    "price": Number
  },
  "inventory": {
    "currentStock": Number,
    "availableStock": Number,
    "reservedStock": Number,
    "stockValue": Number,
    "locations": [{ "warehouseId", "quantity" }]
  }
}
```

---

## Report Categories & Specifications

### 1. Sales Reports

#### 1.1 Sales by Customer
**Purpose**: Analyze revenue by customer, identify top customers
**Columns**:
- Customer Name
- Company (if B2B)
- Invoice Count
- Total Sales
- Sales with Tax
- Average Order Value
- Customer Type (B2B/B2C)
**Filters**:
- Date Range
- Customer Type (B2B/B2C)
- Status
- Minimum/Maximum Sales Amount
**Metrics**:
- Total Revenue
- Number of Customers
- Average Customer Value

#### 1.2 Sales by Item
**Purpose**: Product performance analysis
**Columns**:
- Product SKU
- Product Name
- Brand
- Category
- Quantity Sold
- Revenue
- Average Selling Price
- Cost of Goods Sold
- Profit Margin
**Filters**:
- Date Range
- Category
- Brand
- Status
**Metrics**:
- Total Units Sold
- Total Revenue
- Average Margin

#### 1.3 Order Fulfillment by Item
**Purpose**: Track delivery performance
**Columns**:
- Product SKU/Name
- Orders Placed
- Orders Delivered
- Orders Pending
- Fulfillment Rate %
- Average Delivery Time
**Filters**:
- Date Range
- Warehouse
- Status

#### 1.4 Sales Return History
**Purpose**: Track returns and refunds
**Columns**:
- Order Number
- Customer
- Return Date
- Items Returned
- Return Reason
- Refund Amount
- Processing Status
**Filters**:
- Date Range
- Return Reason
- Status

#### 1.5 Sales by Sales Person
**Purpose**: Sales team performance
**Columns**:
- Sales Person Name
- Number of Orders
- Total Sales
- Average Order Value
- Commission (if applicable)
- Conversion Rate
**Filters**:
- Date Range
- Minimum Sales

### 2. Inventory Reports

#### 2.1 Inventory Summary
**Purpose**: Current stock levels overview
**Columns**:
- Product SKU/Name
- Category
- Current Stock
- Available Stock
- Reserved Stock
- Stock Value
- Warehouse
**Filters**:
- Category
- Brand
- Warehouse
- Stock Level (Low/Normal/High)
**Metrics**:
- Total Inventory Value
- Total Items
- Low Stock Items Count

#### 2.2 Inventory Valuation Summary
**Purpose**: Financial view of inventory
**Columns**:
- Category
- Total Items
- Total Quantity
- Average Cost
- Total Value
- Percentage of Total
**Filters**:
- Warehouse
- Category

#### 2.3 Inventory Aging Summary
**Purpose**: Identify slow-moving inventory
**Columns**:
- Product SKU/Name
- Last Sale Date
- Days Since Last Sale
- Current Stock
- Stock Value
- Turnover Rate
**Filters**:
- Days Range (0-30, 31-60, 61-90, 90+)
- Category
- Minimum Stock Value

#### 2.4 Product Sales Report
**Purpose**: Product movement history
**Columns**:
- Product SKU/Name
- Opening Stock
- Purchases
- Sales
- Returns
- Adjustments
- Closing Stock
- Stock Value
**Filters**:
- Date Range
- Category
- Product

#### 2.5 Active Purchase Orders Report
**Purpose**: Track incoming inventory
**Columns**:
- PO Number
- Supplier
- Order Date
- Expected Date
- Items
- Total Value
- Status
- Received %
**Filters**:
- Date Range
- Supplier
- Status

### 3. Receivables Reports

#### 3.1 Customer Balances
**Purpose**: Outstanding customer payments
**Columns**:
- Customer Name
- Total Invoiced
- Total Paid
- Outstanding Balance
- Overdue Amount
- Days Overdue
- Credit Limit
**Filters**:
- Balance Type (All/With Balance Only)
- Overdue Only
- Customer Type

#### 3.2 Invoice Details
**Purpose**: Detailed invoice listing
**Columns**:
- Invoice Number
- Customer
- Invoice Date
- Due Date
- Amount
- Paid Amount
- Balance
- Status
- Days Overdue
**Filters**:
- Date Range
- Customer
- Status
- Overdue Only

#### 3.3 Receivable Aging Summary
**Purpose**: Age analysis of receivables
**Columns**:
- Customer
- Current
- 1-30 Days
- 31-60 Days
- 61-90 Days
- Over 90 Days
- Total Outstanding
**Filters**:
- Customer Type
- Minimum Balance

### 4. Payables Reports

#### 4.1 Vendor Balances
**Purpose**: Outstanding supplier payments
**Columns**:
- Vendor Name
- Total Billed
- Total Paid
- Outstanding Balance
- Overdue Amount
- Days Overdue
**Filters**:
- Balance Type
- Overdue Only

#### 4.2 Purchase Order Details
**Purpose**: PO status tracking
**Columns**:
- PO Number
- Vendor
- Order Date
- Total Amount
- Received Amount
- Pending Amount
- Status
**Filters**:
- Date Range
- Vendor
- Status

#### 4.3 Payable Aging Summary
**Purpose**: Age analysis of payables
**Columns**:
- Vendor
- Current
- 1-30 Days
- 31-60 Days
- 61-90 Days
- Over 90 Days
- Total Outstanding
**Filters**:
- Minimum Balance

### 5. Activity Reports

#### 5.1 Activity Logs & Audit Trail
**Purpose**: Track system changes
**Columns**:
- Date/Time
- User
- Action
- Entity Type
- Entity ID
- Old Value
- New Value
- IP Address
**Filters**:
- Date Range
- User
- Action Type
- Entity Type

---

## Technical Architecture

### Frontend Stack
- **Framework**: Next.js 14 with App Router
- **UI Components**: Tailwind CSS + Headless UI
- **Data Tables**: TanStack Table (React Table v8)
- **Charts**: Recharts or Chart.js
- **Date Picker**: React Date Picker
- **Export**: xlsx, jsPDF, react-to-print

### Backend Stack
- **API Routes**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Caching**: Redis for report caching
- **Export Generation**: Node.js streams for large exports

### Report Generation Flow
```
User Request → API Route → MongoDB Aggregation → Data Processing → Response
                   ↓              ↓                    ↓
              Cache Check    Index Usage         Format/Export
```

---

## Implementation Steps

### Phase 1: Core Infrastructure (Week 1)

#### Step 1: Database Layer
```typescript
// models/Report.ts
interface ReportConfig {
  id: string;
  name: string;
  category: string;
  description: string;
  requiredCollections: string[];
  aggregationPipeline: any[];
  columns: ReportColumn[];
  filters: ReportFilter[];
  defaultSort: SortConfig;
  exportFormats: string[];
}

// utils/reportGenerator.ts
class ReportGenerator {
  async generateReport(config: ReportConfig, params: ReportParams) {
    // 1. Validate parameters
    // 2. Build aggregation pipeline
    // 3. Execute query
    // 4. Format results
    // 5. Handle pagination
    // 6. Cache results
  }
}
```

#### Step 2: API Routes Structure
```
/api/reports/
  ├── sales/
  │   ├── by-customer/route.ts
  │   ├── by-item/route.ts
  │   ├── by-salesperson/route.ts
  │   └── returns/route.ts
  ├── inventory/
  │   ├── summary/route.ts
  │   ├── valuation/route.ts
  │   ├── aging/route.ts
  │   └── movement/route.ts
  ├── receivables/
  │   ├── balances/route.ts
  │   ├── invoices/route.ts
  │   └── aging/route.ts
  └── export/
      └── [reportId]/route.ts
```

#### Step 3: Report Configuration
```typescript
// config/reports/salesByCustomer.ts
export const salesByCustomerReport: ReportConfig = {
  id: 'sales-by-customer',
  name: 'Sales by Customer',
  category: 'sales',
  columns: [
    { key: 'customerName', label: 'Customer Name', type: 'string' },
    { key: 'invoiceCount', label: 'Invoice Count', type: 'number' },
    { key: 'totalSales', label: 'Total Sales', type: 'currency' },
    { key: 'salesWithTax', label: 'Sales with Tax', type: 'currency' }
  ],
  filters: [
    { key: 'dateRange', type: 'dateRange', label: 'Date Range' },
    { key: 'customerType', type: 'select', options: ['All', 'B2B', 'B2C'] }
  ],
  aggregationPipeline: [
    // MongoDB aggregation stages
  ]
};
```

### Phase 2: Frontend Components (Week 2)

#### Step 1: Report Layout
```typescript
// components/reports/ReportLayout.tsx
interface ReportLayoutProps {
  title: string;
  filters: React.ReactNode;
  actions: React.ReactNode;
  children: React.ReactNode;
}

// components/reports/ReportTable.tsx
interface ReportTableProps {
  columns: Column[];
  data: any[];
  pagination: PaginationConfig;
  onSort: (column: string) => void;
  onPageChange: (page: number) => void;
}
```

#### Step 2: Filter Components
```typescript
// components/reports/filters/DateRangeFilter.tsx
// components/reports/filters/SelectFilter.tsx
// components/reports/filters/SearchFilter.tsx
// components/reports/filters/NumberRangeFilter.tsx
```

#### Step 3: Export Components
```typescript
// components/reports/ExportMenu.tsx
interface ExportMenuProps {
  reportId: string;
  params: any;
  formats: ('pdf' | 'excel' | 'csv')[];
}
```

### Phase 3: Report Pages (Week 3)

#### Step 1: Report Category Pages
```typescript
// app/dashboard/reports/sales/page.tsx
// app/dashboard/reports/inventory/page.tsx
// app/dashboard/reports/receivables/page.tsx
// app/dashboard/reports/payables/page.tsx
```

#### Step 2: Individual Report Pages
```typescript
// app/dashboard/reports/sales/by-customer/page.tsx
export default function SalesByCustomerReport() {
  const [filters, setFilters] = useState(defaultFilters);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Fetch report data
  // Handle filtering
  // Handle sorting
  // Handle pagination
  // Handle export
}
```

### Phase 4: Advanced Features (Week 4)

#### Step 1: Report Scheduling
```typescript
// models/ScheduledReport.ts
interface ScheduledReport {
  reportId: string;
  userId: string;
  schedule: CronExpression;
  recipients: string[];
  format: 'pdf' | 'excel';
  filters: any;
}
```

#### Step 2: Custom Report Builder
```typescript
// components/reports/CustomReportBuilder.tsx
// Allow users to:
// - Select data source
// - Choose columns
// - Add filters
// - Configure grouping
// - Save custom reports
```

#### Step 3: Dashboard Integration
```typescript
// components/dashboard/ReportWidget.tsx
interface ReportWidgetProps {
  reportId: string;
  title: string;
  refreshInterval?: number;
  compact?: boolean;
}
```

---

## API Design

### Standard Report API Response
```typescript
interface ReportResponse {
  success: boolean;
  data: {
    results: any[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
    summary?: {
      [key: string]: any; // Aggregated metrics
    };
    metadata: {
      generatedAt: string;
      executionTime: number;
      cached: boolean;
    };
  };
  error?: string;
}
```

### API Endpoints

#### GET /api/reports/{category}/{reportType}
Query Parameters:
- `startDate`: ISO date string
- `endDate`: ISO date string
- `page`: number (default: 1)
- `pageSize`: number (default: 50, max: 200)
- `sortBy`: column name
- `sortOrder`: 'asc' | 'desc'
- `filters`: JSON string of additional filters
- `export`: 'pdf' | 'excel' | 'csv' (optional)

#### POST /api/reports/custom
Create custom report with aggregation pipeline

#### GET /api/reports/scheduled
List scheduled reports for user

#### POST /api/reports/scheduled
Create new scheduled report

---

## MongoDB Aggregation Queries

### Sales by Customer
```javascript
const salesByCustomerPipeline = [
  // Match date range
  {
    $match: {
      'dates.orderDate': {
        $gte: startDate,
        $lte: endDate
      },
      status: { $in: ['Completed', 'Delivered'] }
    }
  },
  // Group by customer
  {
    $group: {
      _id: '$customer.email',
      customerName: { $first: '$customer.name' },
      company: { $first: '$customer.company' },
      isB2B: { $first: '$customer.isB2B' },
      invoiceCount: { $sum: 1 },
      totalSales: { $sum: '$financial.subtotal' },
      totalTax: { $sum: '$financial.totalTax' },
      salesWithTax: { $sum: '$financial.grandTotal' }
    }
  },
  // Calculate average order value
  {
    $addFields: {
      averageOrderValue: { $divide: ['$totalSales', '$invoiceCount'] }
    }
  },
  // Sort by total sales
  {
    $sort: { totalSales: -1 }
  }
];
```

### Inventory Summary
```javascript
const inventorySummaryPipeline = [
  // Lookup current inventory
  {
    $lookup: {
      from: 'products',
      localField: '_id',
      foreignField: '_id',
      as: 'product'
    }
  },
  {
    $unwind: '$product'
  },
  // Calculate stock values
  {
    $project: {
      sku: '$product.sku',
      name: '$product.name',
      category: '$product.category.name',
      brand: '$product.brand',
      currentStock: '$product.inventory.currentStock',
      availableStock: '$product.inventory.availableStock',
      reservedStock: '$product.inventory.reservedStock',
      unitCost: '$product.pricing.cost',
      stockValue: {
        $multiply: ['$product.inventory.currentStock', '$product.pricing.cost']
      }
    }
  },
  // Add warehouse breakdown
  {
    $lookup: {
      from: 'warehouses',
      let: { locations: '$product.inventory.locations' },
      pipeline: [
        {
          $match: {
            $expr: {
              $in: ['$_id', '$$locations.warehouseId']
            }
          }
        }
      ],
      as: 'warehouses'
    }
  }
];
```

### Customer Balance (Receivables)
```javascript
const customerBalancePipeline = [
  // Get all completed sales
  {
    $match: {
      status: { $in: ['Completed', 'Delivered'] }
    }
  },
  // Group by customer
  {
    $group: {
      _id: '$customer.email',
      customerName: { $first: '$customer.name' },
      company: { $first: '$customer.company' },
      totalInvoiced: { $sum: '$financial.grandTotal' },
      orders: {
        $push: {
          orderId: '$_id',
          amount: '$financial.grandTotal',
          paidAmount: '$payment.paidAmount',
          dueDate: '$dates.dueDate',
          paymentStatus: '$payment.status'
        }
      }
    }
  },
  // Calculate balances
  {
    $addFields: {
      totalPaid: {
        $sum: {
          $map: {
            input: '$orders',
            as: 'order',
            in: { $ifNull: ['$$order.paidAmount', 0] }
          }
        }
      },
      outstandingBalance: {
        $subtract: ['$totalInvoiced', '$totalPaid']
      }
    }
  },
  // Calculate overdue amounts
  {
    $addFields: {
      overdueAmount: {
        $sum: {
          $map: {
            input: '$orders',
            as: 'order',
            in: {
              $cond: [
                {
                  $and: [
                    { $lt: ['$$order.dueDate', new Date()] },
                    { $gt: [{ $subtract: ['$$order.amount', '$$order.paidAmount'] }, 0] }
                  ]
                },
                { $subtract: ['$$order.amount', '$$order.paidAmount'] },
                0
              ]
            }
          }
        }
      }
    }
  }
];
```

---

## Performance Considerations

### 1. Indexing Strategy
```javascript
// Create indexes for common query patterns
db.salesorders.createIndex({ 'dates.orderDate': 1, 'status': 1 });
db.salesorders.createIndex({ 'customer.email': 1 });
db.salesorders.createIndex({ 'salesPersonId': 1 });
db.products.createIndex({ 'category.id': 1, 'brand': 1 });
db.products.createIndex({ 'inventory.currentStock': 1 });
db.purchaseorders.createIndex({ 'dates.orderDate': 1, 'status': 1 });
db.purchaseorders.createIndex({ 'supplierId': 1 });
```

### 2. Caching Strategy
- Cache report results for 5-15 minutes
- Use Redis with key pattern: `report:{reportId}:{hash(params)}`
- Invalidate cache on data updates
- Implement cache warming for popular reports

### 3. Pagination
- Default page size: 50 records
- Maximum page size: 200 records
- Use cursor-based pagination for large datasets
- Include total count only on first page

### 4. Query Optimization
- Use projection to limit fields
- Implement query timeout (30 seconds)
- Use aggregation pipeline optimization
- Consider materialized views for complex reports

### 5. Export Optimization
- Stream large exports
- Generate exports asynchronously
- Store generated files temporarily (1 hour)
- Compress large files

---

## Testing Strategy

### 1. Unit Tests
- Test aggregation pipelines
- Test data formatting functions
- Test filter validation
- Test export generators

### 2. Integration Tests
- Test API endpoints
- Test database queries
- Test caching behavior
- Test authentication/authorization

### 3. Performance Tests
- Load test with large datasets
- Test concurrent report generation
- Test export performance
- Monitor memory usage

### 4. E2E Tests
- Test report workflows
- Test filter interactions
- Test export functionality
- Test error handling

---

## Security Considerations

### 1. Authorization
- Role-based access to reports
- Data-level security (e.g., sales person sees only their data)
- Audit trail for report access

### 2. Input Validation
- Sanitize filter inputs
- Validate date ranges
- Prevent injection attacks
- Rate limiting on API

### 3. Data Privacy
- Mask sensitive data in exports
- Implement data retention policies
- GDPR compliance for customer data

---

## Deployment Checklist

### Pre-deployment
- [ ] All reports tested with production-like data
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Documentation updated
- [ ] Export templates created

### Deployment
- [ ] Deploy backend changes
- [ ] Run database migrations/indexes
- [ ] Deploy frontend changes
- [ ] Configure caching
- [ ] Set up monitoring

### Post-deployment
- [ ] Monitor performance metrics
- [ ] Gather user feedback
- [ ] Fix any reported issues
- [ ] Plan next phase features

---

## Future Enhancements

### Phase 5 (Month 2)
- Real-time dashboards with WebSocket
- Advanced custom report builder
- Scheduled report automation
- Email delivery integration
- Report templates library

### Phase 6 (Month 3)
- Machine learning insights
- Predictive analytics
- Anomaly detection
- Natural language queries
- Mobile app integration

---

## References
- MongoDB Aggregation Framework: https://docs.mongodb.com/manual/aggregation/
- Next.js API Routes: https://nextjs.org/docs/api-routes/introduction
- TanStack Table: https://tanstack.com/table/v8
- Report Design Best Practices: Internal documentation
