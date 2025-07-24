import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/next-auth';
import connectMongo from '@/libs/mongoose';
import Category from '@/models/Category';
import Product from '@/models/Product';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectMongo();

    // Get all categories
    const categories = await Category.find({}).lean();
    
    // Get product counts for each category
    const productCounts = await Product.aggregate([
      {
        $match: {
          isActive: true,
          status: 'active'
        }
      },
      {
        $group: {
          _id: '$category.id',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Create a map of category ID to product count
    const countMap = new Map(
      productCounts.map(item => [item._id.toString(), item.count])
    );
    
    // Merge product counts with categories
    const categoriesWithCounts = categories.map(cat => ({
      _id: cat._id,
      name: cat.name,
      isActive: cat.isActive,
      parentId: cat.parentId,
      productCount: countMap.get(cat._id.toString()) || 0
    }));

    // Calculate statistics
    const totalCategories = categoriesWithCounts.length;
    const activeCategories = categoriesWithCounts.filter(c => c.isActive).length;
    const categoriesWithProducts = categoriesWithCounts.filter(c => c.productCount > 0).length;
    const emptyCategoriesCount = categoriesWithCounts.filter(c => c.productCount === 0).length;
    const parentCategories = categoriesWithCounts.filter(c => !c.parentId).length;
    
    // Get top categories by product count
    const topCategories = categoriesWithCounts
      .filter(c => c.productCount > 0)
      .sort((a, b) => b.productCount - a.productCount)
      .slice(0, 5)
      .map(c => ({
        id: c._id.toString(),
        name: c.name,
        productCount: c.productCount
      }));

    // Get empty categories
    const emptyCategories = categoriesWithCounts
      .filter(c => c.productCount === 0)
      .slice(0, 10) // Limit to 10 for performance
      .map(c => ({
        id: c._id.toString(),
        name: c.name
      }));

    return NextResponse.json({
      totalCategories,
      activeCategories,
      categoriesWithProducts,
      emptyCategoriesCount,
      parentCategories,
      topCategories,
      emptyCategories
    });
  } catch (error) {
    console.error('Error fetching category stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category statistics' },
      { status: 500 }
    );
  }
}
