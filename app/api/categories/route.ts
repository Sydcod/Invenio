import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/next-auth';
import connectMongo from '@/libs/mongoose';
import Category from '@/models/Category';
import Product from '@/models/Product';
import mongoose from 'mongoose';

// GET /api/categories - List all categories
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

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const parent = searchParams.get('parent');
    const active = searchParams.get('active');
    const search = searchParams.get('search');

    // Build query
    const query: any = {};

    if (parent === 'root') {
      query.parentId = null;
    } else if (parent) {
      query.parentId = parent;
    }

    if (active !== null) {
      query.isActive = active === 'true';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    // Execute query
    const categories = await Category.find(query)
      .populate('parentId', 'name')
      .sort({ sortOrder: 1, name: 1 })
      .lean();

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
      productCounts.map((item: any) => [item._id.toString(), item.count])
    );

    // Add product counts to categories
    const categoriesWithCounts = categories.map((cat: any) => ({
      ...cat,
      productCount: countMap.get(cat._id.toString()) || 0
    }));

    // Check if hierarchy is requested
    const withHierarchy = searchParams.get('hierarchy') === 'true';
    
    if (withHierarchy && !parent) {
      console.log('Building hierarchy using Category.buildTree()');
      
      // Use the Category model's built-in buildTree method
      const tree = await (Category as any).buildTree();
      
      // Add product counts to the tree and aggregate for parents
      const addProductCounts = (nodes: any[]): any[] => {
        return nodes.map(node => {
          // Get direct product count for this category
          const directCount = countMap.get(node._id.toString()) || 0;
          
          // Process children first
          let childrenWithCounts: any[] = [];
          let childrenTotalCount = 0;
          
          if (node.children && node.children.length > 0) {
            childrenWithCounts = addProductCounts(node.children);
            // Sum up all children's total counts
            childrenTotalCount = childrenWithCounts.reduce((sum, child) => 
              sum + (child.productCount || 0), 0
            );
          }
          
          // Total count is direct count plus all children's counts
          const totalCount = directCount + childrenTotalCount;
          
          return {
            ...node,
            productCount: totalCount,
            directProductCount: directCount,
            children: childrenWithCounts
          };
        });
      };
      
      const treeWithCounts = addProductCounts(tree);
      
      console.log('Tree built with', treeWithCounts.length, 'root categories');
      console.log('Tree structure:', JSON.stringify(treeWithCounts.map(c => ({
        name: c.name,
        level: c.level,
        childrenCount: c.children?.length || 0,
        childrenNames: c.children?.map((child: any) => child.name) || []
      })), null, 2));

      return NextResponse.json({
        success: true,
        data: treeWithCounts,
        count: treeWithCounts.length,
      });
    }

    return NextResponse.json({
      success: true,
      data: categoriesWithCounts,
      count: categoriesWithCounts.length,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/categories - Create new category
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check permission
    if (!session.user.role.permissions?.canManageInventory) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await connectMongo();
    const body = await req.json();

    // Validate required fields
    const { name, parentId } = body;
    if (!name) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    // Validate parent category if provided
    let parentCategory = null;
    let level = 0;
    let path = name;

    if (parentId) {
      parentCategory = await Category.findOne({
        _id: parentId,
      });

      if (!parentCategory) {
        return NextResponse.json(
          { error: 'Parent category not found' },
          { status: 400 }
        );
      }

      level = parentCategory.level + 1;
      path = `${parentCategory.path} > ${name}`;
    }

    // Check for duplicate name at same level
    const duplicate = await Category.findOne({
      parentId: parentId || null,
      name: { $regex: `^${name}$`, $options: 'i' },
    });

    if (duplicate) {
      return NextResponse.json(
        { error: 'Category with this name already exists at this level' },
        { status: 400 }
      );
    }

    // Generate code if not provided
    let code = body.code;
    if (!code) {
      // Generate unique code
      const baseCode = name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
      let counter = 1;
      code = baseCode;
      
      while (await Category.findOne({ code })) {
        code = `${baseCode}${counter}`;
        counter++;
      }
    }

    // Create category
    const category = await Category.create({
      ...body,
      code,
      parentId: parentId || null,
      level,
      path,
      createdBy: new mongoose.Types.ObjectId(session.user.userId),
      updatedBy: new mongoose.Types.ObjectId(session.user.userId),
    });

    // Populate parent reference
    if (parentId) {
      await category.populate('parentId', 'name');
    }

    return NextResponse.json({
      success: true,
      data: category,
      message: 'Category created successfully',
    });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
