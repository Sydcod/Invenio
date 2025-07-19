import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/next-auth';
import connectMongo from '@/libs/mongoose';
import PurchaseOrder from '@/models/PurchaseOrder';
import Product from '@/models/Product';
import Supplier from '@/models/Supplier';
import mongoose from 'mongoose';

interface RouteParams {
  params: {
    orderId: string;
  };
}

// GET /api/purchase-orders/[orderId] - Get purchase order details
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

    const order = await PurchaseOrder.findOne({
      _id: params.orderId,
      organizationId: session.user.organizationId,
    })
      .populate('supplierId', 'name code contactInfo paymentTerms')
      .populate('warehouseId', 'name code location')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('approvedBy', 'name email');

    if (!order) {
      return NextResponse.json(
        { error: 'Purchase order not found' },
        { status: 404 }
      );
    }

    // Enrich items with current product info
    const enrichedItems = await Promise.all(
      order.items.map(async (item: any) => {
        const product = await Product.findById(item.productId)
          .select('name sku inventory media');
        
        return {
          ...item.toObject(),
          product: product ? {
            name: product.name,
            sku: product.sku,
            currentStock: product.inventory.currentStock,
            image: product.media?.primaryImage,
          } : null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        ...order.toObject(),
        items: enrichedItems,
      },
    });
  } catch (error) {
    console.error('Error fetching purchase order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/purchase-orders/[orderId] - Update purchase order
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
    if (!session.user.permissions?.canManageOrders) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await connectMongo();
    const body = await req.json();

    const order = await PurchaseOrder.findOne({
      _id: params.orderId,
      organizationId: session.user.organizationId,
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Purchase order not found' },
        { status: 404 }
      );
    }

    // Restrict updates based on status
    if (['cancelled', 'delivered'].includes(order.status)) {
      return NextResponse.json(
        { error: 'Cannot update completed or cancelled orders' },
        { status: 400 }
      );
    }

    // Handle status transitions
    if (body.status && body.status !== order.status) {
      switch (body.status) {
        case 'approved':
          if (order.status !== 'pending') {
            return NextResponse.json(
              { error: 'Only pending orders can be approved' },
              { status: 400 }
            );
          }
          order.approval = {
            approved: true,
            approvedBy: new mongoose.Types.ObjectId(session.user.userId),
            approvedAt: new Date(),
            notes: body.approvalNotes,
          };
          break;

        case 'ordered':
          if (!['pending', 'approved'].includes(order.status)) {
            return NextResponse.json(
              { error: 'Invalid status transition' },
              { status: 400 }
            );
          }
          break;

        case 'cancelled':
          if (['delivered', 'partial'].includes(order.status)) {
            return NextResponse.json(
              { error: 'Cannot cancel orders with received items' },
              { status: 400 }
            );
          }
          break;
      }
    }

    // Prevent updating sensitive fields
    const { 
      _id, 
      organizationId, 
      orderNumber,
      createdBy,
      createdAt,
      ...updateData 
    } = body;

    // Update order
    Object.assign(order, {
      ...updateData,
      updatedBy: new mongoose.Types.ObjectId(session.user.userId),
      updatedAt: new Date(),
    });

    // Recalculate totals if items updated
    if (body.items) {
      const subtotal = order.items.reduce((sum: number, item: any) => sum + item.totalCost, 0);
      const taxAmount = order.items.reduce((sum: number, item: any) => sum + (item.totalCost * item.taxRate / 100), 0);
      order.financial.subtotal = subtotal;
      order.financial.taxAmount = taxAmount;
      order.financial.totalAmount = subtotal + taxAmount + order.financial.shippingCost - order.financial.discount;
    }

    await order.save();

    // Update supplier performance if status changed to delivered
    if (body.status === 'delivered' && order.status !== 'delivered') {
      const isOnTime = !order.deliveryDate || order.deliveryDate <= order.expectedDelivery;
      await updateSupplierPerformance(order.supplierId, isOnTime);
    }

    await order.populate('supplierId', 'name code');
    await order.populate('warehouseId', 'name code');

    return NextResponse.json({
      success: true,
      data: order,
      message: 'Purchase order updated successfully',
    });
  } catch (error) {
    console.error('Error updating purchase order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/purchase-orders/[orderId] - Cancel purchase order
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
    if (!session.user.permissions?.canManageOrders) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await connectMongo();

    const order = await PurchaseOrder.findOne({
      _id: params.orderId,
      organizationId: session.user.organizationId,
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Purchase order not found' },
        { status: 404 }
      );
    }

    // Check if order can be cancelled
    if (['delivered', 'partial', 'cancelled'].includes(order.status)) {
      return NextResponse.json(
        { error: 'Cannot cancel this order' },
        { status: 400 }
      );
    }

    // Cancel order
    order.status = 'cancelled';
    order.updatedBy = new mongoose.Types.ObjectId(session.user.userId);
    order.updatedAt = new Date();

    await order.save();

    // Update supplier performance
    const supplier = await Supplier.findById(order.supplierId);
    if (supplier) {
      supplier.performance.ordersCancelled++;
      await supplier.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Purchase order cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling purchase order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to update supplier performance
async function updateSupplierPerformance(supplierId: string, onTime: boolean) {
  const supplier = await Supplier.findById(supplierId);
  if (supplier) {
    if (onTime) {
      supplier.performance.ordersDelivered++;
    } else {
      supplier.performance.ordersLate++;
    }
    await supplier.save();
  }
}
