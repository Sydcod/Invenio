import { requirePermission } from "@/libs/auth-utils";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Supplier from "@/models/Supplier";
import connectMongo from "@/libs/mongoose";
import SupplierForm from "@/components/dashboard/SupplierForm";

export const dynamic = "force-dynamic";

async function getSupplier(supplierId: string) {
  await connectMongo();
  
  const supplier = await Supplier.findOne({
    _id: supplierId,
  })
    .lean();
    
  if (!supplier) {
    return null;
  }

  return JSON.parse(JSON.stringify(supplier));
}

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ supplierId: string }>;
}) {
  const session = await requirePermission('canManageInventory');
  
  const { supplierId } = await params;
  // Handle "new" supplier creation
  if (supplierId === 'new') {
    return (
      <div className="p-8">
        {/* Page header */}
        <div className="mb-8">
          <Link
            href="/dashboard/suppliers"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="mr-1 h-4 w-4" />
            Back to suppliers
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">New Supplier</h1>
          <p className="mt-1 text-sm text-gray-500">
            Add a new supplier to your vendor network
          </p>
        </div>

        {/* Supplier form */}
        <div className="max-w-4xl">
          <SupplierForm />
        </div>
      </div>
    );
  }
  
  // Get existing supplier
  const supplier = await getSupplier(supplierId);
  
  if (!supplier) {
    notFound();
  }

  return (
    <div className="p-8">
      {/* Page header */}
      <div className="mb-8">
        <Link
          href="/dashboard/suppliers"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="mr-1 h-4 w-4" />
          Back to suppliers
        </Link>
        <div className="mt-2 sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{supplier.name}</h1>
            <p className="mt-1 text-sm text-gray-500">Code: {supplier.code}</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
              supplier.status === 'active'
                ? 'bg-green-100 text-green-800'
                : supplier.status === 'pending'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {supplier.status}
            </span>
          </div>
        </div>
      </div>

      {/* Supplier form */}
      <div className="max-w-4xl">
        <SupplierForm 
          supplier={supplier}
        />
      </div>
    </div>
  );
}
