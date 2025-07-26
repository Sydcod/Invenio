import { Document } from 'mongodb';

// Type alias for MongoDB aggregation pipeline stages
type PipelineStage = Document;

// Helper to convert string dates to Date objects
const createDateConversionStage = (): PipelineStage => ({
  $addFields: {
    'dates.orderDateConverted': {
      $dateFromString: {
        dateString: '$dates.orderDate',
        onError: null,
        onNull: null
      }
    }
  }
});

// Helper to calculate percentage change
export const calculateChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

// Sales KPIs pipeline
export const buildSalesKPIsPipeline = (
  startDate: Date,
  endDate: Date,
  comparisonStartDate: Date,
  comparisonEndDate: Date,
  filters: any = {}
): PipelineStage[] => {
  const baseMatch: any = {
    status: { $nin: ['draft', 'cancelled'] }
  };

  // Apply filters
  if (filters.warehouse && filters.warehouse !== 'all') {
    baseMatch['warehouseId'] = filters.warehouse;
  }
  if (filters.channel && filters.channel !== 'all') {
    baseMatch['channel'] = filters.channel;
  }
  if (filters.salesRep && filters.salesRep !== 'all') {
    baseMatch['salesPersonId'] = filters.salesRep;
  }

  return [
    createDateConversionStage(),
    {
      $match: {
        ...baseMatch,
        $or: [
          { 'dates.orderDateConverted': { $gte: startDate, $lte: endDate } },
          { 'dates.orderDateConverted': { $gte: comparisonStartDate, $lte: comparisonEndDate } }
        ]
      }
    },
    {
      $group: {
        _id: {
          $cond: [
            { $and: [
              { $gte: ['$dates.orderDateConverted', startDate] },
              { $lte: ['$dates.orderDateConverted', endDate] }
            ]},
            'current',
            'comparison'
          ]
        },
        revenue: { $sum: '$financial.grandTotal' },
        orders: { $sum: 1 },
        totalItems: { $sum: { $size: '$items' } },
        customers: { $addToSet: '$customerId' }
      }
    },
    {
      $project: {
        _id: 1,
        revenue: 1,
        orders: 1,
        avgOrderValue: {
          $cond: [
            { $eq: ['$orders', 0] },
            0,
            { $divide: ['$revenue', '$orders'] }
          ]
        },
        uniqueCustomers: { $size: '$customers' },
        conversionRate: {
          $cond: [
            { $eq: [{ $size: '$customers' }, 0] },
            0,
            {
              $multiply: [
                { $divide: ['$orders', { $size: '$customers' }] },
                100
              ]
            }
          ]
        }
      }
    }
  ];
};

// Sales trend pipeline
export const buildSalesTrendPipeline = (
  startDate: Date,
  endDate: Date,
  filters: any = {}
): PipelineStage[] => {
  const baseMatch: any = {
    status: { $nin: ['draft', 'cancelled'] },
    'dates.orderDateConverted': { $gte: startDate, $lte: endDate }
  };

  // Apply filters
  if (filters.warehouse && filters.warehouse !== 'all') {
    baseMatch['warehouseId'] = filters.warehouse;
  }
  if (filters.channel && filters.channel !== 'all') {
    baseMatch['channel'] = filters.channel;
  }
  if (filters.salesRep && filters.salesRep !== 'all') {
    baseMatch['salesPersonId'] = filters.salesRep;
  }

  return [
    createDateConversionStage(),
    { $match: baseMatch },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$dates.orderDateConverted'
          }
        },
        revenue: { $sum: '$financial.grandTotal' },
        orders: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    },
    {
      $project: {
        _id: 0,
        date: '$_id',
        revenue: 1,
        orders: 1
      }
    }
  ];
};

