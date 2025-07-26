import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/next-auth';
import connectMongo from '@/libs/mongoose';
import '@/models/SalesOrder';
import '@/models/Product';
import '@/models/Customer';
import mongoose from 'mongoose';
import { 
  buildSalesKPIsPipeline, 
  buildSalesTrendPipeline,
  buildCategoryPerformancePipeline,
  buildCustomerSegmentsPipeline,
  buildInventoryKPIsPipeline,
  buildInsightsPipeline
} from '@/libs/analytics/aggregations';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    // TEMPORARILY DISABLED FOR DEVELOPMENT - UNCOMMENT IN PRODUCTION
    // const session = await getServerSession(authOptions);
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const warehouseId = searchParams.get('warehouse');

    console.log('Analytics API - Date Range:', { startDate, endDate });

    // Calculate comparison period for KPIs (previous period of same length)
    let comparisonStartDate, comparisonEndDate;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const periodLength = end.getTime() - start.getTime();
      
      comparisonEndDate = new Date(start.getTime() - 1);
      comparisonStartDate = new Date(comparisonEndDate.getTime() - periodLength);
    }

    // Connect to database
    await connectMongo();

    const SalesOrder = mongoose.model('SalesOrder');
    const Product = mongoose.model('Product');

    // Debug: Log the date parameters being used
    console.log('[DEBUG] Date parameters:', {
      startDate,
      endDate,
      comparisonStartDate: comparisonStartDate?.toISOString(),
      comparisonEndDate: comparisonEndDate?.toISOString()
    });

    // Execute aggregations in parallel for better performance
    const [salesKPIsResult, salesTrendResult, categoryPerformanceResult, customerSegmentsResult, inventoryKPIsResult] = await Promise.all([
      // Sales KPIs with comparison
      SalesOrder.aggregate(buildSalesKPIsPipeline({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        warehouseId: warehouseId || undefined,
        comparisonStartDate: comparisonStartDate?.toISOString(),
        comparisonEndDate: comparisonEndDate?.toISOString()
      })),
      
      // Sales trend (daily for dashboard overview)
      SalesOrder.aggregate(buildSalesTrendPipeline({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        warehouseId: warehouseId || undefined,
        groupBy: 'day'
      })),
      
      // Top 5 categories by revenue
      SalesOrder.aggregate(buildCategoryPerformancePipeline({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        warehouseId: warehouseId || undefined,
        limit: 5
      })),
      
      // Customer segments
      (() => {
        const params = {
          startDate: startDate || undefined,
          endDate: endDate || undefined
        };
        console.log('[API DEBUG] Customer segments params:', params);
        const pipeline = buildCustomerSegmentsPipeline(params);
        console.log('[API DEBUG] Customer segments pipeline:', JSON.stringify(pipeline, null, 2));
        return SalesOrder.aggregate(pipeline).then(result => {
          console.log('[API DEBUG] Customer segments raw result:', JSON.stringify(result, null, 2));
          return result;
        });
      })(),
      
      // Inventory KPIs
      Product.aggregate(buildInventoryKPIsPipeline({
        warehouseId: warehouseId || undefined
      }))
    ]);

    // Debug logging
    console.log('Analytics API - Sales KPIs Result:', JSON.stringify(salesKPIsResult, null, 2));
    console.log('Analytics API - Sales Trend Result:', JSON.stringify(salesTrendResult, null, 2));
    console.log('Analytics API - Category Performance Result:', JSON.stringify(categoryPerformanceResult, null, 2));
    console.log('Analytics API - Customer Segments Result:', JSON.stringify(customerSegmentsResult, null, 2));
    console.log('Analytics API - Inventory KPIs Result:', JSON.stringify(inventoryKPIsResult, null, 2));

    // Debug: Log raw aggregation result
    console.log('[DEBUG] Raw salesKPIsResult:', JSON.stringify(salesKPIsResult, null, 2));

    // Process KPIs with comparison calculations
    const currentKPIs = salesKPIsResult[0]?.current[0] || {
      totalRevenue: 0,
      totalOrders: 0,
      avgOrderValue: 0,
      uniqueCustomerCount: 0
    };

    const comparisonKPIs = salesKPIsResult[0]?.comparison[0] || {
      totalRevenue: 0,
      totalOrders: 0,
      avgOrderValue: 0
    };

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    // Process inventory KPIs
    const inventoryOverview = inventoryKPIsResult[0]?.overview[0] || {
      totalProducts: 0,
      totalValue: 0,
      totalQuantity: 0,
      outOfStock: 0,
      lowStock: 0
    };

    const deadStock = inventoryKPIsResult[0]?.deadStock[0] || {
      deadStockValue: 0,
      deadStockCount: 0
    };

    // Calculate current period metrics
    const inventoryTurnover = currentKPIs.totalRevenue > 0 && inventoryOverview.totalValue > 0
      ? (currentKPIs.totalRevenue / inventoryOverview.totalValue) * 4 // Quarterly estimate
      : 0;

    const conversionRate = currentKPIs.uniqueCustomerCount > 0
      ? (currentKPIs.totalOrders / currentKPIs.uniqueCustomerCount) * 100
      : 0;

    const customerLifetimeValue = currentKPIs.uniqueCustomerCount > 0
      ? currentKPIs.totalRevenue / currentKPIs.uniqueCustomerCount
      : 0;

    // Calculate comparison period metrics for percentage changes
    const comparisonInventoryTurnover = comparisonKPIs.totalRevenue > 0 && inventoryOverview.totalValue > 0
      ? (comparisonKPIs.totalRevenue / inventoryOverview.totalValue) * 4
      : 0;

    const comparisonConversionRate = comparisonKPIs.uniqueCustomerCount > 0
      ? (comparisonKPIs.totalOrders / comparisonKPIs.uniqueCustomerCount) * 100
      : 0;

    const comparisonCustomerLifetimeValue = comparisonKPIs.uniqueCustomerCount > 0
      ? comparisonKPIs.totalRevenue / comparisonKPIs.uniqueCustomerCount
      : 0;

    // Format response
    const response: any = {
      kpis: {
        totalRevenue: {
          value: currentKPIs.totalRevenue || 0,
          change: calculateChange(currentKPIs.totalRevenue || 0, comparisonKPIs.totalRevenue || 0)
        },
        totalOrders: {
          value: currentKPIs.totalOrders || 0,
          change: calculateChange(currentKPIs.totalOrders || 0, comparisonKPIs.totalOrders || 0)
        },
        avgOrderValue: {
          value: currentKPIs.avgOrderValue || 0,
          change: calculateChange(currentKPIs.avgOrderValue || 0, comparisonKPIs.avgOrderValue || 0)
        },
        conversionRate: {
          value: conversionRate,
          change: calculateChange(conversionRate, comparisonConversionRate)
        },
        inventoryTurnover: {
          value: inventoryTurnover,
          change: calculateChange(inventoryTurnover, comparisonInventoryTurnover)
        },
        customerLifetimeValue: {
          value: customerLifetimeValue,
          change: calculateChange(customerLifetimeValue, comparisonCustomerLifetimeValue)
        }
      },
      salesTrend: salesTrendResult.map(item => ({
        date: item.date,
        revenue: item.revenue,
        orders: item.orders
      })),
      categoryPerformance: categoryPerformanceResult,
      customerSegments: customerSegmentsResult.map(segment => ({
        segment: segment.segment,
        count: segment.customerCount, // Rename customerCount to count
        revenue: segment.revenue,
        orderCount: segment.orderCount,
        avgOrderValue: segment.avgOrderValue
      })),
      inventoryMetrics: {
        totalProducts: inventoryOverview.totalProducts,
        totalValue: inventoryOverview.totalValue,
        outOfStock: inventoryOverview.outOfStock,
        lowStock: inventoryOverview.lowStock,
        deadStockValue: deadStock.deadStockValue
      }
    };

    // Generate insights
    const { lowStockPipeline, categoryTrendsPipeline, segmentTrendsPipeline } = buildInsightsPipeline({
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined
    });

    // Execute insights pipelines
    const [lowStockResult] = await Product.aggregate(lowStockPipeline);
    const [categoryTrend] = await SalesOrder.aggregate(categoryTrendsPipeline as any);
    const segmentTrends = await SalesOrder.aggregate(segmentTrendsPipeline);

    // Process segment trends to find growth comparison
    const b2bGrowth = segmentTrends.find(s => s.segment === 'B2B')?.growth || 0;
    const b2cGrowth = segmentTrends.find(s => s.segment === 'B2C')?.growth || 0;
    const growthComparison = b2bGrowth > 0 && b2cGrowth > 0 ? b2bGrowth / b2cGrowth : 0;

    // Build insights array
    const insights = [];
    
    // Low stock alert
    if (lowStockResult?.lowStockCount > 0) {
      insights.push({
        type: 'alert',
        icon: 'warning',
        title: 'Low Stock Alert',
        description: `${lowStockResult.lowStockCount} products below reorder point`
      });
    }

    // Category trend insight
    if (categoryTrend && categoryTrend.percentChange !== 0) {
      const trend = categoryTrend.percentChange > 0 ? 'up' : 'down';
      const icon = categoryTrend.percentChange > 0 ? 'up' : 'down';
      insights.push({
        type: 'trend',
        icon,
        title: 'Sales Spike',
        description: `${categoryTrend.category || 'Top category'} ${trend} ${Math.abs(categoryTrend.percentChange).toFixed(1)}% this week`
      });
    }

    // Segment growth comparison
    if (growthComparison > 1) {
      insights.push({
        type: 'analysis',
        icon: 'chart',
        title: 'Trend Analysis',
        description: `B2B sales growing ${growthComparison.toFixed(1)}x faster than B2C`
      });
    } else if (b2bGrowth > 0 || b2cGrowth > 0) {
      const leadingSegment = b2bGrowth > b2cGrowth ? 'B2B' : 'B2C';
      const growth = Math.max(b2bGrowth, b2cGrowth);
      if (growth > 1) {
        insights.push({
          type: 'analysis',
          icon: 'chart',
          title: 'Segment Growth',
          description: `${leadingSegment} segment showing ${((growth - 1) * 100).toFixed(1)}% growth`
        });
      }
    }

    // Add insights to response
    response.insights = insights;

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in analytics dashboard API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
