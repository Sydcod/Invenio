import { NextRequest, NextResponse } from 'next/server';
import { getReportMetadata, getReportCategories } from '@/libs/reports/registry';

// GET /api/reports - List all available reports
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    
    // Get report metadata
    let reports = getReportMetadata();
    
    // Filter by category if specified
    if (category) {
      reports = reports.filter(report => report.category === category);
    }
    
    // Group reports by category
    const categories = getReportCategories();
    const groupedReports = categories.reduce((acc, cat) => {
      acc[cat] = reports.filter(report => report.category === cat);
      return acc;
    }, {} as Record<string, typeof reports>);
    
    return NextResponse.json({
      success: true,
      data: {
        reports,
        groupedReports,
        categories,
        total: reports.length
      }
    });
    
  } catch (error) {
    console.error('Reports list error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch reports list',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
