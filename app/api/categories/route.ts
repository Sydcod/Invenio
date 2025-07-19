import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/next-auth';
import connectMongo from '@/libs/mongoose';
import Category from '@/models/Category';
import mongoose from 'mongoose';

// GET /api/categories - List all categories
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

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const parent = searchParams.get('parent');
    const active = searchParams.get('active');
    const search = searchParams.get('search');

    // Build query
    const query: any = {
      organizationId: session.user.organizationId,
    };

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
      .sort({ sortOrder: 1, name: 1 });

    // Build hierarchy if requested
    const buildHierarchy = searchParams.get('hierarchy') === 'true';
    if (buildHierarchy && !parent) {
      const categoryMap = new Map();
      const rootCategories: any[] = [];

      // Create map of all categories
      categories.forEach(cat => {
        categoryMap.set(cat._id.toString(), {
          ...cat.toObject(),
          children: [],
        });
      });

      // Build hierarchy
      categories.forEach(cat => {
        const catObj = categoryMap.get(cat._id.toString());
        if (cat.parentId) {
          const parent = categoryMap.get(cat.parentId._id.toString());
          if (parent) {
            parent.children.push(catObj);
          }
        } else {
          rootCategories.push(catObj);
        }
      });

      return NextResponse.json({
        success: true,
        data: rootCategories,
        count: categories.length,
      });
    }

    return NextResponse.json({
      success: true,
      data: categories,
      count: categories.length,
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
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check permission
    if (!session.user.permissions?.canManageProducts) {
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
        organizationId: session.user.organizationId,
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
      organizationId: session.user.organizationId,
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
      
      while (await Category.findOne({ organizationId: session.user.organizationId, code })) {
        code = `${baseCode}${counter}`;
        counter++;
      }
    }

    // Create category
    const category = await Category.create({
      ...body,
      code,
      organizationId: session.user.organizationId,
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
