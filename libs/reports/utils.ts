import { ReportFilter, ReportParams } from './types';

// Date utilities
export const getDateRangeFilter = (params: ReportParams): { startDate: Date; endDate: Date } => {
  const dateRange = params.filters.dateRange || {};
  
  // Default to last 30 days if not specified
  const endDate = dateRange.endDate ? new Date(dateRange.endDate) : new Date();
  const startDate = dateRange.startDate 
    ? new Date(dateRange.startDate) 
    : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  // Set time to start and end of day
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);
  
  return { startDate, endDate };
};

// MongoDB aggregation helpers
export const buildMatchStage = (filters: Record<string, any>): any => {
  const match: Record<string, any> = {};
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    
    // Handle different filter types
    if (key === 'dateRange') {
      // Skip, handled separately
    } else if (Array.isArray(value) && value.length > 0) {
      match[key] = { $in: value };
    } else if (typeof value === 'string' && key.includes('search')) {
      // Handle search fields with regex
      match[key] = { $regex: value, $options: 'i' };
    } else {
      match[key] = value;
    }
  });
  
  return Object.keys(match).length > 0 ? { $match: match } : null;
};

// Pagination helpers
export const calculateSkipLimit = (page: number, pageSize: number) => {
  const skip = (page - 1) * pageSize;
  return { skip, limit: pageSize };
};

// Format helpers
export const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
};

export const formatPercentage = (value: number | null | undefined, decimals: number = 2): string => {
  if (value === null || value === undefined) return '0%';
  return `${(value * 100).toFixed(decimals)}%`;
};

export const formatNumber = (value: number | null | undefined, decimals: number = 0): string => {
  if (value === null || value === undefined) return '0';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
};

export const formatDate = (value: string | Date | null | undefined): string => {
  if (!value) return '';
  const date = new Date(value);
  if (isNaN(date.getTime())) return '';
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

export const formatDateTime = (value: string | Date | null | undefined): string => {
  if (!value) return '';
  const date = new Date(value);
  if (isNaN(date.getTime())) return '';
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// Aggregation helpers
export const addSortStage = (sort?: { column: string; direction: 'asc' | 'desc' }): any => {
  if (!sort) return null;
  
  const sortOrder = sort.direction === 'asc' ? 1 : -1;
  return { $sort: { [sort.column]: sortOrder } };
};

export const addLookupStage = (from: string, localField: string, foreignField: string, as: string): any => {
  return {
    $lookup: {
      from,
      localField,
      foreignField,
      as
    }
  };
};

// Summary calculation helpers
export const calculateSummary = (data: any[], fields: string[]): Record<string, number> => {
  const summary: Record<string, number> = {};
  
  fields.forEach(field => {
    summary[field] = data.reduce((sum, item) => {
      const value = item[field];
      return sum + (typeof value === 'number' ? value : 0);
    }, 0);
  });
  
  summary.count = data.length;
  summary.average = summary.count > 0 ? summary.total / summary.count : 0;
  
  return summary;
};

// Export filename generator
export const generateExportFilename = (reportName: string, format: string): string => {
  const timestamp = new Date().toISOString().split('T')[0];
  const cleanName = reportName.toLowerCase().replace(/\s+/g, '_');
  return `${cleanName}_${timestamp}.${format}`;
};

// Filter validation
export const validateFilters = (filters: Record<string, any>, filterConfigs: ReportFilter[]): string[] => {
  const errors: string[] = [];
  
  filterConfigs.forEach(config => {
    const value = filters[config.key];
    
    // Check required filters
    if (config.required && (value === undefined || value === null || value === '')) {
      errors.push(`${config.label} is required`);
    }
    
    // Validate filter types
    if (value !== undefined && value !== null) {
      switch (config.type) {
        case 'dateRange':
          if (!value.startDate || !value.endDate) {
            errors.push(`${config.label} must have both start and end dates`);
          }
          break;
        case 'number':
          if (typeof value !== 'number') {
            errors.push(`${config.label} must be a number`);
          }
          break;
        case 'select':
          if (config.options && !config.options.some(opt => opt.value === value)) {
            errors.push(`${config.label} has an invalid value`);
          }
          break;
      }
    }
  });
  
  return errors;
};

// Safe division helper
export const safeDivide = (numerator: number, denominator: number, defaultValue: number = 0): number => {
  if (denominator === 0 || isNaN(denominator) || isNaN(numerator)) {
    return defaultValue;
  }
  return numerator / denominator;
};

// Group data by field
export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
};
