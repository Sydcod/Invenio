'use client';

import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import {
  CurrencyDollarIcon,
  ShoppingCartIcon,
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  UserGroupIcon,
  CreditCardIcon,
  TruckIcon,
  TagIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Types
interface SalesMetrics {
  revenue: number;
  revenueChange: number;
  orders: number;
  ordersChange: number;
  avgOrderValue: number;
  avgOrderValueChange: number;
  conversionRate: number;
  conversionRateChange: number;
}

interface SalesTrend {
  date: string;
  revenue: number;
  orders: number;
}

interface ChannelData {
  channel: string;
  revenue: number;
  orders: number;
  customers: number;
  percentage: number;
}

interface SourceData {
  source: string;
  revenue: number;
  percentage: number;
}

interface PaymentMethodData {
  method: string;
  count: number;
  revenue: number;
}

interface ProductData {
  productId: string;
  name: string;
  sku: string;
  category: string;
  unitsSold: number;
  revenue: number;
  avgPrice: number;
}

interface SalesRepData {
  repId: string;
  name: string;
  revenue: number;
  orders: number;
  avgOrderValue: number;
  conversionRate: number;
}

interface OrderStatusData {
  status: string;
  count: number;
  percentage: number;
}

interface SalesAnalyticsData {
  metrics: SalesMetrics;
  salesTrend: SalesTrend[];
  channelPerformance: ChannelData[];
  sourceDistribution: SourceData[];
  paymentMethods: PaymentMethodData[];
  topProducts: ProductData[];
  salesRepPerformance: SalesRepData[];
  orderStatusFunnel: OrderStatusData[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function SalesAnalyticsPage() {
  const [data, setData] = useState<SalesAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(new Date('2025-07-01')), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date('2025-07-01')), 'yyyy-MM-dd')
  });
  const [filters, setFilters] = useState({
    warehouse: 'all',
    channel: 'all',
    salesRep: 'all'
  });

  // Fetch sales analytics data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const queryParams = new URLSearchParams({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          ...filters
        });

        const response = await fetch(`/api/analytics/sales?${queryParams}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Sales Analytics API Error:', errorData);
          throw new Error(errorData.details?.message || 'Failed to fetch sales analytics');
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange, filters]);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Analytics</h1>
          <p className="text-gray-600 mt-1">Revenue performance, order trends, and sales channel insights</p>
        </div>
        
        {/* Date Range Filter */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5 text-gray-400" />
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-xl font-semibold text-gray-900">{formatCurrency(data.metrics.revenue)}</p>
              <p className={`text-sm ${data.metrics.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'} flex items-center`}>
                {data.metrics.revenueChange >= 0 ? <ArrowUpIcon className="h-3 w-3 mr-1" /> : <ArrowDownIcon className="h-3 w-3 mr-1" />}
                {Math.abs(data.metrics.revenueChange).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ShoppingCartIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-500">Total Orders</p>
              <p className="text-xl font-semibold text-gray-900">{data.metrics.orders.toLocaleString()}</p>
              <p className={`text-sm ${data.metrics.ordersChange >= 0 ? 'text-green-600' : 'text-red-600'} flex items-center`}>
                {data.metrics.ordersChange >= 0 ? <ArrowUpIcon className="h-3 w-3 mr-1" /> : <ArrowDownIcon className="h-3 w-3 mr-1" />}
                {Math.abs(data.metrics.ordersChange).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-500">Average Order Value</p>
              <p className="text-xl font-semibold text-gray-900">{formatCurrency(data.metrics.avgOrderValue)}</p>
              <p className={`text-sm ${data.metrics.avgOrderValueChange >= 0 ? 'text-green-600' : 'text-red-600'} flex items-center`}>
                {data.metrics.avgOrderValueChange >= 0 ? <ArrowUpIcon className="h-3 w-3 mr-1" /> : <ArrowDownIcon className="h-3 w-3 mr-1" />}
                {Math.abs(data.metrics.avgOrderValueChange).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ArrowUpIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-500">Conversion Rate</p>
              <p className="text-xl font-semibold text-gray-900">{data.metrics.conversionRate.toFixed(1)}%</p>
              <p className={`text-sm ${data.metrics.conversionRateChange >= 0 ? 'text-green-600' : 'text-red-600'} flex items-center`}>
                {data.metrics.conversionRateChange >= 0 ? <ArrowUpIcon className="h-3 w-3 mr-1" /> : <ArrowDownIcon className="h-3 w-3 mr-1" />}
                {Math.abs(data.metrics.conversionRateChange).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Sales Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.salesTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => format(new Date(value), 'MMM dd')}
              />
              <YAxis yAxisId="left" orientation="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.6}
                name="Revenue"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="orders"
                stroke="#10B981"
                strokeWidth={2}
                name="Orders"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Channel Performance */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Sales by Channel</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.channelPerformance}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="revenue"
                label={(entry) => `${entry.channel}: ${entry.percentage.toFixed(1)}%`}
              >
                {data.channelPerformance.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Source */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Sales by Source</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.sourceDistribution} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="source" type="category" />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="revenue" fill="#3B82F6">
                {data.sourceDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Methods */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Payment Methods</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.paymentMethods}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                dataKey="revenue"
                label={(entry) => entry.method}
              >
                {data.paymentMethods.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Top Products by Revenue</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Units Sold
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Price
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {data.topProducts.slice(0, 10).map((product) => (
                <tr key={product.productId}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {product.name}
                      </div>
                      <div className="text-sm text-gray-500">{product.sku}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {product.unitsSold.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {formatCurrency(product.revenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {formatCurrency(product.avgPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sales Rep Performance */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Sales Representative Performance</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data.salesRepPerformance} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={150} />
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
            <Bar dataKey="revenue" fill="#3B82F6" name="Revenue" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
