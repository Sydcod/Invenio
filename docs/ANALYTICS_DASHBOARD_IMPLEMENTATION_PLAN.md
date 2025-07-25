# Analytics Dashboard Implementation Plan

## Overview

This document outlines the comprehensive plan for implementing a robust Analytics Dashboard for the Invenio inventory management system. The dashboard will provide advanced metrics, KPIs, visualizations, and insights to help users make data-driven decisions about their inventory, sales, procurement, and customer relationships.

## 1. Project Structure and Code Organization

Based on the analysis of the existing codebase, we will organize the Analytics Dashboard implementation as follows:

### 1.1. Frontend Structure

```
/app/dashboard/analytics/           # Main route for the Analytics Dashboard
  |- page.tsx                      # Main Analytics Dashboard page
  |- layout.tsx                    # Layout for Analytics sections (if needed)
  |- [section]/                    # Dynamic routes for detailed analytics sections
     |- page.tsx                   # Individual analytics section pages

/components/dashboard/analytics/    # Reusable Analytics Dashboard components
  |- AnalyticsCard.tsx             # Summary metric/KPI card component
  |- AnalyticsFilter.tsx           # Global filter component for analytics data
  |- charts/                       # Chart components directory
     |- AreaChart.tsx              # Time-series area chart component
     |- BarChart.tsx               # Bar chart component
     |- PieChart.tsx               # Pie chart component
     |- etc.
  |- tables/                       # Table components for detailed data
     |- MetricsTable.tsx           # Tabular data presentation component
  |- sections/                     # Section-specific components
     |- SalesSummary.tsx           # Sales analytics section
     |- InventorySummary.tsx       # Inventory analytics section
     |- ProcurementSummary.tsx     # Procurement analytics section
     |- CustomerAnalytics.tsx      # Customer analytics section
     |- FinancialMetrics.tsx       # Financial metrics section
```

### 1.2. Backend Structure

```
/app/api/analytics/                  # API routes for analytics data
  |- route.ts                       # Main analytics API router
  |- dashboard/                     # Dashboard summary endpoints
     |- route.ts                    # Dashboard summary data endpoint
  |- sales/                         # Sales analytics endpoints
     |- route.ts                    # Sales metrics endpoint
  |- inventory/                     # Inventory analytics endpoints
     |- route.ts                    # Inventory metrics endpoint
  |- procurement/                   # Procurement analytics endpoints
     |- route.ts                    # Procurement metrics endpoint
  |- customers/                     # Customer analytics endpoints
     |- route.ts                    # Customer metrics endpoint
```

### 1.3. Models and Utilities

```
/libs/analytics/                    # Analytics utilities
  |- metrics.ts                     # Metrics calculation functions
  |- aggregations.ts                # MongoDB aggregation pipeline builders (for direct database interaction)
  |- transformers.ts                # Data transformation utilities
  |- constants.ts                   # Analytics-related constants

/models/                            # No new models needed, will use existing models
```

These utilities will enable direct communication between the application and MongoDB without relying on external tools like MCP at runtime.

## 2. Database Schema and Collections

> **Note:** The MCP server is used only as a development and analysis tool to explore the database structure. The actual implementation will connect directly to MongoDB via the application's backend services. End users will not interact with MCP.

The Analytics Dashboard will utilize the following MongoDB collections from the test database:

1. **products**: For product inventory analytics
2. **salesorders**: For sales performance analytics
3. **purchaseorders**: For procurement analytics
4. **customers**: For customer analytics
5. **suppliers**: For supplier analytics
6. **warehouses**: For warehouse and location analytics
7. **categories**: For category performance analysis

## 3. Key Features and Implementation Details

### 3.1. Dashboard Navigation

We'll update the DashboardSidebar component to include the Analytics navigation item:

```typescript
// In components/dashboard/DashboardSidebar.tsx
const navigation = [
  { name: 'Overview', href: '/dashboard', icon: HomeIcon },
  // ... existing navigation items
  { name: 'Analytics', href: '/dashboard/analytics', icon: ChartPieIcon }, // Add this line
  { name: 'Reports', href: '/dashboard/reports', icon: ChartBarIcon },
  // ... other navigation items
];
```

### 3.2. Analytics Dashboard Page

The main Analytics Dashboard page will:
- Load summary metrics via API
- Provide global filtering options
- Present high-level KPIs as cards
- Include key visualizations for main business metrics
- Offer navigation to detailed analytics sections

### 3.3. API Implementation

Each API endpoint will use MongoDB's aggregation framework to calculate metrics efficiently:

