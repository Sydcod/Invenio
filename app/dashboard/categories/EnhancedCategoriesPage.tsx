'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import Link from 'next/link';
import { 
  PlusIcon, 
  FolderIcon, 
  FolderOpenIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  TagIcon,
  CubeIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  Square3Stack3DIcon
} from '@heroicons/react/24/outline';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '@/components/LoadingSpinner';

// Category icon mapping
const getCategoryIcon = (name: string, level: number) => {
  const n = name.toLowerCase();
  if (n.includes('laptop') || n.includes('computer')) return '💻';
  if (n.includes('phone') || n.includes('mobile')) return '📱';
  if (n.includes('tablet')) return '📱';
  if (n.includes('tv') || n.includes('television')) return '📺';
  if (n.includes('audio') || n.includes('speaker')) return '🔊';
  if (n.includes('gaming') || n.includes('console')) return '🎮';
  if (n.includes('accessory')) return '🎧';
  if (n.includes('camera')) return '📷';
  if (n.includes('storage')) return '💾';
  if (n.includes('network')) return '📡';
  if (n.includes('smart')) return '🏠';
  if (n.includes('wearable')) return '⌚';
  if (level === 0) return '📦';
  if (level === 1) return '📁';
  return '📄';
};

// Color classes for levels
const getLevelColor = (level: number) => {
  const colors = [
    'bg-purple-50 text-purple-700 border-purple-200',
    'bg-blue-50 text-blue-700 border-blue-200',
    'bg-green-50 text-green-700 border-green-200',
    'bg-yellow-50 text-yellow-700 border-yellow-200'
  ];
  return colors[level % colors.length];
};

interface Category {
  _id: string;
  name: string;
  code: string;
  description?: string;
  level: number;
  path: string;
  parentId?: string;
  isActive: boolean;
  productCount?: number;
  children: Category[];
}

interface CategoryStats {
  totalCategories: number;
  activeCategories: number;
  categoriesWithProducts: number;
  emptyCategoriesCount: number;
  parentCategories: number;
  topCategories: Array<{ id: string; name: string; productCount: number }>;
  emptyCategories: Array<{ id: string; name: string }>;
}

