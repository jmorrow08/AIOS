import { supabase } from '@/lib/supabaseClient';
import { getTotalApiCost, getBudgetConfig } from '@/api/apiUsage';

export interface DashboardMetrics {
  clientsCount: number;
  activeJobsCount: number;
  monthlyRevenue: number;
  monthlyApiCost: number;
  documentsCount: number;
  agentsCount: number;
  recentInteractionsCount: number;
}

export interface ActivityLogEntry {
  id: string;
  description: string;
  timestamp: string;
  category: 'client' | 'invoice' | 'job' | 'media' | 'agent' | 'document' | 'system';
  link?: string;
  metadata?: any;
  created_at: string;
}

export interface BudgetInfo {
  budgetLimit: number;
  currentUsage: number;
  percentageUsed: number;
  isOverBudget: boolean;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  recentActivity: ActivityLogEntry[];
  budgetInfo: BudgetInfo;
  loading: boolean;
  error: string | null;
}

/**
 * Get dashboard metrics
 */
export const getDashboardMetrics = async (): Promise<{
  data: DashboardMetrics | null;
  error: string | null;
}> => {
  try {
    // Get current month dates
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    // Parallel queries for better performance
    const [
      clientsResult,
      jobsResult,
      revenueResult,
      apiCostResult,
      documentsResult,
      agentsResult,
      interactionsResult,
    ] = await Promise.allSettled([
      // Count of clients (companies)
      supabase.from('companies').select('id', { count: 'exact', head: true }),

      // Count of active jobs
      supabase
        .from('jobs')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'In Progress'),

      // Sum of paid invoice amounts this month
      supabase
        .from('invoices')
        .select('amount')
        .eq('status', 'paid')
        .gte('paid_date', startOfMonth)
        .lte('paid_date', endOfMonth),

      // API usage cost this month
      getTotalApiCost(startOfMonth),

      // Count of documents
      supabase.from('documents').select('id', { count: 'exact', head: true }),

      // Count of AI agents
      supabase.from('ai_agents').select('id', { count: 'exact', head: true }),

      // Recent AI interactions (last 30 days)
      supabase
        .from('agent_logs')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    ]);

    // Process results
    const clientsCount =
      clientsResult.status === 'fulfilled' && clientsResult.value.count !== null
        ? clientsResult.value.count
        : 0;

    const activeJobsCount =
      jobsResult.status === 'fulfilled' && jobsResult.value.count !== null
        ? jobsResult.value.count
        : 0;

    const monthlyRevenue =
      revenueResult.status === 'fulfilled' && revenueResult.value.data
        ? revenueResult.value.data.reduce((sum, invoice) => sum + (invoice.amount || 0), 0)
        : 0;

    const monthlyApiCost =
      apiCostResult.status === 'fulfilled' && apiCostResult.value.data !== null
        ? apiCostResult.value.data
        : 0;

    const documentsCount =
      documentsResult.status === 'fulfilled' && documentsResult.value.count !== null
        ? documentsResult.value.count
        : 0;

    const agentsCount =
      agentsResult.status === 'fulfilled' && agentsResult.value.count !== null
        ? agentsResult.value.count
        : 0;

    const recentInteractionsCount =
      interactionsResult.status === 'fulfilled' && interactionsResult.value.count !== null
        ? interactionsResult.value.count
        : 0;

    const metrics: DashboardMetrics = {
      clientsCount,
      activeJobsCount,
      monthlyRevenue,
      monthlyApiCost,
      documentsCount,
      agentsCount,
      recentInteractionsCount,
    };

    return { data: metrics, error: null };
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return {
      data: null,
      error: 'Failed to fetch dashboard metrics',
    };
  }
};

/**
 * Get recent activity log entries
 */
export const getRecentActivity = async (
  limit: number = 10,
): Promise<{ data: ActivityLogEntry[] | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('activity_log')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent activity:', error);
      return { data: null, error: error.message || 'Failed to fetch recent activity' };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Unexpected error fetching recent activity:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching recent activity',
    };
  }
};

