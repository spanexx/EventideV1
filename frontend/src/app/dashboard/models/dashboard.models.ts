// Dashboard models
export interface DashboardStats {
  totalBookings: number;
  revenue: number;
  upcomingBookings: number;
  occupancy: number;
  bookingChange: string;
  revenueChange: string;
  upcomingChange: string;
  occupancyChange: string;
}

export interface Activity {
  id: string;
  description: string;
  time: Date;
  type: 'booking' | 'cancellation' | 'update';
}