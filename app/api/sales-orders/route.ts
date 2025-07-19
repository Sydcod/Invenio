import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/next-auth';
import connectMongo from '@/libs/mongoose';
import SalesOrder from '@/models/SalesOrder';
import Product from '@/models/Product';
import Warehouse from '@/models/Warehouse';
import mongoose from 'mongoose';

// GET /api/sales-orders - List all sales orders
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
    const status = searchParams.get('status');
    const warehouseId = searchParams.get('warehouseId');
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sort = searchParams.get('sort') || 'orderDate';
    const order = searchParams.get('order') === 'asc' ? 1 : -1;

    // Build query
    const query: any = {
      organizationId: session.user.organizationId,
    };

    if (status) {
      query.status = status;
    }

    if (warehouseId) {
      query.warehouseId = warehouseId;
    }

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.email': { $regex: search, $options: 'i' } },
      ];
    }

    if (startDate || endDate) {
      query['dates.orderDate'] = {};
      if (startDate) query['dates.orderDate'].$gte = new Date(startDate);
      if (endDate) query['dates.orderDate'].$lte = new Date(endDate);
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const totalCount = await SalesOrder.countDocuments(query);
    
    const orders = await SalesOrder.find(query)
      .populate('warehouseId', 'name code')
      .populate('createdBy', 'name email')
      .select('-__v')
      .sort({ [sort === 'orderDate' ? 'dates.orderDate' : sort]: order })
      .skip(skip)
      .limit(limit);

    // Calculate summary statistics
    const stats = await SalesOrder.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$financial.grandTotal' },
          averageOrderValue: { $avg: '$financial.grandTotal' },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      data: orders,
      stats: stats[0] || { totalRevenue: 0, averageOrderValue: 0, totalOrders: 0 },
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
      },
    });
  } catch (error) {
    console.error('Error fetching sales orders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/sales-orders - Create new sales order
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
    if (!session.user.role.permissions?.canManageSales) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await connectMongo();
    const body = await req.json();

    // Validate required fields
    const { customer, warehouseId, items, shippingAddress } = body;
    if (!customer?.email || !warehouseId || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Customer email, warehouse, and items are required' },
        { status: 400 }
      );
    }

    if (!shippingAddress?.address || !shippingAddress?.city || !shippingAddress?.postalCode) {
      return NextResponse.json(
        { error: 'Complete shipping address is required' },
        { status: 400 }
      );
    }

    // Validate warehouse
    const warehouse = await Warehouse.findOne({
      _id: warehouseId,
      organizationId: session.user.organizationId,
      status: 'active',
    });

    if (!warehouse) {
      return NextResponse.json(
        { error: 'Invalid or inactive warehouse' },
        { status: 400 }
      );
    }

    // Validate and enrich items, check inventory
    const enrichedItems = await Promise.all(
      items.map(async (item: any) => {
        const product = await Product.findOne({
          _id: item.productId,
          organizationId: session.user.organizationId,
          status: 'active',
        });

        if (!product) {
          throw new Error(`Invalid product: ${item.productId}`);
        }

        // Check inventory in specified warehouse
        const warehouseInventory = product.inventory.locations?.find(
          (loc: any) => loc.warehouseId.toString() === warehouseId
        );

        const availableQuantity = warehouseInventory?.quantity || 0;
        if (availableQuantity < item.quantity) {
          throw new Error(`Insufficient inventory for ${product.name}. Available: ${availableQuantity}`);
        }

        const unitPrice = item.unitPrice || product.pricing.price;
        const discount = item.discount || 0;
        const discountType = item.discountType || 'fixed';
        const discountAmount = discountType === 'percentage' ? (unitPrice * item.quantity * discount / 100) : discount;
        const totalPrice = (unitPrice * item.quantity) - discountAmount;
        const taxRate = item.taxRate || 0;
        const taxAmount = totalPrice * taxRate / 100;

        return {
          productId: product._id,
          product: {
            name: product.name,
            sku: product.sku,
            category: product.category?.name || '',
          },
          quantity: item.quantity,
          shippedQuantity: 0,
          unitPrice,
          costPrice: product.pricing.cost,
          discount,
          discountType,
          tax: taxRate,
          taxAmount,
          total: totalPrice + taxAmount,
          warehouseLocation: warehouseInventory?.binLocation || '',
        };
      })
    );

    // Calculate totals
    const subtotal = enrichedItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const totalDiscount = enrichedItems.reduce((sum, item) => {
      return sum + (item.discountType === 'percentage' 
        ? (item.unitPrice * item.quantity * item.discount / 100) 
        : item.discount);
    }, 0);
    const totalTax = enrichedItems.reduce((sum, item) => sum + item.taxAmount, 0);
    const shippingCost = body.shippingCost || 0;
    const grandTotal = subtotal - totalDiscount + totalTax + shippingCost;

    // Generate order number
    const orderCount = await SalesOrder.countDocuments({
      organizationId: session.user.organizationId,
    });
    const orderNumber = `SO-${new Date().getFullYear()}-${String(orderCount + 1).padStart(6, '0')}`;

    // Create sales order
    const salesOrder = await SalesOrder.create({
      orderNumber,
      organizationId: session.user.organizationId,
      customer: {
        ...customer,
        name: customer.name || customer.email.split('@')[0],
      },
      warehouseId,
      warehouse: {
        name: warehouse.name,
        code: warehouse.code,
      },
      items: enrichedItems,
      status: 'confirmed',
      dates: {
        orderDate: new Date(),
        confirmedDate: new Date(),
        expectedDelivery: body.expectedDelivery ? new Date(body.expectedDelivery) : null,
      },
      financial: {
        subtotal,
        totalDiscount,
        totalTax,
        shippingCost,
        handlingFee: 0,
        otherCharges: 0,
        grandTotal,
        paidAmount: 0,
        balanceAmount: grandTotal,
        currency: body.currency || 'USD',
        exchangeRate: 1,
        profitMargin: subtotal - enrichedItems.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0),
        totalCost: enrichedItems.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0),
      },
      payment: {
        method: body.paymentMethod || 'credit',
        terms: body.paymentTerms || '30 days',
        status: 'pending',
        transactions: [],
      },
      shipping: {
        address: shippingAddress,
        billingAddress: body.billingAddress || shippingAddress,
      },
      fulfillment: {
        type: 'warehouse',
        priority: body.priority || 'normal',
        instructions: body.fulfillmentInstructions,
      },
      source: body.source || 'api',
      channel: body.channel,
      notes: body.notes,
      internalNotes: body.internalNotes,
      tags: body.tags || [],
      createdBy: new mongoose.Types.ObjectId(session.user.userId),
      updatedBy: new mongoose.Types.ObjectId(session.user.userId),
    });

    // Reserve inventory
    for (const item of enrichedItems) {
      await Product.findByIdAndUpdate(
        item.productId,
        {
          $inc: {
            'inventory.reservedStock': item.quantity,
            'inventory.availableStock': -item.quantity,
          },
        }
      );
    }

    // Populate references
    await salesOrder.populate('warehouseId', 'name code');

    return NextResponse.json({
      success: true,
      data: salesOrder,
      message: 'Sales order created successfully',
    });
  } catch (error) {
    console.error('Error creating sales order:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
