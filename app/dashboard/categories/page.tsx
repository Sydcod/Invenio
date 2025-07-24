import { requirePermission } from "@/libs/auth-utils";
import EnhancedCategoriesPage from "./EnhancedCategoriesPage";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  // Check permission on server side
  await requirePermission('canManageInventory');
  
  // Render the client component
  return <EnhancedCategoriesPage />;
}
