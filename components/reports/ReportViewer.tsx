'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ArrowDownTrayIcon,
  FunnelIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpDownIcon,
  TableCellsIcon,
  DocumentTextIcon,
  PrinterIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { ReportConfig, ReportFilter } from '@/libs/reports/types';
import { MultiSelect } from '@/components/ui/multi-select';
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';

interface ReportViewerProps {
  reportConfig: ReportConfig;
  reportId: string;
  category: string;
}

export default function ReportViewer({ reportConfig, reportId, category }: ReportViewerProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [filtersInitialized, setFiltersInitialized] = useState(false);
  const [dynamicFilterOptions, setDynamicFilterOptions] = useState<Record<string, any[]>>({});
  const [sortColumn, setSortColumn] = useState(reportConfig.defaultSort?.column || '');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(
    reportConfig.defaultSort?.direction || 'desc'
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [summary, setSummary] = useState<Record<string, any>>({});
  const [showFilters, setShowFilters] = useState(true);
  const [exporting, setExporting] = useState(false);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize filters with defaults and load dynamic options
  useEffect(() => {
    const defaultFilters: Record<string, any> = {};
    const loadDynamicOptions = async () => {
      const dynamicOptions: Record<string, any[]> = {};
      
      for (const filter of reportConfig.filters) {
        if (filter.defaultValue !== undefined) {
          defaultFilters[filter.key] = filter.defaultValue;
        }
        
        // Load dynamic options for filters marked as dynamic
        if (filter.dynamic && filter.dynamicConfig) {
          try {
            console.log(`Loading dynamic options for ${filter.key}...`);
            // Use the new dynamic filters API endpoint
            const params = new URLSearchParams({
              type: filter.dynamicConfig.type,
              collection: filter.dynamicConfig.collection
            });
            
            const response = await fetch(`/api/reports/filters?${params}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include' // Include cookies for authentication
            });
            
            if (response.ok) {
              const options = await response.json();
              console.log(`Loaded ${filter.key} options:`, options);
              dynamicOptions[filter.key] = options;
            } else {
              console.error(`Failed to fetch ${filter.key} options:`, response.status, response.statusText);
              dynamicOptions[filter.key] = [];
            }
          } catch (error) {
            console.error(`Failed to load dynamic options for ${filter.key}:`, error);
            dynamicOptions[filter.key] = [];
          }
        }
      }
      
      setDynamicFilterOptions(dynamicOptions);
      setFilters(defaultFilters);
      setFiltersInitialized(true);
    };
    
    loadDynamicOptions();
  }, [reportConfig]);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      // Add pagination
      params.append('page', currentPage.toString());
      params.append('pageSize', pageSize.toString());
      
      // Add sort
      if (sortColumn) {
        params.append('sortBy', sortColumn);
        params.append('sortOrder', sortDirection);
      }
      
      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (key === 'dateRange' && value.startDate && value.endDate) {
            params.append(key, JSON.stringify(value));
          } else if (Array.isArray(value)) {
            params.append(key, value.join(','));
          } else {
            params.append(key, value.toString());
          }
        }
      });

      const response = await fetch(`/api/reports/${category}/${reportId.replace(`${category}-`, '')}?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
        setTotalPages(result.pagination.totalPages);
        setTotalRecords(result.pagination.totalRecords);
        if (result.summary) {
          setSummary(result.summary);
        }
      }
    } catch (error) {
      console.error('Failed to fetch report:', error);
    } finally {
      setLoading(false);
    }
  }, [category, reportId, currentPage, pageSize, sortColumn, sortDirection, filters]);

  useEffect(() => {
    // Only fetch report after filters have been initialized
    if (filtersInitialized) {
      // Clear any pending fetch
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      
      // Debounce the fetch to prevent rapid consecutive calls
      fetchTimeoutRef.current = setTimeout(() => {
        fetchReport();
      }, 300); // 300ms debounce
      
      return () => {
        if (fetchTimeoutRef.current) {
          clearTimeout(fetchTimeoutRef.current);
        }
      };
    }
  }, [fetchReport, filtersInitialized]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      params.append('export', format);
      
      // Add current filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (key === 'dateRange' && value.startDate && value.endDate) {
            params.append(key, JSON.stringify(value));
          } else if (Array.isArray(value)) {
            params.append(key, value.join(','));
          } else {
            params.append(key, value.toString());
          }
        }
      });

      const response = await fetch(`/api/reports/${category}/${reportId.replace(`${category}-`, '')}?${params}`);
      
      if (response.ok) {
        const blob = await response.blob();
        console.log(`Export ${format} - Blob size:`, blob.size, 'Type:', blob.type);
        
        // Check if we got an empty response
        if (blob.size === 0) {
          console.error(`Export ${format} failed: Empty response`);
          alert(`Export to ${format.toUpperCase()} failed: No data received`);
          return;
        }
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Add proper file extension based on format
        const fileExtensions: Record<string, string> = {
          csv: '.csv',
          excel: '.xlsx',
          pdf: '.pdf'
        };
        const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        a.download = `${reportConfig.name.toLowerCase().replace(/\s+/g, '_')}_${timestamp}${fileExtensions[format] || ''}`;
        
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // Handle non-OK responses
        const errorText = await response.text();
        console.error(`Export ${format} failed with status ${response.status}:`, errorText);
        alert(`Export to ${format.toUpperCase()} failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = async () => {
    // Fetch all data for printing
    setLoading(true);
    try {
      // Build params with large page size to get all records
      const params = new URLSearchParams();
      params.append('page', '1');
      params.append('pageSize', '10000'); // Get all records
      
      // Add current filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (key === 'dateRange' && value.startDate && value.endDate) {
            params.append(key, JSON.stringify(value));
          } else if (Array.isArray(value)) {
            params.append(key, value.join(','));
          } else {
            params.append(key, value.toString());
          }
        }
      });

      // Add sort parameters
      if (sortColumn) {
        params.append('sortBy', sortColumn);
        params.append('sortOrder', sortDirection);
      }

      const response = await fetch(`/api/reports/${category}/${reportId.replace(`${category}-`, '')}?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch data for printing');
      }

      const result = await response.json();
      const allData = result.data || [];
      const printSummary = result.summary || summary;
      const printTotalRecords = result.pagination?.totalRecords || allData.length;

      // Create a print-specific window with just the report content
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      // Build the print content
      const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${reportConfig.name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; margin-bottom: 10px; }
          .metadata { color: #666; font-size: 14px; margin-bottom: 20px; }
          .filters { background: #f5f5f5; padding: 10px; margin-bottom: 20px; border-radius: 4px; }
          .filters h3 { margin: 0 0 10px 0; font-size: 16px; }
          .filter-item { margin: 5px 0; }
          .summary { background: #e8f4f8; padding: 15px; margin-bottom: 20px; border-radius: 4px; }
          .summary h3 { margin: 0 0 10px 0; }
          .summary-item { display: inline-block; margin-right: 30px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #f0f0f0; padding: 10px; text-align: left; border: 1px solid #ddd; }
          td { padding: 8px; border: 1px solid #ddd; }
          tr:nth-child(even) { background: #f9f9f9; }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>${reportConfig.name}</h1>
        <div class="metadata">
          Generated on: ${new Date().toLocaleString()}<br>
          Total Records: ${printTotalRecords}
        </div>
        
        ${Object.keys(filters).some(key => filters[key]) ? `
          <div class="filters">
            <h3>Applied Filters:</h3>
            ${Object.entries(filters).map(([key, value]) => {
              if (!value) return '';
              const filter = reportConfig.filters.find(f => f.key === key);
              const label = filter?.label || key;
              return `<div class="filter-item"><strong>${label}:</strong> ${Array.isArray(value) ? value.join(', ') : value}</div>`;
            }).join('')}
          </div>
        ` : ''}
        
        ${Object.keys(printSummary).length > 0 ? `
          <div class="summary">
            <h3>Summary</h3>
            ${Object.entries(printSummary).map(([key, value]) => 
              `<div class="summary-item"><strong>${key}:</strong> ${value}</div>`
            ).join('')}
          </div>
        ` : ''}
        
        <table>
          <thead>
            <tr>
              ${reportConfig.columns
                .filter(col => col.exportable !== false)
                .map(col => `<th>${col.label}</th>`)
                .join('')}
            </tr>
          </thead>
          <tbody>
            ${allData.map(row => `
              <tr>
                ${reportConfig.columns
                  .filter(col => col.exportable !== false)
                  .map(col => {
                    const value = row[col.key];
                    const displayValue = value !== null && value !== undefined
                      ? (col.format ? col.format(value) : value)
                      : '';
                    return `<td>${displayValue}</td>`;
                  })
                  .join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.print();
      // Close the window after printing
      printWindow.onafterprint = () => {
        printWindow.close();
      };
    };
    } catch (error) {
      console.error('Print failed:', error);
      alert('Failed to prepare data for printing');
    } finally {
      setLoading(false);
    }
  };

  const renderFilterControl = (filter: ReportFilter) => {
    switch (filter.type) {
      case 'dateRange':
        return (
          <DatePickerWithRange
            value={filters[filter.key] || {}}
            onChange={(value) => handleFilterChange(filter.key, value)}
          />
        );
      case 'select':
        const options = filter.dynamic && dynamicFilterOptions[filter.key] 
          ? dynamicFilterOptions[filter.key] 
          : filter.options || [];
        return (
          <select
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            value={filters[filter.key] || ''}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
          >
            <option value="">All</option>
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      case 'multiSelect':
        const multiOptions = filter.dynamic && dynamicFilterOptions[filter.key] 
          ? dynamicFilterOptions[filter.key] 
          : filter.options || [];
        return (
          <MultiSelect
            options={multiOptions}
            value={filters[filter.key] || []}
            onChange={(values) => handleFilterChange(filter.key, values)}
            placeholder={`Select ${filter.label}...`}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder={filter.placeholder}
            value={filters[filter.key] || ''}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
          />
        );
      default:
        return (
          <input
            type="text"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder={filter.placeholder}
            value={filters[filter.key] || ''}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
          />
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-gray-900">{reportConfig.name}</h2>
              <p className="mt-1 text-sm text-gray-500">{reportConfig.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                {showFilters ? 'Hide' : 'Show'} Filters
              </button>
              <button
                type="button"
                onClick={fetchReport}
                disabled={loading}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <div className="relative inline-block text-left">
                <button
                  type="button"
                  disabled={exporting}
                  onClick={() => setExporting(!exporting)}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Export
                </button>
                {exporting && (
                  <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                    <div className="py-1" role="menu">
                      {reportConfig.exportFormats.includes('excel') && (
                        <button
                          onClick={() => { handleExport('excel'); setExporting(false); }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem"
                        >
                          <TableCellsIcon className="inline h-4 w-4 mr-2" />
                          Export to Excel
                        </button>
                      )}
                      {reportConfig.exportFormats.includes('csv') && (
                        <button
                          onClick={() => { handleExport('csv'); setExporting(false); }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem"
                        >
                          <DocumentTextIcon className="inline h-4 w-4 mr-2" />
                          Export to CSV
                        </button>
                      )}
                      {reportConfig.exportFormats.includes('pdf') && (
                        <button
                          onClick={() => { handleExport('pdf'); setExporting(false); }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem"
                        >
                          <DocumentTextIcon className="inline h-4 w-4 mr-2" />
                          Export to PDF
                        </button>
                      )}
                      <button
                        onClick={handlePrint}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem"
                      >
                        <PrinterIcon className="inline h-4 w-4 mr-2" />
                        Print
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-base font-medium text-gray-900">Filters</h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportConfig.filters.map(filter => (
                <div key={filter.key} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">{filter.label}</label>
                  {renderFilterControl(filter)}
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => fetchReport()}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <ArrowPathIcon className="-ml-1 mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <ArrowPathIcon className="-ml-1 mr-2 h-4 w-4" />
                    Generate Report
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      {Object.keys(summary).length > 0 && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-4 py-6 sm:p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(summary).slice(0, 4).map(([key, value]) => (
                <div key={key}>
                  <p className="text-sm text-gray-500 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                  <p className="text-2xl font-bold">
                    {typeof value === 'number' ? 
                      value.toLocaleString('en-US', { 
                        style: key.includes('revenue') || key.includes('value') ? 'currency' : 'decimal',
                        currency: 'USD',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2
                      }) : value
                    }
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-0">
          <div className="relative overflow-x-auto">
            {loading ? (
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 w-full bg-gray-200 animate-pulse rounded" />
                ))}
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {reportConfig.columns.map(column => (
                      <th
                        key={column.key}
                        className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.align === 'right' ? 'text-right' : ''} ${
                          column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                        }`}
                        onClick={() => column.sortable && handleSort(column.key)}
                      >
                        <div className="flex items-center gap-2">
                          {column.label}
                          {column.sortable && sortColumn === column.key && (
                            <ChevronUpDownIcon className="h-4 w-4" />
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      {reportConfig.columns.map(column => (
                        <td
                          key={column.key}
                          className={`px-6 py-4 text-sm text-gray-900 ${
                            column.align === 'right' ? 'text-right' : ''
                          } ${
                            column.type === 'string' ? 'whitespace-nowrap' : ''
                          }`}
                        >
                          {column.format
                            ? column.format(row[column.key])
                            : row[column.key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * pageSize) + 1} to{' '}
              {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} records
            </div>
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={currentPage}
                  onChange={(e) => {
                    const page = parseInt(e.target.value);
                    if (page > 0 && page <= totalPages) {
                      setCurrentPage(page);
                    }
                  }}
                  className="w-16 px-2 py-1 text-sm text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  min={1}
                  max={totalPages}
                />
                <span className="text-sm text-gray-500">of {totalPages}</span>
              </div>
              <button
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
              <select
                value={pageSize.toString()}
                onChange={(e) => {
                  setPageSize(parseInt(e.target.value));
                  setCurrentPage(1);
                }}
                className="w-24 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="200">200</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
