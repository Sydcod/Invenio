import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/next-auth';
import connectMongo from '@/libs/mongoose';
import Product from '@/models/Product';
import Category from '@/models/Category';
import mongoose from 'mongoose';

interface RouteParams {
  params: {
    productId: string;
  };
}

// GET /api/products/[productId] - Get a specific product
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectMongo();

    const product = await Product.findOne({
      _id: params.productId,
    })
      .populate('category.id', 'name parentId')
      .populate('suppliers.vendorId', 'name code contactInfo')
      .populate('inventory.locations.warehouseId', 'name code location');

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/products/[productId] - Update a product
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
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

    // Find product
    const product = await Product.findOne({
      _id: params.productId,
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Validate category if being updated
    if (body.category) {
      const category = await Category.findOne({
        _id: body.category.id,
      });
      
      if (!category) {
        return NextResponse.json(
          { error: 'Invalid category' },
          { status: 400 }
        );
      }
      
      // Update the category with full information
      body.category = {
        id: category._id,
        name: category.name,
        path: category.path || category.name,
      };
    }

    // Check SKU uniqueness if being updated
    if (body.sku && body.sku !== product.sku) {
      const existingProduct = await Product.findOne({
        sku: body.sku.toUpperCase(),
        _id: { $ne: params.productId },
      });
      
      if (existingProduct) {
        return NextResponse.json(
          { error: 'Product with this SKU already exists' },
          { status: 400 }
        );
      }
    }

    // Prevent updating sensitive fields
    const { 
      _id, 
      organizationId, 
      createdBy,
      createdAt,
      ...updateData 
    } = body;

    // Update product
    Object.assign(product, {
      ...updateData,
      sku: updateData.sku ? updateData.sku.toUpperCase() : product.sku,
      updatedBy: new mongoose.Types.ObjectId(session.user.userId),
      updatedAt: new Date(),
    });

    await product.save();

    // Populate references
    await product.populate('category.id', 'name parentId');
    await product.populate('suppliers.vendorId', 'name code');

    return NextResponse.json({
      success: true,
      data: product,
      message: 'Product updated successfully',
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[productId] - Soft delete a product
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
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

    const product = await Product.findOne({
      _id: params.productId,
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if product has inventory
    if (product.inventory.availableStock > 0) {
      return NextResponse.json(
        { error: 'Cannot delete product with available inventory' },
        { status: 400 }
      );
    }

    // Soft delete by marking as inactive
    product.isActive = false;
    product.status = 'discontinued';
    product.updatedBy = new mongoose.Types.ObjectId(session.user.userId);
    product.updatedAt = new Date();
    
    await product.save();

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
