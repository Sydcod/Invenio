import { NextRequest, NextResponse } from 'next/server';
import { ReportGenerator } from '@/libs/reports/ReportGenerator';
import { getReport } from '@/libs/reports/registry';
import { ReportParams } from '@/libs/reports/types';
import { validateFilters, generateExportFilename } from '@/libs/reports/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: { category: string; reportId: string } }
) {
  try {
    const { category, reportId } = params;
    const searchParams = request.nextUrl.searchParams;
    
    // Handle both cases: reportId with or without category prefix
    let fullReportId: string;
    if (reportId.startsWith(`${category}-`)) {
      // reportId already includes category prefix (e.g., "sales-by-customer")
      fullReportId = reportId;
    } else {
      // reportId doesn't include category prefix (e.g., "by-customer")
      fullReportId = `${category}-${reportId}`;
    }
    
    // Get report configuration from registry
    const reportConfig = getReport(fullReportId);
    
    if (!reportConfig) {
      return NextResponse.json({
        success: false,
        error: 'Report not found',
        details: `Report with ID '${fullReportId}' does not exist`
      }, { status: 404 });
    }
    
    // Parse query parameters
    const reportParams: ReportParams = {
      filters: {},
      pagination: {
        page: parseInt(searchParams.get('page') || '1'),
        pageSize: parseInt(searchParams.get('pageSize') || '50')
      }
    };

    // Parse filters dynamically based on report configuration
    reportConfig.filters.forEach(filter => {
      const value = searchParams.get(filter.key);
      
      if (value) {
        switch (filter.type) {
          case 'dateRange':
            try {
              reportParams.filters[filter.key] = JSON.parse(value);
            } catch (e) {
              console.error(`Failed to parse dateRange filter: ${e}`);
            }
            break;
          case 'multiSelect':
            reportParams.filters[filter.key] = value.split(',');
            break;
          case 'number':
            reportParams.filters[filter.key] = parseFloat(value);
            break;
          case 'select':
          case 'search':
          default:
            reportParams.filters[filter.key] = value;
            break;
        }
      }
    });
    
    // Debug: Log parsed filters
    console.log('Parsed filters:', reportParams.filters);

    // Parse sort
    const sortBy = searchParams.get('sortBy');
    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc';
    if (sortBy) {
      reportParams.sort = {
        column: sortBy,
        direction: sortOrder || 'desc'
      };
    }

    // Check for export format
    const exportFormat = searchParams.get('export') as 'pdf' | 'excel' | 'csv' | null;
    if (exportFormat) {
      reportParams.export = exportFormat;
    }

    // Validate filters
    const errors = validateFilters(reportParams.filters, reportConfig.filters);
    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid filters',
        details: errors
      }, { status: 400 });
    }

    // Generate report
    const generator = new ReportGenerator();
    
    // Handle export requests
    if (reportParams.export) {
      const exportData = await generator.exportReport(reportConfig, reportParams);
      if (!exportData) {
        return NextResponse.json({
          success: false,
          error: 'Failed to generate export'
        }, { status: 500 });
      }

      const filename = generateExportFilename(reportConfig.name, reportParams.export);
      
      // Set appropriate headers based on format
      const headers: HeadersInit = {
        'Content-Disposition': `attachment; filename="${filename}"`
      };

      switch (reportParams.export) {
        case 'csv':
          headers['Content-Type'] = 'text/csv';
          break;
        case 'excel':
          headers['Content-Type'] = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
        case 'pdf':
          headers['Content-Type'] = 'application/pdf';
          break;
      }

      return new NextResponse(exportData, { headers });
    }

    // Generate regular report
    const report = await generator.generateReport(reportConfig, reportParams);
    
    // Transform response to match frontend expectations
    if (report.success && report.data) {
      return NextResponse.json({
        success: true,
        data: report.data.results || [],
        pagination: {
          totalPages: report.data.pagination?.totalPages || 1,
          totalRecords: report.data.pagination?.total || 0,
          currentPage: report.data.pagination?.page || 1,
          pageSize: report.data.pagination?.pageSize || 50
        },
        summary: report.data.summary,
        metadata: report.data.metadata
      });
    }
    
    return NextResponse.json(report);

  } catch (error) {
    console.error(`Report error for ${params.category}/${params.reportId}:`, error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// OPTIONS method for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
