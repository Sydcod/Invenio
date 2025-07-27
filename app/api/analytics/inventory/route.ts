import { NextRequest, NextResponse } from 'next/server';
import connectMongo from '@/libs/mongoose';
import '@/models/Product';
import '@/models/Warehouse';
import mongoose from 'mongoose';
import { 
  buildStockOptimizationPipeline,
  buildWarehouseDistributionPipeline,
  buildMonthlyTurnoverPipeline,
  buildABCAnalysisPipeline,
  buildLowStockAlertsPipeline,
  buildDeadStockPipeline
} from '@/libs/analytics/inventory-aggregations';

// Type definitions
interface ABCItem {
  _id: string;
  sku: string;
  name: string;
  currentStock: number;
  value: number;
  cumulativePercentage?: number;
}

interface ABCAnalysis {
  aItems: ABCItem[];
  bItems: ABCItem[];
  cItems: ABCItem[];
  totalValue: number;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Extract filters from query parameters
    const warehouse = searchParams.get('warehouse') || 'all';
    const category = searchParams.get('category') || 'all';
    const filters: any = {};
    if (warehouse !== 'all') filters.warehouse = warehouse;
    if (category !== 'all') filters.category = category;
    
    console.log('Inventory Analytics API - Filters:', filters);
    console.log('Category filter value:', category);
    console.log('Warehouse filter value:', warehouse);

    await connectMongo();

    // Use test database for all data
    const testDb = mongoose.connection.useDb('test');
    const productsCollection = testDb.collection('products');
    const warehousesCollection = testDb.collection('warehouses');
    const categoriesCollection = testDb.collection('categories');

    // Run all aggregation pipelines
    const [
      stockOptimization,
      abcAnalysisResult,
      warehouseDistribution,
      lowStockAlerts,
      deadStock,
      monthlyTurnover
    ] = await Promise.all([
      productsCollection.aggregate(
        buildStockOptimizationPipeline(filters)
      ).toArray(),
      productsCollection.aggregate(
        buildABCAnalysisPipeline(filters)
      ).toArray(),
      productsCollection.aggregate(
        buildWarehouseDistributionPipeline(filters)
      ).toArray(),
      productsCollection.aggregate(
        buildLowStockAlertsPipeline(filters, 10)
      ).toArray(),
      productsCollection.aggregate(
        buildDeadStockPipeline(filters, 90, 10)
      ).toArray(),
      (async () => {
        try {
          // Get products from test database
          const productFilter: any = { status: 'active' };
          if (filters.category && filters.category !== 'all') {
            productFilter['category.id'] = filters.category;
          }
          
          const testDb = mongoose.connection.useDb('test');
          const testProducts = testDb.collection('products');
          const products = await testProducts.find(productFilter).toArray();
          const productIds = products.map(p => p._id.toString());
          
          // Get sales from test database
          const testSalesOrders = testDb.collection('salesorders');
          
          const salesData = await testSalesOrders.aggregate([
            {
              $addFields: {
                orderDate: { $dateFromString: { dateString: '$dates.orderDate' } }
              }
            },
            {
              $match: {
                orderDate: {
                  $gte: new Date(new Date().getFullYear(), 0, 1),
                  $lte: new Date()
                }
              }
            },
            { $unwind: '$items' },
            {
              $match: {
                'items.productId': { $in: productIds.map(id => new mongoose.Types.ObjectId(id)) }
              }
            },
            {
              $group: {
                _id: {
                  month: { $month: '$orderDate' },
                  year: { $year: '$orderDate' },
                  productId: '$items.productId'
                },
                quantitySold: { $sum: '$items.quantity' }
              }
            }
          ]).toArray();
          
          // Calculate monthly turnover
          const monthlyData = new Map();
          
          // Initialize months
          for (let month = 1; month <= new Date().getMonth() + 1; month++) {
            const key = `${new Date().getFullYear()}-${month}`;
            monthlyData.set(key, {
              month,
              year: new Date().getFullYear(),
              totalStock: 0,
              totalSold: 0
            });
          }
          
          // Calculate total stock per month
          products.forEach(product => {
            let stock = product.inventory?.currentStock || 0;
            
            // Apply warehouse filter if needed
            if (filters.warehouse && filters.warehouse !== 'all' && product.inventory?.locations) {
              const warehouseStock = product.inventory.locations
                .filter((loc: any) => loc.warehouseId === filters.warehouse)
                .reduce((sum: number, loc: any) => sum + (loc.quantity || 0), 0);
              stock = warehouseStock;
            }
            
            // Add stock to all months (assuming current stock level)
            monthlyData.forEach((data) => {
              data.totalStock += stock;
            });
          });
          
          // Add sales data
          salesData.forEach((sale: any) => {
            const key = `${sale._id.year}-${sale._id.month}`;
            if (monthlyData.has(key)) {
              monthlyData.get(key).totalSold += sale.quantitySold;
            }
          });
          
          // Calculate turnover rate
          const result = Array.from(monthlyData.values()).map(data => ({
            month: data.month,
            year: data.year,
            turnoverRate: data.totalStock > 0 ? data.totalSold / data.totalStock : 0
          }));
          
          return result;
        } catch (error) {
          console.error('Error calculating monthly turnover:', error);
          return [];
        }
      })()
    ]);
    
