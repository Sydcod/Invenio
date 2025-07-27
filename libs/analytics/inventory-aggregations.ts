import { Document } from 'mongodb';

// Type alias for MongoDB aggregation pipeline stages
type PipelineStage = Document;

// Helper to convert string dates to Date objects (learned from sales analytics)
const createDateConversionStage = (): PipelineStage => ({
  $addFields: {
    'createdAtConverted': {
      $cond: {
        if: { $type: '$createdAt' },
        then: { $dateFromString: { dateString: '$createdAt' } },
        else: null
      }
    },
    'updatedAtConverted': {
      $cond: {
        if: { $type: '$updatedAt' },
        then: { $dateFromString: { dateString: '$updatedAt' } },
        else: null
      }
    }
  }
});

// Stock Optimization Metrics
export const buildStockOptimizationPipeline = (
  filters: any = {}
): PipelineStage[] => {
  const baseMatch: any = {
    status: 'active'
  };

  // Don't filter by warehouse here - it's an array field
  if (filters.category && filters.category !== 'all') {
    baseMatch['category.id'] = filters.category;
  }

  return [
    createDateConversionStage(),
    {
      $facet: {
        totalItems: [
          { $match: baseMatch },
          { $count: 'count' }
        ],
        belowReorderPoint: [
          { $match: baseMatch },
          // If warehouse filter, we need to check stock at specific warehouse
          ...(filters.warehouse && filters.warehouse !== 'all' ? [
            { $unwind: '$inventory.locations' },
            { $match: { 'inventory.locations.warehouseId': filters.warehouse } },
            {
              $match: {
                $expr: {
                  $and: [
                    { $gt: ['$inventory.locations.quantity', 0] },
                    { $lte: ['$inventory.locations.quantity', '$inventory.reorderPoint'] }
                  ]
                }
              }
            }
          ] : [
            // No warehouse filter, use total currentStock
            {
              $match: {
                $expr: {
                  $and: [
                    { $gt: ['$inventory.currentStock', 0] },
                    { $lte: ['$inventory.currentStock', '$inventory.reorderPoint'] }
                  ]
                }
              }
            }
          ]),
          { $count: 'count' }
        ],
        overstockItems: [
          { $match: baseMatch },
          // If warehouse filter, check overstock at specific warehouse
          ...(filters.warehouse && filters.warehouse !== 'all' ? [
            { $unwind: '$inventory.locations' },
            { $match: { 'inventory.locations.warehouseId': filters.warehouse } },
            {
              $match: {
                $expr: {
                  $gt: ['$inventory.locations.quantity', { $multiply: ['$inventory.reorderPoint', 3] }]
                }
              }
            }
          ] : [
            // No warehouse filter, use total currentStock
            {
              $match: {
                $expr: {
                  $gt: ['$inventory.currentStock', { $multiply: ['$inventory.reorderPoint', 3] }]
                }
              }
            }
          ]),
          { $count: 'count' }
        ],
        outOfStock: [
          { $match: baseMatch },
          // If warehouse filter, check stock at specific warehouse
          ...(filters.warehouse && filters.warehouse !== 'all' ? [
            { $unwind: '$inventory.locations' },
            { $match: { 'inventory.locations.warehouseId': filters.warehouse } },
            {
              $match: {
                'inventory.locations.quantity': 0
              }
            }
          ] : [
            // No warehouse filter, use total currentStock
            {
              $match: {
                'inventory.currentStock': 0
              }
            }
          ]),
          { $count: 'count' }
        ],
        totalInventoryValue: [
          { $match: baseMatch },
          // If warehouse filter, unwind and filter locations
          ...(filters.warehouse && filters.warehouse !== 'all' ? [
            { $unwind: '$inventory.locations' },
            { $match: { 'inventory.locations.warehouseId': filters.warehouse } },
            {
              $group: {
                _id: null,
                value: {
                  $sum: {
                    $multiply: ['$inventory.locations.quantity', '$pricing.cost']
                  }
                }
              }
            }
          ] : [
            // No warehouse filter, use total currentStock
            {
              $group: {
                _id: null,
                value: {
                  $sum: {
                    $multiply: ['$inventory.currentStock', '$pricing.cost']
                  }
                }
              }
            }
          ]),
        ],
        totalActiveStock: [
          { $match: baseMatch },
          // If warehouse filter, unwind and filter locations
          ...(filters.warehouse && filters.warehouse !== 'all' ? [
            { $unwind: '$inventory.locations' },
            { $match: { 'inventory.locations.warehouseId': filters.warehouse } },
            {
              $group: {
                _id: null,
                totalStock: {
                  $sum: '$inventory.locations.quantity'
                }
              }
            }
          ] : [
            // No warehouse filter, use total currentStock
            {
              $group: {
                _id: null,
                totalStock: {
                  $sum: '$inventory.currentStock'
                }
              }
            }
          ])
        ]
      }
    },
    {
      $project: {
        totalItems: { $arrayElemAt: ['$totalItems.count', 0] },
        belowReorderPoint: { $arrayElemAt: ['$belowReorderPoint.count', 0] },
        overstockItems: { $arrayElemAt: ['$overstockItems.count', 0] },
        outOfStock: { $arrayElemAt: ['$outOfStock.count', 0] },
        totalInventoryValue: { $arrayElemAt: ['$totalInventoryValue.value', 0] },
        totalActiveStock: { $arrayElemAt: ['$totalActiveStock.totalStock', 0] }
      }
    }
  ];
};

