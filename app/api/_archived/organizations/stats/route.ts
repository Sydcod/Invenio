import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/next-auth';
import connectMongo from '@/libs/mongoose';
import Organization from '@/models/Organization';
import User from '@/models/User';
import Product from '@/models/Product';
import SalesOrder from '@/models/SalesOrder';
import PurchaseOrder from '@/models/PurchaseOrder';
import Warehouse from '@/models/Warehouse';
import Supplier from '@/models/Supplier';

// GET /api/organizations/stats - Get organization statistics
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectMongo();

    const organizationId = session.user.organizationId;

    // Fetch all statistics in parallel
    const [
      organization,
      userCount,
      productCount,
      lowStockCount,
      supplierCount,
      warehouseCount,
      salesOrderStats,
      purchaseOrderStats,
      recentSalesOrders,
      recentPurchaseOrders,
    ] = await Promise.all([
      // Organization details
      Organization.findById(organizationId),
      
      // User count by status
      User.aggregate([
        { $match: { organizationId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      
      // Total products
      Product.countDocuments({ organizationId, isActive: true }),
      
      // Low stock products
      Product.countDocuments({
        organizationId,
        isActive: true,
        $expr: { $lte: ['$inventory.available', '$inventory.reorderPoint'] },
      }),
      
      // Active suppliers
      Supplier.countDocuments({ organizationId, isActive: true }),
      
      // Active warehouses
      Warehouse.countDocuments({ organizationId, status: 'active' }),
      
      // Sales order statistics
      SalesOrder.aggregate([
        { $match: { organizationId } },
        {
          $facet: {
            byStatus: [
              { $group: { _id: '$status', count: { $sum: 1 } } },
            ],
            revenue: [
              {
                $match: {
                  status: { $nin: ['cancelled', 'refunded'] },
                  'dates.orderDate': {
                    $gte: new Date(new Date().setDate(1)), // First day of current month
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  total: { $sum: '$financial.grandTotal' },
                  count: { $sum: 1 },
                },
              },
            ],
          },
        },
      ]),
      
      // Purchase order statistics
      PurchaseOrder.aggregate([
        { $match: { organizationId } },
        {
          $facet: {
            byStatus: [
              { $group: { _id: '$status', count: { $sum: 1 } } },
            ],
            spending: [
              {
                $match: {
                  status: { $nin: ['cancelled'] },
                  'dates.orderDate': {
                    $gte: new Date(new Date().setDate(1)), // First day of current month
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  total: { $sum: '$financial.grandTotal' },
                  count: { $sum: 1 },
                },
              },
            ],
          },
        },
      ]),
      
      // Recent sales orders
      SalesOrder.find({ organizationId })
        .sort({ 'dates.orderDate': -1 })
        .limit(5)
        .select('orderNumber customer financial.grandTotal status dates.orderDate'),
      
      // Recent purchase orders
      PurchaseOrder.find({ organizationId })
        .sort({ 'dates.orderDate': -1 })
        .limit(5)
        .select('orderNumber supplier financial.grandTotal status dates.orderDate'),
    ]);

    // Process user statistics
    const userStats = {
      total: userCount.reduce((sum, stat) => sum + stat.count, 0),
      byStatus: Object.fromEntries(userCount.map(stat => [stat._id, stat.count])),
    };

    // Process sales statistics
    const salesStats = {
      byStatus: Object.fromEntries(
        salesOrderStats[0]?.byStatus?.map((stat: any) => [stat._id, stat.count]) || []
      ),
      monthlyRevenue: salesOrderStats[0]?.revenue?.[0]?.total || 0,
      monthlyOrders: salesOrderStats[0]?.revenue?.[0]?.count || 0,
    };

    // Process purchase statistics
    const purchaseStats = {
      byStatus: Object.fromEntries(
        purchaseOrderStats[0]?.byStatus?.map((stat: any) => [stat._id, stat.count]) || []
      ),
      monthlySpending: purchaseOrderStats[0]?.spending?.[0]?.total || 0,
      monthlyOrders: purchaseOrderStats[0]?.spending?.[0]?.count || 0,
    };

    // Calculate inventory value
    const inventoryValue = await Product.aggregate([
      { $match: { organizationId, isActive: true } },
      {
        $group: {
          _id: null,
          totalValue: { $sum: '$inventory.stockValue' },
          totalItems: { $sum: '$inventory.available' },
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      data: {
        organization: {
          name: organization?.name,
          industry: (organization as any)?.industry,
          subscription: organization?.subscription,
        },
        users: userStats,
        inventory: {
          totalProducts: productCount,
          lowStockProducts: lowStockCount,
          totalValue: inventoryValue[0]?.totalValue || 0,
          totalItems: inventoryValue[0]?.totalItems || 0,
        },
        suppliers: {
          total: supplierCount,
        },
        warehouses: {
          total: warehouseCount,
        },
        sales: salesStats,
        purchases: purchaseStats,
        recentActivity: {
          salesOrders: recentSalesOrders,
          purchaseOrders: recentPurchaseOrders,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching organization stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
