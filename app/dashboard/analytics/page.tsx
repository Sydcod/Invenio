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

  // Mock data for initial display - will be replaced with real data from API
  const mockData = {
    kpis: {
      totalRevenue: { value: 1234567, change: 12.5 },
      totalOrders: { value: 543, change: 8.3 },
      avgOrderValue: { value: 2274, change: 3.2 },
      conversionRate: { value: 68.5, change: -2.1 },
      inventoryTurnover: { value: 8.2, change: 0.5 },
      customerLifetimeValue: { value: 5432, change: 15.7 }
    },
    salesTrend: [
      { date: 'Jan', revenue: 120000, orders: 45 },
      { date: 'Feb', revenue: 135000, orders: 52 },
      { date: 'Mar', revenue: 155000, orders: 61 },
      { date: 'Apr', revenue: 142000, orders: 58 },
      { date: 'May', revenue: 168000, orders: 67 },
      { date: 'Jun', revenue: 185000, orders: 73 },
      { date: 'Jul', revenue: 198000, orders: 78 },
    ],
    categoryPerformance: [
      { name: 'Laptops', revenue: 450000, quantity: 125 },
      { name: 'Smartphones', revenue: 380000, quantity: 320 },
      { name: 'Tablets', revenue: 220000, quantity: 145 },
      { name: 'Televisions', revenue: 180000, quantity: 65 },
      { name: 'Audio', revenue: 120000, quantity: 210 },
    ],
    customerSegments: [
      { segment: 'B2B', count: 120, revenue: 820000 },
      { segment: 'B2C', count: 423, revenue: 530000 },
    ]
  };

  // Debug: Check what dashboardData contains
  console.log('dashboardData:', dashboardData);
  console.log('dashboardData.customerSegments:', dashboardData?.customerSegments);
  
  // Properly merge data - use dashboardData but fill missing fields from mockData
  const data = dashboardData ? {
    ...mockData,
    ...dashboardData,
    // Ensure customerSegments exists even if API doesn't return it
    customerSegments: dashboardData.customerSegments || mockData.customerSegments
  } : mockData;

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
                {formatPercentage(Math.abs(data.kpis.totalRevenue.change))}
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
                {formatPercentage(Math.abs(data.kpis.totalOrders.change))}
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
                {formatPercentage(Math.abs(data.kpis.avgOrderValue.change))}
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
              <p className="text-sm font-medium text-gray-500">Conversion Rate</p>
              <p className="text-xl font-semibold text-gray-900">{formatPercentage(data.kpis.conversionRate.value)}</p>
              <p className={`text-sm ${data.kpis.conversionRate.change >= 0 ? 'text-green-600' : 'text-red-600'} flex items-center`}>
                {data.kpis.conversionRate.change >= 0 ? <ArrowUpIcon className="h-3 w-3 mr-1" /> : <ArrowDownIcon className="h-3 w-3 mr-1" />}
                {formatPercentage(Math.abs(data.kpis.conversionRate.change))} pts
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
              <p className="text-xl font-semibold text-gray-900">{data.kpis.inventoryTurnover.value}x</p>
              <p className={`text-sm ${data.kpis.inventoryTurnover.change >= 0 ? 'text-green-600' : 'text-red-600'} flex items-center`}>
                {data.kpis.inventoryTurnover.change >= 0 ? <ArrowUpIcon className="h-3 w-3 mr-1" /> : <ArrowDownIcon className="h-3 w-3 mr-1" />}
                {Math.abs(data.kpis.inventoryTurnover.change)}x
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
        </div>

        {/* Category Performance */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Category Performance</h3>
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
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Customer Segments */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Segments</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data.customerSegments}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ segment, percent }: any) => `${segment} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="revenue"
              >
                {data.customerSegments.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
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

        {/* Recent Alerts */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Insights & Alerts</h3>
          <div className="space-y-3">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Low Stock Alert</p>
                <p className="text-xs text-gray-500">12 products below reorder point</p>
              </div>
            </div>
            <div className="flex items-start">
              <ArrowUpIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Sales Spike</p>
                <p className="text-xs text-gray-500">Laptops category up 25% this week</p>
              </div>
            </div>
            <div className="flex items-start">
              <ChartBarIcon className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Trend Analysis</p>
                <p className="text-xs text-gray-500">B2B sales growing 3x faster than B2C</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
