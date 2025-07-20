import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/next-auth';
import connectMongo from '@/libs/mongoose';
import Category from '@/models/Category';
import Product from '@/models/Product';
import mongoose from 'mongoose';

interface RouteParams {
  params: {
    categoryId: string;
  };
}

// GET /api/categories/[categoryId] - Get category details
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

    const category = await Category.findOne({
      _id: params.categoryId,
    })
      .populate('parentId', 'name path')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Get child categories
    const children = await Category.find({
      parentId: category._id,
    })
      .select('name code isActive productCount')
      .sort({ sortOrder: 1, name: 1 });

    // Get product count
    const productCount = await Product.countDocuments({
      'category.id': category._id,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...category.toObject(),
        children,
        actualProductCount: productCount,
      },
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/categories/[categoryId] - Update category
export async function PATCH(req: NextRequest, { params }: RouteParams) {
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

    const category = await Category.findOne({
      _id: params.categoryId,
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Validate new parent if changing
    if (body.parentId !== undefined && body.parentId !== category.parentId?.toString()) {
      if (body.parentId === params.categoryId) {
        return NextResponse.json(
          { error: 'Category cannot be its own parent' },
          { status: 400 }
        );
      }

      // Check for circular reference
      if (body.parentId) {
        let currentParent = await Category.findById(body.parentId);
        while (currentParent) {
          if (currentParent._id.toString() === params.categoryId) {
            return NextResponse.json(
              { error: 'Circular reference detected' },
              { status: 400 }
            );
          }
          currentParent = currentParent.parentId ? 
            await Category.findById(currentParent.parentId) : null;
        }
      }

      // Update level and path
      if (body.parentId) {
        const newParent = await Category.findOne({
          _id: body.parentId,
        });

        if (!newParent) {
          return NextResponse.json(
            { error: 'Parent category not found' },
            { status: 400 }
          );
        }

        category.level = newParent.level + 1;
        category.path = `${newParent.path} > ${body.name || category.name}`;
      } else {
        category.level = 0;
        category.path = body.name || category.name;
      }
    }

    // Check for duplicate name at same level if name is changing
    if (body.name && body.name !== category.name) {
      const duplicate = await Category.findOne({
        parentId: body.parentId !== undefined ? body.parentId : category.parentId,
        name: { $regex: `^${body.name}$`, $options: 'i' },
        _id: { $ne: params.categoryId },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: 'Category with this name already exists at this level' },
          { status: 400 }
        );
      }

      // Update path if name changed
      if (!body.parentId) {
        category.path = category.path.replace(category.name, body.name);
      }
    }

    // Update fields
    const { 
      _id, 
      organizationId, 
      createdBy,
      createdAt,
      productCount,
      ...updateData 
    } = body;

    Object.assign(category, {
      ...updateData,
      updatedBy: new mongoose.Types.ObjectId(session.user.userId),
      updatedAt: new Date(),
    });

    await category.save();

    // Update all child categories' paths if name or parent changed
    if (body.name || body.parentId !== undefined) {
      await updateChildPaths(category);
    }

    // Update products if category name changed
    if (body.name && body.name !== category.name) {
      await Product.updateMany(
        { 
          'category.id': category._id,
        },
        { 
          $set: { 
            'category.name': body.name,
            'category.path': category.path,
          } 
        }
      );
    }

    await category.populate('parentId', 'name path');

    return NextResponse.json({
      success: true,
      data: category,
      message: 'Category updated successfully',
    });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/categories/[categoryId] - Delete category
export async function DELETE(req: NextRequest, { params }: RouteParams) {
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

    const category = await Category.findOne({
      _id: params.categoryId,
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check for child categories
    const childCount = await Category.countDocuments({
      parentId: category._id,
    });

    if (childCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with subcategories' },
        { status: 400 }
      );
    }

    // Check for products
    const productCount = await Product.countDocuments({
      'category.id': category._id,
    });

    if (productCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with products' },
        { status: 400 }
      );
    }

    // Soft delete
    category.isActive = false;
    category.updatedBy = new mongoose.Types.ObjectId(session.user.userId);
    category.updatedAt = new Date();

    await category.save();

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to update child category paths
async function updateChildPaths(category: any) {
  const children = await Category.find({ parentId: category._id });
  
  for (const child of children) {
    child.path = `${category.path} > ${child.name}`;
    child.level = category.level + 1;
    await child.save();
    
    // Recursively update grandchildren
    await updateChildPaths(child);
  }
}
