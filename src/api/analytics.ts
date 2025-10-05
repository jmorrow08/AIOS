import { supabase } from '@/lib/supabaseClient';

export interface PnLData {
  date: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface MRRData {
  month: string;
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
}

export interface ARAgingBucket {
  range: string;
  amount: number;
  count: number;
}

export interface ARAgingData {
  buckets: ARAgingBucket[];
  totalOutstanding: number;
}

export interface ChurnData {
  month: string;
  activeClients: number;
  churnedClients: number;
  churnRate: number;
}

export interface EngagementStats {
  period: string;
  activeUsers: number;
  totalLogins: number;
  messagesSent: number;
  deliverablesAccepted: number;
}

export interface PnLResponse {
  data: PnLData[] | null;
  error: string | null;
}

export interface MRRResponse {
  data: MRRData | null;
  error: string | null;
}

export interface ARAgingResponse {
  data: ARAgingData | null;
  error: string | null;
}

export interface ChurnResponse {
  data: ChurnData[] | null;
  error: string | null;
}

export interface EngagementResponse {
  data: EngagementStats[] | null;
  error: string | null;
}

/**
 * Get Profit & Loss data for a date range
 */
export const getPnL = async (startDate: string, endDate: string): Promise<PnLResponse> => {
  try {
    // Get revenue from paid invoices
    const { data: revenueData, error: revenueError } = await supabase
      .from('invoices')
      .select('amount, paid_date')
      .eq('status', 'paid')
      .gte('paid_date', startDate)
      .lte('paid_date', endDate)
      .order('paid_date');

    if (revenueError) {
      console.error('Error fetching revenue data:', revenueError);
      return { data: null, error: revenueError.message };
    }

    // Get expenses (for now, this is a stub - would need expense tracking table)
    // Placeholder: assume 30% of revenue as expenses for demo
    const expensesRate = 0.3;

    // Group data by month
    const monthlyData: { [key: string]: { revenue: number; expenses: number } } = {};

    if (revenueData) {
      revenueData.forEach((invoice) => {
        const month = invoice.paid_date.substring(0, 7); // YYYY-MM format
        if (!monthlyData[month]) {
          monthlyData[month] = { revenue: 0, expenses: 0 };
        }
        monthlyData[month].revenue += invoice.amount;
      });
    }

    // Calculate expenses and profit
    const pnlData: PnLData[] = Object.keys(monthlyData)
      .sort()
      .map((month) => {
        const revenue = monthlyData[month].revenue;
        const expenses = revenue * expensesRate;
        const profit = revenue - expenses;

        return {
          date: month,
          revenue: Math.round(revenue * 100) / 100,
          expenses: Math.round(expenses * 100) / 100,
          profit: Math.round(profit * 100) / 100,
        };
      });

    return { data: pnlData, error: null };
  } catch (error) {
    console.error('Error fetching PnL data:', error);
    return { data: null, error: 'Failed to fetch profit and loss data' };
  }
};

/**
 * Get Monthly/Annual Recurring Revenue
 */
export const getMRRARR = async (): Promise<MRRResponse> => {
  try {
    const currentDate = new Date();
    const currentMonth = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1,
    ).padStart(2, '0')}`;

    // Get active subscription services
    const { data: subscriptionServices, error: servicesError } = await supabase
      .from('services')
      .select('price, billing_type, created_at')
      .eq('billing_type', 'subscription')
      .neq('status', 'archived');

    if (servicesError) {
      console.error('Error fetching subscription services:', servicesError);
      return { data: null, error: servicesError.message };
    }

    let monthlyRevenue = 0;
    let annualRevenue = 0;

    if (subscriptionServices) {
      subscriptionServices.forEach((service) => {
        if (service.billing_type === 'subscription') {
          monthlyRevenue += service.price;
          annualRevenue += service.price * 12;
        }
      });
    }

    const mrrData: MRRData = {
      month: currentMonth,
      monthlyRecurringRevenue: Math.round(monthlyRevenue * 100) / 100,
      annualRecurringRevenue: Math.round(annualRevenue * 100) / 100,
    };

    return { data: mrrData, error: null };
  } catch (error) {
    console.error('Error fetching MRR/ARR data:', error);
    return { data: null, error: 'Failed to fetch MRR/ARR data' };
  }
};

/**
 * Get Accounts Receivable Aging data
 */
export const getARAging = async (): Promise<ARAgingResponse> => {
  try {
    const currentDate = new Date();

    // Get unpaid invoices
    const { data: unpaidInvoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('amount, due_date, status')
      .neq('status', 'paid')
      .order('due_date');

    if (invoicesError) {
      console.error('Error fetching unpaid invoices:', invoicesError);
      return { data: null, error: invoicesError.message };
    }

    // Initialize aging buckets
    const buckets: { [key: string]: { amount: number; count: number } } = {
      '0-30': { amount: 0, count: 0 },
      '31-60': { amount: 0, count: 0 },
      '61-90': { amount: 0, count: 0 },
      '90+': { amount: 0, count: 0 },
    };

    let totalOutstanding = 0;

    if (unpaidInvoices) {
      unpaidInvoices.forEach((invoice) => {
        const dueDate = new Date(invoice.due_date);
        const daysDiff = Math.floor(
          (currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        totalOutstanding += invoice.amount;

        if (daysDiff <= 30) {
          buckets['0-30'].amount += invoice.amount;
          buckets['0-30'].count += 1;
        } else if (daysDiff <= 60) {
          buckets['31-60'].amount += invoice.amount;
          buckets['31-60'].count += 1;
        } else if (daysDiff <= 90) {
          buckets['61-90'].amount += invoice.amount;
          buckets['61-90'].count += 1;
        } else {
          buckets['90+'].amount += invoice.amount;
          buckets['90+'].count += 1;
        }
      });
    }

    const agingData: ARAgingData = {
      buckets: Object.entries(buckets).map(([range, data]) => ({
        range,
        amount: Math.round(data.amount * 100) / 100,
        count: data.count,
      })),
      totalOutstanding: Math.round(totalOutstanding * 100) / 100,
    };

    return { data: agingData, error: null };
  } catch (error) {
    console.error('Error fetching AR aging data:', error);
    return { data: null, error: 'Failed to fetch accounts receivable aging data' };
  }
};

/**
 * Get Churn Rate data by month
 */
export const getChurnRate = async (period: string = '12'): Promise<ChurnResponse> => {
  try {
    const months = parseInt(period);
    const currentDate = new Date();

    const churnData: ChurnData[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthStart = targetDate.toISOString().split('T')[0];
      const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0)
        .toISOString()
        .split('T')[0];
      const monthKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(
        2,
        '0',
      )}`;

