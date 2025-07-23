import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import SalesOrder from "@/models/SalesOrder";
import PurchaseOrder from "@/models/PurchaseOrder";
import Product from "@/models/Product";
import Warehouse from "@/models/Warehouse";
import Supplier from "@/models/Supplier";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongo();

    // Get date ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    lastMonth.setDate(1);
    lastMonth.setHours(0, 0, 0, 0);
    
    const lastMonthEnd = new Date(thisMonth);
    lastMonthEnd.setDate(0);

    // Fetch all data in parallel
    const [
      // Sales metrics
      totalRevenue,
      monthlyRevenue,
      lastMonthRevenue,
      salesByStatus,
      salesByChannel,
      topProducts,
      
      // Purchase metrics
      purchaseOrders,
      purchaseByStatus,
      
      // Inventory metrics
      products,
      lowStockProducts,
      productsByCategory,
      
      // Other metrics
      warehouses,
      suppliers,
      recentSales,
      recentPurchases
    ] = await Promise.all([
      // Total revenue
      SalesOrder.aggregate([
        { $group: { 
          _id: null, 
          total: { $sum: "$financial.grandTotal" },
          count: { $sum: 1 },
          avgOrderValue: { $avg: "$financial.grandTotal" },
          totalProfit: { $sum: { $multiply: ["$financial.grandTotal", { $divide: ["$financial.profitMargin", 100] }] } }
        }}
      ]),
      
      // This month's revenue
      SalesOrder.aggregate([
        { $match: { createdAt: { $gte: thisMonth.toISOString() } } },
        { $group: { 
          _id: null, 
          total: { $sum: "$financial.grandTotal" },
          count: { $sum: 1 }
        }}
      ]),
      
      // Last month's revenue
      SalesOrder.aggregate([
        { $match: { 
          createdAt: { 
            $gte: lastMonth.toISOString(),
            $lt: thisMonth.toISOString()
          } 
        }},
        { $group: { 
          _id: null, 
          total: { $sum: "$financial.grandTotal" },
          count: { $sum: 1 }
        }}
      ]),
      
      // Sales by status
      SalesOrder.aggregate([
        { $group: { 
          _id: "$status", 
          count: { $sum: 1 },
          total: { $sum: "$financial.grandTotal" }
        }},
        { $sort: { count: -1 } }
      ]),
      
      // Sales by channel
      SalesOrder.aggregate([
        { $group: { 
          _id: "$channel", 
          count: { $sum: 1 },
          total: { $sum: "$financial.grandTotal" }
        }}
      ]),
      
      // Top selling products
      SalesOrder.aggregate([
        { $unwind: "$items" },
        { $group: {
          _id: {
            productId: "$items.productId",
            name: "$items.product.name",
            sku: "$items.product.sku"
          },
          quantity: { $sum: "$items.quantity" },
          revenue: { $sum: "$items.total" }
        }},
        { $sort: { revenue: -1 } },
        { $limit: 10 }
      ]),
      
      // Purchase orders
      PurchaseOrder.aggregate([
        { $group: { 
          _id: null, 
          total: { $sum: "$financial.grandTotal" },
          count: { $sum: 1 },
          pending: { $sum: { $cond: [{ $in: ["$status", ["pending", "ordered", "approved"]] }, 1, 0] } }
        }}
      ]),
      
      // Purchase by status
      PurchaseOrder.aggregate([
        { $group: { 
          _id: "$status", 
          count: { $sum: 1 },
          total: { $sum: "$financial.grandTotal" }
        }}
      ]),
      
      // Products overview
      Product.aggregate([
        { $group: { 
          _id: null, 
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
          totalValue: { $sum: { $multiply: ["$pricing.price", "$inventory.currentStock"] } }
        }}
      ]),
      
      // Low stock products
      Product.find({
        $expr: { $lte: ["$inventory.quantity", "$inventory.reorderPoint"] },
        status: "active"
      }).limit(10).lean(),
      
      // Products by category
      Product.aggregate([
        { $group: { 
          _id: "$category.name",
          count: { $sum: 1 },
          value: { $sum: { $multiply: ["$pricing.price", "$inventory.currentStock"] } }
        }},
        { $sort: { value: -1 } }
      ]),
      
      // Warehouses
      Warehouse.countDocuments(),
      
      // Suppliers
      Supplier.aggregate([
        { $group: { 
          _id: null, 
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } }
        }}
      ]),
      
      // Recent sales
      SalesOrder.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .select("orderNumber customer.name financial.grandTotal status createdAt")
        .lean(),
        
      // Recent purchases
      PurchaseOrder.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .select("orderNumber supplier.name financial.grandTotal status createdAt")
        .lean()
    ]);

    // Calculate growth percentages
    const currentMonthRevenue = monthlyRevenue[0]?.total || 0;
    const previousMonthRevenue = lastMonthRevenue[0]?.total || 0;
    const revenueGrowth = previousMonthRevenue > 0 
      ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
      : 0;

    // Format response
    const stats = {
      revenue: {
        total: totalRevenue[0]?.total || 0,
        totalProfit: totalRevenue[0]?.totalProfit || 0,
        avgOrderValue: totalRevenue[0]?.avgOrderValue || 0,
        currentMonth: currentMonthRevenue,
        growth: revenueGrowth,
        orderCount: totalRevenue[0]?.count || 0
      },
      salesByStatus: salesByStatus.map(s => ({
        status: s._id,
        count: s.count,
        total: s.total
      })),
      salesByChannel: salesByChannel.map(s => ({
        channel: s._id || 'Direct',
        count: s.count,
        total: s.total
      })),
      topProducts: topProducts.map(p => ({
        productId: p._id.productId,
        name: p._id.name,
        sku: p._id.sku,
        quantity: p.quantity,
        revenue: p.revenue
      })),
      inventory: {
        totalProducts: products[0]?.total || 0,
        activeProducts: products[0]?.active || 0,
        totalValue: products[0]?.totalValue || 0,
        lowStockCount: lowStockProducts.length,
        lowStockProducts: lowStockProducts.map(p => ({
          _id: p._id,
          name: p.name,
          sku: p.sku,
          currentStock: p.inventory?.quantity || 0,
          reorderPoint: p.inventory?.reorderPoint || 0
        }))
      },
      productsByCategory: productsByCategory.map(cat => ({
        _id: cat._id || 'Uncategorized',
        name: cat._id || 'Uncategorized',
        value: cat.value || 0,
        count: cat.count || 0
      })),
      purchaseOrders: {
        total: purchaseOrders[0]?.total || 0,
        count: purchaseOrders[0]?.count || 0,
        pending: purchaseOrders[0]?.pending || 0
      },
      purchaseByStatus: purchaseByStatus.map(p => ({
        status: p._id,
        count: p.count,
        total: p.total
      })),
      warehouses: {
        total: warehouses
      },
      suppliers: {
        total: suppliers[0]?.total || 0,
        active: suppliers[0]?.active || 0
      },
      recentActivity: {
        sales: recentSales,
        purchases: recentPurchases
      }
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