/**
 * Get budget information using the new budget system
 */
export const getBudgetInfo = async (): Promise<{
  data: BudgetInfo | null;
  error: string | null;
}> => {
  try {
    // Get budget configuration from company_config
    const budgetResult = await getBudgetConfig();
    if (budgetResult.error) {
      console.error('Error fetching budget config:', budgetResult.error);
      return { data: null, error: budgetResult.error };
    }

    if (!budgetResult.data) {
      // Return default budget info if no configuration exists
      return {
        data: {
          budgetLimit: 0,
          currentUsage: 0,
          percentageUsed: 0,
          isOverBudget: false,
        },
        error: null,
      };
    }

    const { monthly_budget_usd, current_spend_usd } = budgetResult.data;
    const percentageUsed =
      monthly_budget_usd > 0 ? (current_spend_usd / monthly_budget_usd) * 100 : 0;
    const isOverBudget = current_spend_usd > monthly_budget_usd && monthly_budget_usd > 0;

    const budgetInfo: BudgetInfo = {
      budgetLimit: monthly_budget_usd,
      currentUsage: current_spend_usd,
      percentageUsed,
      isOverBudget,
    };

    return { data: budgetInfo, error: null };
  } catch (error) {
    console.error('Error fetching budget info:', error);
    return {
      data: null,
      error: 'Failed to fetch budget information',
    };
  }
};

/**
 * Log an activity event
 */
export const logActivity = async (
  description: string,
  category: ActivityLogEntry['category'],
  link?: string,
  metadata?: any,
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { error } = await supabase.from('activity_log').insert([
      {
        description,
        category,
        link,
        metadata: metadata || {},
        timestamp: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error('Error logging activity:', error);
      return { success: false, error: error.message || 'Failed to log activity' };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Unexpected error logging activity:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while logging activity',
    };
  }
};

/**
 * Get complete dashboard data
 */
export const getDashboardData = async (): Promise<DashboardData> => {
  try {
    const [metricsResult, activityResult, budgetResult] = await Promise.allSettled([
      getDashboardMetrics(),
      getRecentActivity(10),
      getBudgetInfo(),
    ]);

    const metrics =
      metricsResult.status === 'fulfilled' && metricsResult.value.data
        ? metricsResult.value.data
        : {
            clientsCount: 0,
            activeJobsCount: 0,
            monthlyRevenue: 0,
            monthlyApiCost: 0,
            documentsCount: 0,
            agentsCount: 0,
            recentInteractionsCount: 0,
          };

    const recentActivity =
      activityResult.status === 'fulfilled' && activityResult.value.data
        ? activityResult.value.data
        : [];

    const budgetInfo =
      budgetResult.status === 'fulfilled' && budgetResult.value.data
        ? budgetResult.value.data
        : {
            budgetLimit: 0,
            currentUsage: 0,
            percentageUsed: 0,
            isOverBudget: false,
          };

    // Check for errors
    const errors = [
      metricsResult.status === 'rejected' ? 'Failed to fetch metrics' : null,
      activityResult.status === 'rejected' ? 'Failed to fetch activity' : null,
      budgetResult.status === 'rejected' ? 'Failed to fetch budget info' : null,
    ].filter(Boolean);

    const error = errors.length > 0 ? errors.join('; ') : null;

    return {
      metrics,
      recentActivity,
      budgetInfo,
      loading: false,
      error,
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return {
      metrics: {
        clientsCount: 0,
        activeJobsCount: 0,
        monthlyRevenue: 0,
        monthlyApiCost: 0,
        documentsCount: 0,
        agentsCount: 0,
        recentInteractionsCount: 0,
      },
      recentActivity: [],
      budgetInfo: {
        budgetLimit: 0,
        currentUsage: 0,
        percentageUsed: 0,
        isOverBudget: false,
      },
      loading: false,
      error: 'Failed to fetch dashboard data',
    };
  }
};
