'use client';

import { useEffect, useState } from 'react';
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  CurrencyDollarIcon, 
  ShoppingCartIcon, 
  CubeIcon,
  TruckIcon,
  BuildingStorefrontIcon,
  ExclamationTriangleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export const dynamic = "force-dynamic";

// Color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// Format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Format number with commas
const formatNumber = (value: number) => {
  return new Intl.NumberFormat('en-US').format(value);
};

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Error loading dashboard: {error}</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  // Prepare data for charts
  const salesStatusData = stats.salesByStatus.map((item: any) => ({
    name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
    value: item.count,
    revenue: item.total
  }));

  const channelData = stats.salesByChannel.map((item: any) => ({
    name: item.channel,
    value: item.count,
    revenue: item.total
  }));

  const topProductsData = stats.topProducts.slice(0, 5).map((item: any) => ({
    name: item.name.length > 30 ? item.name.substring(0, 30) + '...' : item.name,
    revenue: item.revenue,
    quantity: item.quantity
  }));

  const categoryData = stats.productsByCategory.slice(0, 6).map((item: any) => ({
    name: item.name || 'Uncategorized',
    value: item.value || 0,
    count: item.count || 0
  }));

  // KPI Cards data
  const kpiCards = [
    {
      name: 'Total Revenue',
      value: formatCurrency(stats.revenue.total),
      change: stats.revenue.growth,
      changeType: stats.revenue.growth >= 0 ? 'increase' : 'decrease',
      icon: CurrencyDollarIcon,
      subtitle: `${stats.revenue.orderCount} orders`,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      name: 'Average Order Value',
      value: formatCurrency(stats.revenue.avgOrderValue),
      change: 0,
      changeType: 'neutral',
      icon: ShoppingCartIcon,
      subtitle: 'Per order',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      name: 'Total Products',
      value: formatNumber(stats.inventory.totalProducts),
      change: 0,
      changeType: 'neutral',
      icon: CubeIcon,
      subtitle: `${stats.inventory.lowStockCount} low stock`,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      alert: stats.inventory.lowStockCount > 0
    },
    {
      name: 'Active Suppliers',
      value: formatNumber(stats.suppliers.active),
      change: 0,
      changeType: 'neutral',
      icon: TruckIcon,
      subtitle: `${stats.suppliers.total} total`,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ];

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="mt-2 text-sm text-gray-600">
          Real-time insights into your inventory and sales performance
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {kpiCards.map((stat) => (
          <div
            key={stat.name}
            className="relative overflow-hidden rounded-lg bg-white px-6 py-5 shadow hover:shadow-md transition-shadow"
          >
            <dt>
              <div className={`absolute rounded-md ${stat.bgColor} p-3`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} aria-hidden="true" />
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
                  {Math.abs(stat.change).toFixed(1)}%
                </p>
              )}
            </dd>
            <dd className="ml-16 mt-1 text-xs text-gray-500">{stat.subtitle}</dd>
            {stat.alert && (
              <div className="absolute top-2 right-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
        {/* Sales by Status */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2 text-gray-400" />
            Sales Order Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={salesStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {salesStatusData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => formatNumber(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <CubeIcon className="h-5 w-5 mr-2 text-gray-400" />
            Top Selling Products
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProductsData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
              <YAxis dataKey="name" type="category" width={150} />
              <Tooltip formatter={(value: any) => formatCurrency(value)} />
              <Bar dataKey="revenue" fill="#0088FE" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Distribution and Channel Performance */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
        {/* Inventory by Category */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Inventory Value by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => entry.name}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Sales by Channel */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue by Sales Channel</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={channelData} margin={{ top: 20, right: 30, left: 80, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip formatter={(value: any) => formatCurrency(value)} />
              <Bar dataKey="revenue" fill="#00C49F" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Low Stock Alert */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h3 className="flex items-center text-lg font-medium text-gray-900 mb-4">
              <ExclamationTriangleIcon className="mr-2 h-5 w-5 text-yellow-500" />
              Low Stock Products
            </h3>
            <div className="space-y-3">
              {stats.inventory.lowStockProducts.slice(0, 5).map((product: any) => (
                <div key={product._id} className="flex items-center justify-between rounded-lg bg-yellow-50 p-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-500">
                      SKU: {product.sku} • {product.currentStock} units left
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/products/${product._id}`}
                    className="text-sm font-medium text-primary hover:text-primary/80"
                  >
                    View
                  </Link>
                </div>
              ))}
              {stats.inventory.lowStockCount > 5 && (
                <Link
                  href="/dashboard/products?filter=low-stock"
                  className="block pt-3 text-sm font-medium text-primary hover:text-primary/80"
                >
                  View all {stats.inventory.lowStockCount} low stock items →
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Sales Orders</h3>
            <div className="space-y-3">
              {stats.recentActivity.sales.map((order: any) => (
                <div key={order._id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-900">
                      {order.orderNumber} - {order.customer?.name || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatCurrency(order.financial?.grandTotal || 0)} • {order.status}
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/sales-orders/${order._id}`}
                    className="text-sm font-medium text-primary hover:text-primary/80"
                  >
                    View
                  </Link>
                </div>
              ))}
              <Link
                href="/dashboard/sales-orders"
                className="block pt-3 text-sm font-medium text-primary hover:text-primary/80"
              >
                View all orders →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