#### Example: Sales Analytics Endpoint

```typescript
// In app/api/analytics/sales/route.ts
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import SalesOrder from '@/models/SalesOrder';
import { salesMetricsPipeline } from '@/libs/analytics/aggregations';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const warehouse = searchParams.get('warehouse');
    
    const pipeline = salesMetricsPipeline({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      warehouseId: warehouse,
    });
    
    const data = await SalesOrder.aggregate(pipeline);
    
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error fetching sales analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales analytics' },
      { status: 500 }
    );
  }
}
```

### 3.4. Metrics and Aggregations Library

The analytics library will contain reusable aggregation pipelines and transformation functions:

```typescript
// In libs/analytics/aggregations.ts
export const salesMetricsPipeline = ({ startDate, endDate, warehouseId }) => {
  const match = {};
  
  if (startDate || endDate) {
    match['dates.orderDate'] = {};
    if (startDate) match['dates.orderDate'].$gte = startDate;
    if (endDate) match['dates.orderDate'].$lte = endDate;
  }
  
  if (warehouseId) match['warehouseId'] = new mongoose.Types.ObjectId(warehouseId);
  
  return [
    { $match: match },
    {
      $facet: {
        totalSales: [
          { $group: { 
            _id: null, 
            count: { $sum: 1 }, 
            revenue: { $sum: '$financial.grandTotal' } 
          }}
        ],
        salesByStatus: [
          { $group: { 
            _id: '$status', 
            count: { $sum: 1 }, 
            revenue: { $sum: '$financial.grandTotal' } 
          }},
          { $project: { 
            status: '$_id', 
            count: 1, 
            revenue: 1, 
            _id: 0 
          }}
        ],
        // Other metrics as needed...
      }
    }
  ];
};

// Similar pipeline builders for inventory, procurement, customers, etc.
```

### 3.5. Component Implementation

Each component will be designed for reusability and will handle its own data fetching and state:

```typescript
// In components/dashboard/analytics/sections/SalesSummary.tsx
'use client';

import { useState, useEffect } from 'react';
import AnalyticsCard from '../AnalyticsCard';
import { AreaChart } from '../charts/AreaChart';
import { formatCurrency } from '@/libs/utils';

export default function SalesSummary({ filters }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams();
        if (filters.startDate) queryParams.append('startDate', filters.startDate);
        if (filters.endDate) queryParams.append('endDate', filters.endDate);
        if (filters.warehouse) queryParams.append('warehouse', filters.warehouse);
        
        const response = await fetch(`/api/analytics/sales?${queryParams}`);
        if (!response.ok) throw new Error('Failed to fetch sales analytics');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [filters]);

  if (loading) return <div>Loading sales analytics...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return null;

  const { totalSales, salesByStatus } = data;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-medium">Sales Performance</h2>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AnalyticsCard 
          title="Total Revenue" 
          value={formatCurrency(totalSales[0]?.revenue || 0)}
          subtitle={`${totalSales[0]?.count || 0} orders`}
          icon={CurrencyDollarIcon}
        />
        {/* Other KPI cards */}
      </div>
      
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium mb-4">Revenue Trend</h3>
        <div className="h-80">
          <AreaChart data={revenueData} />
        </div>
      </div>
      
      {/* Other visualizations */}
    </div>
  );
}
```

## 4. Metric Definitions and Calculations

This section defines the exact calculations for key metrics to ensure accuracy and consistency.

### 4.1. Sales Metrics

| Metric | Definition | Calculation |
|--------|------------|-------------|
| Total Sales Revenue | Total revenue generated from all sales | `SUM(salesorders.financial.grandTotal)` |
| Average Order Value | Average revenue per order | `AVG(salesorders.financial.grandTotal)` |
| Sales Growth Rate | Percentage change in sales between periods | `(CurrentPeriodSales - PreviousPeriodSales) / PreviousPeriodSales * 100` |
| Order Conversion Rate | Percentage of orders moved to completed status | `COUNT(salesorders WHERE status = 'completed') / COUNT(salesorders) * 100` |
| B2B vs B2C Sales | Sales split between business and consumer customers | Segmentation by `customer.isB2B` |
| Gross Profit Margin | Profit as percentage of revenue | `(Revenue - COGS) / Revenue * 100` |
| Top Products | Products with highest revenue contribution | Sort by `SUM(orderItems.total)` grouped by product |

### 4.2. Inventory Metrics

