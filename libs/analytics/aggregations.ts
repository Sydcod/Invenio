import mongoose from 'mongoose';
import { ORDER_STATUSES, PURCHASE_ORDER_STATUSES, PAYMENT_STATUSES } from './constants';

// Helper function to create date range filter
export function createDateRangeFilter(
  dateField: string,
  startDate?: string | Date,
  endDate?: string | Date
) {
  const filter: any = {};
  
  if (startDate || endDate) {
    filter[dateField] = {};
    if (startDate) filter[dateField].$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter[dateField].$lte = end;
    }
  }
  
  return filter;
}

// Helper function to convert string dates to Date objects in aggregation
export function createDateConversionStage(dateFields: string[]) {
  const fields: any = {};
  dateFields.forEach(field => {
    fields[field] = { $dateFromString: { dateString: `$${field}` } };
  });
  return { $addFields: fields };
}

// Sales Analytics Aggregations
export function buildSalesKPIsPipeline(params: {
  startDate?: string;
  endDate?: string;
  warehouseId?: string;
  comparisonStartDate?: string;
  comparisonEndDate?: string;
}) {
  const { startDate, endDate, warehouseId, comparisonStartDate, comparisonEndDate } = params;
  
  // Build match stage
  const matchStage: any = {
    ...createDateRangeFilter('dates.orderDate', startDate, endDate),
    status: { $nin: [ORDER_STATUSES.DRAFT, ORDER_STATUSES.CANCELLED] }
  };
  
  if (warehouseId && warehouseId !== 'all') {
    matchStage.warehouseId = new mongoose.Types.ObjectId(warehouseId);
  }

  // Build comparison match stage if provided
  const comparisonMatchStage: any = comparisonStartDate ? {
    ...createDateRangeFilter('dates.orderDate', comparisonStartDate, comparisonEndDate),
    status: { $nin: [ORDER_STATUSES.DRAFT, ORDER_STATUSES.CANCELLED] }
  } : null;

  if (comparisonMatchStage && warehouseId && warehouseId !== 'all') {
    comparisonMatchStage.warehouseId = new mongoose.Types.ObjectId(warehouseId);
  }

  const pipeline: any[] = [
    // Convert string dates to Date objects
    createDateConversionStage(['dates.orderDate']),
    {
      $facet: {
        current: [
          { $match: matchStage },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$financial.grandTotal' },
              totalOrders: { $sum: 1 },
              totalQuantity: { $sum: { $sum: '$items.quantity' } },
              uniqueCustomers: { $addToSet: '$customer.email' }
            }
          },
          {
            $project: {
              totalRevenue: 1,
              totalOrders: 1,
              avgOrderValue: {
                $cond: [
                  { $gt: ['$totalOrders', 0] },
                  { $divide: ['$totalRevenue', '$totalOrders'] },
                  0
                ]
              },
              totalQuantity: 1,
              uniqueCustomerCount: { $size: '$uniqueCustomers' }
            }
          }
        ],
        comparison: comparisonMatchStage ? [
          { $match: comparisonMatchStage },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$financial.grandTotal' },
              totalOrders: { $sum: 1 }
            }
          },
          {
            $project: {
              totalRevenue: 1,
              totalOrders: 1,
              avgOrderValue: {
                $cond: [
                  { $gt: ['$totalOrders', 0] },
                  { $divide: ['$totalRevenue', '$totalOrders'] },
                  0
                ]
              }
            }
          }
        ] : []
      }
    }
  ];

  return pipeline;
}

