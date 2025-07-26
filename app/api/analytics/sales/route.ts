import { NextRequest, NextResponse } from 'next/server';
import connectMongo from '@/libs/mongoose';
import '@/models/SalesOrder';
import '@/models/Product';
import '@/models/Customer';
import mongoose from 'mongoose';
import { 
  buildSalesKPIsPipeline,
  buildSalesTrendPipeline,
  buildChannelPerformancePipeline,
  buildSourceDistributionPipeline,
  buildPaymentMethodsPipeline,
  buildTopProductsPipeline,
  buildSalesRepPerformancePipeline,
  buildOrderStatusFunnelPipeline,
  calculateChange
} from '@/libs/analytics/sales-aggregations';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  
  // Parse query parameters
  const startDateParam = searchParams.get('startDate');
  const endDateParam = searchParams.get('endDate');
  
  const startDate = startDateParam ? new Date(startDateParam) : new Date();
  const endDate = endDateParam ? new Date(endDateParam) : new Date();
  
  // Calculate comparison period (previous period of same length)
  const periodLength = endDate.getTime() - startDate.getTime();
  const comparisonEndDate = new Date(startDate.getTime() - 1);
  const comparisonStartDate = new Date(comparisonEndDate.getTime() - periodLength);
  
  // Parse filters
  const filters = {
    warehouse: searchParams.get('warehouse') || 'all',
    channel: searchParams.get('channel') || 'all',
    salesRep: searchParams.get('salesRep') || 'all'
  };

  try {
    // Connect to MongoDB using mongoose
    await connectMongo();
    
    const SalesOrder = mongoose.models.SalesOrder || mongoose.model('SalesOrder', new mongoose.Schema({}));
    const salesOrdersCollection = SalesOrder.collection;

    // Execute all aggregations in parallel
    const [
      kpiResults,
      salesTrend,
      channelPerformance,
      sourceDistribution,
      paymentMethods,
      topProducts,
      salesRepPerformance,
      orderStatusFunnel
    ] = await Promise.all([
      // KPIs with comparison
      salesOrdersCollection.aggregate(
        buildSalesKPIsPipeline(startDate, endDate, comparisonStartDate, comparisonEndDate, filters)
      ).toArray(),
      
      // Sales trend
      salesOrdersCollection.aggregate(
        buildSalesTrendPipeline(startDate, endDate, filters)
      ).toArray(),
      
      // Channel performance
      salesOrdersCollection.aggregate(
        buildChannelPerformancePipeline(startDate, endDate, filters)
      ).toArray(),
      
      // Source distribution
      salesOrdersCollection.aggregate(
        buildSourceDistributionPipeline(startDate, endDate, filters)
      ).toArray(),
      
      // Payment methods
      salesOrdersCollection.aggregate(
        buildPaymentMethodsPipeline(startDate, endDate, filters)
      ).toArray(),
      
      // Top products
      salesOrdersCollection.aggregate(
        buildTopProductsPipeline(startDate, endDate, filters, 10)
      ).toArray(),
      
      // Sales rep performance
      salesOrdersCollection.aggregate(
        buildSalesRepPerformancePipeline(startDate, endDate, filters)
      ).toArray(),
      
      // Order status funnel
      salesOrdersCollection.aggregate(
        buildOrderStatusFunnelPipeline(startDate, endDate, filters)
      ).toArray()
    ]);

    // Extract KPI results
    const kpiCurrent = kpiResults.find((r: any) => r._id === 'current') || {
      revenue: 0,
      orders: 0,
      avgOrderValue: 0,
      conversionRate: 0
    };
    const kpiComparison = kpiResults.find((r: any) => r._id === 'comparison') || {
      revenue: 0,
      orders: 0,
      avgOrderValue: 0,
      conversionRate: 0
    };

    // Calculate percentage changes
    const metrics = {
      revenue: (kpiCurrent as any).revenue || 0,
      revenueChange: calculateChange((kpiCurrent as any).revenue, (kpiComparison as any).revenue),
      orders: (kpiCurrent as any).orders || 0,
      ordersChange: calculateChange((kpiCurrent as any).orders, (kpiComparison as any).orders),
      avgOrderValue: (kpiCurrent as any).avgOrderValue || 0,
      avgOrderValueChange: calculateChange((kpiCurrent as any).avgOrderValue, (kpiComparison as any).avgOrderValue),
      conversionRate: (kpiCurrent as any).conversionRate || 0,
      conversionRateChange: calculateChange((kpiCurrent as any).conversionRate, (kpiComparison as any).conversionRate)
    };

    // Calculate percentages for channel performance
    const totalChannelRevenue = channelPerformance.reduce((sum, channel) => sum + channel.revenue, 0);
    const channelPerformanceWithPercentage = channelPerformance.map(channel => ({
      ...channel,
      percentage: totalChannelRevenue > 0 ? (channel.revenue / totalChannelRevenue) * 100 : 0
    }));

    // Calculate percentages for source distribution
    const totalSourceRevenue = sourceDistribution.reduce((sum, source) => sum + source.revenue, 0);
    const sourceDistributionWithPercentage = sourceDistribution.map(source => ({
      ...source,
      percentage: totalSourceRevenue > 0 ? (source.revenue / totalSourceRevenue) * 100 : 0
    }));

    return NextResponse.json({
      metrics,
      salesTrend,
      channelPerformance: channelPerformanceWithPercentage,
      sourceDistribution: sourceDistributionWithPercentage,
      paymentMethods,
      topProducts,
      salesRepPerformance,
      orderStatusFunnel
    });
    
  } catch (error) {
    console.error('Sales analytics API error:', error);
    
    // In development, return the actual error for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch sales analytics',
        details: process.env.NODE_ENV === 'development' ? {
          message: errorMessage,
          stack: errorStack
        } : undefined
      },
      { status: 500 }
    );
  } finally {
    // Mongoose connection is managed globally, no need to close
  }
}
