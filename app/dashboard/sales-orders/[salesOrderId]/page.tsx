import { requirePermission } from "@/libs/auth-utils";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import SalesOrder from "@/models/SalesOrder";
import connectMongo from "@/libs/mongoose";
import SalesOrderForm from "@/components/dashboard/SalesOrderForm";

export const dynamic = "force-dynamic";

async function getSalesOrder(salesOrderId: string, organizationId: string) {
  await connectMongo();
  
  const order = await SalesOrder.findOne({
    _id: salesOrderId,
    organizationId,
  })
    .populate('warehouse', 'name code')
    .populate('items.product', 'name sku')
    .lean();
    
  return order;
}

export default async function SalesOrderDetailPage({
  params,
}: {
  params: { salesOrderId: string };
}) {
  const session = await requirePermission('canManageInventory');
  
  // Handle "new" sales order creation
  if (params.salesOrderId === 'new') {
    return (
      <div className="p-8">
        {/* Page header */}
        <div className="mb-8">
          <Link
            href="/dashboard/sales-orders"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="mr-1 h-4 w-4" />
            Back to sales orders
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">New Sales Order</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create a new sales order for a customer
          </p>
        </div>

        {/* Sales order form */}
        <div className="max-w-6xl">
          <SalesOrderForm organizationId={session.user.organizationId} />
        </div>
      </div>
    );
  }
  
  // Get existing sales order
  const order = await getSalesOrder(params.salesOrderId, session.user.organizationId);
  
  if (!order) {
    notFound();
  }

  return (
    <div className="p-8">
      {/* Page header */}
      <div className="mb-8">
        <Link
          href="/dashboard/sales-orders"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="mr-1 h-4 w-4" />
          Back to sales orders
        </Link>
        <div className="mt-2 sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Sales Order {order.orderNumber}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {order.customer?.name || 'Customer'} • ${order.financials?.totalAmount?.toFixed(2) || '0.00'}
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
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
          </div>
        </div>
      </div>

      {/* Sales order form */}
      <div className="max-w-6xl">
        <SalesOrderForm 
          salesOrder={order}
          organizationId={session.user.organizationId}
        />
      </div>
    </div>
  );
}