export function buildSalesTrendPipeline(params: {
  startDate?: string;
  endDate?: string;
  warehouseId?: string;
  groupBy: 'day' | 'week' | 'month';
}) {
  const { startDate, endDate, warehouseId, groupBy = 'day' } = params;
  
  const matchStage: any = {
    ...createDateRangeFilter('dates.orderDate', startDate, endDate),
    status: { $nin: [ORDER_STATUSES.DRAFT, ORDER_STATUSES.CANCELLED] }
  };
  
  if (warehouseId && warehouseId !== 'all') {
    matchStage.warehouseId = new mongoose.Types.ObjectId(warehouseId);
  }

  // Define grouping format based on groupBy parameter
  let dateFormat: any;
  switch (groupBy) {
    case 'week':
      dateFormat = { $dateToString: { format: '%Y-W%V', date: '$dates.orderDate' } };
      break;
    case 'month':
      dateFormat = { $dateToString: { format: '%Y-%m', date: '$dates.orderDate' } };
      break;
    case 'day':
    default:
      dateFormat = { $dateToString: { format: '%Y-%m-%d', date: '$dates.orderDate' } };
      break;
  }

  const pipeline = [
    // Convert string dates to Date objects
    createDateConversionStage(['dates.orderDate']),
    { $match: matchStage },
    {
      $group: {
        _id: dateFormat,
        revenue: { $sum: '$financial.grandTotal' },
        orders: { $sum: 1 },
        quantity: { $sum: { $sum: '$items.quantity' } },
        avgOrderValue: { $avg: '$financial.grandTotal' }
      }
    },
    { $sort: { _id: 1 as 1 } },
    {
      $project: {
        date: '$_id',
        revenue: { $round: ['$revenue', 2] },
        orders: 1,
        quantity: 1,
        avgOrderValue: { $round: ['$avgOrderValue', 2] },
        _id: 0
      }
    }
  ];

  return pipeline;
}

export function buildCategoryPerformancePipeline(params: {
  startDate?: string;
  endDate?: string;
  warehouseId?: string;
  limit?: number;
}) {
  const { startDate, endDate, warehouseId, limit = 10 } = params;
  
  const matchStage: any = {
    ...createDateRangeFilter('dates.orderDate', startDate, endDate),
    status: { $nin: [ORDER_STATUSES.DRAFT, ORDER_STATUSES.CANCELLED] }
  };
  
  if (warehouseId && warehouseId !== 'all') {
    matchStage.warehouseId = new mongoose.Types.ObjectId(warehouseId);
  }

  const pipeline = [
    // Convert string dates to Date objects
    createDateConversionStage(['dates.orderDate']),
    { $match: matchStage },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product.category',
        revenue: { 
          $sum: '$items.total'
        },
        quantity: { $sum: '$items.quantity' },
        orders: { $addToSet: '$_id' }
      }
    },
    {
      $project: {
        name: '$_id',
        revenue: { $round: ['$revenue', 2] },
        quantity: 1,
        orderCount: { $size: '$orders' },
        _id: 0
      }
    },
    { $sort: { revenue: -1 as -1 } },
    { $limit: limit }
  ];

  return pipeline;
}

// Inventory Analytics Aggregations
export function buildInventoryKPIsPipeline(params: {
  warehouseId?: string;
}) {
  const { warehouseId } = params;
  
  const matchStage: any = {
    status: 'active'
  };

  // For inventory, we need to consider warehouse-specific stock
  const pipeline = [
    { $match: matchStage },
    {
      $facet: {
        overview: [
          {
            $group: {
              _id: null as any,
              totalProducts: { $sum: 1 },
              totalValue: {
                $sum: {
                  $multiply: ['$inventory.currentStock', '$pricing.price']
                }
              },
              totalQuantity: { $sum: '$inventory.currentStock' },
              outOfStock: {
                $sum: {
                  $cond: [{ $lte: ['$inventory.currentStock', 0] }, 1, 0]
                }
              },
              lowStock: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $gt: ['$inventory.currentStock', 0] },
                        { $lte: ['$inventory.currentStock', '$inventory.reorderPoint'] }
                      ]
                    },
                    1,
                    0
                  ]
                }
              }
            }
          }
        ],
        byCategory: [
          {
            $group: {
              _id: '$category.name',
              count: { $sum: 1 },
              value: {
                $sum: {
                  $multiply: ['$inventory.currentStock', '$pricing.price']
                }
              },
              quantity: { $sum: '$inventory.currentStock' }
            }
          },
          { $sort: { value: -1 as -1 } },
          { $limit: 5 }
        ],
        deadStock: [
          {
            $lookup: {
              from: 'salesorders',
              let: { productId: '$_id' },
              pipeline: [
                // Convert string dates to Date objects
                {
                  $addFields: {
                    'dates.orderDate': { $dateFromString: { dateString: '$dates.orderDate' } }
                  }
                },
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $in: ['$$productId', '$items.productId'] },
                        { $gte: ['$dates.orderDate', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)] }
                      ]
                    }
                  }
                }
              ],
              as: 'recentSales'
            }
          },
          {
            $match: {
              recentSales: { $size: 0 },
              'inventory.currentStock': { $gt: 0 }
            }
          },
          {
            $group: {
              _id: null as any,
              deadStockValue: {
                $sum: {
                  $multiply: ['$inventory.currentStock', '$pricing.price']
                }
              },
              deadStockCount: { $sum: 1 }
            }
          }
        ]
      }
    }
  ];

  return pipeline;
}

