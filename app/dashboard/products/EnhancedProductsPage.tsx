'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronRightIcon,
  CubeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  ArchiveBoxIcon,
  XCircleIcon,
  ChartBarIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Product {
  _id: string;
  sku: string;
  name: string;
  description?: string;
  brand?: string;
  category?: {
    _id: string;
    name: string;
  };
  status: 'active' | 'draft' | 'discontinued';
  pricing: {
    price: number;
    compareAtPrice?: number;
    costPrice?: number;
  };
  inventory: {
    currentStock: number;
    reorderPoint: number;
    minQuantity: number;
    maxQuantity?: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalInventoryValue: number;
  categoriesCount: number;
  brandsCount: number;
}

export default function EnhancedProductsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    brand: 'all',
    stockStatus: 'all'
  });
  
  const [sortBy, setSortBy] = useState('name');
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);

  // Fetch products and stats
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch products
      const response = await fetch('/api/products?paginate=false');
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const productsData = await response.json();
      setProducts(productsData);
      
      // Extract unique categories and brands
      const uniqueCategories = Array.from(new Set(productsData
        .filter((p: Product) => p.category?.name)
        .map((p: Product) => p.category!.name))).sort() as string[];
      const uniqueBrands = Array.from(new Set(productsData
        .filter((p: Product) => p.brand)
        .map((p: Product) => p.brand!))).sort() as string[];
      
      setCategories(uniqueCategories);
      setBrands(uniqueBrands);
      
      // Calculate stats
      const activeProducts = productsData.filter((p: Product) => p.status === 'active');
      const lowStockProducts = productsData.filter((p: Product) => 
        p.inventory.currentStock > 0 && p.inventory.currentStock <= p.inventory.reorderPoint
      );
      const outOfStockProducts = productsData.filter((p: Product) => 
        p.inventory.currentStock === 0
      );
      
      const totalInventoryValue = productsData.reduce((sum: number, p: Product) => 
        sum + (p.pricing.price * p.inventory.currentStock), 0
      );

      setStats({
        totalProducts: productsData.length,
        activeProducts: activeProducts.length,
        lowStockProducts: lowStockProducts.length,
        outOfStockProducts: outOfStockProducts.length,
        totalInventoryValue,
        categoriesCount: uniqueCategories.length,
        brandsCount: uniqueBrands.length
      });
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load products data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter and sort products
  const filteredProducts = products.filter(product => {
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesSearch = 
        product.name.toLowerCase().includes(search) ||
        product.sku.toLowerCase().includes(search) ||
        product.description?.toLowerCase().includes(search) ||
        product.brand?.toLowerCase().includes(search) ||
        product.category?.name.toLowerCase().includes(search);
      
      if (!matchesSearch) return false;
    }

    // Status filter
    if (filters.status !== 'all' && product.status !== filters.status) {
      return false;
    }

    // Category filter
    if (filters.category !== 'all' && product.category?.name !== filters.category) {
      return false;
    }

    // Brand filter
    if (filters.brand !== 'all' && product.brand !== filters.brand) {
      return false;
    }

    // Stock status filter
    if (filters.stockStatus !== 'all') {
      const currentStock = product.inventory.currentStock;
      const reorderPoint = product.inventory.reorderPoint;
      
      if (filters.stockStatus === 'in-stock' && currentStock <= reorderPoint) return false;
      if (filters.stockStatus === 'low-stock' && (currentStock === 0 || currentStock > reorderPoint)) return false;
      if (filters.stockStatus === 'out-of-stock' && currentStock > 0) return false;
    }

    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'sku':
        return a.sku.localeCompare(b.sku);
      case 'price':
        return a.pricing.price - b.pricing.price;
      case 'stock':
        return b.inventory.currentStock - a.inventory.currentStock;
      case 'recent':
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      default:
        return 0;
    }
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center space-x-4">
          <li>
            <Link href="/dashboard" className="text-gray-700 hover:text-primary">
              Dashboard
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <ChevronRightIcon className="w-4 h-4 text-gray-400 mx-1" />
              <span className="text-gray-500">Products</span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Page header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your product inventory and pricing
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/dashboard/products/new"
            className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
          >
            <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
            Add Product
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CubeIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Products
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalProducts}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Products
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.activeProducts}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Low Stock
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.lowStockProducts}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyDollarIcon className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Inventory Value
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      ${stats.totalInventoryValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full rounded-md border-0 py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                placeholder="Search products by name, SKU, brand, or category..."
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          {/* Filter Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <FunnelIcon className="-ml-0.5 mr-1.5 h-4 w-4" />
              Filters
            </button>
            
            <button
              onClick={() => {
                setSearchTerm('');
                setFilters({
                  status: 'all',
                  category: 'all',
                  brand: 'all',
                  stockStatus: 'all'
                });
              }}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Clear All
            </button>
          </div>
        </div>
        
        {/* Filters Panel */}
        {showFilters && (
          <div className="border-t pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="discontinued">Discontinued</option>
                </select>
              </div>
              
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({...filters, category: e.target.value})}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              {/* Brand Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand
                </label>
                <select
                  value={filters.brand}
                  onChange={(e) => setFilters({...filters, brand: e.target.value})}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                >
                  <option value="all">All Brands</option>
                  {brands.map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>
              
              {/* Stock Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Status
                </label>
                <select
                  value={filters.stockStatus}
                  onChange={(e) => setFilters({...filters, stockStatus: e.target.value})}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                >
                  <option value="all">All Stock Levels</option>
                  <option value="in-stock">In Stock</option>
                  <option value="low-stock">Low Stock</option>
                  <option value="out-of-stock">Out of Stock</option>
                </select>
              </div>
            </div>
            
            {/* Sort By */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">
                  Sort By:
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                >
                  <option value="name">Name</option>
                  <option value="sku">SKU</option>
                  <option value="price">Price</option>
                  <option value="stock">Stock Level</option>
                  <option value="recent">Recently Updated</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Products Table */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-gray-500">
            {searchTerm || filters.status !== 'all' || filters.category !== 'all' || filters.brand !== 'all' || filters.stockStatus !== 'all' ? (
              <>
                <ArchiveBoxIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium">No products found</p>
                <p className="mt-1">Try adjusting your search or filters</p>
              </>
            ) : (
              <>
                <CubeIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium">No products yet</p>
                <p className="mt-1">Add your first product to get started</p>
                <Link
                  href="/dashboard/products/new"
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90"
                >
                  <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
                  Add Product
                </Link>
              </>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden xl:block bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-2 py-2 text-left text-sm font-semibold text-gray-900">
                    Product
                  </th>
                  <th className="px-2 py-2 text-left text-sm font-semibold text-gray-900">
                    SKU
                  </th>
                  <th className="px-2 py-2 text-left text-sm font-semibold text-gray-900">
                    Category
                  </th>
                  <th className="px-2 py-2 text-left text-sm font-semibold text-gray-900">
                    Stock
                  </th>
                  <th className="px-2 py-2 text-left text-sm font-semibold text-gray-900">
                    Price
                  </th>
                  <th className="px-2 py-2 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="relative py-2 pl-2 pr-2">
                    <span className="sr-only">Edit</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredProducts.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-2 py-2">
                      <div>
                        <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                          {product.name}
                        </div>
                        {product.brand && (
                          <div className="text-xs text-gray-500">{product.brand}</div>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-900">
                      {product.sku}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-900">
                      {product.category?.name || '-'}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-sm">
                      <div className={`font-medium ${
                        product.inventory.currentStock === 0
                          ? 'text-red-600'
                          : product.inventory.currentStock <= product.inventory.reorderPoint
                          ? 'text-yellow-600'
                          : 'text-gray-900'
                      }`}>
                        {product.inventory.currentStock}
                        {product.inventory.currentStock === 0 && (
                          <span className="ml-1 text-xs text-red-500">Out</span>
                        )}
                        {product.inventory.currentStock > 0 && product.inventory.currentStock <= product.inventory.reorderPoint && (
                          <span className="ml-1 text-xs text-yellow-500">Low</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        Min: {product.inventory.minQuantity}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-900">
                      ${product.pricing.price.toFixed(2)}
                      {product.pricing.compareAtPrice && product.pricing.compareAtPrice > product.pricing.price && (
                        <div className="text-xs text-gray-500 line-through">
                          ${product.pricing.compareAtPrice.toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        product.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : product.status === 'draft'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="relative whitespace-nowrap py-2 px-2 text-right text-sm font-medium">
                      <Link
                        href={`/dashboard/products/${product._id}`}
                        className="text-primary hover:text-primary/80"
                      >
                        Edit<span className="sr-only">, {product.name}</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Products Cards - Mobile/Tablet View */}
          <div className="xl:hidden space-y-4">
            <ul className="divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <li key={product._id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">
                          {product.name}
                        </h3>
                        {product.brand && (
                          <p className="text-sm text-gray-500">{product.brand}</p>
                        )}
                        <p className="text-sm text-gray-500 mt-1">SKU: {product.sku}</p>
                      </div>
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        product.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : product.status === 'draft'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Category</p>
                        <p className="font-medium">{product.category?.name || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Price</p>
                        <p className="font-medium">
                          ${product.pricing.price.toFixed(2)}
                          {product.pricing.compareAtPrice && product.pricing.compareAtPrice > product.pricing.price && (
                            <span className="text-xs text-gray-500 line-through ml-1">
                              ${product.pricing.compareAtPrice.toFixed(2)}
                            </span>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Stock</p>
                        <div className={`font-medium ${
                          product.inventory.currentStock === 0
                            ? 'text-red-600'
                            : product.inventory.currentStock <= product.inventory.reorderPoint
                            ? 'text-yellow-600'
                            : 'text-gray-900'
                        }`}>
                          {product.inventory.currentStock}
                          {product.inventory.currentStock === 0 && (
                            <span className="ml-1 text-xs text-red-500">Out</span>
                          )}
                          {product.inventory.currentStock > 0 && product.inventory.currentStock <= product.inventory.reorderPoint && (
                            <span className="ml-1 text-xs text-yellow-500">Low</span>
                          )}
                          <span className="text-xs text-gray-500 ml-1">(Min: {product.inventory.minQuantity})</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <Link
                        href={`/dashboard/products/${product._id}`}
                        className="text-primary hover:text-primary/80 text-sm font-medium"
                      >
                        Edit Product →
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
