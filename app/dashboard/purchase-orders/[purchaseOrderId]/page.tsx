import { requirePermission } from "@/libs/auth-utils";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import PurchaseOrder from "@/models/PurchaseOrder";
import connectMongo from "@/libs/mongoose";
import PurchaseOrderForm from "@/components/dashboard/PurchaseOrderForm";

export const dynamic = "force-dynamic";

async function getPurchaseOrder(purchaseOrderId: string, organizationId: string) {
  await connectMongo();
  
  const order = await PurchaseOrder.findOne({
    _id: purchaseOrderId,
    organizationId,
  })
    .populate('supplier', 'name code')
    .populate('warehouse', 'name code')
    .populate('items.product', 'name sku')
    .lean();
    
  return order;
}

export default async function PurchaseOrderDetailPage({
  params,
}: {
  params: { purchaseOrderId: string };
}) {
  const session = await requirePermission('canManageInventory');
  
  // Handle "new" purchase order creation
  if (params.purchaseOrderId === 'new') {
    return (
      <div className="p-8">
        {/* Page header */}
        <div className="mb-8">
          <Link
            href="/dashboard/purchase-orders"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="mr-1 h-4 w-4" />
            Back to purchase orders
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">New Purchase Order</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create a new purchase order for your suppliers
          </p>
        </div>

        {/* Purchase order form */}
        <div className="max-w-6xl">
          <PurchaseOrderForm organizationId={session.user.organizationId} />
        </div>
      </div>
    );
  }
  
  // Get existing purchase order
  const order = await getPurchaseOrder(params.purchaseOrderId, session.user.organizationId);
  
  if (!order) {
    notFound();
  }

  return (
    <div className="p-8">
      {/* Page header */}
      <div className="mb-8">
        <Link
          href="/dashboard/purchase-orders"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="mr-1 h-4 w-4" />
          Back to purchase orders
        </Link>
        <div className="mt-2 sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Purchase Order {order.orderNumber}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {order.supplier?.name} • ${order.financial?.grandTotal?.toFixed(2) || '0.00'}
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
              order.status === 'draft'
                ? 'bg-gray-100 text-gray-800'
                : order.status === 'pending'
                ? 'bg-blue-100 text-blue-800'
                : order.status === 'approved'
                ? 'bg-green-100 text-green-800'
                : order.status === 'received'
                ? 'bg-purple-100 text-purple-800'
                : order.status === 'cancelled'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {order.status}
            </span>
          </div>
        </div>
      </div>

      {/* Purchase order form */}
      <div className="max-w-6xl">
        <PurchaseOrderForm 
          purchaseOrder={order}
          organizationId={session.user.organizationId}
        />
      </div>
    </div>
  );
}
