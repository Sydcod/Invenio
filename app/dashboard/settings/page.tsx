import { requireAuth } from "@/libs/auth-utils";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";

export default async function SettingsPage() {
  // Only require authentication, not organization membership
  const session = await requireAuth();

  return (
    <div className="p-8">
      <div className="text-center">
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h2 className="text-lg font-bold text-green-800">Great job signing in!</h2>
          <p className="text-sm text-green-600 mt-1">Your authentication is working perfectly.</p>
        </div>
        
        <Cog6ToothIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">Settings Coming Soon</h3>
        <p className="mt-1 text-sm text-gray-500">
          Organization and system settings will be available here.
        </p>
      </div>
    </div>
  );
}