// Channel performance pipeline
export const buildChannelPerformancePipeline = (
  startDate: Date,
  endDate: Date,
  filters: any = {}
): PipelineStage[] => {
  const baseMatch: any = {
    status: { $nin: ['draft', 'cancelled'] },
    'dates.orderDateConverted': { $gte: startDate, $lte: endDate }
  };

  if (filters.warehouse && filters.warehouse !== 'all') {
    baseMatch['warehouseId'] = filters.warehouse;
  }
  if (filters.salesRep && filters.salesRep !== 'all') {
    baseMatch['salesPersonId'] = filters.salesRep;
  }

  return [
    createDateConversionStage(),
    { $match: baseMatch },
    {
      $group: {
        _id: '$channel',
        revenue: { $sum: '$financial.grandTotal' },
        orders: { $sum: 1 },
        customers: { $addToSet: '$customerId' }
      }
    },
    {
      $project: {
        _id: 0,
        channel: '$_id',
        revenue: 1,
        orders: 1,
        customers: { $size: '$customers' }
      }
    },
    {
      $sort: { revenue: -1 }
    }
  ];
};

// Source distribution pipeline
export const buildSourceDistributionPipeline = (
  startDate: Date,
  endDate: Date,
  filters: any = {}
): PipelineStage[] => {
  const baseMatch: any = {
    status: { $nin: ['draft', 'cancelled'] },
    'dates.orderDateConverted': { $gte: startDate, $lte: endDate }
  };

  if (filters.warehouse && filters.warehouse !== 'all') {
    baseMatch['warehouseId'] = filters.warehouse;
  }
  if (filters.channel && filters.channel !== 'all') {
    baseMatch['channel'] = filters.channel;
  }
  if (filters.salesRep && filters.salesRep !== 'all') {
    baseMatch['salesPersonId'] = filters.salesRep;
  }

  return [
    createDateConversionStage(),
    { $match: baseMatch },
    {
      $group: {
        _id: '$source',
        revenue: { $sum: '$financial.grandTotal' }
      }
    },
    {
      $project: {
        _id: 0,
        source: '$_id',
        revenue: 1
      }
    },
    {
      $sort: { revenue: -1 }
    }
  ];
};

// Payment methods pipeline
export const buildPaymentMethodsPipeline = (
  startDate: Date,
  endDate: Date,
  filters: any = {}
): PipelineStage[] => {
  const baseMatch: any = {
    status: { $nin: ['draft', 'cancelled'] },
    'dates.orderDateConverted': { $gte: startDate, $lte: endDate }
  };

  if (filters.warehouse && filters.warehouse !== 'all') {
    baseMatch['warehouseId'] = filters.warehouse;
  }
  if (filters.channel && filters.channel !== 'all') {
    baseMatch['channel'] = filters.channel;
  }
  if (filters.salesRep && filters.salesRep !== 'all') {
    baseMatch['salesPersonId'] = filters.salesRep;
  }

  return [
    createDateConversionStage(),
    { $match: baseMatch },
    {
      $group: {
        _id: '$payment.method',
        count: { $sum: 1 },
        revenue: { $sum: '$financial.grandTotal' }
      }
    },
    {
      $project: {
        _id: 0,
        method: '$_id',
        count: 1,
        revenue: 1
      }
    },
    {
      $sort: { revenue: -1 }
    }
  ];
};

// Top products pipeline
export const buildTopProductsPipeline = (
  startDate: Date,
  endDate: Date,
  filters: any = {},
  limit: number = 10
): PipelineStage[] => {
  const baseMatch: any = {
    status: { $nin: ['draft', 'cancelled'] },
    'dates.orderDateConverted': { $gte: startDate, $lte: endDate }
  };

  if (filters.warehouse && filters.warehouse !== 'all') {
    baseMatch['warehouseId'] = filters.warehouse;
  }
  if (filters.channel && filters.channel !== 'all') {
    baseMatch['channel'] = filters.channel;
  }
  if (filters.salesRep && filters.salesRep !== 'all') {
    baseMatch['salesPersonId'] = filters.salesRep;
  }

  return [
    createDateConversionStage(),
    { $match: baseMatch },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.productId',
        name: { $first: '$items.product.name' },
        sku: { $first: '$items.product.sku' },
        category: { $first: '$items.product.category' },
        unitsSold: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.total' },
        totalPrice: { $sum: '$items.price' }
      }
    },
    {
      $project: {
        _id: 0,
        productId: '$_id',
        name: 1,
        sku: 1,
        category: 1,
        unitsSold: 1,
        revenue: 1,
        avgPrice: {
          $cond: [
            { $eq: ['$unitsSold', 0] },
            0,
            { $divide: ['$totalPrice', '$unitsSold'] }
          ]
        }
      }
    },
    { $sort: { revenue: -1 } },
    { $limit: limit }
  ];
};

