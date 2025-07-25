// Analytics-related constants

export const ANALYTICS_DATE_RANGES = {
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  LAST_7_DAYS: 'last7days',
  LAST_30_DAYS: 'last30days',
  THIS_MONTH: 'thisMonth',
  LAST_MONTH: 'lastMonth',
  THIS_QUARTER: 'thisQuarter',
  LAST_QUARTER: 'lastQuarter',
  THIS_YEAR: 'thisYear',
  LAST_YEAR: 'lastYear',
  CUSTOM: 'custom'
} as const;

export const ANALYTICS_METRICS = {
  // Sales metrics
  TOTAL_REVENUE: 'totalRevenue',
  TOTAL_ORDERS: 'totalOrders',
  AVERAGE_ORDER_VALUE: 'avgOrderValue',
  CONVERSION_RATE: 'conversionRate',
  SALES_GROWTH: 'salesGrowth',
  
  // Inventory metrics
  INVENTORY_TURNOVER: 'inventoryTurnover',
  STOCK_OUT_RATE: 'stockOutRate',
  DAYS_OF_SUPPLY: 'daysOfSupply',
  DEAD_STOCK_VALUE: 'deadStockValue',
  
  // Customer metrics
  CUSTOMER_LIFETIME_VALUE: 'customerLifetimeValue',
  CUSTOMER_ACQUISITION_COST: 'customerAcquisitionCost',
  RETENTION_RATE: 'retentionRate',
  CHURN_RATE: 'churnRate',
  
  // Procurement metrics
  PURCHASE_ORDER_CYCLE_TIME: 'purchaseOrderCycleTime',
  SUPPLIER_ON_TIME_DELIVERY: 'supplierOnTimeDelivery',
  COST_SAVINGS: 'costSavings',
  SUPPLIER_DEFECT_RATE: 'supplierDefectRate'
} as const;

export const ORDER_STATUSES = {
  DRAFT: 'Draft',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  PACKED: 'Packed',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded'
} as const;

export const PURCHASE_ORDER_STATUSES = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  ORDERED: 'Ordered',
  PARTIAL: 'Partial',
  RECEIVED: 'Received',
  CANCELLED: 'Cancelled'
} as const;

export const PAYMENT_STATUSES = {
  PENDING: 'pending',
  PARTIAL: 'partial',
  PAID: 'paid',
  OVERDUE: 'overdue',
  REFUNDED: 'refunded'
} as const;

export const CUSTOMER_SEGMENTS = {
  B2B: 'B2B',
  B2C: 'B2C',
  VIP: 'VIP',
  NEW: 'New',
  RETURNING: 'Returning',
  CHURNED: 'Churned'
} as const;

// Time periods for trend analysis
export const TREND_PERIODS = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  YEARLY: 'yearly'
} as const;

// Chart types
export const CHART_TYPES = {
  LINE: 'line',
  BAR: 'bar',
  PIE: 'pie',
  AREA: 'area',
  SCATTER: 'scatter',
  HEATMAP: 'heatmap',
  GAUGE: 'gauge'
} as const;
