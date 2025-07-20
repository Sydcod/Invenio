import { requirePermission } from "@/libs/auth-utils";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Warehouse from "@/models/Warehouse";
import connectMongo from "@/libs/mongoose";
import WarehouseForm from "@/components/dashboard/WarehouseForm";

export const dynamic = "force-dynamic";

async function getWarehouse(warehouseId: string) {
  await connectMongo();
  
  const warehouse = await Warehouse.findOne({
    _id: warehouseId,
  })
    .lean();
    
  return warehouse;
}

export default async function WarehouseDetailPage({
  params,
}: {
  params: Promise<{ warehouseId: string }>;
}) {
  const session = await requirePermission('canManageInventory');
  
  const { warehouseId } = await params;
  // Handle "new" warehouse creation
  if (warehouseId === 'new') {
    return (
      <div className="p-8">
        {/* Page header */}
        <div className="mb-8">
          <Link
            href="/dashboard/warehouses"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="mr-1 h-4 w-4" />
            Back to warehouses
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">New Warehouse</h1>
          <p className="mt-1 text-sm text-gray-500">
            Add a new warehouse location
          </p>
        </div>

        {/* Warehouse form */}
        <div className="max-w-4xl">
          <WarehouseForm />
        </div>
      </div>
    );
  }
  
  // Get existing warehouse
  const warehouse = await getWarehouse(warehouseId);
  
  if (!warehouse) {
    notFound();
  }

  const utilizationRate = warehouse.capacity.totalSpace > 0
    ? ((warehouse.capacity.usedSpace / warehouse.capacity.totalSpace) * 100).toFixed(1)
    : 0;

  return (
    <div className="p-8">
      {/* Page header */}
      <div className="mb-8">
        <Link
          href="/dashboard/warehouses"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="mr-1 h-4 w-4" />
          Back to warehouses
        </Link>
        <div className="mt-2 sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{warehouse.name}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {warehouse.address.city}, {warehouse.address.state} • Utilization: {utilizationRate}%
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center gap-x-3">
            {warehouse.settings?.isDefault && (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                Default Warehouse
              </span>
            )}
            <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
              warehouse.status === 'active'
                ? 'bg-green-100 text-green-800'
                : warehouse.status === 'maintenance'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {warehouse.status}
            </span>
          </div>
        </div>
      </div>

      {/* Warehouse form */}
      <div className="max-w-4xl">
        <WarehouseForm 
          warehouse={warehouse}
        />
      </div>
    </div>
  );
}
