'use client';

import { useState, useEffect } from 'react';
import { 
  CubeIcon, 
  CurrencyDollarIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  BeakerIcon,
  ArchiveBoxIcon,
  BuildingStorefrontIcon,
  CalendarIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
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

const COLORS = ['#22C55E', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

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

interface StockMetrics {
  totalItems: number;
  totalInventoryValue: number;
  belowReorderPoint: number;
  outOfStock: number;
  overstockItems: number;
  totalActiveStock: number;
}

interface ABCAnalysis {
  aItems: Array<{ sku: string; name: string; value: number; cumulativePercentage: number; }>;
  bItems: Array<{ sku: string; name: string; value: number; cumulativePercentage: number; }>;
  cItems: Array<{ sku: string; name: string; value: number; cumulativePercentage: number; }>;
  totalValue: number;
}

interface WarehouseStock {
  warehouse: string;
  itemCount: number;
  stockValue: number;
}

interface MonthlyTurnover {
  month: number;
  year: number;
  turnoverRate: number;
}

interface LowStockAlert {
  sku: string;
  name: string;
  currentStock: number;
  reorderPoint: number;
  warehouse: string;
}

interface DeadStockItem {
  sku: string;
  name: string;
  stock: number;
  value: number;
  lastSoldDate: string;
}

interface InventoryData {
  totalActiveStock: number;
  stockMetrics: StockMetrics;
  lowStock: number;
  abcAnalysis: ABCAnalysis;
  warehouseDistribution: WarehouseStock[];
  monthlyTurnover: MonthlyTurnover[];
  lowStockAlerts: LowStockAlert[];
  deadStock: DeadStockItem[];
}

export default function InventoryAnalyticsPage() {
  const [filters, setFilters] = useState({
    warehouse: 'all',
    category: 'all'
  });
  const [data, setData] = useState<InventoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOptions, setFilterOptions] = useState<{
    warehouses: Array<{ value: string; label: string }>;
    categories: Array<{ value: string; label: string }>;
  }>({ warehouses: [], categories: [] });

  // Fetch inventory analytics data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          warehouse: filters.warehouse,
          category: filters.category
        });
        
        const response = await fetch(`/api/analytics/inventory?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch inventory data');
        }
        
        const result = await response.json();
        setData(result);
        if (result.filters) {
          setFilterOptions({
            warehouses: result.filters.warehouses || [],
            categories: result.filters.categories || []
          });
        }
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching inventory data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded">
        Error: {error}
      </div>
    );
  }

  if (!data) {
    return <div>No data available</div>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Analytics</h1>
          <p className="text-gray-600 mt-1">Stock optimization, ABC analysis, and warehouse insights</p>
        </div>
        
        {/* Filters */}
        <div className="flex items-center space-x-4">
          {/* Warehouse Filter */}
          <select
            value={filters.warehouse}
            onChange={(e) => setFilters({ ...filters, warehouse: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="all">All Warehouses</option>
            {filterOptions.warehouses.map((warehouse) => (
              <option key={warehouse.value} value={warehouse.value}>
                {warehouse.label}
              </option>
            ))}
          </select>
          
          {/* Category Filter */}
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="all">All Categories</option>
            {filterOptions.categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Active Items</p>
              <p className="text-2xl font-bold">{formatNumber(data.stockMetrics.totalItems)}</p>
            </div>
            <CubeIcon className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inventory Active Value</p>
              <p className="text-2xl font-bold">{formatCurrency(data.stockMetrics.totalInventoryValue)}</p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Stock Active Quantity</p>
              <p className="text-2xl font-bold">{data.stockMetrics.totalActiveStock.toLocaleString()}</p>
            </div>
            <ArrowTrendingDownIcon className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold">{data.stockMetrics.belowReorderPoint}</p>
            </div>
            <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold">{data.stockMetrics.outOfStock}</p>
            </div>
            <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overstock</p>
              <p className="text-2xl font-bold">{data.stockMetrics.overstockItems}</p>
            </div>
            <ArchiveBoxIcon className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ABC Analysis */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">ABC Analysis</h2>
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-blue-50 rounded">
                <p className="text-sm text-gray-600">A Items (80% value)</p>
                <p className="text-xl font-bold">{data.abcAnalysis?.aItems?.length || 0}</p>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded">
                <p className="text-sm text-gray-600">B Items (15% value)</p>
                <p className="text-xl font-bold">{data.abcAnalysis?.bItems?.length || 0}</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded">
                <p className="text-sm text-gray-600">C Items (5% value)</p>
                <p className="text-xl font-bold">{data.abcAnalysis?.cItems?.length || 0}</p>
              </div>
            </div>
            
            {/* Product Details Table */}
            <div className="overflow-x-auto max-h-64 overflow-y-auto">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-gray-50">
                  <tr>
                    <th className="text-left py-2 px-2">Category</th>
                    <th className="text-left py-2 px-2">SKU</th>
                    <th className="text-left py-2 px-2">Product</th>
                    <th className="text-right py-2 px-2">Stock</th>
                    <th className="text-right py-2 px-2">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {/* A Items */}
                  {data.abcAnalysis?.aItems?.slice(0, 3).map((item: any, idx: number) => (
                    <tr key={`a-${idx}`} className="border-b bg-blue-50/30">
                      <td className="py-1 px-2">A</td>
                      <td className="py-1 px-2">{item.sku}</td>
                      <td className="py-1 px-2 truncate max-w-xs">{item.name}</td>
                      <td className="py-1 px-2 text-right">{item.currentStock}</td>
                      <td className="py-1 px-2 text-right">{formatCurrency(item.value)}</td>
                    </tr>
                  ))}
                  {/* B Items */}
                  {data.abcAnalysis?.bItems?.slice(0, 2).map((item: any, idx: number) => (
                    <tr key={`b-${idx}`} className="border-b bg-yellow-50/30">
                      <td className="py-1 px-2">B</td>
                      <td className="py-1 px-2">{item.sku}</td>
                      <td className="py-1 px-2 truncate max-w-xs">{item.name}</td>
                      <td className="py-1 px-2 text-right">{item.currentStock}</td>
                      <td className="py-1 px-2 text-right">{formatCurrency(item.value)}</td>
                    </tr>
                  ))}
                  {/* C Items */}
                  {data.abcAnalysis?.cItems?.slice(0, 2).map((item: any, idx: number) => (
                    <tr key={`c-${idx}`} className="border-b bg-green-50/30">
                      <td className="py-1 px-2">C</td>
                      <td className="py-1 px-2">{item.sku}</td>
                      <td className="py-1 px-2 truncate max-w-xs">{item.name}</td>
                      <td className="py-1 px-2 text-right">{item.currentStock}</td>
                      <td className="py-1 px-2 text-right">{formatCurrency(item.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Warehouse Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Stock by Warehouse</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart 
              data={data.warehouseDistribution}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="warehouse"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="stockValue" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Turnover Rate */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Inventory Turnover Rate</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.monthlyTurnover}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tickFormatter={(month) => {
                  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  return months[month - 1] || '';
                }}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(month) => {
                  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                  return months[month - 1] || '';
                }}
                formatter={(value: number) => [`${value.toFixed(2)}x`, 'Turnover Rate']}
              />
              <Line 
                type="monotone" 
                dataKey="turnoverRate" 
                stroke="#8884d8" 
                strokeWidth={2}
                dot={{ fill: '#8884d8' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Low Stock Alerts</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">SKU</th>
                  <th className="text-left py-2">Product</th>
                  <th className="text-right py-2">Stock</th>
                  <th className="text-right py-2">Reorder</th>
                  <th className="text-left py-2">Warehouse</th>
                </tr>
              </thead>
              <tbody>
                {data.lowStockAlerts.slice(0, 5).map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2 text-sm">{item.sku}</td>
                    <td className="py-2 text-sm">{item.name}</td>
                    <td className="py-2 text-sm text-right">{item.currentStock}</td>
                    <td className="py-2 text-sm text-right">{item.reorderPoint}</td>
                    <td className="py-2 text-sm">{item.warehouse}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Dead Stock */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Dead Stock (No Sales in 90+ Days)</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">SKU</th>
                <th className="text-left py-2">Product</th>
                <th className="text-right py-2">Stock</th>
                <th className="text-right py-2 pr-8">Value</th>
                <th className="text-left py-2 pl-8">Last Sold</th>
              </tr>
            </thead>
            <tbody>
              {data.deadStock.slice(0, 10).map((item, index) => (
                <tr key={index} className="border-b">
                  <td className="py-2 text-sm">{item.sku}</td>
                  <td className="py-2 text-sm">{item.name}</td>
                  <td className="py-2 text-sm text-right">{item.stock}</td>
                  <td className="py-2 text-sm text-right pr-8">{formatCurrency(item.value)}</td>
                  <td className="py-2 text-sm pl-8">{item.lastSoldDate ? new Date(item.lastSoldDate).toLocaleDateString() : 'Never sold'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