// Customer Analytics Aggregations
export function buildCustomerSegmentsPipeline(params: {
  startDate?: string;
  endDate?: string;
}) {
  const { startDate, endDate } = params;
  
  console.log('[DEBUG] buildCustomerSegmentsPipeline called with:', { startDate, endDate });
  
  const dateFilter = createDateRangeFilter('dates.orderDate', startDate, endDate);
  console.log('[DEBUG] Date filter:', JSON.stringify(dateFilter, null, 2));
  
  const matchStage: any = {
    ...dateFilter,
    status: { $nin: ['draft', 'cancelled'] } // Use lowercase to match database values
  };
  
  console.log('[DEBUG] Match stage:', JSON.stringify(matchStage, null, 2));

  const pipeline = [
    // Convert string dates to Date objects
    createDateConversionStage(['dates.orderDate']),
    { $match: matchStage },
    // Group by channel (B2B/B2C) which is embedded in sales orders
    {
      $group: {
        _id: '$channel',
        customerCount: { $addToSet: '$customer.email' },
        revenue: { $sum: '$financial.grandTotal' },
        orderCount: { $sum: 1 }
      }
    },
    {
      $project: {
        segment: { $ifNull: ['$_id', 'Unknown'] },
        customerCount: { $size: '$customerCount' },
        revenue: { $round: ['$revenue', 2] },
        orderCount: 1,
        avgOrderValue: {
          $round: [
            { $divide: ['$revenue', '$orderCount'] },
            2
          ]
        },
        _id: 0
      }
    },
    { $sort: { revenue: -1 as -1 } }
  ];

  return pipeline;
}

