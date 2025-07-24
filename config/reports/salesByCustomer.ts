import { ReportConfig, ReportParams, CommonFilters } from '@/libs/reports/types';
import { getDateRangeFilter, formatCurrency, formatNumber, safeDivide } from '@/libs/reports/utils';

export const salesByCustomerReport: ReportConfig = {
  id: 'sales-by-customer',
  name: 'Sales by Customer',
  category: 'sales',
  description: 'Analyze revenue by customer, identify top customers and customer segments',
  requiredCollections: ['salesorders'],
  
  columns: [
    {
      key: 'customerName',
      label: 'Customer Name',
      type: 'string',
      sortable: true
    },
    {
      key: 'company',
      label: 'Company',
      type: 'string',
      sortable: true
    },
    {
      key: 'customerType',
      label: 'Type',
      type: 'string',
      sortable: true,
      format: (value: boolean) => value ? 'B2B' : 'B2C'
    },
    {
      key: 'invoiceCount',
      label: 'Orders',
      type: 'number',
      sortable: true,
      align: 'right'
    },
    {
      key: 'totalSales',
      label: 'Sales',
      type: 'currency',
      sortable: true,
      align: 'right',
      format: formatCurrency
    },
    {
      key: 'totalTax',
      label: 'Tax',
      type: 'currency',
      sortable: true,
      align: 'right',
      format: formatCurrency
    },
    {
      key: 'salesWithTax',
      label: 'Total',
      type: 'currency',
      sortable: true,
      align: 'right',
      format: formatCurrency
    },
    {
      key: 'averageOrderValue',
      label: 'Avg Order',
      type: 'currency',
      sortable: true,
      align: 'right',
      format: formatCurrency
    }
  ],
  
  filters: [
    CommonFilters.dateRange('dateRange'),
    {
      key: 'customerType',
      label: 'Customer Type',
      type: 'select',
      options: [
        { value: 'all', label: 'All Customers' },
        { value: 'b2b', label: 'B2B Only' },
        { value: 'b2c', label: 'B2C Only' }
      ],
      defaultValue: 'all'
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
      key: 'minAmount',
      label: 'Minimum Sales',
      type: 'number',
      placeholder: 'Min amount'
    },
    CommonFilters.search('Search customer...')
  ],
  
  defaultSort: {
    column: 'totalSales',
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
    
    // Filter by customer type
    if (params.filters.customerType === 'b2b') {
      matchStage['customer.isB2B'] = true;
    } else if (params.filters.customerType === 'b2c') {
      matchStage['customer.isB2B'] = { $ne: true };
    }
    
    // Search filter
    if (params.filters.search) {
      matchStage.$or = [
        { 'customer.name': { $regex: params.filters.search, $options: 'i' } },
        { 'customer.company': { $regex: params.filters.search, $options: 'i' } },
        { 'customer.email': { $regex: params.filters.search, $options: 'i' } }
      ];
    }
    
    pipeline.push({ $match: matchStage });
    
    // 2. Group by customer
    pipeline.push({
      $group: {
        _id: '$customer.email',
        customerName: { $first: '$customer.name' },
        company: { $first: '$customer.company' },
        customerType: { $first: '$customer.isB2B' },
        invoiceCount: { $sum: 1 },
        totalSales: { $sum: '$financial.subtotal' },
        totalTax: { $sum: '$financial.totalTax' },
        salesWithTax: { $sum: '$financial.grandTotal' },
        
        // For average calculation
        orderCount: { $sum: 1 },
        orderTotal: { $sum: '$financial.grandTotal' }
      }
    });
    
    // 3. Calculate average order value
    pipeline.push({
      $addFields: {
        averageOrderValue: {
          $cond: {
            if: { $eq: ['$orderCount', 0] },
            then: 0,
            else: { $divide: ['$orderTotal', '$orderCount'] }
          }
        }
      }
    });
    
    // 4. Project final fields
    pipeline.push({
      $project: {
        _id: 0,
        customerId: '$_id',
        customerName: 1,
        company: { $ifNull: ['$company', ''] },
        customerType: 1,
        invoiceCount: 1,
        totalSales: { $round: ['$totalSales', 2] },
        totalTax: { $round: ['$totalTax', 2] },
        salesWithTax: { $round: ['$salesWithTax', 2] },
        averageOrderValue: { $round: ['$averageOrderValue', 2] }
      }
    });
    
    // 5. Filter by minimum amount if specified
    if (params.filters.minAmount && params.filters.minAmount > 0) {
      pipeline.push({
        $match: {
          totalSales: { $gte: params.filters.minAmount }
        }
      });
    }
    
    // 6. Add sort stage (before pagination)
    if (params.sort) {
      const sortOrder = params.sort.direction === 'asc' ? 1 : -1;
      pipeline.push({ $sort: { [params.sort.column]: sortOrder } });
    } else {
      // Default sort by total sales descending
      pipeline.push({ $sort: { totalSales: -1 } });
    }
    
    return pipeline;
  },
  
  summary: (data: any[]) => {
    const totalCustomers = data.length;
    const totalRevenue = data.reduce((sum, row) => sum + row.salesWithTax, 0);
    const totalOrders = data.reduce((sum, row) => sum + row.invoiceCount, 0);
    const avgCustomerValue = safeDivide(totalRevenue, totalCustomers);
    const avgOrderValue = safeDivide(totalRevenue, totalOrders);
    
    // Customer segmentation
    const b2bCustomers = data.filter(row => row.customerType).length;
    const b2cCustomers = totalCustomers - b2bCustomers;
    const b2bRevenue = data.filter(row => row.customerType).reduce((sum, row) => sum + row.salesWithTax, 0);
    const b2cRevenue = totalRevenue - b2bRevenue;
    
    return {
      totalCustomers,
      totalRevenue,
      totalOrders,
      avgCustomerValue,
      avgOrderValue,
      b2bCustomers,
      b2cCustomers,
      b2bRevenue,
      b2cRevenue,
      b2bRevenuePercentage: safeDivide(b2bRevenue, totalRevenue),
      b2cRevenuePercentage: safeDivide(b2cRevenue, totalRevenue)
    };
  }
};
