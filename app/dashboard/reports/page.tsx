import { requirePermission } from "@/libs/auth-utils";
import { ChartBarIcon } from "@heroicons/react/24/outline";

export default async function ReportsPage() {
  await requirePermission('canManageInventory');

  return (
    <div className="p-8">
      <div className="text-center">
        <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">Reports Coming Soon</h3>
        <p className="mt-1 text-sm text-gray-500">
          Inventory, sales, and purchase reports will be available here.
        </p>
      </div>
    </div>
  );
}
