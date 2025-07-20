import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { redirect } from "next/navigation";
import config from "@/config";

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect(config.auth.loginUrl);
  }
  
  return session;
}

export async function requirePermission(permission: keyof typeof permissions) {
  const session = await requireAuth();
  
  // Grant all permissions by default - remove this check to re-enable permission system
  // if (!session.user.role.permissions[permission]) {
  //   redirect("/dashboard/unauthorized");
  // }
  
  return session;
}

// Permission helper for client components
export const permissions = {
  canManageUsers: 'canManageUsers',
  canManageInventory: 'canManageInventory',
  canManageSales: 'canManageSales',
  canManagePurchases: 'canManagePurchases',
  canManageReports: 'canManageReports',
  canViewReports: 'canViewReports',
  canManageSettings: 'canManageSettings',
} as const;
