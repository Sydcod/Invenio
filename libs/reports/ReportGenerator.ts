import { Db, MongoClient } from 'mongodb';
import { ReportConfig, ReportParams, ReportResponse, PaginationConfig } from './types';
import { getDatabase } from './mongodb';
import crypto from 'crypto';

export class ReportGenerator {
  private db: Db | null = null;
  private cacheEnabled: boolean = true;
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes

  constructor(cacheEnabled: boolean = true) {
    this.cacheEnabled = cacheEnabled;
  }

  private async getDb(): Promise<Db> {
    if (!this.db) {
      this.db = await getDatabase();
    }
    return this.db;
  }

  private generateCacheKey(reportId: string, params: ReportParams): string {
    const paramString = JSON.stringify({
      filters: params.filters,
      sort: params.sort,
      pagination: params.pagination
    });
    return `report:${reportId}:${crypto.createHash('md5').update(paramString).digest('hex')}`;
  }

  async generateReport(config: ReportConfig, params: ReportParams): Promise<ReportResponse> {
    const startTime = Date.now();
    
    try {
      // Validate parameters
      this.validateParams(config, params);

      // Check cache if enabled
      const cacheKey = this.generateCacheKey(config.id, params);
      if (this.cacheEnabled && !params.export) {
        const cachedData = await this.getCachedReport(cacheKey);
        if (cachedData) {
          return {
            success: true,
            data: {
              ...cachedData,
              metadata: {
                ...cachedData.metadata,
                cached: true,
                executionTime: Date.now() - startTime
              }
            }
          };
        }
      }

      const db = await this.getDb();

      // Build aggregation pipeline
      const pipeline = config.aggregationPipeline(params);
      
      // Debug: Log the pipeline and params
      console.log('Report params:', JSON.stringify(params, null, 2));
      console.log('Aggregation pipeline:', JSON.stringify(pipeline, null, 2));

      // Add pagination stages
      const paginatedPipeline = this.addPaginationToPipeline(pipeline, params.pagination);

      // Execute aggregation
      const [results, countResult] = await Promise.all([
        db.collection(config.requiredCollections[0])
          .aggregate(paginatedPipeline.dataPipeline)
          .toArray(),
        db.collection(config.requiredCollections[0])
          .aggregate(paginatedPipeline.countPipeline)
          .toArray()
      ]);

      // Post-process results if needed
      let processedResults = results;
      if (config.postProcess) {
        processedResults = config.postProcess(results);
      }

      // Calculate summary if defined
      let summary;
      if (config.summary) {
        summary = config.summary(processedResults);
      }

      // Calculate pagination
      const total = countResult[0]?.total || 0;
      const pagination: PaginationConfig = {
        page: params.pagination.page,
        pageSize: params.pagination.pageSize,
        total,
        totalPages: Math.ceil(total / params.pagination.pageSize)
      };

      const responseData = {
        results: processedResults,
        pagination,
        summary,
        metadata: {
          generatedAt: new Date().toISOString(),
          executionTime: Date.now() - startTime,
          cached: false,
          reportId: config.id,
          reportName: config.name
        }
      };

      // Cache the result if enabled
      if (this.cacheEnabled && !params.export) {
        await this.cacheReport(cacheKey, responseData);
      }

      return {
        success: true,
        data: responseData
      };

    } catch (error) {
      console.error('Report generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private validateParams(config: ReportConfig, params: ReportParams): void {
    // Validate required filters
    config.filters.forEach(filter => {
      if (filter.required && !params.filters[filter.key]) {
        throw new Error(`Required filter '${filter.label}' is missing`);
      }
    });

    // Validate pagination
    if (params.pagination.page < 1) {
      throw new Error('Page number must be greater than 0');
    }
    if (params.pagination.pageSize < 1 || params.pagination.pageSize > 200) {
      throw new Error('Page size must be between 1 and 200');
    }

    // Validate sort column if provided
    if (params.sort) {
      const validColumn = config.columns.find(col => col.key === params.sort!.column);
      if (!validColumn || validColumn.sortable === false) {
        throw new Error(`Invalid sort column: ${params.sort.column}`);
      }
    }
  }

  private addPaginationToPipeline(pipeline: any[], pagination: { page: number; pageSize: number }) {
    const skip = (pagination.page - 1) * pagination.pageSize;
    
    // Create data pipeline with pagination
    const dataPipeline = [
      ...pipeline,
      { $skip: skip },
      { $limit: pagination.pageSize }
    ];

    // Create count pipeline
    const countPipeline = [
      ...pipeline,
      { $count: 'total' }
    ];

    return { dataPipeline, countPipeline };
  }

  private async getCachedReport(key: string): Promise<any | null> {
    // In a real implementation, this would use Redis or another cache store
    // For now, we'll return null to skip caching
    return null;
  }

  private async cacheReport(key: string, data: any): Promise<void> {
    // In a real implementation, this would store in Redis
    // For now, we'll skip caching
    return;
  }

  // Export handler methods
  async exportReport(config: ReportConfig, params: ReportParams): Promise<Buffer | null> {
    try {
      // Remove pagination for exports
      const exportParams = {
        ...params,
        pagination: { page: 1, pageSize: 10000 } // Export all records
      };

      const report = await this.generateReport(config, exportParams);
      
      if (!report.success || !report.data) {
        throw new Error(report.error || 'Failed to generate report');
      }

      switch (params.export) {
        case 'csv':
          return this.exportToCSV(config, report.data.results);
        case 'excel':
          return this.exportToExcel(config, report.data.results, report.data.summary);
        case 'pdf':
          return this.exportToPDF(config, report.data.results, report.data.summary, params.filters);
        default:
          throw new Error(`Unsupported export format: ${params.export}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      return null;
    }
  }

  private exportToCSV(config: ReportConfig, data: any[]): Buffer {
    // Simple CSV export implementation
    const headers = config.columns
      .filter(col => col.exportable !== false)
      .map(col => col.label);
    
    const rows = data.map(row => 
      config.columns
        .filter(col => col.exportable !== false)
        .map(col => {
          const value = row[col.key];
          if (value === null || value === undefined) return '';
          if (col.format) return col.format(value);
          return value.toString();
        })
    );

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return Buffer.from(csvContent, 'utf-8');
  }

  private exportToExcel(config: ReportConfig, data: any[], summary?: Record<string, any>): Buffer {
    // This would use a library like exceljs
    // For now, return CSV as a placeholder
    return this.exportToCSV(config, data);
  }

  private exportToPDF(config: ReportConfig, data: any[], summary?: Record<string, any>, filters?: Record<string, any>): Buffer {
    // This would use a library like pdfkit or puppeteer
    // For now, return CSV as a placeholder
    return this.exportToCSV(config, data);
  }
}
