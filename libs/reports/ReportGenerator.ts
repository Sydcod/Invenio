import { Db, MongoClient } from 'mongodb';
import { ReportConfig, ReportParams, ReportResponse, PaginationConfig } from './types';
import { getDatabase } from './mongodb';
import crypto from 'crypto';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

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
    
    // Allow larger page sizes for exports
    const maxPageSize = params.export ? 50000 : 200;
    if (params.pagination.pageSize < 1 || params.pagination.pageSize > maxPageSize) {
      throw new Error(`Page size must be between 1 and ${maxPageSize}`);
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

      console.log(`Starting ${params.export} export for ${report.data.results.length} records`);

      switch (params.export) {
        case 'csv':
          return this.exportToCSV(config, report.data.results);
        case 'excel':
          return await this.exportToExcel(config, report.data.results, report.data.summary);
        case 'pdf':
          try {
            return await this.exportToPDF(config, report.data.results, report.data.summary, params.filters);
          } catch (pdfError) {
            console.error('PDF export specific error:', pdfError);
            throw pdfError;
          }
        default:
          throw new Error(`Unsupported export format: ${params.export}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
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

  private async exportToExcel(config: ReportConfig, data: any[], summary?: Record<string, any>): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(config.name);

    // Add report title
    worksheet.addRow([config.name]);
    worksheet.getRow(1).font = { bold: true, size: 16 };
    worksheet.addRow([]); // Empty row

    // Add summary if available
    if (summary) {
      worksheet.addRow(['Summary']);
      worksheet.getRow(worksheet.rowCount).font = { bold: true, size: 14 };
      
      Object.entries(summary).forEach(([key, value]) => {
        worksheet.addRow([key, value]);
      });
      worksheet.addRow([]); // Empty row
    }

    // Add headers
    const headers = config.columns
      .filter(col => col.exportable !== false)
      .map(col => col.label);
    
    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add data rows
    data.forEach(row => {
      const values = config.columns
        .filter(col => col.exportable !== false)
        .map(col => {
          const value = row[col.key];
          if (value === null || value === undefined) return '';
          if (col.format) return col.format(value);
          return value;
        });
      worksheet.addRow(values);
    });

    // Auto-fit columns
    worksheet.columns.forEach((column, index) => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const cellLength = cell.value ? cell.value.toString().length : 0;
        if (cellLength > maxLength) maxLength = cellLength;
      });
      column.width = Math.min(maxLength + 2, 50); // Cap at 50 characters
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private async exportToPDF(config: ReportConfig, data: any[], summary?: Record<string, any>, filters?: Record<string, any>): Promise<Buffer> {
    console.log('Starting PDF export...');
    console.log('Data length:', data.length);
    console.log('Summary:', summary);
    
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        // Collect PDF data chunks
        doc.on('data', (chunk) => {
          console.log('PDF chunk received, size:', chunk.length);
          chunks.push(chunk);
        });
        doc.on('end', () => {
          console.log('PDF generation complete, total chunks:', chunks.length);
          const buffer = Buffer.concat(chunks);
          console.log('Final PDF buffer size:', buffer.length);
          resolve(buffer);
        });
        doc.on('error', (error) => {
          console.error('PDF generation error:', error);
          reject(error);
        });

      // Add report title
      doc.fontSize(20).text(config.name, { align: 'center' });
      doc.moveDown();

      // Add generation date
      doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'right' });
      doc.moveDown();

      // Add filters if any
      if (filters && Object.keys(filters).length > 0) {
        doc.fontSize(12).text('Applied Filters:', { underline: true });
        Object.entries(filters).forEach(([key, value]) => {
          if (value) {
            const filterConfig = config.filters.find(f => f.key === key);
            const label = filterConfig?.label || key;
            doc.fontSize(10).text(`${label}: ${Array.isArray(value) ? value.join(', ') : value}`);
          }
        });
        doc.moveDown();
      }

      // Add summary if available
      if (summary && Object.keys(summary).length > 0) {
        doc.fontSize(14).text('Summary', { underline: true });
        doc.moveDown(0.5);
        
        Object.entries(summary).forEach(([key, value]) => {
          doc.fontSize(10).text(`${key}: ${value}`);
        });
        doc.moveDown();
      }

      // Add table headers
      const exportableColumns = config.columns.filter(col => col.exportable !== false);
      const columnWidth = (doc.page.width - 100) / exportableColumns.length;
      
      doc.fontSize(10).font('Helvetica-Bold');
      let x = 50;
      exportableColumns.forEach(col => {
        doc.text(col.label, x, doc.y, { width: columnWidth, align: 'left' });
        x += columnWidth;
      });
      
      // Add horizontal line after headers
      doc.moveTo(50, doc.y + 15)
         .lineTo(doc.page.width - 50, doc.y + 15)
         .stroke();
      doc.moveDown();

      // Add data rows - Process in chunks to avoid memory issues
      doc.font('Helvetica').fontSize(9);
      
      console.log(`Processing ${data.length} rows for PDF...`);
      
      // Process rows in smaller chunks to avoid memory issues
      const chunkSize = 100;
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, Math.min(i + chunkSize, data.length));
        
        chunk.forEach((row, chunkIndex) => {
          const index = i + chunkIndex;
          
          // Check if we need a new page
          if (doc.y > doc.page.height - 100) {
            doc.addPage();
            
            // Re-add headers on new page
            doc.fontSize(10).font('Helvetica-Bold');
            let headerX = 50;
            exportableColumns.forEach(col => {
              doc.text(col.label, headerX, doc.y, { width: columnWidth, align: 'left' });
              headerX += columnWidth;
            });
            doc.moveTo(50, doc.y + 15)
               .lineTo(doc.page.width - 50, doc.y + 15)
               .stroke();
            doc.moveDown();
            doc.font('Helvetica').fontSize(9);
          }

          x = 50;
          let maxHeight = 0;
          
          // Calculate row height first
          exportableColumns.forEach(col => {
            const value = row[col.key];
            let displayValue = '';
            
            if (value !== null && value !== undefined) {
              displayValue = col.format ? col.format(value) : value.toString();
            }
            
            // Truncate very long values to prevent overflow
            if (displayValue.length > 50) {
              displayValue = displayValue.substring(0, 47) + '...';
            }
          });
          
          // Now render the row
          exportableColumns.forEach(col => {
            const value = row[col.key];
            let displayValue = '';
            
            if (value !== null && value !== undefined) {
              displayValue = col.format ? col.format(value) : value.toString();
            }
            
            // Truncate very long values
            if (displayValue.length > 50) {
              displayValue = displayValue.substring(0, 47) + '...';
            }
            
            doc.text(displayValue, x, doc.y, { 
              width: columnWidth - 5, 
              align: 'left',
              lineBreak: false
            });
            x += columnWidth;
          });
          doc.moveDown(0.5);

          // Add subtle row separator every 5 rows
          if ((index + 1) % 5 === 0) {
            doc.moveTo(50, doc.y)
               .lineTo(doc.page.width - 50, doc.y)
               .stroke('gray');
            doc.moveDown(0.5);
          }
        });
        
        // Allow event loop to process between chunks
        if (i + chunkSize < data.length) {
          console.log(`Processed ${Math.min(i + chunkSize, data.length)} of ${data.length} rows...`);
        }
      }

      // Finalize the PDF
      doc.end();
      } catch (error) {
        console.error('PDF generation failed:', error);
        reject(error);
      }
    });
  }
}
