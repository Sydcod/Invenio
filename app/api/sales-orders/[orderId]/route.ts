import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/next-auth';
import connectMongo from '@/libs/mongoose';
import SalesOrder from '@/models/SalesOrder';
import Product from '@/models/Product';
import mongoose from 'mongoose';

interface RouteParams {
  params: {
    orderId: string;
  };
}

// GET /api/sales-orders/[orderId] - Get sales order details
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

    const order = await SalesOrder.findOne({
      _id: params.orderId,
    })
      .populate('warehouseId', 'name code location')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!order) {
      return NextResponse.json(
        { error: 'Sales order not found' },
        { status: 404 }
      );
    }

    // Enrich items with current product info
    const enrichedItems = await Promise.all(
      order.items.map(async (item: any) => {
        const product = await Product.findById(item.productId)
          .select('name sku inventory media category');
        
        return {
          ...item.toObject(),
          product: product ? {
            name: product.name,
            sku: product.sku,
            currentStock: product.inventory.currentStock,
            availableStock: product.inventory.availableStock,
            category: product.category?.name,
            image: product.media?.primaryImage,
          } : null,
        };
      })
    );

    // Calculate fulfillment progress from order items
    const fulfillmentProgress = order.items.reduce((acc: any, item: any) => {
      acc.totalItems += item.quantity;
      acc.fulfilledItems += item.shippedQuantity || 0;
      return acc;
    }, { totalItems: 0, fulfilledItems: 0 });

    const fulfillmentRate = fulfillmentProgress.totalItems > 0
      ? (fulfillmentProgress.fulfilledItems / fulfillmentProgress.totalItems * 100).toFixed(2)
      : '0';

    return NextResponse.json({
      success: true,
      data: {
        ...order.toObject(),
        items: enrichedItems,
        fulfillmentRate: parseFloat(fulfillmentRate.toString()),
      },
    });
  } catch (error) {
    console.error('Error fetching sales order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/sales-orders/[orderId] - Update sales order
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
    if (!session.user.role.permissions?.canManageSales) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await connectMongo();
    const body = await req.json();

    const order = await SalesOrder.findOne({
      _id: params.orderId,
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Sales order not found' },
        { status: 404 }
      );
    }

    // Restrict updates based on status
    if (['cancelled', 'delivered', 'returned'].includes(order.status)) {
      return NextResponse.json(
        { error: 'Cannot update completed, cancelled, or returned orders' },
        { status: 400 }
      );
    }

    // Handle status transitions
    if (body.status && body.status !== order.status) {
      // Only allow status changes from 'draft' to 'confirmed'
      if (body.status && order.status === 'draft' && body.status !== 'confirmed') {
        return NextResponse.json(
          { error: 'Only pending orders can be confirmed' },
          { status: 400 }
        );
      }
      switch (body.status) {
        case 'confirmed':
          if (order.status !== 'draft') {
            return NextResponse.json(
              { error: 'Only pending orders can be confirmed' },
              { status: 400 }
            );
          }
          break;

        case 'processing':
          if (!['pending', 'confirmed'].includes(order.status)) {
            return NextResponse.json(
              { error: 'Invalid status transition' },
              { status: 400 }
            );
          }
          break;

        case 'shipped':
          if (order.status !== 'processing') {
            return NextResponse.json(
              { error: 'Only processing orders can be shipped' },
              { status: 400 }
            );
          }
          order.dates.shippedDate = new Date();
          break;

        case 'delivered':
          if (order.status !== 'shipped') {
            return NextResponse.json(
              { error: 'Only shipped orders can be marked as delivered' },
              { status: 400 }
            );
          }
          order.dates.deliveredDate = new Date();
          break;

        case 'cancelled':
          if (['shipped', 'delivered'].includes(order.status)) {
            return NextResponse.json(
              { error: 'Cannot cancel shipped or delivered orders' },
              { status: 400 }
            );
          }
          // Release reserved inventory
          for (const item of order.items) {
            await Product.findByIdAndUpdate(
              item.productId,
              {
                $inc: {
                  'inventory.reservedStock': -item.quantity,
                  'inventory.availableStock': item.quantity,
                },
              }
            );
          }
          break;
      }
    }

    // Handle payment status updates
    if (body.paymentStatus && body.paymentStatus !== order.payment.status) {
      if (body.paymentStatus === 'paid' && order.payment.status !== 'paid') {
        order.payment.status = body.paymentStatus;
        order.payment.transactions.push({
          date: new Date(),
          amount: order.financial.grandTotal,
          method: order.payment.method,
          reference: body.paymentReference || '',
          notes: body.paymentNotes
        });
        // Recalculate paid amount
        const totalPaid = order.payment.transactions.reduce((sum: number, t: any) => sum + t.amount, 0);
        order.financial.paidAmount = totalPaid;
        order.financial.balanceAmount = order.financial.grandTotal - totalPaid;
      }
      order.payment.status = body.paymentStatus;
    }

    // Prevent updating sensitive fields
    const { 
      _id, 
      organizationId, 
      orderNumber,
      createdBy,
      createdAt,
      items,
      ...updateData 
    } = body;

    // Update order
    Object.assign(order, {
      ...updateData,
      updatedBy: new mongoose.Types.ObjectId(session.user.userId),
      updatedAt: new Date(),
    });

    await order.save();

    await order.populate('warehouseId', 'name code');

    return NextResponse.json({
      success: true,
      data: order,
      message: 'Sales order updated successfully',
    });
  } catch (error) {
    console.error('Error updating sales order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/sales-orders/[orderId] - Cancel sales order
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
    if (!session.user.role.permissions?.canManageSales) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await connectMongo();

    const order = await SalesOrder.findOne({
      _id: params.orderId,
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Sales order not found' },
        { status: 404 }
      );
    }

    // Check if order can be cancelled
    if (['shipped', 'delivered', 'cancelled', 'returned'].includes(order.status)) {
      return NextResponse.json(
        { error: 'Cannot cancel this order' },
        { status: 400 }
      );
    }

    // Release reserved inventory
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.productId,
        {
          $inc: {
            'inventory.reservedStock': -item.quantity,
            'inventory.availableStock': item.quantity,
          },
        }
      );
    }

    // Cancel order
    order.status = 'cancelled';
    order.updatedBy = new mongoose.Types.ObjectId(session.user.userId);
    order.updatedAt = new Date();

    await order.save();

    return NextResponse.json({
      success: true,
      message: 'Sales order cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling sales order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/sales-orders/[orderId]/fulfillment - Update fulfillment
export async function POST(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check permission
    if (!session.user.role.permissions?.canManageSales) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await connectMongo();
    const body = await req.json();

    const order = await SalesOrder.findOne({
      _id: params.orderId,
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Sales order not found' },
        { status: 404 }
      );
    }

    // Validate order status
    if (!['confirmed', 'processing'].includes(order.status)) {
      return NextResponse.json(
        { error: 'Order must be confirmed or processing to fulfill' },
        { status: 400 }
      );
    }

    const { items, trackingNumber, carrier } = body;

    // Update fulfillment for each item
    for (const fulfillmentItem of items) {
      const orderItem = order.items.find(
        (item: any) => item.productId.toString() === fulfillmentItem.productId
      );

      if (!orderItem) {
        return NextResponse.json(
          { error: `Product ${fulfillmentItem.productId} not found in order` },
          { status: 400 }
        );
      }

      const remainingToFulfill = orderItem.quantity - (orderItem.shippedQuantity || 0);
      const quantityToFulfill = Math.min(fulfillmentItem.quantity, remainingToFulfill);

      if (quantityToFulfill > 0) {
        orderItem.shippedQuantity = (orderItem.shippedQuantity || 0) + quantityToFulfill;

        // Update inventory
        const product = await Product.findById(fulfillmentItem.productId);
        if (product) {
          const warehouseLocation = product.inventory.locations?.find(
            (loc: any) => loc.warehouseId.toString() === order.warehouseId.toString()
          );

          if (warehouseLocation) {
            warehouseLocation.quantity -= quantityToFulfill;
            product.inventory.currentStock -= quantityToFulfill;
            product.inventory.reservedStock -= quantityToFulfill;
            await product.save();
          }
        }
      }
    }

    // Update fulfillment status
    const allItemsFulfilled = order.items.every(
      (item: any) => item.shippedQuantity >= item.quantity
    );

    if (allItemsFulfilled) {
      order.status = 'shipped';
      order.dates.shippedDate = new Date();
    } else {
      order.status = 'processing';
    }

    // Add tracking information if provided
    if (trackingNumber && carrier) {
      order.shipping.trackingNumber = trackingNumber;
      order.shipping.carrier = carrier;
    }

    order.updatedBy = new mongoose.Types.ObjectId(session.user.userId);
    order.updatedAt = new Date();

    await order.save();

    return NextResponse.json({
      success: true,
      data: order.fulfillment,
      message: 'Order fulfillment updated successfully',
    });
  } catch (error) {
    console.error('Error updating fulfillment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
