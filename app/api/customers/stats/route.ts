import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/next-auth';
import connectMongo from '@/libs/mongoose';
import Customer from '@/models/Customer';

// GET /api/customers/stats - Get customer statistics
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectMongo();

    // Use aggregation pipeline to calculate all stats efficiently from full dataset
    const statsAggregation = await Customer.aggregate([
      {
        $facet: {
          // Total customers count
          totalCustomers: [
            { $count: "count" }
          ],
          // Customers by type (B2B vs B2C)
          customersByType: [
            {
              $group: {
                _id: "$type",
                count: { $sum: 1 }
              }
            }
          ],
          // Customers by status
          customersByStatus: [
            {
              $group: {
                _id: "$status", 
                count: { $sum: 1 }
              }
            }
          ],
          // Total revenue from all customers
          totalRevenue: [
            {
              $group: {
                _id: null,
                totalRevenue: { $sum: "$metrics.totalSpent" },
                totalOrders: { $sum: "$metrics.totalOrders" },
                avgSpentPerCustomer: { $avg: "$metrics.totalSpent" },
                avgOrdersPerCustomer: { $avg: "$metrics.totalOrders" }
              }
            }
          ],
          // Top spending customers
          topCustomers: [
            { $sort: { "metrics.totalSpent": -1 } },
            { $limit: 10 },
            {
              $project: {
                _id: 1,
                name: 1,
                type: 1,
                company: 1,
                totalSpent: "$metrics.totalSpent",
                totalOrders: "$metrics.totalOrders"
              }
            }
          ],
          // Recent customers (last 30 days if createdAt exists)
          recentCustomers: [
            {
              $match: {
                createdAt: {
                  $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
                }
              }
            },
            { $count: "count" }
          ]
        }
      }
    ]);

    const stats = statsAggregation[0];

    // Process customersByType results
    const typeStats = stats.customersByType.reduce((acc: any, item: any) => {
      acc[item._id.toLowerCase()] = item.count;
      return acc;
    }, {});

    // Process customersByStatus results
    const statusStats = stats.customersByStatus.reduce((acc: any, item: any) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    // Build response with safe defaults
    const totalCustomers = stats.totalCustomers[0]?.count || 0;
    const b2bCount = typeStats.b2b || 0;
    const b2cCount = typeStats.b2c || 0;
    const revenueData = stats.totalRevenue[0] || {};

    const response = {
      totalCustomers,
      b2bCustomers: b2bCount,
      b2cCustomers: b2cCount,
      b2bPercentage: totalCustomers > 0 ? Math.round((b2bCount / totalCustomers) * 100) : 0,
      b2cPercentage: totalCustomers > 0 ? Math.round((b2cCount / totalCustomers) * 100) : 0,
      totalRevenue: revenueData.totalRevenue || 0,
      totalOrders: revenueData.totalOrders || 0,
      averageSpentPerCustomer: revenueData.avgSpentPerCustomer || 0,
      averageOrdersPerCustomer: revenueData.avgOrdersPerCustomer || 0,
      customersByStatus: stats.customersByStatus || [],
      topCustomers: stats.topCustomers || [],
      recentCustomersCount: stats.recentCustomers[0]?.count || 0,
      activeCustomers: statusStats.active || 0,
      inactiveCustomers: statusStats.inactive || 0
    };

    return NextResponse.json({
      success: true,
      data: response,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error calculating customer stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