    // Debug logging for results
    console.log('Stock Optimization Result:', stockOptimization[0]);
    console.log('Warehouse Distribution Result:', warehouseDistribution);
    console.log('ABC Analysis Items Count:', abcAnalysisResult[0]?.items?.length || 0);

    // Process ABC Analysis results
    let abcAnalysis: ABCAnalysis = { 
      aItems: [] as ABCItem[], 
      bItems: [] as ABCItem[], 
      cItems: [] as ABCItem[], 
      totalValue: 0 
    };
    if (abcAnalysisResult.length > 0 && abcAnalysisResult[0].items) {
      const items = abcAnalysisResult[0].items;
      const totalValue = abcAnalysisResult[0].totalValue;
      
      let cumulativeValue = 0;
      const itemsWithCumulative = items.map((item: any) => {
        cumulativeValue += item.value;
        const cumulativePercentage = (cumulativeValue / totalValue) * 100;
        return { ...item, cumulativePercentage };
      });

      // Classify items based on cumulative percentage
      abcAnalysis = {
        aItems: itemsWithCumulative.filter((item: any) => item.cumulativePercentage <= 80),
        bItems: itemsWithCumulative.filter((item: any) => 
          item.cumulativePercentage > 80 && item.cumulativePercentage <= 95
        ),
        cItems: itemsWithCumulative.filter((item: any) => item.cumulativePercentage > 95),
        totalValue
      };
    }

    // Extract stock optimization metrics
    const stockMetrics = stockOptimization[0] || {
      totalItems: 0,
      belowReorderPoint: 0,
      overstockItems: 0,
      outOfStock: 0,
      totalInventoryValue: 0
    };

    // Get filter options from test database
    // For categories, only get ones that have products assigned
    const [warehouseDocs, categoryIdsWithProducts] = await Promise.all([
      warehousesCollection.find({}).project({ _id: 1, name: 1 }).toArray(),
      productsCollection.distinct('category.id')
    ]);
    
    // Fetch category details for categories that have products
    const categoryDocs = await categoriesCollection.find({
      _id: { $in: categoryIdsWithProducts }
    }).project({ _id: 1, name: 1 }).toArray();

    return NextResponse.json({
      stockMetrics: {
        totalItems: stockMetrics.totalItems || 0,
        belowReorderPoint: stockMetrics.belowReorderPoint || 0,
        overstockItems: stockMetrics.overstockItems || 0,
        outOfStock: stockMetrics.outOfStock || 0,
        totalInventoryValue: stockMetrics.totalInventoryValue || 0,
        totalActiveStock: stockMetrics.totalActiveStock || 0
      },
      abcAnalysis,
      warehouseDistribution,
      lowStockAlerts,
      monthlyTurnover,
      deadStock,
      filters: {
        warehouses: warehouseDocs.map((w: any) => ({ value: w._id.toString(), label: w.name })),
        categories: categoryDocs.map((c: any) => ({ value: c._id.toString(), label: c.name }))
      }
    });
  } catch (error) {
    console.error('Error in inventory analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory analytics' },
      { status: 500 }
    );
  }
}