export function buildInsightsPipeline(params: {
  startDate?: string;
  endDate?: string;
}) {
  const { startDate, endDate } = params;
  
  // Pipeline for low stock products
  const lowStockPipeline = [
    {
      $match: {
        status: 'active'
      }
    },
    {
      $project: {
        name: 1,
        sku: 1,
        currentStock: '$inventory.currentStock',
        reorderPoint: '$inventory.reorderPoint',
        isLowStock: {
          $and: [
            { $gt: ['$inventory.reorderPoint', 0] },
            { $lte: ['$inventory.currentStock', '$inventory.reorderPoint'] }
          ]
        }
      }
    },
    {
      $match: { isLowStock: true }
    },
    {
      $count: 'lowStockCount'
    }
  ];

  // Pipeline for category trends (week over week)
  const currentWeekStart = new Date(endDate || new Date().toISOString());
  currentWeekStart.setDate(currentWeekStart.getDate() - 7);
  const previousWeekStart = new Date(currentWeekStart);
  previousWeekStart.setDate(previousWeekStart.getDate() - 7);
  
  const categoryTrendsPipeline = [
    createDateConversionStage(['dates.orderDate']),
    {
      $match: {
        'dates.orderDate': {
          $gte: previousWeekStart,
          $lte: new Date(endDate || new Date().toISOString())
        },
        status: { $nin: ['Draft', 'Cancelled'] }
      }
    },
    { $unwind: '$items' },
    {
      $group: {
        _id: {
          category: '$items.product.category',
          week: {
            $cond: [
              { $gte: ['$dates.orderDate', currentWeekStart] },
              'current',
              'previous'
            ]
          }
        },
        revenue: {
          $sum: {
            $multiply: ['$items.quantity', '$items.costPrice']
          }
        }
      }
    },
    {
      $group: {
        _id: '$_id.category',
        currentWeek: {
          $sum: {
            $cond: [
              { $eq: ['$_id.week', 'current'] },
              '$revenue',
              0
            ]
          }
        },
        previousWeek: {
          $sum: {
            $cond: [
              { $eq: ['$_id.week', 'previous'] },
              '$revenue',
              0
            ]
          }
        }
      }
    },
    {
      $project: {
        category: '$_id',
        currentWeek: 1,
        previousWeek: 1,
        percentChange: {
          $cond: [
            { $eq: ['$previousWeek', 0] },
            0,
            {
              $multiply: [
                {
                  $divide: [
                    { $subtract: ['$currentWeek', '$previousWeek'] },
                    '$previousWeek'
                  ]
                },
                100
              ]
            }
          ]
        },
        _id: 0
      }
    },
    { $sort: { percentChange: -1 } },
    { $limit: 1 }
  ];

  // Pipeline for customer segment trends (B2B vs B2C)
  const segmentTrendsPipeline = [
    createDateConversionStage(['dates.orderDate']),
    {
      $match: {
        'dates.orderDate': {
          $gte: new Date(startDate || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString()),
          $lte: new Date(endDate || new Date().toISOString())
        },
        status: { $nin: ['Draft', 'Cancelled'] }
      }
    },
    {
      $lookup: {
        from: 'customers',
        localField: 'customer.customerId',
        foreignField: '_id',
        as: 'customerDetails'
      }
    },
    { $unwind: '$customerDetails' },
    {
      $group: {
        _id: {
          type: '$customerDetails.type',
          month: { $month: '$dates.orderDate' }
        },
        revenue: { $sum: '$financial.grandTotal' },
        orderCount: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.type',
        currentMonth: {
          $sum: {
            $cond: [
              { $eq: ['$_id.month', new Date(endDate || new Date()).getMonth() + 1] },
              '$revenue',
              0
            ]
          }
        },
        previousMonth: {
          $sum: {
            $cond: [
              { $eq: ['$_id.month', new Date(endDate || new Date()).getMonth()] },
              '$revenue',
              0
            ]
          }
        }
      }
    },
    {
      $project: {
        segment: '$_id',
        growth: {
          $cond: [
            { $eq: ['$previousMonth', 0] },
            0,
            { $divide: ['$currentMonth', '$previousMonth'] }
          ]
        },
        currentRevenue: '$currentMonth',
        _id: 0
      }
    }
  ];

  return {
    lowStockPipeline,
    categoryTrendsPipeline,
    segmentTrendsPipeline
  };
}

export function buildTopCustomersPipeline(params: {
  startDate?: string;
  endDate?: string;
  limit?: number;
}) {
  const { startDate, endDate, limit = 10 } = params;
  
  const matchStage: any = {
    ...createDateRangeFilter('dates.orderDate', startDate, endDate),
    status: { $in: [ORDER_STATUSES.COMPLETED, ORDER_STATUSES.DELIVERED] }
  };

  const pipeline = [
    // Convert string dates to Date objects
    createDateConversionStage(['dates.orderDate']),
    { $match: matchStage },
    {
      $group: {
        _id: '$customer.email',
        customerName: { $first: '$customer.name' },
        customerType: { $first: '$customer.type' },
        totalRevenue: { $sum: '$financial.grandTotal' },
        orderCount: { $sum: 1 },
        lastOrderDate: { $max: '$dates.orderDate' }
      }
    },
    {
      $project: {
        customer: {
          email: '$_id',
          name: '$customerName',
          type: { $ifNull: ['$customerType', 'B2C'] }
        },
        totalRevenue: { $round: ['$totalRevenue', 2] },
        orderCount: 1,
        avgOrderValue: {
          $round: [
            { $divide: ['$totalRevenue', '$orderCount'] },
            2
          ]
        },
        lastOrderDate: 1,
        _id: 0
      }
    },
    { $sort: { totalRevenue: -1 as -1 } },
    { $limit: limit }
  ];

  return pipeline;
}

