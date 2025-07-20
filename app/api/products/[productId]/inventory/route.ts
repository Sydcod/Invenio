import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/next-auth';
import connectMongo from '@/libs/mongoose';
import Product from '@/models/Product';
import Warehouse from '@/models/Warehouse';
import mongoose from 'mongoose';

interface RouteParams {
  params: {
    productId: string;
  };
}

// GET /api/products/[productId]/inventory - Get inventory details
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
      .select('name sku inventory')
      .populate('inventory.warehouses.warehouseId', 'name code location');

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Calculate inventory metrics
    const inventoryMetrics = {
      totalAvailable: product.inventory.availableStock,
      totalOnHand: product.inventory.currentStock,
      totalAllocated: product.inventory.reservedStock,
      totalOnOrder: product.inventory.incomingStock,
      stockValue: product.inventory.stockValue,
      reorderPoint: product.inventory.reorderPoint,
      reorderQuantity: product.inventory.reorderQuantity,
      needsReorder: product.inventory.availableStock <= product.inventory.reorderPoint,
      warehouseBreakdown: product.inventory.locations?.map((loc: any) => ({
        warehouseId: loc.warehouseId,
        warehouseName: loc.warehouseName,
        quantity: loc.quantity,
        binLocation: loc.binLocation,
        isDefault: loc.isDefault,
      })) || [],
    };

    return NextResponse.json({
      success: true,
      data: {
        productId: product._id,
        name: product.name,
        sku: product.sku,
        inventory: inventoryMetrics,
      },
    });
  } catch (error) {
    console.error('Error fetching product inventory:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/products/[productId]/inventory - Adjust inventory
export async function POST(req: NextRequest, { params }: RouteParams) {
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
    const { type, quantity, warehouseId, reason, reference, cost } = body;

    // Validate required fields
    if (!type || quantity === undefined || !warehouseId || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: type, quantity, warehouseId, and reason are required' },
        { status: 400 }
      );
    }

    // Validate adjustment type
    const validTypes = ['add', 'remove', 'transfer', 'count'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid adjustment type' },
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

    // Start session for transaction
    const mongoSession = await mongoose.startSession();
    mongoSession.startTransaction();

    try {
      let result;
      
      switch (type) {
        case 'add':
          // Manual inventory addition
          const locationIndex = product.inventory.locations?.findIndex(
            (loc: any) => loc.warehouseId.toString() === warehouseId
          ) ?? -1;
          
          if (locationIndex >= 0) {
            product.inventory.locations![locationIndex].quantity += quantity;
          } else {
            // Add new location
            if (!product.inventory.locations) {
              product.inventory.locations = [];
            }
            const warehouseDoc = await Warehouse.findById(warehouseId);
            product.inventory.locations.push({
              warehouseId,
              warehouseName: warehouseDoc?.name || 'Unknown',
              quantity,
              binLocation: '',
              isDefault: false,
            } as any);
          }
          
          product.inventory.currentStock += quantity;
          product.inventory.availableStock += quantity;
          product.inventory.stockValue = product.inventory.currentStock * (cost || product.pricing.cost);
          result = { success: true, message: 'Inventory added successfully' };
          break;
          
        case 'remove':
          // Manual inventory removal
          const removeLocationIndex = product.inventory.locations?.findIndex(
            (loc: any) => loc.warehouseId.toString() === warehouseId
          ) ?? -1;
          
          if (removeLocationIndex < 0) {
            result = { success: false, message: 'Product not found in specified warehouse' };
          } else {
            const location = product.inventory.locations![removeLocationIndex];
            if (location.quantity < quantity) {
              result = { success: false, message: 'Insufficient inventory in warehouse' };
            } else {
              location.quantity -= quantity;
              product.inventory.currentStock -= quantity;
              product.inventory.availableStock -= quantity;
              product.inventory.stockValue = product.inventory.currentStock * product.pricing.cost;
              result = { success: true, message: 'Inventory removed successfully' };
            }
          }
          break;
          
        case 'count':
          // Physical count adjustment
          const countLocationIndex = product.inventory.locations?.findIndex(
            (loc: any) => loc.warehouseId.toString() === warehouseId
          ) ?? -1;
          
          if (countLocationIndex < 0) {
            result = { success: false, message: 'Product not found in specified warehouse' };
          } else {
            const location = product.inventory.locations![countLocationIndex];
            const currentQuantity = location.quantity;
            const adjustment = quantity - currentQuantity;
            
            if (adjustment !== 0) {
              // Update location quantity
              location.quantity = quantity;
              
              // Update total inventory
              product.inventory.currentStock += adjustment;
              product.inventory.availableStock += adjustment;
              product.inventory.stockValue = product.inventory.currentStock * (cost || product.pricing.cost);
            }
            result = { success: true, message: 'Inventory count adjusted successfully' };
          }
          break;
          
        default:
          throw new Error('Invalid adjustment type');
      }

      if (!result.success) {
        throw new Error(result.message);
      }

      // Note: Inventory movements tracking would be added here if the model supported it
      // For now, we'll just update the lastCostUpdate date
      product.inventory.lastCostUpdate = new Date();

      // Save product with updated inventory
      await product.save({ session: mongoSession });

      await mongoSession.commitTransaction();

      return NextResponse.json({
        success: true,
        data: {
          productId: product._id,
          newInventory: {
            available: product.inventory.availableStock,
            onHand: product.inventory.currentStock,
            stockValue: product.inventory.stockValue,
          },
        },
        message: 'Inventory adjusted successfully',
      });
    } catch (error) {
      await mongoSession.abortTransaction();
      throw error;
    } finally {
      mongoSession.endSession();
    }
  } catch (error) {
    console.error('Error adjusting inventory:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/products/[productId]/inventory - Update inventory settings
export async function PUT(req: NextRequest, { params }: RouteParams) {
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
    const { reorderPoint, reorderQuantity, maxStockLevel, minStockLevel } = body;

    const product = await Product.findOne({
      _id: params.productId,
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Update inventory settings
    if (reorderPoint !== undefined) {
      product.inventory.reorderPoint = reorderPoint;
    }
    if (reorderQuantity !== undefined) {
      product.inventory.reorderQuantity = reorderQuantity;
    }
    if (maxStockLevel !== undefined) {
      product.inventory.maxStockLevel = maxStockLevel;
    }
    if (minStockLevel !== undefined) {
      product.inventory.minStockLevel = minStockLevel;
    }

    product.updatedBy = new mongoose.Types.ObjectId(session.user.userId);
    product.updatedAt = new Date();

    await product.save();

    return NextResponse.json({
      success: true,
      data: {
        productId: product._id,
        inventory: {
          reorderPoint: product.inventory.reorderPoint,
          reorderQuantity: product.inventory.reorderQuantity,
          maxStockLevel: product.inventory.maxStockLevel,
          minStockLevel: product.inventory.minStockLevel,
          needsReorder: product.inventory.availableStock <= product.inventory.reorderPoint,
        },
      },
      message: 'Inventory settings updated successfully',
    });
  } catch (error) {
    console.error('Error updating inventory settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
