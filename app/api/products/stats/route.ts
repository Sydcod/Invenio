import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import Product from "@/models/Product";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongo();

    // Fetch all product metrics in parallel
    const [
      totalProducts,
      statusCounts,
      lowStockProducts,
      categoryStats,
      brandStats,
      inventoryMetrics
    ] = await Promise.all([
      // Total products count
      Product.countDocuments(),
      
      // Products by status
      Product.aggregate([
        { $group: { 
          _id: "$status", 
          count: { $sum: 1 }
        }}
      ]),
      
      // Low stock products (current stock <= reorder point)
      Product.countDocuments({
        $expr: { $lte: ["$inventory.currentStock", "$inventory.reorderPoint"] }
      }),
      
      // Products by category with inventory value
      Product.aggregate([
        { $group: { 
          _id: "$category.name",
          count: { $sum: 1 },
          totalValue: { $sum: { $multiply: ["$pricing.price", "$inventory.currentStock"] } }
        }},
        { $sort: { totalValue: -1 } },
        { $limit: 5 }
      ]),
      
      // Top brands by product count
      Product.aggregate([
        { $match: { brand: { $exists: true, $ne: "" } } },
        { $group: { 
          _id: "$brand",
          count: { $sum: 1 }
        }},
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      
      // Inventory metrics
      Product.aggregate([
        { $group: { 
          _id: null,
          totalValue: { $sum: { $multiply: ["$pricing.price", "$inventory.currentStock"] } },
          totalStock: { $sum: "$inventory.currentStock" },
          avgPrice: { $avg: "$pricing.price" },
          avgStock: { $avg: "$inventory.currentStock" },
          outOfStock: { $sum: { $cond: [{ $lte: ["$inventory.currentStock", 0] }, 1, 0] } }
        }}
      ])
    ]);

    // Process status counts
    const statusMap = {
      active: 0,
      draft: 0,
      discontinued: 0
    };
    
    statusCounts.forEach((status: any) => {
      if (status._id in statusMap) {
        statusMap[status._id as keyof typeof statusMap] = status.count;
      }
    });

    // Format response
    const stats = {
      overview: {
        total: totalProducts,
        active: statusMap.active,
        draft: statusMap.draft,
        discontinued: statusMap.discontinued,
        lowStock: lowStockProducts,
        outOfStock: inventoryMetrics[0]?.outOfStock || 0
      },
      inventory: {
        totalValue: inventoryMetrics[0]?.totalValue || 0,
        totalStock: inventoryMetrics[0]?.totalStock || 0,
        avgPrice: inventoryMetrics[0]?.avgPrice || 0,
        avgStock: inventoryMetrics[0]?.avgStock || 0
      },
      categories: categoryStats.map(cat => ({
        name: cat._id || 'Uncategorized',
        count: cat.count,
        value: cat.totalValue
      })),
      brands: brandStats.map(brand => ({
        name: brand._id,
        count: brand.count
      }))
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Product stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch product stats" },
      { status: 500 }
    );
  }
}
