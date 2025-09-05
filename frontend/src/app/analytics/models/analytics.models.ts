export interface AnalyticsData {
  metrics: {
    totalBookings: number;
    revenue: number;
    cancellations: number;
    occupancyRate: number;
  };
  revenueData: {
    daily: { date: Date; amount: number; }[];
    weekly: { date: Date; amount: number; }[];
    monthly: { date: Date; amount: number; }[];
  };
  occupancyData: {
    daily: { date: Date; rate: number; }[];
    weekly: { date: Date; rate: number; }[];
    monthly: { date: Date; rate: number; }[];
  };
  bookingTrends: { date: Date; count: number; }[];
}

export interface AnalyticsRequest {
  providerId: string;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
}

export interface ReportData {
  type: 'pdf' | 'csv';
  data: string;
}