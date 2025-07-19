import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/next-auth';
import connectMongo from '@/libs/mongoose';
import Supplier from '@/models/Supplier';
import Product from '@/models/Product';
import PurchaseOrder from '@/models/PurchaseOrder';
import mongoose from 'mongoose';

interface RouteParams {
  params: {
    supplierId: string;
  };
}

// GET /api/suppliers/[supplierId] - Get supplier details
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectMongo();

    const supplier = await Supplier.findOne({
      _id: params.supplierId,
      organizationId: session.user.organizationId,
    })
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }

    // Get related products count
    const productCount = await Product.countDocuments({
      'suppliers.vendorId': supplier._id,
      organizationId: session.user.organizationId,
    });

    // Get recent purchase orders
    const recentOrders = await PurchaseOrder.find({
      supplierId: supplier._id,
      organizationId: session.user.organizationId,
    })
      .select('orderNumber orderDate totalAmount status')
      .sort({ orderDate: -1 })
      .limit(5);

    // Calculate total business
    const totalBusiness = await PurchaseOrder.aggregate([
      {
        $match: {
          supplierId: supplier._id,
          organizationId: new mongoose.Types.ObjectId(session.user.organizationId),
          status: { $in: ['completed', 'partial'] },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      data: {
        ...supplier.toObject(),
        productCount,
        recentOrders,
        totalBusiness: totalBusiness[0] || { totalAmount: 0, orderCount: 0 },
      },
    });
  } catch (error) {
    console.error('Error fetching supplier:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/suppliers/[supplierId] - Update supplier
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
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

    const supplier = await Supplier.findOne({
      _id: params.supplierId,
      organizationId: session.user.organizationId,
    });

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }

    // Check code uniqueness if being updated
    if (body.code && body.code !== supplier.code) {
      const duplicate = await Supplier.findOne({
        organizationId: session.user.organizationId,
        code: body.code.toUpperCase(),
        _id: { $ne: params.supplierId },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: 'Supplier with this code already exists' },
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
      performance,
      ...updateData 
    } = body;

    // Update supplier
    Object.assign(supplier, {
      ...updateData,
      code: updateData.code ? updateData.code.toUpperCase() : supplier.code,
      updatedBy: new mongoose.Types.ObjectId(session.user.userId),
      updatedAt: new Date(),
    });

    await supplier.save();

    return NextResponse.json({
      success: true,
      data: supplier,
      message: 'Supplier updated successfully',
    });
  } catch (error) {
    console.error('Error updating supplier:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/suppliers/[supplierId] - Delete supplier
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
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

    const supplier = await Supplier.findOne({
      _id: params.supplierId,
      organizationId: session.user.organizationId,
    });

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }

    // Check for active purchase orders
    const activeOrders = await PurchaseOrder.countDocuments({
      supplierId: supplier._id,
      organizationId: session.user.organizationId,
      status: { $in: ['pending', 'approved', 'ordered', 'partial'] },
    });

    if (activeOrders > 0) {
      return NextResponse.json(
        { error: 'Cannot delete supplier with active purchase orders' },
        { status: 400 }
      );
    }

    // Check for products
    const productCount = await Product.countDocuments({
      'suppliers.vendorId': supplier._id,
      organizationId: session.user.organizationId,
      status: 'active',
    });

    if (productCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete supplier linked to active products' },
        { status: 400 }
      );
    }

    // Soft delete
    supplier.status = 'inactive';
    supplier.isActive = false;
    // Remove non-schema fields - using status and isActive for soft delete
    supplier.updatedBy = new mongoose.Types.ObjectId(session.user.userId);
    supplier.updatedAt = new Date();

    await supplier.save();

    return NextResponse.json({
      success: true,
      message: 'Supplier deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/suppliers/[supplierId]/performance - Update supplier performance
export async function POST(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
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

    const supplier = await Supplier.findOne({
      _id: params.supplierId,
      organizationId: session.user.organizationId,
    });

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }

    // Update performance metrics
    const { type, data } = body;

    switch (type) {
      case 'order_completed':
        supplier.performance.totalOrders++;
        
        if (data.onTime) {
          const onTimeOrders = (supplier.performance.onTimeDelivery / 100) * (supplier.performance.totalOrders - 1);
          supplier.performance.onTimeDelivery = Math.round(((onTimeOrders + 1) / supplier.performance.totalOrders) * 100);
        } else {
          const onTimeOrders = (supplier.performance.onTimeDelivery / 100) * (supplier.performance.totalOrders - 1);
          supplier.performance.onTimeDelivery = Math.round((onTimeOrders / supplier.performance.totalOrders) * 100);
        }
        
        // Update average lead time
        if (data.leadTime) {
          supplier.performance.averageLeadTime = 
            Math.round(((supplier.performance.averageLeadTime * (supplier.performance.totalOrders - 1)) + data.leadTime) / supplier.performance.totalOrders);
        }
        
        supplier.performance.lastOrderDate = new Date();
        break;

      case 'quality_assessment':
        supplier.performance.qualityScore = data.rating;
        break;

      case 'return_recorded':
        if (data.returnCount && supplier.performance.totalOrders > 0) {
          const totalReturns = (supplier.performance.returnRate / 100) * supplier.performance.totalOrders + data.returnCount;
          supplier.performance.returnRate = Math.round((totalReturns / supplier.performance.totalOrders) * 100);
        }
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid performance update type' },
          { status: 400 }
        );
    }

    supplier.updatedBy = new mongoose.Types.ObjectId(session.user.userId);
    supplier.updatedAt = new Date();

    await supplier.save();

    return NextResponse.json({
      success: true,
      data: supplier.performance,
      message: 'Supplier performance updated successfully',
    });
  } catch (error) {
    console.error('Error updating supplier performance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
