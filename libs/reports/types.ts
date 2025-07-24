// Report System Type Definitions

export interface ReportColumn {
  key: string;
  label: string;
  type: 'string' | 'number' | 'currency' | 'percentage' | 'date' | 'boolean';
  width?: string;
  align?: 'left' | 'center' | 'right';
  format?: (value: any) => string;
  sortable?: boolean;
  exportable?: boolean;
}

export interface ReportFilter {
  key: string;
  label: string;
  type: 'dateRange' | 'select' | 'multiSelect' | 'search' | 'number' | 'numberRange' | 'boolean';
  options?: Array<{ value: string; label: string }>;
  defaultValue?: any;
  required?: boolean;
  placeholder?: string;
  dynamic?: boolean; // Indicates filter options should be loaded dynamically
  dynamicConfig?: {
    type: string; // Type of dynamic filter (e.g., 'category', 'brand', 'warehouse')
    collection: string; // MongoDB collection to query
  };
}

export interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

export interface PaginationConfig {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ReportParams {
  filters: Record<string, any>;
  pagination: {
    page: number;
    pageSize: number;
  };
  sort?: SortConfig;
  export?: 'pdf' | 'excel' | 'csv';
}

export interface ReportConfig {
  id: string;
  name: string;
  category: 'sales' | 'inventory' | 'receivables' | 'payables' | 'activity';
  description: string;
  requiredCollections: string[];
  columns: ReportColumn[];
  filters: ReportFilter[];
  defaultSort?: SortConfig;
  exportFormats: ('pdf' | 'excel' | 'csv')[];
  aggregationPipeline: (params: ReportParams) => any[];
  postProcess?: (data: any[]) => any[];
  summary?: (data: any[]) => Record<string, any>;
}

export interface ReportResponse {
  success: boolean;
  data?: {
    results: any[];
    pagination: PaginationConfig;
    summary?: Record<string, any>;
    metadata: {
      generatedAt: string;
      executionTime: number;
      cached: boolean;
      reportId: string;
      reportName: string;
    };
  };
  error?: string;
}

export interface ReportExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  includeHeaders: boolean;
  includeFilters: boolean;
  includeSummary: boolean;
  filename?: string;
}

export interface ReportSchedule {
  id: string;
  reportId: string;
  userId: string;
  name: string;
  schedule: string; // Cron expression
  recipients: string[];
  format: 'pdf' | 'excel';
  filters: Record<string, any>;
  active: boolean;
  lastRun?: Date;
  nextRun?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportCache {
  key: string;
  data: any;
  expiresAt: Date;
  metadata: {
    reportId: string;
    params: ReportParams;
    userId?: string;
  };
}

// Common filter types for reuse
export const CommonFilters = {
  dateRange: (key: string = 'dateRange'): ReportFilter => ({
    key,
    label: 'Date Range',
    type: 'dateRange',
    defaultValue: {
      startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
      endDate: new Date().toISOString()
    }
  }),
  
  status: (options: string[]): ReportFilter => ({
    key: 'status',
    label: 'Status',
    type: 'multiSelect',
    options: options.map(opt => ({ value: opt, label: opt }))
  }),
  
  search: (placeholder: string = 'Search...'): ReportFilter => ({
    key: 'search',
    label: 'Search',
    type: 'search',
    placeholder
  })
};

// Currency formatter
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
};

// Percentage formatter
export const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(2)}%`;
};

// Date formatter
export const formatDate = (value: string | Date): string => {
  const date = new Date(value);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};
