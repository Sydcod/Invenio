import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/next-auth';
import connectMongo from '@/libs/mongoose';
import Organization from '@/models/Organization';

// GET /api/organizations - Get current user's organization
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

    const organization = await Organization.findById(session.user.organizationId);

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: organization
    });
  } catch (error) {
    console.error('Error fetching organization:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/organizations - Update organization details
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has permission to manage organization
    if (!session.user.role?.permissions?.canManageOrganization) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }

    await connectMongo();

    const body = await req.json();
    
    // Prevent updating sensitive fields
    const { 
      _id, 
      ownerId, 
      subscription, 
      createdAt, 
      updatedAt,
      ...updateData 
    } = body;

    const organization = await Organization.findByIdAndUpdate(
      session.user.organizationId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: organization
    });
  } catch (error) {
    console.error('Error updating organization:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/organizations - Create a new organization (for initial setup only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectMongo();

    // Check if user already belongs to an organization
    const User = (await import('@/models/User')).default;
    const existingUser = await User.findOne({ email: session.user.email });
    
    if (existingUser?.organizationId) {
      return NextResponse.json(
        { error: 'User already belongs to an organization' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { name, industry, size, website } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Organization name is required' },
        { status: 400 }
      );
    }

    // Create organization
    const organization = await Organization.create({
      name,
      industry,
      size,
      website,
      ownerId: existingUser?._id,
      subscription: {
        status: 'trial',
        plan: 'free',
        startDate: new Date(),
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
      },
      settings: {
        currency: 'USD',
        timezone: 'UTC',
        dateFormat: 'MM/DD/YYYY',
        language: 'en',
      },
    });

    // Update user with organization and owner role
    if (existingUser) {
      existingUser.organizationId = organization._id;
      existingUser.role = {
        name: 'owner',
        permissions: {
          canManageOrganization: true,
          canManageUsers: true,
          canManageInventory: true,
          canManageSales: true,
          canManagePurchases: true,
          canManageReports: true,
          canViewReports: true,
          canManageSettings: true,
          custom: {
            inventory: [],
            sales: [],
            purchases: [],
            reports: [],
            settings: [],
          },
        },
      };
      await existingUser.save();
    }

    return NextResponse.json({
      success: true,
      data: organization,
      message: 'Organization created successfully'
    });
  } catch (error) {
    console.error('Error creating organization:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