// ABC Analysis Pipeline
export const buildABCAnalysisPipeline = (
  filters: any = {}
): PipelineStage[] => {
  const baseMatch: any = {
    status: 'active'
  };

  // Category filter can be applied in baseMatch
  if (filters.category && filters.category !== 'all') {
    baseMatch['category.id'] = filters.category;
  }

  return [
    createDateConversionStage(),
    { $match: baseMatch },
    // Handle warehouse filtering
    ...(filters.warehouse && filters.warehouse !== 'all' ? [
      // For specific warehouse, unwind locations and filter
      { $unwind: '$inventory.locations' },
      { $match: { 'inventory.locations.warehouseId': filters.warehouse } },
      // Only include products with stock in this warehouse
      { $match: { 'inventory.locations.quantity': { $gt: 0 } } },
      {
        $addFields: {
          inventoryValue: {
            $multiply: ['$inventory.locations.quantity', '$pricing.cost']
          },
          warehouseStock: '$inventory.locations.quantity'
        }
      }
    ] : [
      // No warehouse filter, use total stock
      { $match: { 'inventory.currentStock': { $gt: 0 } } },
      {
        $addFields: {
          inventoryValue: {
            $multiply: ['$inventory.currentStock', '$pricing.cost']
          },
          warehouseStock: '$inventory.currentStock'
        }
      }
    ]),
    {
      $sort: { inventoryValue: -1 }
    },
    {
      $group: {
        _id: null,
        totalValue: { $sum: '$inventoryValue' },
        items: {
          $push: {
            productId: '$_id',
            name: '$name',
            sku: '$sku',
            category: '$category',
            currentStock: '$warehouseStock',
            cost: '$pricing.cost',
            value: '$inventoryValue'
          }
        }
      }
    },
    {
      $unwind: {
        path: '$items',
        includeArrayIndex: 'index'
      }
    },
    {
      $addFields: {
        'items.cumulativeValue': {
          $multiply: ['$items.value', 1] // Will be calculated in post-processing
        },
        'items.percentageOfTotal': {
          $multiply: [
            { $divide: ['$items.value', '$totalValue'] },
            100
          ]
        }
      }
    },
    {
      $group: {
        _id: null,
        totalValue: { $first: '$totalValue' },
        items: { $push: '$items' }
      }
    }
  ];
};

