import { requirePermission } from "@/libs/auth-utils";
import Link from "next/link";
import { UserGroupIcon, UserPlusIcon } from "@heroicons/react/24/outline";
import Customer from "@/models/Customer";
import connectMongo from "@/libs/mongoose";

export const dynamic = "force-dynamic";

async function getCustomers() {
  await connectMongo();
  
  const customers = await Customer.find({})
    .sort({ 'metrics.totalSpent': -1 })
    .limit(100)
    .lean();
    
  return customers;
}

export default async function CustomersPage() {
  const session = await requirePermission('canManageInventory');
  const customers = await getCustomers();

  // Calculate summary stats
  const stats = {
    total: customers.length,
    b2b: customers.filter(c => c.type === 'B2B').length,
    b2c: customers.filter(c => c.type === 'B2C').length,
    active: customers.filter(c => c.status === 'active').length,
    totalRevenue: customers.reduce((sum, c) => sum + (c.metrics?.totalSpent || 0), 0)
  };

  return (
    <div className="p-8">
      {/* Page header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage customer relationships and view purchase history
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/dashboard/customers/new"
            className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <UserPlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
            New Customer
          </Link>
        </div>
      </div>

      {/* Stats cards */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">Total Customers</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{stats.total}</dd>
        </div>
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">B2B Customers</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            {stats.b2b} <span className="text-sm font-normal text-gray-500">({Math.round(stats.b2b / stats.total * 100)}%)</span>
          </dd>
        </div>
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">B2C Customers</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            {stats.b2c} <span className="text-sm font-normal text-gray-500">({Math.round(stats.b2c / stats.total * 100)}%)</span>
          </dd>
        </div>
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">Total Revenue</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            ${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </dd>
        </div>
      </div>

      {/* Customers table */}
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Customer
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Type
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Email
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Orders
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Total Spent
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Last Order
                    </th>
                    <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">View</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-8 text-center">
                        <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-semibold text-gray-900">No customers</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Customers will appear here once they place orders.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    customers.map((customer: any) => (
                      <tr key={customer._id}>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <div>
                            <div className="font-medium text-gray-900">{customer.name}</div>
                            {customer.company && (
                              <div className="text-gray-500">{customer.company}</div>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            customer.type === 'B2B'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {customer.type}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                          {customer.email}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                          {customer.metrics?.totalOrders || 0}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                          ${(customer.metrics?.totalSpent || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            customer.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : customer.status === 'inactive'
                              ? 'bg-gray-100 text-gray-800'
                              : customer.status === 'blocked'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {customer.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {customer.metrics?.lastOrderDate 
                            ? new Date(customer.metrics.lastOrderDate).toLocaleDateString()
                            : 'N/A'}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <Link
                            href={`/dashboard/customers/${customer._id}`}
                            className="text-primary hover:text-primary/80"
                          >
                            View<span className="sr-only">, {customer.name}</span>
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

      {/* Tags legend */}
      {customers.some(c => c.tags?.length > 0) && (
        <div className="mt-4 text-sm text-gray-500">
          <span className="font-medium">Common tags:</span>{' '}
          {['vip', 'high-value', 'valued', 'frequent-buyer', 'business']
            .filter(tag => customers.some(c => c.tags?.includes(tag)))
            .map((tag, i) => (
              <span key={tag}>
                {i > 0 && ', '}
                <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                  {tag}
                </span>
              </span>
            ))}
        </div>
      )}
    </div>
  );
}