function CategoryRow({ 
  category, 
  level = 0,
  isExpanded,
  onToggle 
}: { 
  category: Category; 
  level?: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const hasChildren = category.children && category.children.length > 0;
  const icon = getCategoryIcon(category.name, level);
  const levelColor = getLevelColor(level);
  
  return (
    <div className="group">
      <div 
        className={`
          flex items-center px-4 py-3 hover:bg-gray-50 transition-colors
          ${level === 0 ? 'border-t border-gray-200' : ''}
        `}
      >
        <div className="flex items-center flex-1" style={{ paddingLeft: `${level * 1.5}rem` }}>
          {hasChildren && (
            <button
              onClick={onToggle}
              className="mr-2 p-1 hover:bg-gray-200 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDownIcon className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronRightIcon className="h-4 w-4 text-gray-600" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-8" />}
          
          <span className="text-2xl mr-3">{icon}</span>
          
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <span className="font-medium text-gray-900">{category.name}</span>
              <span className={`px-2 py-0.5 text-xs rounded-full border ${levelColor}`}>
                Level {level}
              </span>
              <span className="text-xs text-gray-500">{category.code}</span>
            </div>
            {category.description && (
              <p className="text-sm text-gray-500 mt-0.5">{category.description}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{category.productCount || 0}</span>
            <span className="text-gray-400 ml-1">products</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 text-xs rounded ${
              category.isActive 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-700'
            }`}>
              {category.isActive ? 'Active' : 'Inactive'}
            </span>
            
            <Link
              href={`/dashboard/categories/${category._id}`}
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              Edit
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryTree({ categories, expandedIds, onToggle }: { 
  categories: Category[]; 
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  const renderCategory = (category: Category, level: number = 0) => {
    const isExpanded = expandedIds.has(category._id);
    
    return (
      <Fragment key={category._id}>
        <CategoryRow 
          category={category} 
          level={level}
          isExpanded={isExpanded}
          onToggle={() => onToggle(category._id)}
        />
        {isExpanded && category.children?.map(child => 
          renderCategory(child, level + 1)
        )}
      </Fragment>
    );
  };
  
  return (
    <div className="bg-white rounded-lg shadow">
      {categories.map(category => renderCategory(category))}
    </div>
  );
}

export default function EnhancedCategoriesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<CategoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    hasProducts: 'all',
    level: 'all'
  });
  const [sortBy, setSortBy] = useState('name');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // Check authentication
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
    }
  }, [session, status, router]);

  // Fetch categories and stats
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch categories with hierarchy
      const catResponse = await fetch('/api/categories?hierarchy=true');
      if (!catResponse.ok) throw new Error('Failed to fetch categories');
      const catData = await catResponse.json();
      
      // Fetch stats
      const statsResponse = await fetch('/api/categories/stats');
      if (!statsResponse.ok) throw new Error('Failed to fetch stats');
      const statsData = await statsResponse.json();
      
      setCategories(catData.data || []);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session, fetchData]);

  // Filter and sort categories
  useEffect(() => {
    let filtered = [...categories];
    
    // Apply filters
    const filterRecursive = (cats: Category[]): Category[] => {
      return cats.reduce((acc, cat) => {
        let include = true;
        
        // Search filter
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          include = cat.name.toLowerCase().includes(searchLower) ||
                   cat.code.toLowerCase().includes(searchLower) ||
                   (cat.description?.toLowerCase() || '').includes(searchLower);
        }
        
        // Status filter
        if (include && filters.status !== 'all') {
          include = filters.status === 'active' ? cat.isActive : !cat.isActive;
        }
        
        // Has products filter
        if (include && filters.hasProducts !== 'all') {
          include = filters.hasProducts === 'yes' 
            ? (cat.productCount || 0) > 0 
            : (cat.productCount || 0) === 0;
        }
        
        // Level filter
        if (include && filters.level !== 'all') {
          include = cat.level === parseInt(filters.level);
        }
        
        // Check children
        const filteredChildren = cat.children ? filterRecursive(cat.children) : [];
        
        if (include || filteredChildren.length > 0) {
          acc.push({
            ...cat,
            children: filteredChildren
          });
        }
        
        return acc;
      }, [] as Category[]);
    };
    
    filtered = filterRecursive(filtered);
    
    // Sort categories
    const sortRecursive = (cats: Category[]): Category[] => {
      return cats.sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'products':
            return (b.productCount || 0) - (a.productCount || 0);
          case 'recent':
            return 0; // Would need updatedAt field
          default:
            return 0;
        }
      }).map(cat => ({
        ...cat,
        children: cat.children ? sortRecursive(cat.children) : []
      }));
    };
    
    filtered = sortRecursive(filtered);
    setFilteredCategories(filtered);
  }, [categories, searchTerm, filters, sortBy]);

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    const allIds = new Set<string>();
    const collectIds = (cats: Category[]) => {
      cats.forEach(cat => {
        if (cat.children && cat.children.length > 0) {
          allIds.add(cat._id);
          collectIds(cat.children);
        }
      });
    };
    collectIds(filteredCategories);
    setExpandedIds(allIds);
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <nav className="flex mb-4" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link href="/dashboard" className="text-gray-700 hover:text-primary">
              Dashboard
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <ChevronRightIcon className="w-4 h-4 text-gray-400 mx-1" />
              <span className="text-gray-500">Categories</span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Page header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="mt-1 text-sm text-gray-500">
            Organize your products into categories
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/dashboard/categories/new"
            className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
          >
            <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
            Add Category
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
                  <Square3Stack3DIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Categories
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalCategories}
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
                  <CubeIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      With Products
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.categoriesWithProducts}
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
                      Empty Categories
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.emptyCategoriesCount}
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
                      Parent Categories
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.parentCategories}
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
                placeholder="Search categories by name, code, or description..."
              />
            </div>
          </div>
          
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filters
          </button>
          
          {/* Tree Controls */}
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Collapse All
            </button>
          </div>
        </div>
        
        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
                </select>
              </div>
              
              {/* Products Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Has Products
                </label>
                <select
                  value={filters.hasProducts}
                  onChange={(e) => setFilters({...filters, hasProducts: e.target.value})}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                >
                  <option value="all">All</option>
                  <option value="yes">With Products</option>
                  <option value="no">Empty</option>
                </select>
              </div>
              
              {/* Level Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Level
                </label>
                <select
                  value={filters.level}
                  onChange={(e) => setFilters({...filters, level: e.target.value})}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                >
                  <option value="all">All Levels</option>
                  <option value="0">Root (Level 0)</option>
                  <option value="1">Level 1</option>
                  <option value="2">Level 2</option>
                  <option value="3">Level 3+</option>
                </select>
              </div>
              
              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                >
                  <option value="name">Name</option>
                  <option value="products">Product Count</option>
                  <option value="recent">Recently Updated</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Categories Tree */}
      {filteredCategories.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-gray-500">
            {searchTerm || filters.status !== 'all' || filters.hasProducts !== 'all' || filters.level !== 'all' ? (
              <>
                <p className="text-lg font-medium">No categories found</p>
                <p className="mt-1">Try adjusting your search or filters</p>
              </>
            ) : (
              <>
                <p className="text-lg font-medium">No categories yet</p>
                <p className="mt-1">Create your first category to organize products</p>
                <Link
                  href="/dashboard/categories/new"
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90"
                >
                  <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
                  Create Category
                </Link>
              </>
            )}
          </div>
        </div>
      ) : (
        <CategoryTree 
          categories={filteredCategories} 
          expandedIds={expandedIds}
          onToggle={toggleExpanded}
        />
      )}
    </div>
  );
}
