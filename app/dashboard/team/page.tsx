import { requirePermission } from "@/libs/auth-utils";
import { UsersIcon } from "@heroicons/react/24/outline";

export default async function TeamPage() {
  await requirePermission('canManageInventory');

  return (
    <div className="p-8">
      <div className="text-center">
        <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">Team Management Coming Soon</h3>
        <p className="mt-1 text-sm text-gray-500">
          Manage your team members and their permissions here.
        </p>
      </div>
    </div>
  );
}
