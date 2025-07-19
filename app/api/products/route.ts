import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/next-auth';
import connectMongo from '@/libs/mongoose';
import Product from '@/models/Product';
import Category from '@/models/Category';
import mongoose from 'mongoose';

// GET /api/products - Get all products with filtering and pagination
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

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const categoryId = searchParams.get('categoryId');
    const status = searchParams.get('status');
    const lowStock = searchParams.get('lowStock') === 'true';
    const supplierId = searchParams.get('supplierId');
    const warehouseId = searchParams.get('warehouseId');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query
    const query: any = { 
      organizationId: session.user.organizationId,
      isActive: true 
    };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    
    if (categoryId) {
      query.categoryId = categoryId;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (lowStock) {
      query.$expr = { $lte: ['$inventory.available', '$inventory.reorderPoint'] };
    }
    
    if (supplierId) {
      query['suppliers.supplierId'] = supplierId;
    }
    
    if (warehouseId) {
      query['inventory.warehouses.warehouseId'] = warehouseId;
    }

    const skip = (page - 1) * limit;
    const sortOptions: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('categoryId', 'name parentId')
        .populate('suppliers.supplierId', 'name code')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit),
      Product.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/products - Create a new product
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has permission to manage inventory
    if (!session.user.role?.permissions?.canManageInventory) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }

    await connectMongo();

    const body = await req.json();
    
    // Validate required fields
    const { name, sku, categoryId, pricing } = body;
    
    if (!name || !sku || !categoryId || !pricing?.basePrice) {
      return NextResponse.json(
        { error: 'Missing required fields: name, sku, categoryId, and pricing.basePrice are required' },
        { status: 400 }
      );
    }

    // Validate category exists
    const category = await Category.findOne({
      _id: categoryId,
      organizationId: session.user.organizationId,
    });
    
    if (!category) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    // Check if SKU already exists
    const existingProduct = await Product.findOne({
      organizationId: session.user.organizationId,
      sku: sku.toUpperCase(),
    });
    
    if (existingProduct) {
      return NextResponse.json(
        { error: 'Product with this SKU already exists' },
        { status: 400 }
      );
    }

    // Create product
    const product = await Product.create({
      ...body,
      organizationId: session.user.organizationId,
      sku: sku.toUpperCase(),
      categoryId,
      status: body.status || 'active',
      createdBy: session.user.userId,
      updatedBy: session.user.userId,
    });

    // Populate references
    await product.populate('categoryId', 'name parentId');

    return NextResponse.json({
      success: true,
      data: product,
      message: 'Product created successfully',
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/products - Bulk update products
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has permission to manage inventory
    if (!session.user.role?.permissions?.canManageInventory) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }

    await connectMongo();

    const body = await req.json();
    const { productIds, updates } = body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: 'Product IDs array is required' },
        { status: 400 }
      );
    }

    // Validate products belong to organization
    const products = await Product.find({
      _id: { $in: productIds },
      organizationId: session.user.organizationId,
    });

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: 'Some products not found or unauthorized' },
        { status: 404 }
      );
    }

    // Perform bulk update
    const allowedUpdates = ['status', 'categoryId', 'tags', 'customFields'];
    const updateData: any = { updatedBy: session.user.userId };
    
    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        updateData[key] = updates[key];
      }
    }

    const result = await Product.updateMany(
      {
        _id: { $in: productIds },
        organizationId: session.user.organizationId,
      },
      { $set: updateData }
    );

    return NextResponse.json({
      success: true,
      data: {
        matched: result.matchedCount,
        modified: result.modifiedCount,
      },
      message: 'Products updated successfully',
    });
  } catch (error) {
    console.error('Error bulk updating products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
