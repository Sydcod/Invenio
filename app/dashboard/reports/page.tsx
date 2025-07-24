'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import { 
  ChartBarIcon,
  DocumentTextIcon,
  CubeIcon,
  CurrencyDollarIcon,
  ClipboardDocumentCheckIcon,
  ArrowTrendingUpIcon,
  ShoppingCartIcon,
  MagnifyingGlassIcon
} from "@heroicons/react/24/outline";

interface Report {
  id: string;
  name: string;
  category: string;
  description: string;
  exportFormats: string[];
}

const categoryIcons: Record<string, any> = {
  sales: ShoppingCartIcon,
  inventory: CubeIcon,
  receivables: CurrencyDollarIcon,
  payables: DocumentTextIcon,
  activity: ClipboardDocumentCheckIcon,
  analytics: ArrowTrendingUpIcon
};

const categoryDescriptions: Record<string, string> = {
  sales: 'Sales performance, customer insights, and revenue analysis',
  inventory: 'Stock levels, product movement, and warehouse management',
  receivables: 'Customer balances, invoices, and payment tracking',
  payables: 'Vendor balances, bills, and expense management',
  activity: 'System logs, user activity, and audit trails',
  analytics: 'Advanced analytics and business intelligence'
};

const categories = ['all', 'sales', 'inventory', 'receivables', 'payables', 'activity', 'analytics'];

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [groupedReports, setGroupedReports] = useState<Record<string, Report[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/reports');
      const data = await response.json();
      console.log('API Response:', data); // Debug log
      if (data.success && data.data) {
        setReports(data.data.reports || []);
        setGroupedReports(data.data.groupedReports || {});
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredGrouped = Object.entries(groupedReports).reduce((acc, [category, categoryReports]) => {
    if (selectedCategory !== 'all' && category !== selectedCategory) return acc;
    
    const filtered = categoryReports.filter(report => 
      report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    return acc;
  }, {} as Record<string, Report[]>);

  if (loading) {
    return (
      <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading reports...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="mt-2 text-sm text-gray-600">
            Access comprehensive reports and analytics for your business
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="search"
              placeholder="Search reports..."
              className="block w-full rounded-md border-0 py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`
                    whitespace-nowrap border-b-2 py-2 px-1 text-sm font-medium capitalize
                    ${selectedCategory === category
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }
                  `}
                >
                  {category === 'all' ? 'All Reports' : category}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Reports Grid */}
        <div className="space-y-8">
          {Object.entries(filteredGrouped).map(([category, categoryReports]) => {
            const Icon = categoryIcons[category] || ChartBarIcon;
            return (
              <div key={category}>
                {/* Category Header */}
                <div className="mb-4 flex items-center">
                  <Icon className="h-6 w-6 text-gray-400 mr-3" />
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 capitalize">{category}</h2>
                    <p className="text-sm text-gray-500">
                      {categoryDescriptions[category]}
                    </p>
                  </div>
                </div>
                
                {/* Reports Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {categoryReports.map((report) => (
                    <div
                      key={report.id}
                      className="relative rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="mb-4">
                        <h3 className="text-lg font-medium text-gray-900">{report.name}</h3>
                        <p className="mt-1 text-sm text-gray-500">{report.description}</p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex space-x-2">
                          {report.exportFormats.map((format) => (
                            <span
                              key={format}
                              className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600"
                            >
                              {format.toUpperCase()}
                            </span>
                          ))}
                        </div>
                        <Link
                          href={`/dashboard/reports/${category}/${report.id}`}
                          className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        >
                          View Report
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          
          {Object.keys(filteredGrouped).length === 0 && (
            <div className="text-center py-12">
              <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No reports found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'Try adjusting your search criteria' : 'No reports available in this category'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
