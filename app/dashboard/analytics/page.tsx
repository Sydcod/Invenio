'use client';

import { useEffect, useState } from 'react';
import { 
  CurrencyDollarIcon, 
  ShoppingCartIcon, 
  CubeIcon,
  TruckIcon,
  UserGroupIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line
} from 'recharts';
import Link from 'next/link';

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

// Format percentage
const formatPercentage = (value: number) => {
  return `${value.toFixed(1)}%`;
};

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Helper function to get first day of current month in YYYY-MM-DD format
  const getFirstDayOfCurrentMonth = () => {
    const now = new Date();
    // We're using year 2025 for demo purposes since that's the year in our dataset
    const year = 2025; // Use now.getFullYear() for production
    const month = now.getMonth(); // 0-indexed month
    return `${year}-${String(month + 1).padStart(2, '0')}-01`;
  };

  // Helper function to get last day of current month in YYYY-MM-DD format
  const getLastDayOfCurrentMonth = () => {
    const now = new Date();
    // We're using year 2025 for demo purposes since that's the year in our dataset
    const year = 2025; // Use now.getFullYear() for production
    const month = now.getMonth(); // 0-indexed month
    const lastDay = new Date(2025, month + 1, 0).getDate();
    return `${year}-${String(month + 1).padStart(2, '0')}-${lastDay}`;
  };

  const [filters, setFilters] = useState({
    startDate: getFirstDayOfCurrentMonth(), // First day of current month
    endDate: getLastDayOfCurrentMonth(), // Last day of current month
    warehouse: 'all'
  });
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, [filters]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      queryParams.append('startDate', filters.startDate);
      queryParams.append('endDate', filters.endDate);
      if (filters.warehouse !== 'all') {
        queryParams.append('warehouse', filters.warehouse);
      }

      const response = await fetch(`/api/analytics/dashboard?${queryParams}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch analytics data');
      
      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
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
          <p className="text-red-800">Error loading analytics: {error}</p>
        </div>
      </div>
    );
  }

  // Debug: Check what dashboardData contains
  console.log('dashboardData:', dashboardData);
  console.log('dashboardData.customerSegments:', dashboardData?.customerSegments);
  
  // Define types for our data structures
  type SalesTrendItem = { date: string; revenue: number; orders: number };
  type CategoryPerformanceItem = { name: string; revenue: number; quantity: number };
  type CustomerSegmentItem = { segment: string; count: number; revenue: number; orderCount?: number; avgOrderValue?: number };

  // Define default empty structures for data that might be missing from API
  const defaultEmptyData = {
    kpis: {
      totalRevenue: { value: 0, change: 0 },
      totalOrders: { value: 0, change: 0 },
      avgOrderValue: { value: 0, change: 0 },
      conversionRate: { value: 0, change: 0 },
      inventoryTurnover: { value: 0, change: 0 },
      customerLifetimeValue: { value: 0, change: 0 }
    },
    salesTrend: [] as SalesTrendItem[],
    categoryPerformance: [] as CategoryPerformanceItem[],
    customerSegments: [] as CustomerSegmentItem[],
    inventoryMetrics: {
      totalProducts: 0,
      totalValue: 0,
      outOfStock: 0,
      lowStock: 0,
      deadStockValue: 0
    }
  };

  // Use API data or default empty structures if data is missing
  const data = dashboardData || defaultEmptyData;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Comprehensive business insights and performance metrics</p>
        </div>
        
        {/* Date Range Filter */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5 text-gray-400" />
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
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
              <p className="text-xl font-semibold text-gray-900">{formatCurrency(data.kpis.totalRevenue.value)}</p>
              <p className={`text-sm ${data.kpis.totalRevenue.change >= 0 ? 'text-green-600' : 'text-red-600'} flex items-center`}>
                {data.kpis.totalRevenue.change >= 0 ? <ArrowUpIcon className="h-3 w-3 mr-1" /> : <ArrowDownIcon className="h-3 w-3 mr-1" />}
                {formatPercentage(data.kpis.totalRevenue.change)}
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
              <p className="text-xl font-semibold text-gray-900">{formatNumber(data.kpis.totalOrders.value)}</p>
              <p className={`text-sm ${data.kpis.totalOrders.change >= 0 ? 'text-green-600' : 'text-red-600'} flex items-center`}>
                {data.kpis.totalOrders.change >= 0 ? <ArrowUpIcon className="h-3 w-3 mr-1" /> : <ArrowDownIcon className="h-3 w-3 mr-1" />}
                {formatPercentage(data.kpis.totalOrders.change)}
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
              <p className="text-sm font-medium text-gray-500">Avg Order Value</p>
              <p className="text-xl font-semibold text-gray-900">{formatCurrency(data.kpis.avgOrderValue.value)}</p>
              <p className={`text-sm ${data.kpis.avgOrderValue.change >= 0 ? 'text-green-600' : 'text-red-600'} flex items-center`}>
                {data.kpis.avgOrderValue.change >= 0 ? <ArrowUpIcon className="h-3 w-3 mr-1" /> : <ArrowDownIcon className="h-3 w-3 mr-1" />}
                {formatPercentage(data.kpis.avgOrderValue.change)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-500">Orders per Customer</p>
              <p className="text-xl font-semibold text-gray-900">{formatPercentage(data.kpis.conversionRate.value)}</p>
              <p className={`text-sm ${data.kpis.conversionRate.change >= 0 ? 'text-green-600' : 'text-red-600'} flex items-center`}>
                {data.kpis.conversionRate.change >= 0 ? <ArrowUpIcon className="h-3 w-3 mr-1" /> : <ArrowDownIcon className="h-3 w-3 mr-1" />}
                {formatPercentage(data.kpis.conversionRate.change)} pts
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CubeIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-500">Inventory Turnover</p>
              <p className="text-xl font-semibold text-gray-900">{data.kpis.inventoryTurnover.value.toFixed(2)}x</p>
              <p className={`text-sm ${data.kpis.inventoryTurnover.change >= 0 ? 'text-green-600' : 'text-red-600'} flex items-center`}>
                {data.kpis.inventoryTurnover.change >= 0 ? <ArrowUpIcon className="h-3 w-3 mr-1" /> : <ArrowDownIcon className="h-3 w-3 mr-1" />}
                {Math.abs(data.kpis.inventoryTurnover.change).toFixed(2)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserGroupIcon className="h-6 w-6 text-teal-600" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-500">Customer LTV</p>
              <p className="text-xl font-semibold text-gray-900">{formatCurrency(data.kpis.customerLifetimeValue.value)}</p>
              <p className={`text-sm ${data.kpis.customerLifetimeValue.change >= 0 ? 'text-green-600' : 'text-red-600'} flex items-center`}>
                {data.kpis.customerLifetimeValue.change >= 0 ? <ArrowUpIcon className="h-3 w-3 mr-1" /> : <ArrowDownIcon className="h-3 w-3 mr-1" />}
                {formatPercentage(Math.abs(data.kpis.customerLifetimeValue.change))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Sales Trend Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Sales Trend</h3>
          {data.salesTrend && data.salesTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart 
                data={data.salesTrend}
                margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis 
                  yAxisId="left" 
                  tickFormatter={(value) => `$${(value/1000)}k`} 
                  width={60}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  width={35}
                />
                <Tooltip formatter={(value: any, name: string) => 
                  name === 'revenue' ? formatCurrency(value) : formatNumber(value)
                } />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#0088FE" name="Revenue" />
                <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#00C49F" name="Orders" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-sm font-medium">No sales trend data available for the selected period</p>
              <p className="text-xs">Try changing your date range filter</p>
            </div>
          )}
        </div>

        {/* Category Performance */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Category Performance</h3>
          {data.categoryPerformance && data.categoryPerformance.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart 
                data={data.categoryPerformance}
                margin={{ top: 5, right: 20, left: 50, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis 
                  tickFormatter={(value) => `$${(value/1000)}k`} 
                  width={60} 
                />
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
                <Bar dataKey="revenue" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
              <p className="text-sm font-medium">No category performance data available</p>
              <p className="text-xs">Try changing your date range filter</p>
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Customer Segments */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Segments</h3>
          {data.customerSegments && data.customerSegments.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.customerSegments}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="revenue"
                  nameKey="segment"
                >
                  {data.customerSegments.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-sm font-medium">No customer segment data available</p>
              <p className="text-xs">Try changing your date range filter</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Analytics Sections</h3>
          <div className="space-y-3">
            <Link
              href="/dashboard/analytics/sales"
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center">
                <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-sm font-medium text-gray-900">Sales Analytics</span>
              </div>
              <span className="text-gray-400">→</span>
            </Link>
            <Link
              href="/dashboard/analytics/inventory"
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center">
                <CubeIcon className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-sm font-medium text-gray-900">Inventory Analytics</span>
              </div>
              <span className="text-gray-400">→</span>
            </Link>
            <Link
              href="/dashboard/analytics/customers"
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center">
                <UserGroupIcon className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-sm font-medium text-gray-900">Customer Analytics</span>
              </div>
              <span className="text-gray-400">→</span>
            </Link>
            <Link
              href="/dashboard/analytics/procurement"
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center">
                <TruckIcon className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-sm font-medium text-gray-900">Procurement Analytics</span>
              </div>
              <span className="text-gray-400">→</span>
            </Link>
          </div>
        </div>

        {/* Insights & Alerts */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Insights & Alerts</h3>
          <div className="space-y-3">
            {dashboardData?.insights && dashboardData.insights.length > 0 ? (
              dashboardData.insights.map((insight: any, index: number) => (
                <div key={index} className="flex items-start">
                  {insight.icon === 'warning' && (
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
                  )}
                  {insight.icon === 'up' && (
                    <ArrowUpIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  )}
                  {insight.icon === 'down' && (
                    <ArrowDownIcon className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  )}
                  {insight.icon === 'chart' && (
                    <ChartBarIcon className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{insight.title}</p>
                    <p className="text-xs text-gray-500">{insight.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No significant insights available for this period</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