| Metric | Definition | Calculation |
|--------|------------|-------------|
| Inventory Turnover | Number of times inventory is sold and replaced | `COGS / Average Inventory Value` |
| Days of Supply | Average days inventory lasts at current usage | `Average Inventory / (COGS / 365)` |
| Stock-to-Sales Ratio | Ratio of inventory value to sales revenue | `Inventory Value / Sales Revenue` |
| Low Stock Items | Products below reorder point | `COUNT(products WHERE inventory.currentStock < inventory.reorderPoint)` |
| Dead Stock | Products with no sales for specified period | `COUNT(products NOT IN (salesorders.items.productId) for period)` |

### 4.3. Procurement Metrics

| Metric | Definition | Calculation |
|--------|------------|-------------|
| Average Order Cycle Time | Average days from order to delivery | `AVG(purchaseorders.dates.actualDelivery - purchaseorders.dates.orderDate)` |
| On-time Delivery Rate | Percentage of deliveries received on time | `COUNT(po WHERE dates.actualDelivery <= dates.expectedDelivery) / COUNT(po) * 100` |
| Procurement Spend | Total amount spent on purchasing | `SUM(purchaseorders.financial.grandTotal)` |
| Supplier Performance | Scoring based on delivery time, quality, etc. | Composite score from multiple metrics |

### 4.4. Customer Metrics

| Metric | Definition | Calculation |
|--------|------------|-------------|
| Customer Lifetime Value | Total revenue expected from customer relationship | `AVG(Order Value) * Purchase Frequency * Customer Lifespan` |
| Customer Acquisition Cost | Cost to acquire a new customer | Calculated from marketing expenses |
| Customer Retention Rate | Percentage of customers who return | `(Customers at end - New Customers) / Customers at start * 100` |
| Average Purchase Frequency | Average number of purchases per customer | `COUNT(orders) / COUNT(distinct customers)` |

## 5. Implementation Phases

The implementation will follow these phases:

### Phase 1: Foundation (Weeks 1-2)

1. Create basic file structure and routes
2. Update sidebar navigation
3. Implement global filter components
4. Create base API endpoints for top-level metrics
5. Implement core reusable components (cards, basic charts)

### Phase 2: Core Analytics Dashboards (Weeks 3-5)

1. Implement Sales Analytics dashboard and API endpoints
2. Implement Inventory Analytics dashboard and API endpoints
3. Implement Procurement Analytics dashboard and API endpoints
4. Implement Customer Analytics dashboard and API endpoints

### Phase 3: Advanced Features and Optimization (Weeks 6-8)

1. Implement drill-down capabilities for detailed analysis
2. Add export functionality for reports/data
3. Implement data caching for performance
4. Add anomaly detection and automated insights
5. Optimize queries and frontend performance

### Phase 4: Testing and Refinement (Weeks 9-10)

1. Comprehensive testing of all features
2. Performance testing and optimization
3. User feedback collection and refinements
4. Documentation

## 6. Technical Considerations

### 6.1. Performance Optimization

- Use efficient MongoDB aggregation pipelines
- Implement caching for frequently accessed metrics
- Lazy load sections and visualizations
- Use pagination for large datasets
- Consider pre-computing some metrics on a schedule

### 6.2. Data Accuracy and Consistency

- Define clear metric calculations documented in code
- Add validation for unusual data patterns
- Implement proper error handling for edge cases
- Create monitoring for data pipeline failures

### 6.3. Scalability

- Design aggregations to work efficiently with growing data volume
- Use proper indexing on MongoDB collections
- Consider time-based partitioning for historical analytics
- Implement data retention policies for analytics data

### 6.4. Security

- Ensure proper access control for sensitive metrics
- Validate all API inputs
- Avoid exposing sensitive data in responses
- Implement rate limiting on API endpoints

## 7. Dependencies and Libraries

- Charting: Recharts (already in use in the project)
- Date handling: date-fns
- Data grid: react-table or TanStack Table
- CSV export: react-csv

## 8. Testing Strategy

1. Unit tests for metric calculation functions
2. API endpoint tests with mock data
3. Component tests for UI elements
4. End-to-end tests for complete analytics workflows

## 9. Rollout Strategy

1. Develop in feature branch
2. Internal testing with sample data
3. Beta release with select users
4. Full release with documentation
5. Monitor and gather feedback for improvements

## 10. Success Criteria

The Analytics Dashboard implementation will be considered successful when:

1. All specified metrics are accurately calculated and displayed
2. Users can filter and interact with the dashboard effectively
3. The dashboard provides valuable insights for decision-making
4. Performance is acceptable (page load < 3s, interactions < 500ms)
5. The implementation is well-documented for future maintenance
