import { requirePermission } from "@/libs/auth-utils";
import Link from "next/link";
import { PlusIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import Supplier from "@/models/Supplier";
import connectMongo from "@/libs/mongoose";

export const dynamic = "force-dynamic";

async function getSuppliers(organizationId: string, searchQuery?: string) {
  await connectMongo();
  
  const query: any = { organizationId };
  
  if (searchQuery) {
    query.$or = [
      { name: { $regex: searchQuery, $options: 'i' } },
      { code: { $regex: searchQuery, $options: 'i' } },
      { 'contact.email': { $regex: searchQuery, $options: 'i' } },
      { 'contact.phone': { $regex: searchQuery, $options: 'i' } },
    ];
  }
  
  const suppliers = await Supplier.find(query)
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
    
  return suppliers;
}

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: { search?: string };
}) {
  const session = await requirePermission('canManageInventory');
  const suppliers = await getSuppliers(session.user.organizationId, searchParams.search);

  return (
    <div className="p-8">
      {/* Page header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your suppliers and vendor relationships
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/dashboard/suppliers/new"
            className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
            Add Supplier
          </Link>
        </div>
      </div>

      {/* Search bar */}
      <div className="mt-6">
        <form method="get" action="/dashboard/suppliers">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="search"
              name="search"
              defaultValue={searchParams.search}
              className="block w-full rounded-md border-0 py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
              placeholder="Search suppliers by name, code, email, or phone..."
            />
          </div>
        </form>
      </div>

      {/* Suppliers table */}
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Supplier
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Contact
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Type
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Performance
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Edit</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {suppliers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-sm text-gray-500">
                        {searchParams.search
                          ? 'No suppliers found matching your search.'
                          : 'No suppliers yet. Add your first supplier to get started.'}
                      </td>
                    </tr>
                  ) : (
                    suppliers.map((supplier: any) => (
                      <tr key={supplier._id}>
                        <td className="whitespace-nowrap px-3 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {supplier.name}
                            </div>
                            <div className="text-sm text-gray-500">{supplier.code}</div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4">
                          <div className="text-sm text-gray-900">
                            {supplier.contact?.name || '-'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {supplier.contact?.email || supplier.contact?.phone || '-'}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                          <span className="inline-flex rounded-full px-2 text-xs font-semibold leading-5 bg-blue-100 text-blue-800">
                            {supplier.type}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">
                              {supplier.performance?.onTimeDeliveryRate 
                                ? `${supplier.performance.onTimeDeliveryRate}% on-time`
                                : '-'}
                            </div>
                            {supplier.performance?.rating && (
                              <div className="text-gray-500">
                                Rating: {supplier.performance.rating}/5
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            supplier.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : supplier.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {supplier.status}
                          </span>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <Link
                            href={`/dashboard/suppliers/${supplier._id}`}
                            className="text-primary hover:text-primary/80"
                          >
                            Edit<span className="sr-only">, {supplier.name}</span>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
