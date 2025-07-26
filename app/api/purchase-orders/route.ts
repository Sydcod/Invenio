import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/next-auth';
import connectMongo from '@/libs/mongoose';
import PurchaseOrder from '@/models/PurchaseOrder';
import Supplier from '@/models/Supplier';
import Warehouse from '@/models/Warehouse';
import Product from '@/models/Product';
import mongoose from 'mongoose';

// GET /api/purchase-orders - List all purchase orders
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
    const status = searchParams.get('status');
    const supplierId = searchParams.get('supplierId');
    const warehouseId = searchParams.get('warehouseId');
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sort = searchParams.get('sort') || 'orderDate';
    const order = searchParams.get('order') === 'asc' ? 1 : -1;

    // Build query
    const query: any = {};

    if (status) {
      query.status = status;
    }

    if (supplierId) {
      query.supplierId = supplierId;
    }

    if (warehouseId) {
      query.warehouseId = warehouseId;
    }

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'supplier.name': { $regex: search, $options: 'i' } },
      ];
    }

    if (startDate || endDate) {
      query.orderDate = {};
      if (startDate) query.orderDate.$gte = new Date(startDate);
      if (endDate) query.orderDate.$lte = new Date(endDate);
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const totalCount = await PurchaseOrder.countDocuments(query);
    
    const orders = await PurchaseOrder.find(query)
      .populate('createdBy', 'name email')
      .select('-__v')
      .sort({ [sort]: order })
      .skip(skip)
      .limit(limit);

    // Convert ObjectIds to strings for frontend filtering
    const transformedOrders = orders.map(order => {
      const orderObj = order.toObject();
      return {
        ...orderObj,
        supplierId: orderObj.supplierId?.toString() || null,
        warehouseId: orderObj.warehouseId?.toString() || null,
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedOrders,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
      },
    });
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/purchase-orders - Create new purchase order
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
    if (!session.user.role.permissions?.canManagePurchases) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await connectMongo();
    const body = await req.json();

    // Validate required fields
    const { supplierId, warehouseId, items, expectedDelivery } = body;
    if (!supplierId || !warehouseId || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Supplier, warehouse, and items are required' },
        { status: 400 }
      );
    }

    // Validate supplier
    const supplier = await Supplier.findOne({
      _id: supplierId,
      status: 'active',
    });

    if (!supplier) {
      return NextResponse.json(
        { error: 'Invalid or inactive supplier' },
        { status: 400 }
      );
    }

    // Validate warehouse
    const warehouse = await Warehouse.findOne({
      _id: warehouseId,
      status: 'active',
    });

    if (!warehouse) {
      return NextResponse.json(
        { error: 'Invalid or inactive warehouse' },
        { status: 400 }
      );
    }

    // Validate and enrich items
    const enrichedItems = await Promise.all(
      items.map(async (item: any) => {
        const product = await Product.findOne({
          _id: item.productId,
          status: 'active',
        });

        if (!product) {
          throw new Error(`Invalid product: ${item.productId}`);
        }

        // Find supplier info for this product
        const supplierInfo = product.suppliers.find(
          (s: any) => s.vendorId.toString() === supplierId
        );

        return {
          productId: product._id,
          sku: product.sku,
          name: product.name,
          quantity: item.quantity,
          unitCost: item.unitCost || supplierInfo?.cost || product.pricing.cost,
          totalCost: (item.unitCost || supplierInfo?.cost || product.pricing.cost) * item.quantity,
          taxRate: item.taxRate || 0,
          received: 0,
          damaged: 0,
        };
      })
    );

    // Calculate totals
    const subtotal = enrichedItems.reduce((sum, item) => sum + item.totalCost, 0);
    const taxAmount = enrichedItems.reduce((sum, item) => sum + (item.totalCost * item.taxRate / 100), 0);
    const shippingCost = body.shippingCost || 0;
    const totalAmount = subtotal + taxAmount + shippingCost;

    // Generate order number
    const orderCount = await PurchaseOrder.countDocuments();
    const orderNumber = `PO-${new Date().getFullYear()}-${String(orderCount + 1).padStart(6, '0')}`;

    // Create purchase order
    const purchaseOrder = await PurchaseOrder.create({
      orderNumber,
      supplierId,
      supplier: {
        id: supplier._id,
        name: supplier.name,
        code: supplier.code,
      },
      warehouseId,
      warehouse: {
        id: warehouse._id,
        name: warehouse.name,
        code: warehouse.code,
      },
      items: enrichedItems,
      status: 'draft',
      orderDate: new Date(),
      expectedDelivery: expectedDelivery ? new Date(expectedDelivery) : null,
      financial: {
        subtotal,
        taxAmount,
        shippingCost,
        discount: body.discount || 0,
        totalAmount,
        paidAmount: 0,
        currency: body.currency || 'USD',
      },
      paymentTerms: body.paymentTerms || supplier.payment?.terms || 'net30',
      notes: body.notes,
      createdBy: new mongoose.Types.ObjectId(session.user.userId),
      updatedBy: new mongoose.Types.ObjectId(session.user.userId),
    });

    // Populate references
    await purchaseOrder.populate('supplierId', 'name code contactInfo');
    await purchaseOrder.populate('warehouseId', 'name code');

    return NextResponse.json({
      success: true,
      data: purchaseOrder,
      message: 'Purchase order created successfully',
    });
  } catch (error) {
    console.error('Error creating purchase order:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
