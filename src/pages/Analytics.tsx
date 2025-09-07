import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, DollarSign, Users, MessageSquare, Package } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  getPnL,
  getMRRARR,
  getARAging,
  getChurnRate,
  getEngagementStats,
  PnLData,
  MRRData,
  ARAgingData,
  ChurnData,
  EngagementStats,
} from '@/api/analytics';

// Cosmic theme colors for charts
const CHART_COLORS = {
  primary: '#5d8bf4',
  secondary: '#f4f1bb',
  accent: '#0e153a',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  muted: '#64748b',
};

const Analytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState('finance');
  const [loading, setLoading] = useState(true);

  // Finance data
  const [pnlData, setPnlData] = useState<PnLData[]>([]);
  const [mrrData, setMrrData] = useState<MRRData | null>(null);
  const [arAgingData, setArAgingData] = useState<ARAgingData | null>(null);

  // Clients data
  const [churnData, setChurnData] = useState<ChurnData[]>([]);

  // Engagement data
  const [engagementData, setEngagementData] = useState<EngagementStats[]>([]);

  useEffect(() => {
    const loadAnalyticsData = async () => {
      setLoading(true);
      try {
        const currentDate = new Date();
        const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 12, 1)
          .toISOString()
          .split('T')[0];
        const endDate = currentDate.toISOString().split('T')[0];

        // Load all analytics data in parallel
        const [pnlResult, mrrResult, arAgingResult, churnResult, engagementResult] =
          await Promise.allSettled([
            getPnL(startDate, endDate),
            getMRRARR(),
            getARAging(),
            getChurnRate('12'),
            getEngagementStats('30'),
          ]);

        // Process results
        if (pnlResult.status === 'fulfilled' && pnlResult.value.data) {
          setPnlData(pnlResult.value.data);
        }

        if (mrrResult.status === 'fulfilled' && mrrResult.value.data) {
          setMrrData(mrrResult.value.data);
        }

        if (arAgingResult.status === 'fulfilled' && arAgingResult.value.data) {
          setArAgingData(arAgingResult.value.data);
        }

        if (churnResult.status === 'fulfilled' && churnResult.value.data) {
          setChurnData(churnResult.value.data);
        }

        if (engagementResult.status === 'fulfilled' && engagementResult.value.data) {
          setEngagementData(engagementResult.value.data);
        }
      } catch (error) {
        console.error('Error loading analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalyticsData();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Calculate KPIs
  const totalRevenue = pnlData.reduce((sum, item) => sum + item.revenue, 0);
  const totalExpenses = pnlData.reduce((sum, item) => sum + item.expenses, 0);
  const totalProfit = pnlData.reduce((sum, item) => sum + item.profit, 0);
  const grossMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0;

  // AR Aging colors
  const getARAgingColor = (range: string) => {
    switch (range) {
      case '0-30':
        return CHART_COLORS.success;
      case '31-60':
        return CHART_COLORS.warning;
      case '61-90':
        return CHART_COLORS.danger;
      case '90+':
        return CHART_COLORS.danger;
      default:
        return CHART_COLORS.muted;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cosmic-dark via-cosmic-light to-cosmic-accent p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-cosmic-highlight mb-2">Analytics Dashboard</h1>
            <p className="text-muted-foreground">Loading analytics data...</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </CardHeader>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cosmic-dark via-cosmic-light to-cosmic-accent p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-cosmic-highlight mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive business insights and performance metrics
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-card/50 backdrop-blur-sm border-border/50">
            <TabsTrigger
              value="finance"
              className="data-[state=active]:bg-cosmic-accent data-[state=active]:text-cosmic-highlight"
            >
              Finance
            </TabsTrigger>
            <TabsTrigger
              value="clients"
              className="data-[state=active]:bg-cosmic-accent data-[state=active]:text-cosmic-highlight"
            >
              Clients
            </TabsTrigger>
            <TabsTrigger
              value="engagement"
              className="data-[state=active]:bg-cosmic-accent data-[state=active]:text-cosmic-highlight"
            >
              Engagement
            </TabsTrigger>
          </TabsList>

          {/* Finance Tab */}
          <TabsContent value="finance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/70 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Revenue
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-cosmic-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-cosmic-highlight">
                    {formatCurrency(totalRevenue)}
                  </div>
                  <p className="text-xs text-muted-foreground">Last 12 months</p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/70 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Gross Margin
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">
                    {formatPercentage(grossMargin)}
                  </div>
                  <p className="text-xs text-muted-foreground">Profit margin</p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/70 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">MRR</CardTitle>
                  <DollarSign className="h-4 w-4 text-cosmic-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-cosmic-highlight">
                    {mrrData ? formatCurrency(mrrData.monthlyRecurringRevenue) : '$0'}
                  </div>
                  <p className="text-xs text-muted-foreground">Monthly recurring revenue</p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/70 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    AR Aging
                  </CardTitle>
                  <TrendingDown className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-500">
                    {arAgingData ? formatCurrency(arAgingData.totalOutstanding) : '$0'}
                  </div>
                  <p className="text-xs text-muted-foreground">Total outstanding</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="text-cosmic-highlight">Profit & Loss Trend</CardTitle>
                  <CardDescription>Revenue, expenses, and profit over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={pnlData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="date"
                        stroke="#9ca3af"
                        fontSize={12}
                        tickFormatter={(value) => value.substring(0, 7)}
                      />
                      <YAxis stroke="#9ca3af" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => [formatCurrency(value), '']}
                      />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke={CHART_COLORS.primary}
                        strokeWidth={2}
                        name="Revenue"
                      />
                      <Line
                        type="monotone"
                        dataKey="expenses"
                        stroke={CHART_COLORS.danger}
                        strokeWidth={2}
                        name="Expenses"
                      />
                      <Line
                        type="monotone"
                        dataKey="profit"
                        stroke={CHART_COLORS.success}
                        strokeWidth={2}
                        name="Profit"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="text-cosmic-highlight">MRR vs ARR</CardTitle>
                  <CardDescription>Monthly vs Annual Recurring Revenue</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={mrrData ? [mrrData] : []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                      <YAxis stroke="#9ca3af" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => [formatCurrency(value), '']}
                      />
                      <Bar
                        dataKey="monthlyRecurringRevenue"
                        fill={CHART_COLORS.primary}
                        name="MRR"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="annualRecurringRevenue"
                        fill={CHART_COLORS.secondary}
                        name="ARR"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="text-cosmic-highlight">Accounts Receivable Aging</CardTitle>
                  <CardDescription>Outstanding invoices by aging buckets</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={arAgingData?.buckets || []}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="amount"
                        label={({ range, amount }) => `${range}: ${formatCurrency(amount)}`}
                      >
                        {arAgingData?.buckets.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getARAgingColor(entry.range)} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [formatCurrency(value), 'Amount']}
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="text-cosmic-highlight">AR Aging Summary</CardTitle>
                  <CardDescription>Detailed breakdown of outstanding amounts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {arAgingData?.buckets.map((bucket) => (
                      <div key={bucket.range} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getARAgingColor(bucket.range) }}
                          />
                          <span className="text-sm font-medium">{bucket.range} days</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{formatCurrency(bucket.amount)}</div>
                          <div className="text-xs text-muted-foreground">
                            {bucket.count} invoices
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Total Outstanding</span>
                        <span className="text-lg font-bold text-cosmic-highlight">
                          {arAgingData ? formatCurrency(arAgingData.totalOutstanding) : '$0'}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clients" className="space-y-6">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-cosmic-highlight">Client Churn Analysis</CardTitle>
                <CardDescription>Monthly churn rates and client retention metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={churnData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="month"
                        stroke="#9ca3af"
                        fontSize={12}
                        tickFormatter={(value) => value.substring(0, 7)}
                      />
                      <YAxis stroke="#9ca3af" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number, name: string) => {
                          if (name === 'churnRate') return [formatPercentage(value), 'Churn Rate'];
                          return [value, name];
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="activeClients"
                        stroke={CHART_COLORS.success}
                        strokeWidth={2}
                        name="Active Clients"
                      />
                      <Line
                        type="monotone"
                        dataKey="churnedClients"
                        stroke={CHART_COLORS.danger}
                        strokeWidth={2}
                        name="Churned Clients"
                      />
                      <Line
                        type="monotone"
                        dataKey="churnRate"
                        stroke={CHART_COLORS.warning}
                        strokeWidth={2}
                        name="Churn Rate (%)"
                      />
                    </LineChart>
                  </ResponsiveContainer>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-card/30 rounded-lg">
                      <div className="text-2xl font-bold text-cosmic-highlight">
                        {churnData.reduce((sum, item) => sum + item.activeClients, 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Active Clients</div>
                    </div>
                    <div className="text-center p-4 bg-card/30 rounded-lg">
                      <div className="text-2xl font-bold text-red-500">
                        {churnData.reduce((sum, item) => sum + item.churnedClients, 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Churned</div>
                    </div>
                    <div className="text-center p-4 bg-card/30 rounded-lg">
                      <div className="text-2xl font-bold text-orange-500">
                        {formatPercentage(
                          churnData.length > 0
                            ? churnData.reduce((sum, item) => sum + item.churnRate, 0) /
                                churnData.length
                            : 0,
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">Avg Churn Rate</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Engagement Tab */}
          <TabsContent value="engagement" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/70 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Active Users
                  </CardTitle>
                  <Users className="h-4 w-4 text-cosmic-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-cosmic-highlight">
                    {engagementData.reduce((sum, item) => sum + item.activeUsers, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Last 30 days</p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/70 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Logins
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">
                    {engagementData.reduce((sum, item) => sum + item.totalLogins, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">User sessions</p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/70 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Messages Sent
                  </CardTitle>
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-500">
                    {engagementData.reduce((sum, item) => sum + item.messagesSent, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Service communications</p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/70 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Deliverables
                  </CardTitle>
                  <Package className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-500">
                    {engagementData.reduce((sum, item) => sum + item.deliverablesAccepted, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Completed work</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-cosmic-highlight">Daily Login Activity</CardTitle>
                <CardDescription>User login trends over the past 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={engagementData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="period"
                      stroke="#9ca3af"
                      fontSize={12}
                      tickFormatter={(value) =>
                        new Date(value).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })
                      }
                    />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                      }}
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      formatter={(value: number, name: string) => [value, name]}
                    />
                    <Line
                      type="monotone"
                      dataKey="totalLogins"
                      stroke={CHART_COLORS.primary}
                      strokeWidth={2}
                      name="Daily Logins"
                    />
                    <Line
                      type="monotone"
                      dataKey="activeUsers"
                      stroke={CHART_COLORS.secondary}
                      strokeWidth={2}
                      name="Active Users"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Analytics;
