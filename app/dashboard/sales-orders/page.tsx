import { requirePermission } from "@/libs/auth-utils";
import Link from "next/link";
import { PlusIcon, ShoppingCartIcon } from "@heroicons/react/24/outline";
import SalesOrder from "@/models/SalesOrder";
import connectMongo from "@/libs/mongoose";

export const dynamic = "force-dynamic";

async function getSalesOrders(organizationId: string) {
  await connectMongo();
  
  const orders = await SalesOrder.find({ organizationId })
    .populate('warehouse', 'name code')
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
    
  return orders;
}

export default async function SalesOrdersPage() {
  const session = await requirePermission('canManageInventory');
  const orders = await getSalesOrders(session.user.organizationId);

  return (
    <div className="p-8">
      {/* Page header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Orders</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage customer orders and track fulfillment
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/dashboard/sales-orders/new"
            className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
            New Sales Order
          </Link>
        </div>
      </div>

      {/* Orders table */}
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Order Number
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Customer
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Warehouse
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Total
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Date
                    </th>
                    <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">View</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center">
                        <ShoppingCartIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-semibold text-gray-900">No sales orders</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Get started by creating your first sales order.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    orders.map((order: any) => (
                      <tr key={order._id}>
                        <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                          {order.orderNumber}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4">
                          <div className="text-sm text-gray-900">
                            {order.customer?.name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.customer?.email || order.customer?.phone || ''}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                          {order.warehouse?.name || 'N/A'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                          ${order.financials?.totalAmount?.toFixed(2) || '0.00'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            order.status === 'draft'
                              ? 'bg-gray-100 text-gray-800'
                              : order.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : order.status === 'confirmed'
                              ? 'bg-blue-100 text-blue-800'
                              : order.status === 'processing'
                              ? 'bg-indigo-100 text-indigo-800'
                              : order.status === 'shipped'
                              ? 'bg-purple-100 text-purple-800'
                              : order.status === 'delivered'
                              ? 'bg-green-100 text-green-800'
                              : order.status === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <Link
                            href={`/dashboard/sales-orders/${order._id}`}
                            className="text-primary hover:text-primary/80"
                          >
                            View<span className="sr-only">, {order.orderNumber}</span>
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
