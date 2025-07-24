import { ReportConfig, ReportParams, CommonFilters } from '@/libs/reports/types';
import { formatCurrency, formatNumber } from '@/libs/reports/utils';

export const inventorySummaryReport: ReportConfig = {
  id: 'inventory-summary',
  name: 'Inventory Summary',
  category: 'inventory',
  description: 'Current stock levels overview with valuation by product and warehouse',
  requiredCollections: ['products'],
  
  columns: [
    {
      key: 'sku',
      label: 'SKU',
      type: 'string',
      sortable: true
    },
    {
      key: 'name',
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
      key: 'currentStock',
      label: 'Current Stock',
      type: 'number',
      sortable: true,
      align: 'right',
      format: formatNumber
    },
    {
      key: 'availableStock',
      label: 'Available',
      type: 'number',
      sortable: true,
      align: 'right',
      format: formatNumber
    },
    {
      key: 'reservedStock',
      label: 'Reserved',
      type: 'number',
      sortable: true,
      align: 'right',
      format: formatNumber
    },
    {
      key: 'unitCost',
      label: 'Unit Cost',
      type: 'currency',
      sortable: true,
      align: 'right',
      format: formatCurrency
    },
    {
      key: 'stockValue',
      label: 'Stock Value',
      type: 'currency',
      sortable: true,
      align: 'right',
      format: formatCurrency
    },
    {
      key: 'stockStatus',
      label: 'Status',
      type: 'string',
      sortable: true,
      format: (value: string) => {
        const statusMap: Record<string, string> = {
          'low': '🔴 Low Stock',
          'normal': '🟢 Normal',
          'high': '🟡 Overstocked',
          'out': '⚫ Out of Stock'
        };
        return statusMap[value] || value;
      }
    }
  ],
  
  filters: [
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
      key: 'stockLevel',
      label: 'Stock Level',
      type: 'select',
      options: [
        { value: 'all', label: 'All Levels' },
        { value: 'low', label: 'Low Stock' },
        { value: 'normal', label: 'Normal Stock' },
        { value: 'high', label: 'Overstocked' },
        { value: 'out', label: 'Out of Stock' }
      ],
      defaultValue: 'all'
    },
    {
      key: 'warehouse',
      label: 'Warehouse',
      type: 'select',
      options: [], // Will be populated dynamically
      defaultValue: '',
      dynamic: true,
      dynamicConfig: {
        type: 'warehouse',
        collection: 'warehouses'
      }
    },
    {
      key: 'minValue',
      label: 'Min Stock Value',
      type: 'number',
      placeholder: 'Minimum value'
    },
    CommonFilters.search('Search products...')
  ],
  
  defaultSort: {
    column: 'stockValue',
    direction: 'desc'
  },
  
  exportFormats: ['excel', 'csv', 'pdf'],
  
  aggregationPipeline: (params: ReportParams) => {
    const pipeline: any[] = [];
    
    // 1. Match active products and apply filters
    const matchStage: any = {
      isActive: true
    };
    
    // Filter by category
    if (params.filters.category) {
      if (Array.isArray(params.filters.category) && params.filters.category.length > 0) {
        matchStage['category.name'] = { $in: params.filters.category };
      } else if (typeof params.filters.category === 'string' && params.filters.category !== '') {
        matchStage['category.name'] = params.filters.category;
      }
    }
    
    // Filter by brand
    if (params.filters.brand) {
      if (Array.isArray(params.filters.brand) && params.filters.brand.length > 0) {
        matchStage.brand = { $in: params.filters.brand };
      } else if (typeof params.filters.brand === 'string' && params.filters.brand !== '') {
        matchStage.brand = params.filters.brand;
      }
    }
    
    // Search filter
    if (params.filters.search) {
      matchStage.$or = [
        { name: { $regex: params.filters.search, $options: 'i' } },
        { sku: { $regex: params.filters.search, $options: 'i' } },
        { description: { $regex: params.filters.search, $options: 'i' } }
      ];
    }
    
    // Warehouse filter - filter products that have stock in the selected warehouse
    if (params.filters.warehouse && params.filters.warehouse !== 'all') {
      matchStage['inventory.locations'] = {
        $elemMatch: {
          warehouseId: params.filters.warehouse,
          quantity: { $gt: 0 }  // Only show products with stock in this warehouse
        }
      };
    }
    
    pipeline.push({ $match: matchStage });
    
    // 3. If warehouse filter is applied, calculate stock for that specific warehouse
    if (params.filters.warehouse && params.filters.warehouse !== 'all') {
      pipeline.push({
        $addFields: {
          warehouseLocation: {
            $filter: {
              input: '$inventory.locations',
              cond: { $eq: ['$$this.warehouseId', params.filters.warehouse] }
            }
          }
        }
      });
      
      pipeline.push({
        $addFields: {
          // Use warehouse-specific stock if available, otherwise 0
          warehouseStock: {
            $ifNull: [{ $arrayElemAt: ['$warehouseLocation.quantity', 0] }, 0]
          },
          stockStatus: {
            $let: {
              vars: {
                stock: { $ifNull: [{ $arrayElemAt: ['$warehouseLocation.quantity', 0] }, 0] }
              },
              in: {
                $cond: [
                  { $eq: ['$$stock', 0] },
                  'out',
                  {
                    $cond: [
                      { $lte: ['$$stock', '$inventory.reorderPoint'] },
                      'low',
                      {
                        $cond: [
                          { $gte: ['$$stock', { $multiply: ['$inventory.reorderPoint', 3] }] },
                          'high',
                          'normal'
                        ]
                      }
                    ]
                  }
                ]
              }
            }
          },
          stockValue: {
            $multiply: [
              { $ifNull: [{ $arrayElemAt: ['$warehouseLocation.quantity', 0] }, 0] },
              '$pricing.cost'
            ]
          }
        }
      });
    } else {
      // No warehouse filter - use total stock across all warehouses
      pipeline.push({
        $addFields: {
          stockStatus: {
            $cond: [
              { $eq: ['$inventory.currentStock', 0] },
              'out',
              {
                $cond: [
                  { $lte: ['$inventory.currentStock', '$inventory.reorderPoint'] },
                  'low',
                  {
                    $cond: [
                      { $gte: ['$inventory.currentStock', { $multiply: ['$inventory.reorderPoint', 3] }] },
                      'high',
                      'normal'
                    ]
                  }
                ]
              }
            ]
          },
          stockValue: {
            $multiply: ['$inventory.currentStock', '$pricing.cost']
          }
        }
      });
    }
    
    // 4. Filter by stock level if specified
    if (params.filters.stockLevel && params.filters.stockLevel !== 'all') {
      pipeline.push({
        $match: { stockStatus: params.filters.stockLevel }
      });
    }
    
    // 5. Filter by minimum stock value
    if (params.filters.minValue && params.filters.minValue > 0) {
      pipeline.push({
        $match: { stockValue: { $gte: params.filters.minValue } }
      });
    }
    
    // 6. Project final fields
    pipeline.push({
      $project: {
        _id: 0,
        productId: '$_id',
        sku: 1,
        name: 1,
        category: '$category.name',
        brand: 1,
        currentStock: {
          $cond: [
            { $and: [params.filters.warehouse, { $ne: [params.filters.warehouse, 'all'] }] },
            { $ifNull: ['$warehouseStock', 0] },
            '$inventory.currentStock'
          ]
        },
        availableStock: {
          $cond: [
            { $and: [params.filters.warehouse, { $ne: [params.filters.warehouse, 'all'] }] },
            { $ifNull: ['$warehouseStock', 0] },
            '$inventory.availableStock'
          ]
        },
        reservedStock: {
          $cond: [
            { $and: [params.filters.warehouse, { $ne: [params.filters.warehouse, 'all'] }] },
            0, // Reserved stock is not tracked per warehouse
            '$inventory.reservedStock'
          ]
        },
        unitCost: { $round: ['$pricing.cost', 2] },
        stockValue: { $round: ['$stockValue', 2] },
        stockStatus: 1,
        reorderPoint: '$inventory.reorderPoint',
        locations: '$inventory.locations'
      }
    });
    
    // 7. Add sort stage
    if (params.sort) {
      const sortOrder = params.sort.direction === 'asc' ? 1 : -1;
      pipeline.push({ $sort: { [params.sort.column]: sortOrder } });
    } else {
      // Default sort by stock value descending
      pipeline.push({ $sort: { stockValue: -1 } });
    }
    
    return pipeline;
  },
  
  summary: (data: any[]) => {
    const totalProducts = data.length;
    const totalStockValue = data.reduce((sum, row) => sum + row.stockValue, 0);
    const totalUnits = data.reduce((sum, row) => sum + row.currentStock, 0);
    
    // Stock level breakdown
    const stockLevels = data.reduce((acc, row) => {
      acc[row.stockStatus] = (acc[row.stockStatus] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Category breakdown
    const categoryBreakdown = data.reduce((acc, row) => {
      if (!acc[row.category]) {
        acc[row.category] = { count: 0, value: 0 };
      }
      acc[row.category].count++;
      acc[row.category].value += row.stockValue;
      return acc;
    }, {} as Record<string, { count: number; value: number }>);
    
    return {
      totalProducts,
      totalStockValue,
      totalUnits,
      avgStockValue: totalProducts > 0 ? totalStockValue / totalProducts : 0,
      lowStockCount: stockLevels.low || 0,
      outOfStockCount: stockLevels.out || 0,
      normalStockCount: stockLevels.normal || 0,
      highStockCount: stockLevels.high || 0,
      categoryBreakdown
    };
  }
};
