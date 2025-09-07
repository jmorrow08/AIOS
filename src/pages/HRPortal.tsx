import React, { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import HumanTeam from '@/components/HumanTeam';
import AiAgents from '@/components/AiAgents';
import Onboarding from '@/components/Onboarding';
import Payroll from '@/components/Payroll';
import {
  Users,
  Bot,
  UserPlus,
  DollarSign,
  Shield,
  TrendingUp,
  Activity,
  Settings,
  Loader2,
} from 'lucide-react';

const HRPortal: React.FC = () => {
  const { user, loading } = useUser();
  const [activeTab, setActiveTab] = useState('human-team');
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalAgents: 0,
    activeOnboardings: 0,
    pendingPayroll: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Load basic stats
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setIsLoadingStats(true);
    try {
      // This would typically fetch from your API
      // For now, we'll set some placeholder stats
      setStats({
        totalEmployees: 12,
        totalAgents: 8,
        activeOnboardings: 3,
        pendingPayroll: 5,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Check if user is admin
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-cosmic-dark">
        <Loader2 className="w-8 h-8 animate-spin text-cosmic-accent" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/auth" replace />;
  }

  const tabItems = [
    {
      id: 'human-team',
      label: 'Human Team',
      icon: Users,
      component: HumanTeam,
      description: 'Manage human employees and their AI agent linkages',
    },
    {
      id: 'ai-agents',
      label: 'AI Agents',
      icon: Bot,
      component: AiAgents,
      description: 'Configure and manage AI agents and their assignments',
    },
    {
      id: 'onboarding',
      label: 'Onboarding',
      icon: UserPlus,
      component: Onboarding,
      description: 'Create and manage onboarding workflows with SOP generation',
    },
    {
      id: 'payroll',
      label: 'Payroll',
      icon: DollarSign,
      component: Payroll,
      description: 'Track and manage service payouts for employees and agents',
    },
  ];

  const ActiveComponent = tabItems.find((tab) => tab.id === activeTab)?.component || HumanTeam;

  return (
    <div className="h-screen flex flex-col bg-cosmic-dark">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-cosmic-light">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Shield className="w-8 h-8 text-cosmic-accent" />
              <div>
                <h1 className="text-2xl font-bold text-white">HR Portal</h1>
                <p className="text-gray-400 text-sm">AI-Powered Workforce Management</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-6">
              {isLoadingStats ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-cosmic-accent" />
                  <span className="text-gray-400 text-sm">Loading stats...</span>
                </div>
              ) : (
                <>
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">{stats.totalEmployees}</div>
                    <div className="text-xs text-gray-400">Employees</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">{stats.totalAgents}</div>
                    <div className="text-xs text-gray-400">AI Agents</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">{stats.activeOnboardings}</div>
                    <div className="text-xs text-gray-400">Onboarding</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">{stats.pendingPayroll}</div>
                    <div className="text-xs text-gray-400">Pending Payroll</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          {/* Tab Navigation */}
          <div className="flex-shrink-0 px-6 py-4 border-b border-cosmic-light">
            <TabsList className="bg-cosmic-light border border-cosmic-accent">
              {tabItems.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="flex items-center gap-2 px-4 py-2 text-white data-[state=active]:bg-cosmic-accent data-[state=active]:text-white"
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {/* Tab Description */}
            <div className="mt-4">
              <p className="text-gray-400 text-sm">
                {tabItems.find((tab) => tab.id === activeTab)?.description}
              </p>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {tabItems.map((tab) => {
              const Component = tab.component;
              return (
                <TabsContent key={tab.id} value={tab.id} className="h-full m-0 p-6 overflow-y-auto">
                  <Component />
                </TabsContent>
              );
            })}
          </div>
        </Tabs>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-cosmic-light px-6 py-4">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span>HR Portal v2.0</span>
            <Badge variant="outline" className="text-xs">
              AI-Powered
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Activity className="w-3 h-3" />
              <span>System Online</span>
            </div>
            <div className="flex items-center gap-1">
              <Settings className="w-3 h-3" />
              <span>Auto-sync Enabled</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRPortal;