      // Get active services at the beginning of the month
      const { data: activeServices, error: activeError } = await supabase
        .from('services')
        .select('id')
        .neq('status', 'archived')
        .lte('created_at', monthStart);

      if (activeError) {
        console.error('Error fetching active services:', activeError);
        continue;
      }

      // Get services that ended/churned during this month
      const { data: churnedServices, error: churnedError } = await supabase
        .from('services')
        .select('id')
        .eq('status', 'archived')
        .gte('end_date', monthStart)
        .lte('end_date', monthEnd);

      if (churnedError) {
        console.error('Error fetching churned services:', churnedError);
        continue;
      }

      const activeClients = activeServices?.length || 0;
      const churnedClients = churnedServices?.length || 0;
      const churnRate = activeClients > 0 ? (churnedClients / activeClients) * 100 : 0;

      churnData.push({
        month: monthKey,
        activeClients,
        churnedClients,
        churnRate: Math.round(churnRate * 100) / 100,
      });
    }

    return { data: churnData, error: null };
  } catch (error) {
    console.error('Error fetching churn rate data:', error);
    return { data: null, error: 'Failed to fetch churn rate data' };
  }
};

/**
 * Get Engagement Statistics
 */
export const getEngagementStats = async (period: string = '30'): Promise<EngagementResponse> => {
  try {
    const days = parseInt(period);
    const currentDate = new Date();
    const startDate = new Date(currentDate.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

    const engagementData: EngagementStats[] = [];

    // Get login activity from activity_log (assuming login events are logged)
    const { data: loginActivity, error: loginError } = await supabase
      .from('activity_log')
      .select('timestamp, description')
      .ilike('description', '%login%')
      .gte('timestamp', startDate)
      .order('timestamp');

    if (loginError) {
      console.error('Error fetching login activity:', loginError);
    }

    // Get service messages
    const { data: messages, error: messagesError } = await supabase
      .from('service_messages')
      .select('created_at')
      .gte('created_at', startDate)
      .order('created_at');

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
    }

    // Get unique active users from various sources
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, last_sign_in_at')
      .gte('last_sign_in_at', startDate);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    }

    // Group data by day
    const dailyStats: { [key: string]: EngagementStats } = {};

    // Initialize daily stats for the period
    for (let i = 0; i < days; i++) {
      const date = new Date(currentDate.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split('T')[0];

      dailyStats[dateKey] = {
        period: dateKey,
        activeUsers: 0,
        totalLogins: 0,
        messagesSent: 0,
        deliverablesAccepted: 0,
      };
    }

    // Count logins per day
    if (loginActivity) {
      loginActivity.forEach((activity) => {
        const date = activity.timestamp.split('T')[0];
        if (dailyStats[date]) {
          dailyStats[date].totalLogins += 1;
        }
      });
    }

    // Count messages per day
    if (messages) {
      messages.forEach((message) => {
        const date = message.created_at.split('T')[0];
        if (dailyStats[date]) {
          dailyStats[date].messagesSent += 1;
        }
      });
    }

    // Count active users (unique logins per day)
    const uniqueUsersPerDay: { [key: string]: Set<string> } = {};

    if (loginActivity) {
      loginActivity.forEach((activity) => {
        const date = activity.timestamp.split('T')[0];
        // Extract user ID from description or use a default approach
        // This is a simplified version - you'd need to parse the actual user ID
        const userId = 'user_' + Math.random().toString(36).substr(2, 9); // Placeholder

        if (!uniqueUsersPerDay[date]) {
          uniqueUsersPerDay[date] = new Set();
        }
        uniqueUsersPerDay[date].add(userId);
      });

      Object.keys(uniqueUsersPerDay).forEach((date) => {
        if (dailyStats[date]) {
          dailyStats[date].activeUsers = uniqueUsersPerDay[date].size;
        }
      });
    }

    // Convert to array and sort by date
    const result = Object.values(dailyStats).sort((a, b) => a.period.localeCompare(b.period));

    return { data: result, error: null };
  } catch (error) {
    console.error('Error fetching engagement stats:', error);
    return { data: null, error: 'Failed to fetch engagement statistics' };
  }
};