// Sales rep performance pipeline
export const buildSalesRepPerformancePipeline = (
  startDate: Date,
  endDate: Date,
  filters: any = {}
): PipelineStage[] => {
  const baseMatch: any = {
    status: { $nin: ['draft', 'cancelled'] },
    'dates.orderDateConverted': { $gte: startDate, $lte: endDate },
    salesPersonId: { $exists: true, $ne: null }
  };

  if (filters.warehouse && filters.warehouse !== 'all') {
    baseMatch['warehouseId'] = filters.warehouse;
  }
  if (filters.channel && filters.channel !== 'all') {
    baseMatch['channel'] = filters.channel;
  }

  return [
    createDateConversionStage(),
    { $match: baseMatch },
    {
      $group: {
        _id: '$salesPersonId',
        name: { $first: '$salesPerson.name' },
        revenue: { $sum: '$financial.grandTotal' },
        orders: { $sum: 1 },
        customers: { $addToSet: '$customerId' }
      }
    },
    {
      $project: {
        _id: 0,
        repId: '$_id',
        name: 1,
        revenue: 1,
        orders: 1,
        avgOrderValue: {
          $cond: [
            { $eq: ['$orders', 0] },
            0,
            { $divide: ['$revenue', '$orders'] }
          ]
        },
        conversionRate: {
          $cond: [
            { $eq: [{ $size: '$customers' }, 0] },
            0,
            {
              $multiply: [
                { $divide: ['$orders', { $size: '$customers' }] },
                100
              ]
            }
          ]
        }
      }
    },
    { $sort: { revenue: -1 } }
  ];
};

// Order status funnel pipeline
export const buildOrderStatusFunnelPipeline = (
  startDate: Date,
  endDate: Date,
  filters: any = {}
): PipelineStage[] => {
  const baseMatch: any = {
    'dates.orderDateConverted': { $gte: startDate, $lte: endDate }
  };

  if (filters.warehouse && filters.warehouse !== 'all') {
    baseMatch['warehouseId'] = filters.warehouse;
  }
  if (filters.channel && filters.channel !== 'all') {
    baseMatch['channel'] = filters.channel;
  }
  if (filters.salesRep && filters.salesRep !== 'all') {
    baseMatch['salesPersonId'] = filters.salesRep;
  }

  const statusOrder = [
    'confirmed',
    'processing',
    'packed',
    'shipped',
    'delivered',
    'completed'
  ];

  return [
    createDateConversionStage(),
    { $match: baseMatch },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$count' },
        statuses: {
          $push: {
            status: '$_id',
            count: '$count'
          }
        }
      }
    },
    { $unwind: '$statuses' },
    {
      $project: {
        _id: 0,
        status: '$statuses.status',
        count: '$statuses.count',
        percentage: {
          $cond: [
            { $eq: ['$total', 0] },
            0,
            {
              $multiply: [
                { $divide: ['$statuses.count', '$total'] },
                100
              ]
            }
          ]
        }
      }
    },
    {
      $addFields: {
        order: {
          $indexOfArray: [statusOrder, '$status']
        }
      }
    },
    {
      $sort: { order: 1 }
    },
    {
      $project: {
        status: 1,
        count: 1,
        percentage: 1
      }
    }
  ];
};