// Warehouse Stock Distribution
export const buildWarehouseDistributionPipeline = (
  filters: any = {}
): PipelineStage[] => {
  const baseMatch: any = {
    status: 'active'
  };

  if (filters.category && filters.category !== 'all') {
    baseMatch['category.id'] = filters.category;
  }

  // When a specific warehouse is selected, we want to show only that warehouse's data
  // When 'all' is selected, we want to show all warehouses
  if (filters.warehouse && filters.warehouse !== 'all') {
    return [
      createDateConversionStage(),
      { $match: baseMatch },
      { $unwind: '$inventory.locations' },
      // Filter to specific warehouse
      { $match: { 'inventory.locations.warehouseId': filters.warehouse } },
      {
        $group: {
          _id: '$inventory.locations.warehouseId',
          warehouseName: { $first: '$inventory.locations.warehouseName' },
          totalStock: { $sum: '$inventory.locations.quantity' },
          totalValue: {
            $sum: {
              $multiply: ['$inventory.locations.quantity', '$pricing.cost']
            }
          },
          uniqueProducts: { $addToSet: '$_id' },
          categories: { $addToSet: '$category' }
        }
      },
      {
        $project: {
          _id: 0,
          warehouseId: '$_id',
          warehouse: '$warehouseName',
          totalStock: 1,
          stockValue: '$totalValue',
          uniqueProductCount: { $size: '$uniqueProducts' },
          categoryCount: { $size: '$categories' }
        }
      }
    ];
  }

  // Show all warehouses when no specific warehouse is selected
  return [
    createDateConversionStage(),
    { $match: baseMatch },
    { $unwind: '$inventory.locations' },
    {
      $group: {
        _id: '$inventory.locations.warehouseId',
        warehouseName: { $first: '$inventory.locations.warehouseName' },
        totalStock: { $sum: '$inventory.locations.quantity' },
        totalValue: {
          $sum: {
            $multiply: ['$inventory.locations.quantity', '$pricing.cost']
          }
        },
        uniqueProducts: { $addToSet: '$_id' },
        categories: { $addToSet: '$category' }
      }
    },
    {
      $project: {
        _id: 0,
        warehouseId: '$_id',
        warehouse: '$warehouseName',
        totalStock: 1,
        stockValue: '$totalValue',
        uniqueProductCount: { $size: '$uniqueProducts' },
        categoryCount: { $size: '$categories' }
      }
    },
    {
      $sort: { stockValue: -1 }
    }
  ];
};

// Low Stock Alert Pipeline
export const buildLowStockAlertsPipeline = (
  filters: any = {},
  limit: number = 20
): PipelineStage[] => {
  const baseMatch: any = {
    status: 'active'
  };

  // Category filter can be applied in baseMatch
  if (filters.category && filters.category !== 'all') {
    baseMatch['category.id'] = filters.category;
  }

  return [
    createDateConversionStage(),
    { $match: baseMatch },
    // Handle warehouse filtering
    ...(filters.warehouse && filters.warehouse !== 'all' ? [
      // For specific warehouse, unwind and filter
      { $unwind: '$inventory.locations' },
      { $match: { 'inventory.locations.warehouseId': filters.warehouse } },
      // Check low stock at this warehouse
      {
        $match: {
          $expr: {
            $and: [
              { $lt: ['$inventory.locations.quantity', '$inventory.reorderPoint'] },
              { $gt: ['$inventory.reorderPoint', 0] }
            ]
          }
        }
      },
      {
        $addFields: {
          warehouseStock: '$inventory.locations.quantity',
          stockPercentage: {
            $multiply: [
              { $divide: ['$inventory.locations.quantity', '$inventory.reorderPoint'] },
              100
            ]
          },
          stockDeficit: {
            $subtract: ['$inventory.reorderPoint', '$inventory.locations.quantity']
          }
        }
      }
    ] : [
      // No warehouse filter, use total stock
      {
        $match: {
          $expr: {
            $and: [
              { $lt: ['$inventory.currentStock', '$inventory.reorderPoint'] },
              { $gt: ['$inventory.reorderPoint', 0] }
            ]
          }
        }
      },
      {
        $addFields: {
          warehouseStock: '$inventory.currentStock',
          stockPercentage: {
            $multiply: [
              { $divide: ['$inventory.currentStock', '$inventory.reorderPoint'] },
              100
            ]
          },
          stockDeficit: {
            $subtract: ['$inventory.reorderPoint', '$inventory.currentStock']
          }
        }
      }
    ]),
    {
      $project: {
        _id: 0,
        productId: '$_id',
        name: 1,
        sku: 1,
        category: 1,
        currentStock: '$warehouseStock',
        reorderPoint: '$inventory.reorderPoint',
        warehouseName: '$inventory.locations.warehouseId',
        stockPercentage: 1,
        stockDeficit: 1,
        value: {
          $multiply: ['$stockDeficit', '$pricing.cost']
        }
      }
    },
    {
      $sort: { stockPercentage: 1 }
    },
    {
      $limit: limit
    }
  ];
};

