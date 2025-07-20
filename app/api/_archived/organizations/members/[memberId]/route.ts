import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/next-auth';
import connectMongo from '@/libs/mongoose';
import User from '@/models/User';
import mongoose from 'mongoose';

interface RouteParams {
  params: {
    memberId: string;
  };
}

// GET /api/organizations/members/[memberId] - Get specific member details
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

    const member = await User.findOne({
      _id: params.memberId,
      organizationId: session.user.organizationId,
    }).select('-password');

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: member,
    });
  } catch (error) {
    console.error('Error fetching member:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/organizations/members/[memberId] - Update member role or status
export async function PATCH(req: NextRequest, { params }: RouteParams) {
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
    const { role, status } = body;

    // Validate member exists in organization
    const member = await User.findOne({
      _id: params.memberId,
      organizationId: session.user.organizationId,
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Prevent changing owner's role
    if (member.role.name === 'owner') {
      return NextResponse.json(
        { error: 'Cannot modify owner role' },
        { status: 400 }
      );
    }

    // Prevent users from modifying their own role
    if (member._id.toString() === session.user.userId) {
      return NextResponse.json(
        { error: 'Cannot modify your own role' },
        { status: 400 }
      );
    }

    // Update role if provided
    if (role) {
      const validRoles = ['admin', 'manager', 'staff', 'viewer'];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { error: 'Invalid role' },
          { status: 400 }
        );
      }
      member.role = getRolePermissions(role);
    }

    // Update status if provided
    if (status) {
      const validStatuses = ['active', 'inactive', 'suspended'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        );
      }
      member.status = status;
    }

    await member.save();

    return NextResponse.json({
      success: true,
      data: member,
      message: 'Member updated successfully',
    });
  } catch (error) {
    console.error('Error updating member:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/organizations/members/[memberId] - Remove member from organization
export async function DELETE(req: NextRequest, { params }: RouteParams) {
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

    // Validate member exists in organization
    const member = await User.findOne({
      _id: params.memberId,
      organizationId: session.user.organizationId,
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Prevent removing owner
    if (member.role.name === 'owner') {
      return NextResponse.json(
        { error: 'Cannot remove organization owner' },
        { status: 400 }
      );
    }

    // Prevent users from removing themselves
    if (member._id.toString() === session.user.userId) {
      return NextResponse.json(
        { error: 'Cannot remove yourself from organization' },
        { status: 400 }
      );
    }

    // Remove organization association
    member.organizationId = undefined;
    member.role = {
      name: 'viewer',
      permissions: {
        canManageOrganization: false,
        canManageUsers: false,
        canManageInventory: false,
        canManageSales: false,
        canManagePurchases: false,
        canManageReports: false,
        canViewReports: false,
        canManageSettings: false,
        custom: {
          inventory: [] as string[],
          sales: [] as string[],
          purchases: [] as string[],
          reports: [] as string[],
          settings: [] as string[],
        },
      },
    };
    member.status = 'inactive';
    await member.save();

    return NextResponse.json({
      success: true,
      message: 'Member removed from organization',
    });
  } catch (error) {
    console.error('Error removing member:', error);
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
