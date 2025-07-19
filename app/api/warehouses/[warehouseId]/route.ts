import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/next-auth';
import connectMongo from '@/libs/mongoose';
import Warehouse from '@/models/Warehouse';
import Product from '@/models/Product';
import mongoose from 'mongoose';

interface RouteParams {
  params: {
    warehouseId: string;
  };
}

// GET /api/warehouses/[warehouseId] - Get warehouse details
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

    const warehouse = await Warehouse.findOne({
      _id: params.warehouseId,
      organizationId: session.user.organizationId,
    })
      .populate('managerId', 'name email')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!warehouse) {
      return NextResponse.json(
        { error: 'Warehouse not found' },
        { status: 404 }
      );
    }

    // Get inventory statistics
    const inventoryStats = await Product.aggregate([
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(session.user.organizationId),
          'inventory.locations.warehouseId': new mongoose.Types.ObjectId(params.warehouseId),
        },
      },
      {
        $unwind: '$inventory.locations',
      },
      {
        $match: {
          'inventory.locations.warehouseId': new mongoose.Types.ObjectId(params.warehouseId),
        },
      },
      {
        $group: {
          _id: null,
          totalProducts: { $addToSet: '$_id' }, // Collect unique product IDs
          totalQuantity: { $sum: '$inventory.locations.quantity' },
          totalValue: { 
            $sum: { 
              $multiply: ['$inventory.locations.quantity', { $ifNull: ['$pricing.cost', 0] }] 
            } 
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalProducts: { $size: '$totalProducts' }, // Count unique products
          totalQuantity: 1,
          totalValue: 1,
        },
      },
    ]);

    // Calculate utilization
    const utilizationRate = warehouse.capacity.totalSpace > 0
      ? (warehouse.capacity.usedSpace / warehouse.capacity.totalSpace * 100)
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        ...warehouse.toObject(),
        utilizationRate: parseFloat(utilizationRate.toFixed(2)),
        availableCapacity: warehouse.capacity.totalSpace - warehouse.capacity.usedSpace,
        inventoryStats: inventoryStats[0] || {
          totalProducts: 0,
          totalQuantity: 0,
          totalValue: 0,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching warehouse:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/warehouses/[warehouseId] - Update warehouse
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

    const warehouse = await Warehouse.findOne({
      _id: params.warehouseId,
      organizationId: session.user.organizationId,
    });

    if (!warehouse) {
      return NextResponse.json(
        { error: 'Warehouse not found' },
        { status: 404 }
      );
    }

    // Check code uniqueness if being updated
    if (body.code && body.code !== warehouse.code) {
      const duplicate = await Warehouse.findOne({
        organizationId: session.user.organizationId,
        code: body.code.toUpperCase(),
        _id: { $ne: params.warehouseId },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: 'Warehouse with this code already exists' },
          { status: 400 }
        );
      }
    }

    // Handle default warehouse change
    if (body.isDefault === true && !warehouse.settings.isDefault) {
      // Remove default from other warehouses
      await Warehouse.updateMany(
        { 
          organizationId: session.user.organizationId, 
          'settings.isDefault': true,
          _id: { $ne: params.warehouseId },
        },
        { $set: { 'settings.isDefault': false } }
      );
    }

    // Prevent removing default if it's the only warehouse
    if (body.isDefault === false && warehouse.settings.isDefault) {
      const warehouseCount = await Warehouse.countDocuments({
        organizationId: session.user.organizationId,
        status: 'active',
      });
      
      if (warehouseCount === 1) {
        return NextResponse.json(
          { error: 'Cannot remove default status from the only active warehouse' },
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

    // Handle isDefault separately if it's at root level of body
    if (body.isDefault !== undefined) {
      warehouse.settings.isDefault = body.isDefault;
      delete updateData.isDefault; // Remove from updateData to avoid conflicts
    }
    
    // Handle settings object if provided
    if (updateData.settings) {
      // Merge settings instead of overwriting
      warehouse.settings = {
        ...warehouse.settings,
        ...updateData.settings,
      };
      delete updateData.settings; // Remove to handle separately
    }
    
    // Update other fields
    Object.assign(warehouse, {
      ...updateData,
      code: updateData.code ? updateData.code.toUpperCase() : warehouse.code,
      updatedBy: new mongoose.Types.ObjectId(session.user.userId),
      updatedAt: new Date(),
    });

    await warehouse.save();

    return NextResponse.json({
      success: true,
      data: warehouse,
      message: 'Warehouse updated successfully',
    });
  } catch (error) {
    console.error('Error updating warehouse:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/warehouses/[warehouseId] - Delete warehouse
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

    const warehouse = await Warehouse.findOne({
      _id: params.warehouseId,
      organizationId: session.user.organizationId,
    });

    if (!warehouse) {
      return NextResponse.json(
        { error: 'Warehouse not found' },
        { status: 404 }
      );
    }

    // Prevent deleting default warehouse
    if (warehouse.settings.isDefault) {
      return NextResponse.json(
        { error: 'Cannot delete the default warehouse' },
        { status: 400 }
      );
    }

    // Check for inventory
    const inventoryCount = await Product.countDocuments({
      organizationId: session.user.organizationId,
      'inventory.locations.warehouseId': params.warehouseId,
      'inventory.locations.quantity': { $gt: 0 },
    });

    if (inventoryCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete warehouse with inventory' },
        { status: 400 }
      );
    }

    // Soft delete
    warehouse.status = 'inactive';
    warehouse.isActive = false;
    warehouse.updatedBy = new mongoose.Types.ObjectId(session.user.userId);
    warehouse.updatedAt = new Date();

    await warehouse.save();

    return NextResponse.json({
      success: true,
      message: 'Warehouse deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting warehouse:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/warehouses/[warehouseId]/capacity - Update warehouse capacity
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

    const warehouse = await Warehouse.findOne({
      _id: params.warehouseId,
      organizationId: session.user.organizationId,
    });

    if (!warehouse) {
      return NextResponse.json(
        { error: 'Warehouse not found' },
        { status: 404 }
      );
    }

    const { type, amount, reason } = body;
    
    // Store the previous occupancy before update
    const previousOccupancy = warehouse.capacity.usedSpace;

    switch (type) {
      case 'increase':
        warehouse.capacity.usedSpace = Math.min(
          warehouse.capacity.usedSpace + amount,
          warehouse.capacity.totalSpace
        );
        break;

      case 'decrease':
        const newOccupancy = warehouse.capacity.usedSpace - amount;
        // Validate new occupancy
        if (newOccupancy < 0) {
          warehouse.capacity.usedSpace = 0;
        } else {
          warehouse.capacity.usedSpace = newOccupancy;
        }
        break;

      case 'set':
        if (amount < 0 || amount > warehouse.capacity.totalSpace) {
          return NextResponse.json(
            { error: 'Invalid capacity value' },
            { status: 400 }
          );
        }
        warehouse.capacity.usedSpace = amount;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid capacity update type' },
          { status: 400 }
        );
    }

    warehouse.updatedBy = new mongoose.Types.ObjectId(session.user.userId);
    warehouse.updatedAt = new Date();

    await warehouse.save();

    // Log capacity change
    console.log(`Warehouse ${warehouse.code} capacity updated:`, {
      type,
      amount,
      reason,
      newOccupancy: warehouse.capacity.usedSpace,
      occupancyRate: (warehouse.capacity.usedSpace / warehouse.capacity.totalSpace * 100).toFixed(2),
    });

    return NextResponse.json({
      success: true,
      data: {
        previousOccupancy: previousOccupancy,
        newOccupancy: warehouse.capacity.usedSpace,
        occupancyRate: (warehouse.capacity.usedSpace / warehouse.capacity.totalSpace * 100).toFixed(2),
        totalCapacity: warehouse.capacity.totalSpace,
        availableSpace: warehouse.capacity.totalSpace - warehouse.capacity.usedSpace,
      },
      message: 'Warehouse capacity updated successfully',
    });
  } catch (error) {
    console.error('Error updating warehouse capacity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
