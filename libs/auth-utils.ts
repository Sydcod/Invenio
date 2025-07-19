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

export async function requireOrganization(skipSettingsRedirect = false) {
  const session = await requireAuth();
  
  if (!session.user.organizationId && !skipSettingsRedirect) {
    // Redirect to settings page if user doesn't belong to an organization
    // Users can create or join an organization from there
    redirect("/dashboard/settings");
  }
  
  return session;
}

export async function requirePermission(permission: keyof typeof permissions) {
  const session = await requireOrganization();
  
  if (!session.user.role.permissions[permission]) {
    redirect("/dashboard/unauthorized");
  }
  
  return session;
}

// Permission helper for client components
export const permissions = {
  canManageOrganization: 'canManageOrganization',
  canManageUsers: 'canManageUsers',
  canManageInventory: 'canManageInventory',
  canManageSales: 'canManageSales',
  canManagePurchases: 'canManagePurchases',
  canManageReports: 'canManageReports',
  canViewReports: 'canViewReports',
  canManageSettings: 'canManageSettings',
} as const;
