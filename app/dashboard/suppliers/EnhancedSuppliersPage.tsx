'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronRightIcon,
  BuildingOfficeIcon,
  CheckBadgeIcon,
  StarIcon,
  ChartBarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Supplier {
  _id: string;
  code: string;
  name: string;
  type: 'manufacturer' | 'distributor' | 'wholesaler' | 'retailer' | 'dropshipper';
  status: 'active' | 'inactive' | 'pending' | 'blocked';
  contact: {
    companyName?: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    primaryContact?: {
      name?: string;
      email?: string;
      phone?: string;
      position?: string;
    };
    website?: string;
  };
  performance: {
    rating: number;
    onTimeDeliveryRate: number;
    qualityScore: number;
    responseTime: number;
    totalOrders: number;
    returnRate: number;
  };
  isPreferred: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SupplierStats {
  totalSuppliers: number;
  activeSuppliers: number;
  preferredSuppliers: number;
  highPerformingSuppliers: number;
  suppliersByType: Array<{ type: string; count: number }>;
  topSuppliers: Array<{ id: string; name: string; rating: number }>;
}

export default function EnhancedSuppliersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stats, setStats] = useState<SupplierStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    isPreferred: 'all',
    performanceRating: 'all'
  });
  
  const [sortBy, setSortBy] = useState('name');

  // Fetch suppliers and stats
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch suppliers
      const suppliersResponse = await fetch('/api/suppliers');
      if (!suppliersResponse.ok) {
        throw new Error('Failed to fetch suppliers');
      }
      const suppliersData = await suppliersResponse.json();
      setSuppliers(suppliersData);
      
      // Calculate stats
      const activeSuppliers = suppliersData.filter((s: Supplier) => s.status === 'active');
      const preferredSuppliers = suppliersData.filter((s: Supplier) => s.isPreferred);
      const highPerformingSuppliers = suppliersData.filter((s: Supplier) => s.performance?.rating >= 4.0);
      
      const suppliersByType = ['manufacturer', 'distributor', 'wholesaler', 'retailer', 'dropshipper'].map(type => ({
        type,
        count: suppliersData.filter((s: Supplier) => s.type === type).length
      }));
      
      const topSuppliers = suppliersData
        .filter((s: Supplier) => s.performance?.rating)
        .sort((a: Supplier, b: Supplier) => b.performance.rating - a.performance.rating)
        .slice(0, 5)
        .map((s: Supplier) => ({
          id: s._id,
          name: s.name,
          rating: s.performance.rating
        }));

      setStats({
        totalSuppliers: suppliersData.length,
        activeSuppliers: activeSuppliers.length,
        preferredSuppliers: preferredSuppliers.length,
        highPerformingSuppliers: highPerformingSuppliers.length,
        suppliersByType,
        topSuppliers
      });
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load suppliers data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter and sort suppliers
  const filteredSuppliers = suppliers.filter(supplier => {
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesSearch = 
        supplier.name.toLowerCase().includes(search) ||
        supplier.code.toLowerCase().includes(search) ||
        supplier.contact?.email?.toLowerCase().includes(search) ||
        supplier.contact?.phone?.includes(search) ||
        supplier.contact?.primaryContact?.name?.toLowerCase().includes(search) ||
        supplier.contact?.primaryContact?.email?.toLowerCase().includes(search) ||
        supplier.contact?.primaryContact?.phone?.includes(search);
      
      if (!matchesSearch) return false;
    }

    // Status filter
    if (filters.status !== 'all' && supplier.status !== filters.status) {
      return false;
    }

    // Type filter
    if (filters.type !== 'all' && supplier.type !== filters.type) {
      return false;
    }

    // Preferred filter
    if (filters.isPreferred !== 'all') {
      if (filters.isPreferred === 'yes' && !supplier.isPreferred) return false;
      if (filters.isPreferred === 'no' && supplier.isPreferred) return false;
    }

    // Performance rating filter
    if (filters.performanceRating !== 'all') {
      const rating = supplier.performance?.rating || 0;
      if (filters.performanceRating === 'high' && rating < 4.0) return false;
      if (filters.performanceRating === 'medium' && (rating < 3.0 || rating >= 4.0)) return false;
      if (filters.performanceRating === 'low' && rating >= 3.0) return false;
    }

    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'rating':
        return (b.performance?.rating || 0) - (a.performance?.rating || 0);
      case 'recent':
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      case 'orders':
        return (b.performance?.totalOrders || 0) - (a.performance?.totalOrders || 0);
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
              <span className="text-gray-500">Suppliers</span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Page header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your suppliers and vendor relationships
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/dashboard/suppliers/new"
            className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
          >
            <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
            Add Supplier
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
                  <BuildingOfficeIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Suppliers
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalSuppliers}
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
                  <CheckBadgeIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Suppliers
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.activeSuppliers}
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
                  <StarIcon className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Preferred Suppliers
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.preferredSuppliers}
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
                  <ChartBarIcon className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      High Performing
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.highPerformingSuppliers}
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
                placeholder="Search suppliers by name, code, email, or phone..."
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
                  type: 'all',
                  isPreferred: 'all',
                  performanceRating: 'all'
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
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
              
              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier Type
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({...filters, type: e.target.value})}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="manufacturer">Manufacturer</option>
                  <option value="distributor">Distributor</option>
                  <option value="wholesaler">Wholesaler</option>
                  <option value="retailer">Retailer</option>
                  <option value="dropshipper">Dropshipper</option>
                </select>
              </div>
              
              {/* Preferred Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Status
                </label>
                <select
                  value={filters.isPreferred}
                  onChange={(e) => setFilters({...filters, isPreferred: e.target.value})}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                >
                  <option value="all">All</option>
                  <option value="yes">Preferred</option>
                  <option value="no">Not Preferred</option>
                </select>
              </div>
              
              {/* Performance Rating Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Performance Rating
                </label>
                <select
                  value={filters.performanceRating}
                  onChange={(e) => setFilters({...filters, performanceRating: e.target.value})}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                >
                  <option value="all">All Ratings</option>
                  <option value="high">High (4.0+)</option>
                  <option value="medium">Medium (3.0-3.9)</option>
                  <option value="low">Low (&lt;3.0)</option>
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
                  <option value="rating">Performance Rating</option>
                  <option value="orders">Total Orders</option>
                  <option value="recent">Recently Updated</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Suppliers Table */}
      {filteredSuppliers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-gray-500">
            {searchTerm || filters.status !== 'all' || filters.type !== 'all' || filters.isPreferred !== 'all' || filters.performanceRating !== 'all' ? (
              <>
                <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium">No suppliers found</p>
                <p className="mt-1">Try adjusting your search or filters</p>
              </>
            ) : (
              <>
                <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium">No suppliers yet</p>
                <p className="mt-1">Add your first supplier to get started</p>
                <Link
                  href="/dashboard/suppliers/new"
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90"
                >
                  <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
                  Add Supplier
                </Link>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Supplier
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Contact
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Type
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Performance
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">Edit</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredSuppliers.map((supplier) => (
                  <tr key={supplier._id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-3 py-4">
                      <div className="flex items-center">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-gray-900">
                              {supplier.name}
                            </div>
                            {supplier.isPreferred && (
                              <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{supplier.code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="text-sm text-gray-900">
                        {supplier.contact?.primaryContact?.name || supplier.contact?.contactPerson || '-'}
                      </div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {supplier.contact?.primaryContact?.email || supplier.contact?.email || '-'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {supplier.contact?.primaryContact?.phone || supplier.contact?.phone || '-'}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        supplier.type === 'manufacturer'
                          ? 'bg-purple-100 text-purple-800'
                          : supplier.type === 'distributor'
                          ? 'bg-blue-100 text-blue-800'
                          : supplier.type === 'wholesaler'
                          ? 'bg-green-100 text-green-800'
                          : supplier.type === 'retailer'
                          ? 'bg-orange-100 text-orange-800'
                          : supplier.type === 'dropshipper'
                          ? 'bg-pink-100 text-pink-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {supplier.type}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {supplier.performance?.onTimeDeliveryRate 
                            ? `${supplier.performance.onTimeDeliveryRate.toFixed(2)}% on-time`
                            : '-'}
                        </div>
                        {supplier.performance?.rating && (
                          <div className="text-gray-500">
                            Rating: {supplier.performance.rating.toFixed(2)}/5
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        supplier.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : supplier.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : supplier.status === 'blocked'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {supplier.status}
                      </span>
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <Link
                        href={`/dashboard/suppliers/${supplier._id}`}
                        className="text-primary hover:text-primary/80"
                      >
                        Edit<span className="sr-only">, {supplier.name}</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
