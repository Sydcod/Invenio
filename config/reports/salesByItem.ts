import { ReportConfig, ReportParams, CommonFilters } from '@/libs/reports/types';
import { getDateRangeFilter, formatCurrency, formatNumber, formatPercentage, safeDivide } from '@/libs/reports/utils';

export const salesByItemReport: ReportConfig = {
  id: 'sales-by-item',
  name: 'Sales by Item',
  category: 'sales',
  description: 'Analyze product performance, identify best sellers and slow movers',
  requiredCollections: ['salesorders'],
  
  columns: [
    {
      key: 'sku',
      label: 'SKU',
      type: 'string',
      sortable: true
    },
    {
      key: 'productName',
      label: 'Product Name',
      type: 'string',
      sortable: true
    },
    {
      key: 'category',
      label: 'Category',
      type: 'string',
      sortable: true
    },
    {
      key: 'brand',
      label: 'Brand',
      type: 'string',
      sortable: true
    },
    {
      key: 'quantitySold',
      label: 'Qty Sold',
      type: 'number',
      sortable: true,
      align: 'right',
      format: formatNumber
    },
    {
      key: 'revenue',
      label: 'Revenue',
      type: 'currency',
      sortable: true,
      align: 'right',
      format: formatCurrency
    },
    {
      key: 'cost',
      label: 'Cost',
      type: 'currency',
      sortable: true,
      align: 'right',
      format: formatCurrency
    },
    {
      key: 'profit',
      label: 'Profit',
      type: 'currency',
      sortable: true,
      align: 'right',
      format: formatCurrency
    },
    {
      key: 'margin',
      label: 'Margin %',
      type: 'percentage',
      sortable: true,
      align: 'right',
      format: (value: number) => formatPercentage(value, 1)
    },
    {
      key: 'orderCount',
      label: 'Orders',
      type: 'number',
      sortable: true,
      align: 'right'
    }
  ],
  
  filters: [
    CommonFilters.dateRange('dateRange'),
    {
      key: 'category',
      label: 'Category',
      type: 'multiSelect',
      options: [], // Will be populated dynamically
      defaultValue: [],
      dynamic: true,
      dynamicConfig: {
        type: 'category',
        collection: 'products'
      }
    },
    {
      key: 'brand',
      label: 'Brand',
      type: 'multiSelect',
      options: [], // Will be populated dynamically
      defaultValue: [],
      dynamic: true,
      dynamicConfig: {
        type: 'brand',
        collection: 'products'
      }
    },
    {
      key: 'status',
      label: 'Order Status',
      type: 'multiSelect',
      options: [
        { value: 'Completed', label: 'Completed' },
        { value: 'Delivered', label: 'Delivered' },
        { value: 'Processing', label: 'Processing' },
        { value: 'Shipped', label: 'Shipped' },
        { value: 'Confirmed', label: 'Confirmed' }
      ],
      defaultValue: ['Completed', 'Delivered']
    },
    {
      key: 'minQuantity',
      label: 'Min Quantity',
      type: 'number',
      placeholder: 'Minimum quantity sold'
    },
    {
      key: 'performanceType',
      label: 'Performance',
      type: 'select',
      options: [
        { value: 'all', label: 'All Products' },
        { value: 'top', label: 'Top Performers' },
        { value: 'slow', label: 'Slow Movers' }
      ],
      defaultValue: 'all'
    },
    CommonFilters.search('Search products...')
  ],
  
  defaultSort: {
    column: 'revenue',
    direction: 'desc'
  },
  
  exportFormats: ['excel', 'csv', 'pdf'],
  
  aggregationPipeline: (params: ReportParams) => {
    const pipeline: any[] = [];
    const { startDate, endDate } = getDateRangeFilter(params);
    
    // 1. Match stage - filter by date and status
    const matchStage: any = {
      'dates.orderDate': {
        $gte: startDate.toISOString(),
        $lte: endDate.toISOString()
      }
    };
    
    // Filter by status
    if (params.filters.status && params.filters.status.length > 0) {
      matchStage.status = { $in: params.filters.status };
    }
    
    pipeline.push({ $match: matchStage });
    
    // 2. Unwind items array to analyze individual products
    pipeline.push({ $unwind: '$items' });
    
    // 3. Apply product-level filters
    const itemMatchStage: any = {};
    
    if (params.filters.category && params.filters.category.length > 0) {
      itemMatchStage['items.category'] = { $in: params.filters.category };
    }
    
    if (params.filters.brand && params.filters.brand.length > 0) {
      itemMatchStage['items.brand'] = { $in: params.filters.brand };
    }
    
    if (params.filters.search) {
      itemMatchStage.$or = [
        { 'items.name': { $regex: params.filters.search, $options: 'i' } },
        { 'items.sku': { $regex: params.filters.search, $options: 'i' } },
        { 'items.productId': { $regex: params.filters.search, $options: 'i' } }
      ];
    }
    
    if (Object.keys(itemMatchStage).length > 0) {
      pipeline.push({ $match: itemMatchStage });
    }
    
    // 4. Group by product
    pipeline.push({
      $group: {
        _id: '$items.productId',
        sku: { $first: '$items.sku' },
        productName: { $first: '$items.name' },
        category: { $first: '$items.category' },
        brand: { $first: '$items.brand' },
        quantitySold: { $sum: '$items.quantity' },
        revenue: { $sum: { $multiply: ['$items.quantity', '$items.unitPrice'] } },
        cost: { $sum: { $multiply: ['$items.quantity', '$items.unitCost'] } },
        totalAmount: { $sum: '$items.totalAmount' },
        orderCount: { $sum: 1 },
        discountTotal: { $sum: '$items.discount' },
        
        // For average calculations
        totalOrders: { $addToSet: '$orderNumber' }
      }
    });
    
    // 5. Calculate profit and margin
    pipeline.push({
      $addFields: {
        profit: { $subtract: ['$revenue', '$cost'] },
        margin: {
          $cond: {
            if: { $eq: ['$revenue', 0] },
            then: 0,
            else: { $divide: [{ $subtract: ['$revenue', '$cost'] }, '$revenue'] }
          }
        },
        uniqueOrderCount: { $size: '$totalOrders' }
      }
    });
    
    // 6. Project final fields
    pipeline.push({
      $project: {
        _id: 0,
        productId: '$_id',
        sku: 1,
        productName: 1,
        category: 1,
        brand: 1,
        quantitySold: 1,
        revenue: { $round: ['$revenue', 2] },
        cost: { $round: ['$cost', 2] },
        profit: { $round: ['$profit', 2] },
        margin: { $round: ['$margin', 4] },
        orderCount: '$uniqueOrderCount',
        avgOrderValue: {
          $round: [
            { $divide: ['$revenue', { $cond: [{ $eq: ['$uniqueOrderCount', 0] }, 1, '$uniqueOrderCount'] }] },
            2
          ]
        }
      }
    });
    
    // 7. Filter by minimum quantity if specified
    if (params.filters.minQuantity && params.filters.minQuantity > 0) {
      pipeline.push({
        $match: {
          quantitySold: { $gte: params.filters.minQuantity }
        }
      });
    }
    
    // 8. Filter by performance type
    if (params.filters.performanceType === 'top') {
      // Top performers - sort by revenue and take top 20%
      pipeline.push({ $sort: { revenue: -1 } });
      pipeline.push({ $limit: Math.ceil(200 * 0.2) }); // Top 20% of max results
    } else if (params.filters.performanceType === 'slow') {
      // Slow movers - items with low quantity relative to average
      pipeline.push({
        $match: {
          quantitySold: { $lte: 5 } // Items sold 5 or fewer times
        }
      });
    }
    
    // 9. Add final sort stage
    if (params.sort) {
      const sortOrder = params.sort.direction === 'asc' ? 1 : -1;
      pipeline.push({ $sort: { [params.sort.column]: sortOrder } });
    } else {
      // Default sort by revenue descending
      pipeline.push({ $sort: { revenue: -1 } });
    }
    
    return pipeline;
  },
  
  summary: (data: any[]) => {
    const totalProducts = data.length;
    const totalRevenue = data.reduce((sum, row) => sum + row.revenue, 0);
    const totalCost = data.reduce((sum, row) => sum + row.cost, 0);
    const totalProfit = data.reduce((sum, row) => sum + row.profit, 0);
    const totalQuantity = data.reduce((sum, row) => sum + row.quantitySold, 0);
    const avgMargin = safeDivide(totalProfit, totalRevenue);
    
    // Top performers
    const sortedByRevenue = [...data].sort((a, b) => b.revenue - a.revenue);
    const top5Products = sortedByRevenue.slice(0, 5);
    const top5Revenue = top5Products.reduce((sum, row) => sum + row.revenue, 0);
    const top5Percentage = safeDivide(top5Revenue, totalRevenue);
    
    // Category breakdown
    const categoryBreakdown = data.reduce((acc, row) => {
      if (!acc[row.category]) {
        acc[row.category] = { count: 0, revenue: 0, quantity: 0 };
      }
      acc[row.category].count++;
      acc[row.category].revenue += row.revenue;
      acc[row.category].quantity += row.quantitySold;
      return acc;
    }, {} as Record<string, { count: number; revenue: number; quantity: number }>);
    
    return {
      totalProducts,
      totalRevenue,
      totalCost,
      totalProfit,
      totalQuantity,
      avgMargin,
      avgRevenuePerProduct: safeDivide(totalRevenue, totalProducts),
      avgQuantityPerProduct: safeDivide(totalQuantity, totalProducts),
      top5Products,
      top5Revenue,
      top5Percentage,
      categoryBreakdown
    };
  }
};
