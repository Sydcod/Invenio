import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/next-auth';
import connectMongo from '@/libs/mongoose';
import Warehouse from '@/models/Warehouse';
import mongoose from 'mongoose';

// GET /api/warehouses - List all warehouses
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
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const includeCapacity = searchParams.get('includeCapacity') === 'true';

    // Build query
    const query: any = {
      organizationId: session.user.organizationId,
    };

    if (status) {
      query.status = status;
    }

    if (type) {
      query.type = type;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } },
        { 'location.state': { $regex: search, $options: 'i' } },
      ];
    }

    // Execute query
    const warehouses = await Warehouse.find(query)
      .select('-__v')
      .sort({ isDefault: -1, name: 1 });

    // Add capacity information if requested
    if (includeCapacity) {
      const warehousesWithCapacity = await Promise.all(
        warehouses.map(async (warehouse) => {
          const warehouseObj = warehouse.toObject();
          
          // Calculate utilization
          const utilizationRate = warehouse.capacity.currentOccupancy > 0
            ? (warehouse.capacity.currentOccupancy / warehouse.capacity.totalCapacity * 100).toFixed(2)
            : 0;
          
          warehouseObj.utilizationRate = parseFloat(utilizationRate);
          warehouseObj.availableCapacity = warehouse.capacity.totalCapacity - warehouse.capacity.currentOccupancy;
          
          return warehouseObj;
        })
      );
      
      return NextResponse.json({
        success: true,
        data: warehousesWithCapacity,
        count: warehouses.length,
      });
    }

    return NextResponse.json({
      success: true,
      data: warehouses,
      count: warehouses.length,
    });
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/warehouses - Create new warehouse
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
    if (!session.user.permissions?.canManageWarehouses) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await connectMongo();
    const body = await req.json();

    // Validate required fields
    const { name, code, location, capacity } = body;
    if (!name || !code || !location?.address || !location?.city || !location?.postalCode) {
      return NextResponse.json(
        { error: 'Name, code, and complete location are required' },
        { status: 400 }
      );
    }

    if (!capacity?.totalCapacity || capacity.totalCapacity <= 0) {
      return NextResponse.json(
        { error: 'Valid total capacity is required' },
        { status: 400 }
      );
    }

    // Check for duplicate code
    const duplicate = await Warehouse.findOne({
      organizationId: session.user.organizationId,
      code: code.toUpperCase(),
    });

    if (duplicate) {
      return NextResponse.json(
        { error: 'Warehouse with this code already exists' },
        { status: 400 }
      );
    }

    // Check if this should be the default warehouse
    let isDefault = body.isDefault;
    if (isDefault) {
      // Remove default from other warehouses
      await Warehouse.updateMany(
        { organizationId: session.user.organizationId, isDefault: true },
        { $set: { isDefault: false } }
      );
    } else {
      // Check if this is the first warehouse
      const warehouseCount = await Warehouse.countDocuments({
        organizationId: session.user.organizationId,
      });
      if (warehouseCount === 0) {
        isDefault = true;
      }
    }

    // Create warehouse
    const warehouse = await Warehouse.create({
      ...body,
      code: code.toUpperCase(),
      organizationId: session.user.organizationId,
      isDefault,
      createdBy: new mongoose.Types.ObjectId(session.user.userId),
      updatedBy: new mongoose.Types.ObjectId(session.user.userId),
      capacity: {
        ...capacity,
        currentOccupancy: 0,
        unit: capacity.unit || 'sqft',
      },
      operations: {
        receiving: {
          enabled: true,
          hours: body.operations?.receiving?.hours || '9:00 AM - 5:00 PM',
          daysOfWeek: body.operations?.receiving?.daysOfWeek || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        },
        shipping: {
          enabled: true,
          hours: body.operations?.shipping?.hours || '9:00 AM - 5:00 PM',
          daysOfWeek: body.operations?.shipping?.daysOfWeek || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        },
        pickingStrategy: body.operations?.pickingStrategy || 'FIFO',
      },
    });

    return NextResponse.json({
      success: true,
      data: warehouse,
      message: 'Warehouse created successfully',
    });
  } catch (error) {
    console.error('Error creating warehouse:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
