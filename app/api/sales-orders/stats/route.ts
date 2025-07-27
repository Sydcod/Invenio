import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/next-auth';
import connectMongo from '@/libs/mongoose';
import SalesOrder from '@/models/SalesOrder';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectMongo();

    // Get all stats using MongoDB aggregation for efficiency
    const stats = await SalesOrder.aggregate([
      {
        $facet: {
          // Total orders count
          totalOrders: [
            { $count: "count" }
          ],
          
          // Pending orders count (draft, pending, confirmed statuses)
          pendingOrders: [
            {
              $match: {
                status: { $in: ["draft", "pending", "confirmed"] }
              }
            },
            { $count: "count" }
          ],
          
          // Total revenue
          totalRevenue: [
            {
              $group: {
                _id: null,
                total: { $sum: "$financial.grandTotal" }
              }
            }
          ],
          
          // Orders this month count and revenue - July 2025 (string date comparison)
          ordersThisMonth: [
            {
              $match: {
                $or: [
                  {
                    "dates.orderDate": {
                      $gte: "2025-07-01T00:00:00.000Z",
                      $lt: "2025-08-01T00:00:00.000Z"
                    }
                  },
                  {
                    $and: [
                      { "dates.orderDate": { $exists: false } },
                      {
                        "createdAt": {
                          $gte: "2025-07-01T00:00:00.000Z",
                          $lt: "2025-08-01T00:00:00.000Z"
                        }
                      }
                    ]
                  }
                ]
              }
            },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                revenue: { $sum: "$financial.grandTotal" }
              }
            }
          ],
          
          // Orders by status
          ordersByStatus: [
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 }
              }
            },
            {
              $sort: { count: -1 }
            }
          ],
          
          // Top customers
          topCustomers: [
            {
              $group: {
                _id: "$customer.email",
                name: { $first: "$customer.name" },
                email: { $first: "$customer.email" },
                totalOrders: { $sum: 1 },
                totalRevenue: { $sum: "$financial.grandTotal" }
              }
            },
            {
              $sort: { totalRevenue: -1 }
            },
            {
              $limit: 5
            }
          ]
        }
      }
    ]);

    const result = stats[0];

    // Format the response
    const formattedStats = {
      totalOrders: result.totalOrders[0]?.count || 0,
      pendingOrders: result.pendingOrders[0]?.count || 0,
      totalRevenue: result.totalRevenue[0]?.total || 0,
      ordersThisMonth: result.ordersThisMonth[0]?.count || 0,
      thisMonthRevenue: result.ordersThisMonth[0]?.revenue || 0,
      averageOrderValue: result.totalOrders[0]?.count 
        ? (result.totalRevenue[0]?.total || 0) / result.totalOrders[0].count
        : 0,
      completedOrders: result.ordersByStatus.find((s: any) => 
        ['delivered', 'completed'].includes(s._id)
      )?.count || 0,
      ordersByStatus: result.ordersByStatus.map((s: any) => ({
        status: s._id,
        count: s.count
      })),
      topCustomers: result.topCustomers || []
    };

    return NextResponse.json({
      success: true,
      data: formattedStats
    });

  } catch (error) {
    console.error('Error fetching sales orders stats:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch sales orders statistics' 
      },
      { status: 500 }
    );
  }
}