// Procurement Analytics Aggregations
export function buildProcurementKPIsPipeline(params: {
  startDate?: string;
  endDate?: string;
  warehouseId?: string;
}) {
  const { startDate, endDate, warehouseId } = params;
  
  const matchStage: any = {
    ...createDateRangeFilter('dates.orderDate', startDate, endDate)
  };
  
  if (warehouseId && warehouseId !== 'all') {
    matchStage.warehouseId = new mongoose.Types.ObjectId(warehouseId);
  }

  const pipeline = [
    // Convert string dates to Date objects
    createDateConversionStage(['dates.orderDate', 'dates.receivedDate']),
    { $match: matchStage },
    {
      $facet: {
        overview: [
          {
            $group: {
              _id: null as any,
              totalPOs: { $sum: 1 },
              totalSpend: { $sum: '$financial.grandTotal' },
              avgPOValue: { $avg: '$financial.grandTotal' },
              pendingPOs: {
                $sum: {
                  $cond: [
                    { $eq: ['$status', PURCHASE_ORDER_STATUSES.PENDING] },
                    1,
                    0
                  ]
                }
              },
              receivedPOs: {
                $sum: {
                  $cond: [
                    { $eq: ['$status', PURCHASE_ORDER_STATUSES.RECEIVED] },
                    1,
                    0
                  ]
                }
              }
            }
          }
        ],
        bySupplier: [
          {
            $group: {
              _id: '$supplier',
              poCount: { $sum: 1 },
              totalSpend: { $sum: '$financial.grandTotal' }
            }
          },
          {
            $lookup: {
              from: 'suppliers',
              localField: '_id',
              foreignField: '_id',
              as: 'supplierInfo'
            }
          },
          { $unwind: '$supplierInfo' },
          {
            $project: {
              supplier: '$supplierInfo.name',
              poCount: 1,
              totalSpend: { $round: ['$totalSpend', 2] },
              _id: 0
            }
          },
          { $sort: { totalSpend: -1 as -1 } },
          { $limit: 5 }
        ],
        cycleTime: [
          {
            $match: {
              status: PURCHASE_ORDER_STATUSES.RECEIVED,
              'dates.receivedDate': { $exists: true }
            }
          },
          {
            $project: {
              cycleTime: {
                $divide: [
                  { $subtract: ['$dates.receivedDate', '$dates.orderDate'] },
                  1000 * 60 * 60 * 24 // Convert to days
                ]
              }
            }
          },
          {
            $group: {
              _id: null as any,
              avgCycleTime: { $avg: '$cycleTime' },
              minCycleTime: { $min: '$cycleTime' },
              maxCycleTime: { $max: '$cycleTime' }
            }
          }
        ]
      }
    }
  ];

  return pipeline;
}

// Dashboard Overview Aggregation (combines multiple metrics)
export function buildDashboardOverviewPipeline(params: {
  startDate?: string;
  endDate?: string;
  warehouseId?: string;
}) {
  const { startDate, endDate, warehouseId } = params;
  
  // Calculate comparison period (previous period of same length)
  let comparisonStartDate, comparisonEndDate;
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const periodLength = end.getTime() - start.getTime();
    
    comparisonEndDate = new Date(start.getTime() - 1);
    comparisonStartDate = new Date(comparisonEndDate.getTime() - periodLength);
  }

  return {
    salesKPIs: buildSalesKPIsPipeline({
      startDate,
      endDate,
      warehouseId,
      comparisonStartDate: comparisonStartDate?.toISOString(),
      comparisonEndDate: comparisonEndDate?.toISOString()
    }),
    salesTrend: buildSalesTrendPipeline({
      startDate,
      endDate,
      warehouseId,
      groupBy: 'day'
    }),
    categoryPerformance: buildCategoryPerformancePipeline({
      startDate,
      endDate,
      warehouseId,
      limit: 5
    }),
    customerSegments: buildCustomerSegmentsPipeline({
      startDate,
      endDate
    })
  };
}
