import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/next-auth';
import connectMongo from '@/libs/mongoose';
import User from '@/models/User';
import Organization from '@/models/Organization';

// GET /api/organizations/members - Get all organization members
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

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const role = searchParams.get('role');
    const search = searchParams.get('search');

    // Build query
    const query: any = { organizationId: session.user.organizationId };
    
    if (status) {
      query.status = status;
    }
    
    if (role) {
      query['role.name'] = role;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [members, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: members,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching organization members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/organizations/members - Invite a new member
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has permission to manage users
    if (!session.user.role?.permissions?.canManageUsers) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }

    await connectMongo();

    const body = await req.json();
    const { email, name, role } = body;

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['admin', 'manager', 'staff', 'viewer'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    if (existingUser) {
      if (existingUser.organizationId) {
        return NextResponse.json(
          { error: 'User already belongs to an organization' },
          { status: 400 }
        );
      }

      // Update existing user with organization
      existingUser.organizationId = session.user.organizationId;
      existingUser.role = getRolePermissions(role);
      existingUser.status = 'active';
      await existingUser.save();

      return NextResponse.json({
        success: true,
        data: existingUser,
        message: 'User added to organization',
      });
    }

    // Create new user with pending status
    const newUser = await User.create({
      email: email.toLowerCase(),
      name: name || email.split('@')[0],
      organizationId: session.user.organizationId,
      role: getRolePermissions(role),
      status: 'pending',
      invitedBy: session.user.userId,
      invitedAt: new Date(),
    });

    // TODO: Send invitation email using Resend

    return NextResponse.json({
      success: true,
      data: newUser,
      message: 'Invitation sent successfully',
    });
  } catch (error) {
    console.error('Error inviting member:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to get role permissions
function getRolePermissions(roleName: string) {
  const permissions = {
    admin: {
      canManageOrganization: false,
      canManageUsers: true,
      canManageInventory: true,
      canManageSales: true,
      canManagePurchases: true,
      canManageReports: true,
      canViewReports: true,
      canManageSettings: true,
    },
    manager: {
      canManageOrganization: false,
      canManageUsers: false,
      canManageInventory: true,
      canManageSales: true,
      canManagePurchases: true,
      canManageReports: false,
      canViewReports: true,
      canManageSettings: false,
    },
    staff: {
      canManageOrganization: false,
      canManageUsers: false,
      canManageInventory: true,
      canManageSales: true,
      canManagePurchases: false,
      canManageReports: false,
      canViewReports: false,
      canManageSettings: false,
    },
    viewer: {
      canManageOrganization: false,
      canManageUsers: false,
      canManageInventory: false,
      canManageSales: false,
      canManagePurchases: false,
      canManageReports: false,
      canViewReports: true,
      canManageSettings: false,
    },
  };

  return {
    name: roleName,
    permissions: {
      ...permissions[roleName as keyof typeof permissions],
      custom: {
        inventory: [] as string[],
        sales: [] as string[],
        purchases: [] as string[],
        reports: [] as string[],
        settings: [] as string[],
      },
    },
  };
}
