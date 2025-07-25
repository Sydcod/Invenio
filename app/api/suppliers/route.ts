import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/next-auth';
import connectMongo from '@/libs/mongoose';
import Supplier from '@/models/Supplier';
import mongoose from 'mongoose';

// GET /api/suppliers - List all suppliers
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
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100'); // Default to 100 for enhanced page
    const sort = searchParams.get('sort') || 'name';
    const order = searchParams.get('order') === 'desc' ? -1 : 1;
    const paginationEnabled = searchParams.get('paginate') === 'true';

    // Build query
    const query: any = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { 'contact.contactPerson': { $regex: search, $options: 'i' } },
        { 'contact.email': { $regex: search, $options: 'i' } },
        { 'contact.phone': { $regex: search, $options: 'i' } },
        { 'contact.primaryContact.name': { $regex: search, $options: 'i' } },
        { 'contact.primaryContact.email': { $regex: search, $options: 'i' } },
        { 'contact.primaryContact.phone': { $regex: search, $options: 'i' } },
      ];
    }

    // Execute query with optional pagination
    const totalCount = await Supplier.countDocuments(query);
    
    let suppliersQuery = Supplier.find(query)
      .select('-__v')
      .sort({ [sort]: order });
    
    if (paginationEnabled) {
      const skip = (page - 1) * limit;
      suppliersQuery = suppliersQuery.skip(skip).limit(limit);
    }
    
    const suppliers = await suppliersQuery;

    // Calculate performance metrics
    const suppliersWithMetrics = suppliers.map(supplier => {
      const supplierObj = supplier.toObject();
      
      // Add calculated fields
      const totalOrders = supplierObj.performance?.totalOrders || 0;
      const onTimeRate = supplierObj.performance?.onTimeDelivery || 0;
      
      return {
        ...supplierObj,
        totalOrders,
        onTimeRate,
      };
    });

    // Return with or without pagination
    if (paginationEnabled) {
      return NextResponse.json({
        success: true,
        data: suppliersWithMetrics,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
        },
      });
    } else {
      // Return just the data array for enhanced suppliers page
      return NextResponse.json(suppliersWithMetrics);
    }
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/suppliers - Create new supplier
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
    const { name, code, contact } = body;
    if (!name || !code) {
      return NextResponse.json(
        { error: 'Supplier name and code are required' },
        { status: 400 }
      );
    }

    if (!contact?.email) {
      return NextResponse.json(
        { error: 'Contact email is required' },
        { status: 400 }
      );
    }

    // Check for duplicate code
    const duplicate = await Supplier.findOne({
      code: code.toUpperCase(),
    });

    if (duplicate) {
      return NextResponse.json(
        { error: 'Supplier with this code already exists' },
        { status: 400 }
      );
    }

    // Create supplier
    const supplier = await Supplier.create({
      ...body,
      code: code.toUpperCase(),
      createdBy: new mongoose.Types.ObjectId(session.user.userId),
      updatedBy: new mongoose.Types.ObjectId(session.user.userId),
      performance: {
        rating: 5,
        onTimeDelivery: 100,
        qualityScore: 5,
        responseTime: 24,
        totalOrders: 0,
        returnRate: 0,
        averageLeadTime: body.leadTime || 7,
      },
    });

    return NextResponse.json({
      success: true,
      data: supplier,
      message: 'Supplier created successfully',
    });
  } catch (error) {
    console.error('Error creating supplier:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
