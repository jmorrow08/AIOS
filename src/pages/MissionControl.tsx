import React, { useEffect, useState } from 'react';
import { useUser } from '@/context/UserContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import DashboardCard from '@/components/DashboardCard';
import ActivityFeed from '@/components/ActivityFeed';
import QuickActionButton from '@/components/QuickActionButton';
import BudgetUsageIndicator from '@/components/BudgetUsageIndicator';
import { getDashboardData, DashboardData } from '@/api/dashboard';
import {
  Users,
  Briefcase,
  DollarSign,
  FileText,
  Bot,
  FolderOpen,
  Zap,
  UserPlus,
  Receipt,
  Cpu,
  Image,
} from 'lucide-react';

const MissionControl: React.FC = () => {
  const { user } = useUser();
  const [dashboardData, setDashboardData] = useState<DashboardData>({
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
    loading: true,
    error: null,
  });

  // Get user's display name
  const getUserDisplayName = () => {
    if (!user) return 'Guest';
    return user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin';
  };

  // Fetch dashboard data on component mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await getDashboardData();
        setDashboardData(data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setDashboardData((prev) => ({
          ...prev,
          loading: false,
          error: 'Failed to load dashboard data',
        }));
      }
    };

    fetchDashboardData();

    // Set up interval to refresh data every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const { metrics, recentActivity, budgetInfo, loading, error } = dashboardData;

  // Quick action configurations
  const quickActions = [
    {
      title: 'New Client',
      description: 'Add a new client to your operations',
      icon: UserPlus,
      color: 'from-blue-500 to-cyan-500',
      link: '/operations',
    },
    {
      title: 'New Invoice',
      description: 'Create and send a new invoice',
      icon: Receipt,
      color: 'from-green-500 to-emerald-500',
      link: '/finance',
    },
    {
      title: 'New Agent',
      description: 'Configure a new AI agent',
      icon: Bot,
      color: 'from-purple-500 to-pink-500',
      link: '/lab',
    },
    {
      title: 'New Media Project',
      description: 'Start a new media creation project',
      icon: Image,
      color: 'from-orange-500 to-red-500',
      link: '/media',
    },
  ];

  return (
    <DashboardLayout title="Mission Control" subtitle={`Welcome back, ${getUserDisplayName()}!`}>
      {/* Welcome Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-cosmic-accent opacity-75">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          {error && (
            <div className="bg-red-500 bg-opacity-20 border border-red-500 border-opacity-30 rounded-lg p-4">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Budget Usage Warning */}
      {budgetInfo.isOverBudget && (
        <div className="mb-6">
          <BudgetUsageIndicator budgetInfo={budgetInfo} />
        </div>
      )}

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        <DashboardCard
          title="Clients"
          value={metrics.clientsCount}
          icon={Users}
          subtitle={
            metrics.clientsCount === 0 ? 'Add your first client in Operations Hub' : undefined
          }
        />

        <DashboardCard
          title="Active Jobs"
          value={metrics.activeJobsCount}
          icon={Briefcase}
          subtitle={metrics.activeJobsCount === 0 ? 'No active jobs currently' : undefined}
        />

        <DashboardCard
          title="Monthly Revenue"
          value={metrics.monthlyRevenue}
          icon={DollarSign}
          subtitle="This month"
        />

        <DashboardCard
          title="Monthly API Cost"
          value={metrics.monthlyApiCost}
          icon={Zap}
          subtitle="This month"
        />

        <DashboardCard
          title="Knowledge Documents"
          value={metrics.documentsCount}
          icon={FolderOpen}
          subtitle={
            metrics.documentsCount === 0 ? 'Upload documents to Knowledge Library' : undefined
          }
        />

        <DashboardCard
          title="AI Agents"
          value={metrics.agentsCount}
          icon={Bot}
          subtitle={metrics.agentsCount === 0 ? 'Create your first AI agent' : undefined}
        />

        <DashboardCard
          title="Recent Interactions"
          value={metrics.recentInteractionsCount}
          icon={Cpu}
          subtitle="Last 30 days"
        />

        <DashboardCard
          title="Active Projects"
          value={0} // Placeholder - would need projects table
          icon={FileText}
          subtitle="Coming soon"
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <QuickActionButton
              key={index}
              title={action.title}
              description={action.description}
              icon={action.icon}
              color={action.color}
              link={action.link}
            />
          ))}
        </div>
      </div>

      {/* Bottom Section: Activity Feed and Budget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity Feed */}
        <div className="lg:col-span-2">
          <ActivityFeed activities={recentActivity} loading={loading} />
        </div>

        {/* Budget and Additional Info */}
        <div className="space-y-6">
          <BudgetUsageIndicator budgetInfo={budgetInfo} />

          {/* System Status */}
          <div className="bg-cosmic-light bg-opacity-10 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">System Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-cosmic-accent">Database</span>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-xs text-green-400">Online</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-cosmic-accent">AI Services</span>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-xs text-green-400">Active</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-cosmic-accent">Storage</span>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-xs text-green-400">85% Free</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MissionControl;
