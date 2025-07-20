import { requireAuth } from "@/libs/auth-utils";
import { 
  CubeIcon, 
  TruckIcon, 
  BuildingStorefrontIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export const dynamic = "force-dynamic";

// Fetch dashboard statistics
async function getDashboardStats() {
  // This would normally fetch from the database
  // For now, returning mock data
  return {
    products: {
      total: 156,
      active: 142,
      lowStock: 12,
      change: 5.2
    },
    suppliers: {
      total: 24,
      active: 21,
      pending: 3,
      change: -2.1
    },
    warehouses: {
      total: 4,
      active: 4,
      utilization: 67.8,
      change: 3.4
    },
    orders: {
      purchase: {
        pending: 8,
        total: 234,
        value: 45670.50
      },
      sales: {
        pending: 15,
        total: 567,
        value: 89340.25
      }
    },
    recentActivity: [
      { id: 1, type: 'order', message: 'New purchase order #PO-2024-001 created', time: '2 hours ago' },
      { id: 2, type: 'product', message: 'Product "Wireless Mouse" low stock alert', time: '3 hours ago' },
      { id: 3, type: 'warehouse', message: 'Warehouse "Main DC" capacity updated', time: '5 hours ago' },
      { id: 4, type: 'supplier', message: 'Supplier "Tech Supplies Inc" activated', time: '1 day ago' },
    ]
  };
}

export default async function DashboardPage() {
  const session = await requireAuth();
  const stats = await getDashboardStats();

  const statCards = [
    {
      name: 'Total Products',
      value: stats.products.total,
      change: stats.products.change,
      changeType: stats.products.change > 0 ? 'increase' : 'decrease',
      icon: CubeIcon,
      href: '/dashboard/products',
      alert: stats.products.lowStock > 0 ? `${stats.products.lowStock} low stock` : null,
    },
    {
      name: 'Active Suppliers',
      value: stats.suppliers.active,
      change: stats.suppliers.change,
      changeType: stats.suppliers.change > 0 ? 'increase' : 'decrease',
      icon: TruckIcon,
      href: '/dashboard/suppliers',
      alert: stats.suppliers.pending > 0 ? `${stats.suppliers.pending} pending` : null,
    },
    {
      name: 'Warehouses',
      value: stats.warehouses.total,
      change: stats.warehouses.change,
      changeType: stats.warehouses.change > 0 ? 'increase' : 'decrease',
      icon: BuildingStorefrontIcon,
      href: '/dashboard/warehouses',
      alert: `${stats.warehouses.utilization}% utilized`,
    },
    {
      name: 'Pending Orders',
      value: stats.orders.purchase.pending + stats.orders.sales.pending,
      change: 0,
      changeType: 'increase',
      icon: DocumentTextIcon,
      href: '/dashboard/purchase-orders',
      alert: `${stats.orders.purchase.pending} purchase, ${stats.orders.sales.pending} sales`,
    },
  ];

  return (
    <div className="p-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back! Here's what's happening in your inventory.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link
            key={stat.name}
            href={stat.href}
            className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow hover:shadow-md transition-shadow"
          >
            <dt>
              <div className="absolute rounded-md bg-primary/10 p-3">
                <stat.icon className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">{stat.name}</p>
            </dt>
            <dd className="ml-16 flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              {stat.change !== 0 && (
                <p
                  className={`ml-2 flex items-baseline text-sm font-semibold ${
                    stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {stat.changeType === 'increase' ? (
                    <ArrowUpIcon className="h-4 w-4 flex-shrink-0 self-center text-green-500" />
                  ) : (
                    <ArrowDownIcon className="h-4 w-4 flex-shrink-0 self-center text-red-500" />
                  )}
                  <span className="sr-only">
                    {stat.changeType === 'increase' ? 'Increased' : 'Decreased'} by
                  </span>
                  {Math.abs(stat.change)}%
                </p>
              )}
            </dd>
            {stat.alert && (
              <dd className="ml-16 mt-1 text-xs text-gray-500">{stat.alert}</dd>
            )}
          </Link>
        ))}
      </div>

      {/* Recent activity and alerts */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Low stock alerts */}
        <div className="rounded-lg bg-white shadow">
          <div className="p-6">
            <h2 className="flex items-center text-base font-medium text-gray-900">
              <ExclamationTriangleIcon className="mr-2 h-5 w-5 text-yellow-500" />
              Low Stock Alerts
            </h2>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-yellow-50 p-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">Wireless Mouse</p>
                  <p className="text-xs text-gray-500">SKU: WM-001 • 8 units left</p>
                </div>
                <Link
                  href="/dashboard/products/WM-001"
                  className="text-sm font-medium text-primary hover:text-primary/80"
                >
                  View
                </Link>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-yellow-50 p-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">USB-C Cable</p>
                  <p className="text-xs text-gray-500">SKU: UC-102 • 12 units left</p>
                </div>
                <Link
                  href="/dashboard/products/UC-102"
                  className="text-sm font-medium text-primary hover:text-primary/80"
                >
                  View
                </Link>
              </div>
              <Link
                href="/dashboard/products?filter=low-stock"
                className="block pt-3 text-sm font-medium text-primary hover:text-primary/80"
              >
                View all low stock items →
              </Link>
            </div>
          </div>
        </div>

        {/* Recent activity */}
        <div className="rounded-lg bg-white shadow">
          <div className="p-6">
            <h2 className="text-base font-medium text-gray-900">Recent Activity</h2>
            <div className="mt-4 space-y-3">
              {stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
              <Link
                href="/dashboard/activity"
                className="block pt-3 text-sm font-medium text-primary hover:text-primary/80"
              >
                View all activity →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
