import { UserGroupIcon } from "@heroicons/react/24/outline";

export default function CustomerAnalyticsPage() {

  return (
    <div className="p-8">
      <div className="text-center">
        <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">Customer Analytics Coming Soon</h3>
        <p className="mt-1 text-sm text-gray-500">
          Analyze customer behavior, segments, and lifetime value here.
        </p>
      </div>
    </div>
  );
}
