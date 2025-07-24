import { ReportConfig } from './types';
import { salesByCustomerReport } from '@/config/reports/salesByCustomer';
import { inventorySummaryReport } from '@/config/reports/inventorySummary';
import { salesByItemReport } from '@/config/reports/salesByItem';

// Report registry to manage all available reports
export class ReportRegistry {
  private static reports: Map<string, ReportConfig> = new Map();
  private static initialized = false;

  static initialize() {
    if (this.initialized) return;

    // Register all reports
    this.register(salesByCustomerReport);
    this.register(inventorySummaryReport);
    this.register(salesByItemReport);
    
    // TODO: Add more reports as they are created
    // this.register(customerBalancesReport);
    // this.register(vendorBalancesReport);
    // this.register(orderFulfillmentReport);
    // etc.

    this.initialized = true;
  }

  static register(report: ReportConfig) {
    this.reports.set(report.id, report);
  }

  static getReport(reportId: string): ReportConfig | undefined {
    this.initialize();
    return this.reports.get(reportId);
  }

  static getAllReports(): ReportConfig[] {
    this.initialize();
    return Array.from(this.reports.values());
  }

  static getReportsByCategory(category: string): ReportConfig[] {
    this.initialize();
    return Array.from(this.reports.values()).filter(
      report => report.category === category
    );
  }

  static getCategories(): string[] {
    this.initialize();
    const categories = new Set<string>();
    this.reports.forEach(report => categories.add(report.category));
    return Array.from(categories);
  }

  static getReportMetadata() {
    this.initialize();
    return Array.from(this.reports.values()).map(report => ({
      id: report.id,
      name: report.name,
      category: report.category,
      description: report.description,
      exportFormats: report.exportFormats
    }));
  }
}

// Export convenience functions
export const getReport = (reportId: string) => ReportRegistry.getReport(reportId);
export const getAllReports = () => ReportRegistry.getAllReports();
export const getReportsByCategory = (category: string) => ReportRegistry.getReportsByCategory(category);
export const getReportCategories = () => ReportRegistry.getCategories();
export const getReportMetadata = () => ReportRegistry.getReportMetadata();
