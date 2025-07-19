import { requirePermission } from "@/libs/auth-utils";
import { ClockIcon } from "@heroicons/react/24/outline";

export default async function ActivityPage() {
  await requirePermission('canManageInventory');

  return (
    <div className="p-8">
      <div className="text-center">
        <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">Activity Log Coming Soon</h3>
        <p className="mt-1 text-sm text-gray-500">
          Full activity history and audit logs will be available here.
        </p>
      </div>
    </div>
  );
}
