import { requirePermission } from "@/libs/auth-utils";
import EnhancedSuppliersPage from "./EnhancedSuppliersPage";

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  // Check permission on server side
  await requirePermission('canManageInventory');
  
  // Render the client component
  return <EnhancedSuppliersPage />;
}
