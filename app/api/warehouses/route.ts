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
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const includeCapacity = searchParams.get('includeCapacity') === 'true';

    // Build query
    const query: any = {};

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
        { 'address.city': { $regex: search, $options: 'i' } },
        { 'address.state': { $regex: search, $options: 'i' } },
      ];
    }

    // Execute query
    const warehouses = await Warehouse.find(query)
      .select('-__v')
      .sort({ 'settings.isDefault': -1, name: 1 });

    // Add capacity information if requested
    if (includeCapacity) {
      const warehousesWithCapacity = warehouses.map((warehouse) => {
        const warehouseObj = warehouse.toObject();
        
        // Calculate utilization with null checks
        const totalSpace = warehouse.capacity?.totalSpace || 0;
        const usedSpace = warehouse.capacity?.usedSpace || 0;
        
        const utilizationRate = totalSpace > 0 && usedSpace >= 0
          ? (usedSpace / totalSpace * 100)
          : 0;
        
        return {
          ...warehouseObj,
          utilizationRate: parseFloat(utilizationRate.toFixed(2)),
          availableCapacity: totalSpace - usedSpace,
        };
      });
      
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

    // Validate required fields
    const { name, code, address, capacity } = body;
    if (!name || !code || !address?.street || !address?.city || !address?.postalCode) {
      return NextResponse.json(
        { error: 'Name, code, and complete address are required' },
        { status: 400 }
      );
    }

    if (!capacity?.totalSpace || capacity.totalSpace <= 0) {
      return NextResponse.json(
        { error: 'Valid total space is required' },
        { status: 400 }
      );
    }

    // Check for duplicate code
    const duplicate = await Warehouse.findOne({
      code: code.toUpperCase(),
    });

    if (duplicate) {
      return NextResponse.json(
        { error: 'Warehouse with this code already exists' },
        { status: 400 }
      );
    }

    // Check if this should be the default warehouse
    let isDefault = body.settings?.isDefault || false;
    if (isDefault) {
      // Remove default from other warehouses
      await Warehouse.updateMany(
        { 'settings.isDefault': true },
        { $set: { 'settings.isDefault': false } }
      );
    } else {
      // Check if this is the first warehouse
      const warehouseCount = await Warehouse.countDocuments({});
      if (warehouseCount === 0) {
        isDefault = true;
      }
    }

    // Create warehouse
    const warehouse = await Warehouse.create({
      ...body,
      code: code.toUpperCase(),
      createdBy: new mongoose.Types.ObjectId(session.user.userId),
      updatedBy: new mongoose.Types.ObjectId(session.user.userId),
      capacity: {
        ...capacity,
        usedSpace: 0,
        unit: capacity.unit || 'sqft',
        zones: capacity.zones || [],
      },
      settings: {
        ...body.settings,
        isDefault,
        allowNegativeStock: body.settings?.allowNegativeStock || false,
        autoTransferEnabled: body.settings?.autoTransferEnabled || false,
        minimumStockAlerts: body.settings?.minimumStockAlerts || true,
        pickingStrategy: body.settings?.pickingStrategy || 'FIFO',
      },
      operations: {
        workingHours: body.operations?.workingHours || {
          monday: { open: '09:00', close: '17:00' },
          tuesday: { open: '09:00', close: '17:00' },
          wednesday: { open: '09:00', close: '17:00' },
          thursday: { open: '09:00', close: '17:00' },
          friday: { open: '09:00', close: '17:00' },
        },
        holidays: body.operations?.holidays || [],
        staffCount: body.operations?.staffCount || 0,
        equipment: body.operations?.equipment || [],
      },
      inventory: {
        totalItems: 0,
        totalValue: 0,
      },
      isActive: true,
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
