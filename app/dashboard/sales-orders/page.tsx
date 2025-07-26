import { requirePermission } from "@/libs/auth-utils";
import EnhancedSalesOrdersPage from "./EnhancedSalesOrdersPage";

export const dynamic = "force-dynamic";

export default async function SalesOrdersPage() {
  const session = await requirePermission('canManageInventory');
  
  return <EnhancedSalesOrdersPage />;
}
