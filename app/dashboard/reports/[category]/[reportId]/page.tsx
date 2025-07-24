'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import ReportViewer from '@/components/reports/ReportViewer';
import { ReportConfig } from '@/libs/reports/types';
import { getReport } from '@/libs/reports/registry';

export default function ReportPage() {
  const params = useParams();
  const category = params.category as string;
  const reportId = params.reportId as string;
  const [reportConfig, setReportConfig] = useState<ReportConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch report configuration
    const config = getReport(reportId);
    
    if (config) {
      setReportConfig(config);
    } else {
      setError('Report not found');
    }
    setLoading(false);
  }, [category, reportId]);

  if (loading) {
    return (
      <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading report configuration...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !reportConfig) {
    return (
      <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Report Not Found</h2>
            <p className="text-gray-600 mb-6">{error || 'The requested report could not be found.'}</p>
            <Link
              href="/dashboard/reports"
              className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
            >
              <ChevronLeftIcon className="mr-2 h-4 w-4" />
              Back to Reports
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm">
            <li>
              <Link href="/dashboard/reports" className="text-gray-500 hover:text-gray-700">
                Reports
              </Link>
            </li>
            <li>
              <svg className="h-5 w-5 flex-shrink-0 text-gray-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
              </svg>
            </li>
            <li>
              <Link 
                href={`/dashboard/reports?category=${category}`} 
                className="text-gray-500 hover:text-gray-700 capitalize"
              >
                {category}
              </Link>
            </li>
            <li>
              <svg className="h-5 w-5 flex-shrink-0 text-gray-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
              </svg>
            </li>
            <li className="text-gray-900 font-medium">{reportConfig.name}</li>
          </ol>
        </nav>

        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/dashboard/reports"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ChevronLeftIcon className="mr-1 h-4 w-4" />
            Back to Reports
          </Link>
        </div>

        {/* Report Viewer */}
        <ReportViewer
          reportConfig={reportConfig}
          reportId={`${category}-${reportId}`}
          category={category}
        />
      </div>
    </div>
  );
}
