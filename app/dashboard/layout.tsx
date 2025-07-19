import { ReactNode } from "react";
import { requireOrganization, requireAuth } from "@/libs/auth-utils";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  // For settings page, only require auth. For others, require organization
  const session = await requireAuth();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <DashboardSidebar />
      
      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <DashboardHeader 
          user={{
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
          }}
          organization={{
            name: session.user.organizationName || 'No Organization',
            id: session.user.organizationId || '',
          }}
        />
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
