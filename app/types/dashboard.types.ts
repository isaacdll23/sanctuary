/**
 * Feature Card Type - Represents a single accessible feature on the dashboard
 */
export interface FeatureCard {
  id: string;
  pageId: string;
  title: string;
  description: string;
  icon: 
    | "CheckCircleIcon"
    | "CalendarIcon"
    | "BookOpenIcon"
    | "CurrencyDollarIcon"
    | "CommandLineIcon"
    | "Cog8ToothIcon"
    | "ShieldCheckIcon";
  color:
    | "blue"
    | "purple"
    | "amber"
    | "green"
    | "indigo"
    | "gray"
    | "red";
  route: string;
  isAccessible: boolean;
}

/**
 * Dashboard loader data - simplified from previous aggregated metrics
 */
export interface DashboardLoaderData {
  features: FeatureCard[];
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}