// Monthly Turnover Rate Pipeline
export function buildMonthlyTurnoverPipeline(params: {
  warehouseId?: string;
  categoryId?: string;
  year?: number;
}): any[] {
  const { warehouseId, categoryId, year = new Date().getFullYear() } = params;
  const startDate = new Date(year, 0, 1); // January 1st of the year
  const endDate = new Date(Math.min(new Date().getTime(), new Date(year, 11, 31).getTime())); // Current date or end of year

  const matchStage: any = {
    status: 'active'
  };

  if (categoryId) {
    matchStage['category.id'] = categoryId;
  }

  const pipeline = [
    {
      $match: matchStage
    },
    {
      $lookup: {
        from: 'salesorders',
        let: { productId: '$_id' },
        pipeline: [
          {
            $addFields: {
              'dates.orderDateConverted': {
                $dateFromString: { dateString: '$dates.orderDate' }
              }
            }
          },
          {
            $match: {
              $expr: {
                $and: [
                  { $gte: ['$dates.orderDateConverted', startDate] },
                  { $lte: ['$dates.orderDateConverted', endDate] },
                  { $in: ['$status', ['shipped', 'delivered', 'completed']] }
                ]
              }
            }
          },
          { $unwind: '$items' },
          {
            $match: {
              $expr: { $eq: ['$items.productId', '$$productId'] }
            }
          },
          {
            $group: {
              _id: {
                productId: '$items.productId',
                month: { $month: '$dates.orderDateConverted' },
                year: { $year: '$dates.orderDateConverted' }
              },
              soldQuantity: { $sum: '$items.quantity' },
              revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
            }
          },
          {
            $group: {
              _id: '$_id.productId',
              monthlySales: {
                $push: {
                  month: '$_id.month',
                  year: '$_id.year',
                  quantity: '$soldQuantity',
                  revenue: '$revenue'
                }
              }
            }
          }
        ],
        as: 'salesData'
      }
    },
    {
      $unwind: {
        path: '$salesData',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $unwind: {
        path: '$salesData.monthlySales',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $group: {
        _id: {
          month: '$salesData.monthlySales.month',
          year: '$salesData.monthlySales.year'
        },
        totalStock: { $sum: '$inventory.currentStock' },
        totalSold: { $sum: { $ifNull: ['$salesData.monthlySales.quantity', 0] } },
        totalRevenue: { $sum: { $ifNull: ['$salesData.monthlySales.revenue', 0] } },
        productCount: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        month: { $ifNull: ['$_id.month', 0] },
        year: { $ifNull: ['$_id.year', year] },
        turnoverRate: {
          $cond: [
            { $eq: ['$totalStock', 0] },
            0,
            { $divide: ['$totalSold', '$totalStock'] }
          ]
        }
      }
    },
    {
      $match: {
        month: { $ne: 0 }
      }
    },
    {
      $sort: { year: 1, month: 1 }
    }
  ];

  return pipeline;
}

// Dead Stock Pipeline (items not sold in last 90 days)
export const buildDeadStockPipeline = (
  filters: any = {},
  daysThreshold: number = 90,
  limit: number = 20
): PipelineStage[] => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);

  const baseMatch: any = {
    status: 'active',
    'inventory.currentStock': { $gt: 0 }
  };

  if (filters.warehouse && filters.warehouse !== 'all') {
    baseMatch['inventory.locations.warehouseId'] = filters.warehouse;
  }
  if (filters.category && filters.category !== 'all') {
    baseMatch['category.id'] = filters.category;
  }

  return [
    createDateConversionStage(),
    { $match: baseMatch },
    {
      $lookup: {
        from: 'salesorders',
        let: { productId: '$_id' },
        pipeline: [
          {
            $addFields: {
              'dates.orderDateConverted': {
                $dateFromString: { dateString: '$dates.orderDate' }
              }
            }
          },
          {
            $match: {
              $expr: {
                $and: [
                  { $gte: ['$dates.orderDateConverted', cutoffDate] },
                  { $in: ['$status', ['shipped', 'delivered', 'completed']] }
                ]
              }
            }
          },
          { $unwind: '$items' },
          {
            $match: {
              $expr: { $eq: ['$items.productId', '$$productId'] }
            }
          },
          {
            $group: {
              _id: null,
              lastSoldDate: { $max: '$dates.orderDateConverted' },
              totalSold: { $sum: '$items.quantity' }
            }
          }
        ],
        as: 'salesData'
      }
    },
    {
      $match: {
        $or: [
          { salesData: { $size: 0 } },
          { 'salesData.totalSold': 0 }
        ]
      }
    },
    {
      $project: {
        _id: 0,
        productId: '$_id',
        name: 1,
        sku: 1,
        category: 1,
        stock: '$inventory.currentStock',
        value: {
          $multiply: ['$inventory.currentStock', '$pricing.price']
        },
        lastSoldDate: {
          $ifNull: [
            { $arrayElemAt: ['$salesData.lastSoldDate', 0] },
            null
          ]
        }
      }
    },
    {
      $sort: { stockValue: -1 }
    },
    {
      $limit: limit
    }
  ];
};
