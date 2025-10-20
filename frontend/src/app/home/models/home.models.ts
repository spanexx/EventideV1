export interface Statistic {
  value: number;
  label: string;
  icon: string;
  color: string;
  target: number;
}

export interface Step {
  icon: string;
  title: string;
  description: string;
}

export interface TrustItem {
  icon: string;
  title: string;
  description: string;
}

export interface AnimatedStats {
  providers: number;
  bookings: number;
  satisfaction: number;
}