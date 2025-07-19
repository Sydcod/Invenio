import { requirePermission } from "@/libs/auth-utils";
import Link from "next/link";
import { PlusIcon, BuildingStorefrontIcon } from "@heroicons/react/24/outline";
import Warehouse from "@/models/Warehouse";
import connectMongo from "@/libs/mongoose";

export const dynamic = "force-dynamic";

async function getWarehouses(organizationId: string) {
  await connectMongo();
  
  const warehouses = await Warehouse.find({ organizationId })
    .sort({ 'settings.isDefault': -1, createdAt: -1 })
    .lean();
    
  return warehouses;
}

export default async function WarehousesPage() {
  const session = await requirePermission('canManageInventory');
  const warehouses = await getWarehouses(session.user.organizationId);

  return (
    <div className="p-8">
      {/* Page header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Warehouses</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your warehouse locations and inventory storage
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/dashboard/warehouses/new"
            className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
            Add Warehouse
          </Link>
        </div>
      </div>

      {/* Warehouses grid */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {warehouses.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <BuildingStorefrontIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No warehouses</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new warehouse.</p>
            <div className="mt-6">
              <Link
                href="/dashboard/warehouses/new"
                className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
              >
                <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
                Add Warehouse
              </Link>
            </div>
          </div>
        ) : (
          warehouses.map((warehouse: any) => {
            const utilizationRate = warehouse.capacity.totalSpace > 0
              ? ((warehouse.capacity.usedSpace / warehouse.capacity.totalSpace) * 100).toFixed(1)
              : 0;
              
            return (
              <Link
                key={warehouse._id}
                href={`/dashboard/warehouses/${warehouse._id}`}
                className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:shadow-md transition-shadow"
              >
                {warehouse.settings?.isDefault && (
                  <span className="absolute top-2 right-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                    Default
                  </span>
                )}
                
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <BuildingStorefrontIcon className="h-10 w-10 text-gray-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-gray-900 truncate">
                      {warehouse.name}
                    </h3>
                    <p className="text-sm text-gray-500">{warehouse.code}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">
                      {warehouse.location.city}, {warehouse.location.state}
                    </p>
                    <p className="text-xs text-gray-400">{warehouse.location.country}</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Capacity</span>
                      <span className="font-medium text-gray-900">{utilizationRate}%</span>
                    </div>
                    <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          Number(utilizationRate) > 90 
                            ? 'bg-red-600' 
                            : Number(utilizationRate) > 70 
                            ? 'bg-yellow-500' 
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${utilizationRate}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {warehouse.capacity.usedSpace.toLocaleString()} / {warehouse.capacity.totalSpace.toLocaleString()} sq ft
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      warehouse.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : warehouse.status === 'maintenance'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {warehouse.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      {warehouse.operations?.zones || 0} zones
                    </span>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
