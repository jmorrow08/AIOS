import React, { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { RadialMenu } from '@/components/RadialMenu';
import { CosmicBackground } from '@/components/CosmicBackground';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import {
  Settings,
  Zap,
  Smartphone,
  Save,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  DollarSign,
  TrendingUp,
  BarChart3,
  AlertTriangle,
  CreditCard,
  Mail,
  MessageSquare,
} from 'lucide-react';
import {
  getZapierConfig,
  getTaskerConfig,
  toggleZapierIntegration,
  toggleTaskerIntegration,
  updateZapierConfig,
  updateTaskerConfig,
  getSlackConfig,
  getDiscordConfig,
  getEmailConfig,
  getSmsConfig,
  toggleSlackIntegration,
  toggleDiscordIntegration,
  toggleEmailIntegration,
  toggleSmsIntegration,
  updateSlackConfig,
  updateDiscordConfig,
  updateEmailConfig,
  updateSmsConfig,
} from '@/api/companyConfig';
import {
  getBudgetConfig,
  updateBudgetConfig,
  getApiUsage,
  getApiUsageSummary,
  getTotalApiCost,
  ApiUsageRecord,
  ApiUsageSummary,
} from '@/api/apiUsage';
import {
  testSlackNotification,
  testDiscordNotification,
  testEmailNotification,
  testSMSNotification,
} from '@/api/notifications';
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

interface IntegrationConfig {
  enabled: boolean;
  webhook_url?: string;
  api_key?: string;
  enabled_events?: string[];
}

interface BudgetConfig {
  monthly_budget_usd: number;
  current_spend_usd: number;
  alerts_enabled: boolean;
  alert_thresholds: { warning: number; critical: number };
}

interface ApiUsageData {
  records: ApiUsageRecord[];
  summary: ApiUsageSummary[];
  totalCost: number;
  loading: boolean;
}

const AdminSettings: React.FC = () => {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Integration states
  const [zapierEnabled, setZapierEnabled] = useState(false);
  const [taskerEnabled, setTaskerEnabled] = useState(false);

  // Notification integration states
  const [slackEnabled, setSlackEnabled] = useState(false);
  const [discordEnabled, setDiscordEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [smsEnabled, setSmsEnabled] = useState(false);

  // Configuration states
  const [zapierConfig, setZapierConfig] = useState<IntegrationConfig>({
    enabled: false,
    webhook_url: '',
    api_key: '',
    enabled_events: ['client_created', 'invoice_created', 'invoice_overdue'],
  });

  const [taskerConfig, setTaskerConfig] = useState<IntegrationConfig>({
    enabled: false,
    webhook_url: '',
    api_key: '',
    enabled_events: ['client_created', 'invoice_created', 'invoice_overdue'],
  });

  // Notification configuration states
  const [slackConfig, setSlackConfig] = useState({
    enabled: false,
    webhook_url: '',
    channel: '#general',
    enabled_events: ['budget', 'invoice', 'deliverable', 'system'],
    mention_users: [] as string[],
  });

  const [discordConfig, setDiscordConfig] = useState({
    enabled: false,
    webhook_url: '',
    username: 'LytbuB Bot',
    avatar_url: '',
    enabled_events: ['budget', 'invoice', 'deliverable', 'system'],
  });

  const [emailConfig, setEmailConfig] = useState({
    enabled: false,
    provider: 'sendgrid',
    api_key: '',
    from_email: '',
    from_name: 'LytbuB',
    enabled_events: ['budget', 'invoice', 'deliverable', 'message'],
    template_ids: {} as Record<string, string>,
  });

  const [smsConfig, setSmsConfig] = useState({
    enabled: false,
    provider: 'twilio',
    api_key: '',
    account_sid: '',
    phone_number: '',
    enabled_events: ['budget', 'invoice', 'deliverable'],
    country_codes: ['+1'],
  });

  // Budget states
  const [budgetConfig, setBudgetConfig] = useState<BudgetConfig>({
    monthly_budget_usd: 100.0,
    current_spend_usd: 0.0,
    alerts_enabled: true,
    alert_thresholds: { warning: 80, critical: 95 },
  });

  const [budgetLoading, setBudgetLoading] = useState(false);

  // API Usage states
  const [apiUsageData, setApiUsageData] = useState<ApiUsageData>({
    records: [],
    summary: [],
    totalCost: 0,
    loading: true,
  });

  const [usageTimeframe, setUsageTimeframe] = useState<'7d' | '30d' | '90d'>('30d');

  // Load configuration on component mount
  useEffect(() => {
    const loadConfigurations = async () => {
      try {
        setLoading(true);

        // Load Zapier config
        const zapierData = await getZapierConfig();
        if (zapierData) {
          setZapierEnabled(zapierData.enabled);
          setZapierConfig({
            enabled: zapierData.enabled,
            webhook_url: zapierData.config?.webhook_url || '',
            api_key: zapierData.config?.api_key || '',
            enabled_events: zapierData.config?.enabled_events || [
              'client_created',
              'invoice_created',
              'invoice_overdue',
            ],
          });
        }

        // Load Tasker config
        const taskerData = await getTaskerConfig();
        if (taskerData) {
          setTaskerEnabled(taskerData.enabled);
          setTaskerConfig({
            enabled: taskerData.enabled,
            webhook_url: taskerData.config?.webhook_url || '',
            api_key: taskerData.config?.api_key || '',
            enabled_events: taskerData.config?.enabled_events || [
              'client_created',
              'invoice_created',
              'invoice_overdue',
            ],
          });
        }

        // Load budget configuration
        const budgetData = await getBudgetConfig();
        if (budgetData.data) {
          setBudgetConfig(budgetData.data);
        }

        // Load Slack config
        const slackData = await getSlackConfig();
        if (slackData) {
          setSlackEnabled(slackData.enabled);
          setSlackConfig((prev) => ({
            ...prev,
            enabled: slackData.enabled,
            webhook_url: slackData.config?.webhook_url || '',
            channel: slackData.config?.channel || '#general',
            enabled_events: slackData.config?.enabled_events || [
              'budget',
              'invoice',
              'deliverable',
              'system',
            ],
            mention_users: slackData.config?.mention_users || [],
          }));
        }

        // Load Discord config
        const discordData = await getDiscordConfig();
        if (discordData) {
          setDiscordEnabled(discordData.enabled);
          setDiscordConfig((prev) => ({
            ...prev,
            enabled: discordData.enabled,
            webhook_url: discordData.config?.webhook_url || '',
            username: discordData.config?.username || 'AI OS Bot',
            avatar_url: discordData.config?.avatar_url || '',
            enabled_events: discordData.config?.enabled_events || [
              'budget',
              'invoice',
              'deliverable',
              'system',
            ],
          }));
        }

        // Load Email config
        const emailData = await getEmailConfig();
        if (emailData) {
          setEmailEnabled(emailData.enabled);
          setEmailConfig((prev) => ({
            ...prev,
            enabled: emailData.enabled,
            provider: emailData.config?.provider || 'sendgrid',
            api_key: emailData.config?.api_key || '',
            from_email: emailData.config?.from_email || '',
            from_name: emailData.config?.from_name || 'AI OS',
            enabled_events: emailData.config?.enabled_events || [
              'budget',
              'invoice',
              'deliverable',
              'message',
            ],
            template_ids: emailData.config?.template_ids || {},
          }));
        }

        // Load SMS config
        const smsData = await getSmsConfig();
        if (smsData) {
          setSmsEnabled(smsData.enabled);
          setSmsConfig((prev) => ({
            ...prev,
            enabled: smsData.enabled,
            provider: smsData.config?.provider || 'twilio',
            api_key: smsData.config?.api_key || '',
            account_sid: smsData.config?.account_sid || '',
            phone_number: smsData.config?.phone_number || '',
            enabled_events: smsData.config?.enabled_events || ['budget', 'invoice', 'deliverable'],
            country_codes: smsData.config?.country_codes || ['+1'],
          }));
        }

        // Load API usage data
        await loadApiUsageData();
      } catch (error) {
        console.error('Error loading configurations:', error);
        setMessage({ type: 'error', text: 'Failed to load configuration settings' });
      } finally {
        setLoading(false);
      }
    };

    loadConfigurations();
  }, []);

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setMessage(null);

      // Update Zapier configuration
      const zapierUpdateData = {
        webhook_url: zapierConfig.webhook_url,
        api_key: zapierConfig.api_key,
        enabled_events: zapierConfig.enabled_events,
      };

      const zapierResult = await updateZapierConfig(zapierUpdateData);
      if (zapierResult.error) {
        throw new Error(`Failed to update Zapier config: ${zapierResult.error}`);
      }

      // Update Tasker configuration
      const taskerUpdateData = {
        webhook_url: taskerConfig.webhook_url,
        api_key: taskerConfig.api_key,
        enabled_events: taskerConfig.enabled_events,
      };

      const taskerResult = await updateTaskerConfig(taskerUpdateData);
      if (taskerResult.error) {
        throw new Error(`Failed to update Tasker config: ${taskerResult.error}`);
      }

      // Update enabled states
      await toggleZapierIntegration(zapierEnabled);
      await toggleTaskerIntegration(taskerEnabled);

      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save settings',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      setSaving(true);
      setMessage(null);

      // Update Slack configuration
      const slackUpdateData = {
        webhook_url: slackConfig.webhook_url,
        channel: slackConfig.channel,
        enabled_events: slackConfig.enabled_events,
        mention_users: slackConfig.mention_users,
      };

      const slackResult = await updateSlackConfig(slackUpdateData);
      if (slackResult.error) {
        throw new Error(`Failed to update Slack config: ${slackResult.error}`);
      }

      // Update Discord configuration
      const discordUpdateData = {
        webhook_url: discordConfig.webhook_url,
        username: discordConfig.username,
        avatar_url: discordConfig.avatar_url,
        enabled_events: discordConfig.enabled_events,
      };

      const discordResult = await updateDiscordConfig(discordUpdateData);
      if (discordResult.error) {
        throw new Error(`Failed to update Discord config: ${discordResult.error}`);
      }

      // Update Email configuration
      const emailUpdateData = {
        provider: emailConfig.provider,
        api_key: emailConfig.api_key,
        from_email: emailConfig.from_email,
        from_name: emailConfig.from_name,
        enabled_events: emailConfig.enabled_events,
        template_ids: emailConfig.template_ids,
      };

      const emailResult = await updateEmailConfig(emailUpdateData);
      if (emailResult.error) {
        throw new Error(`Failed to update Email config: ${emailResult.error}`);
      }

      // Update SMS configuration
      const smsUpdateData = {
        provider: smsConfig.provider,
        api_key: smsConfig.api_key,
        account_sid: smsConfig.account_sid,
        phone_number: smsConfig.phone_number,
        enabled_events: smsConfig.enabled_events,
        country_codes: smsConfig.country_codes,
      };

      const smsResult = await updateSmsConfig(smsUpdateData);
      if (smsResult.error) {
        throw new Error(`Failed to update SMS config: ${smsResult.error}`);
      }

      // Update enabled states
      await toggleSlackIntegration(slackEnabled);
      await toggleDiscordIntegration(discordEnabled);
      await toggleEmailIntegration(emailEnabled);
      await toggleSmsIntegration(smsEnabled);

      setMessage({ type: 'success', text: 'Notification settings saved successfully!' });
    } catch (error) {
      console.error('Error saving notification settings:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save notification settings',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleZapierToggle = (enabled: boolean) => {
    setZapierEnabled(enabled);
    setZapierConfig((prev) => ({ ...prev, enabled }));
  };

  const handleTaskerToggle = (enabled: boolean) => {
    setTaskerEnabled(enabled);
    setTaskerConfig((prev) => ({ ...prev, enabled }));
  };

  // Notification handler functions
  const handleSlackToggle = (enabled: boolean) => {
    setSlackEnabled(enabled);
    setSlackConfig((prev) => ({ ...prev, enabled }));
  };

  const handleDiscordToggle = (enabled: boolean) => {
    setDiscordEnabled(enabled);
    setDiscordConfig((prev) => ({ ...prev, enabled }));
  };

  const handleEmailToggle = (enabled: boolean) => {
    setEmailEnabled(enabled);
    setEmailConfig((prev) => ({ ...prev, enabled }));
  };

  const handleSmsToggle = (enabled: boolean) => {
    setSmsEnabled(enabled);
    setSmsConfig((prev) => ({ ...prev, enabled }));
  };

  // Test notification functions
  const handleTestSlack = async () => {
    try {
      setMessage(null);
      const result = await testSlackNotification();
      if (result.data) {
        setMessage({ type: 'success', text: 'Slack test notification sent successfully!' });
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to send Slack test notification',
        });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to send Slack test notification' });
    }
  };

  const handleTestDiscord = async () => {
    try {
      setMessage(null);
      const result = await testDiscordNotification();
      if (result.data) {
        setMessage({ type: 'success', text: 'Discord test notification sent successfully!' });
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to send Discord test notification',
        });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to send Discord test notification' });
    }
  };

  const handleTestEmail = async () => {
    try {
      setMessage(null);
      const result = await testEmailNotification();
      if (result.data) {
        setMessage({ type: 'success', text: 'Email test notification sent successfully!' });
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to send Email test notification',
        });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to send Email test notification' });
    }
  };

  const handleTestSMS = async () => {
    // For SMS test, we need a phone number input
    const phoneNumber = prompt('Enter a phone number to test SMS (e.g., +1234567890):');
    if (!phoneNumber) return;

    try {
      setMessage(null);
      const result = await testSMSNotification(phoneNumber);
      if (result.data) {
        setMessage({ type: 'success', text: 'SMS test notification sent successfully!' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to send SMS test notification' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to send SMS test notification' });
    }
  };

  // Load API usage data
  const loadApiUsageData = async () => {
    try {
      setApiUsageData((prev) => ({ ...prev, loading: true }));

      const days = usageTimeframe === '7d' ? 7 : usageTimeframe === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString().split('T')[0];

      const [usageResult, summaryResult, totalCostResult] = await Promise.all([
        getApiUsage(startDateStr),
        getApiUsageSummary(startDateStr),
        getTotalApiCost(startDateStr),
      ]);

      setApiUsageData({
        records: Array.isArray(usageResult.data) ? usageResult.data : [],
        summary: Array.isArray(summaryResult.data) ? summaryResult.data : [],
        totalCost: totalCostResult.data || 0,
        loading: false,
      });
    } catch (error) {
      console.error('Error loading API usage data:', error);
      setApiUsageData((prev) => ({ ...prev, loading: false }));
    }
  };

  // Handle budget configuration changes
  const handleBudgetChange = async () => {
    try {
      setBudgetLoading(true);
      const result = await updateBudgetConfig(budgetConfig);
      if (result.success) {
        setMessage({ type: 'success', text: 'Budget settings saved successfully!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to save budget settings' });
      }
    } catch (error) {
      console.error('Error updating budget:', error);
      setMessage({ type: 'error', text: 'Failed to update budget settings' });
    } finally {
      setBudgetLoading(false);
    }
  };

  // Calculate budget usage percentage
  const getBudgetUsagePercentage = () => {
    if (budgetConfig.monthly_budget_usd === 0) return 0;
    return (budgetConfig.current_spend_usd / budgetConfig.monthly_budget_usd) * 100;
  };

  // Get budget status
  const getBudgetStatus = () => {
    const percentage = getBudgetUsagePercentage();
    if (percentage >= budgetConfig.alert_thresholds.critical) return 'critical';
    if (percentage >= budgetConfig.alert_thresholds.warning) return 'warning';
    return 'normal';
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Prepare chart data
  const prepareChartData = () => {
    const dailyData: { [key: string]: { date: string; cost: number; count: number } } = {};

    apiUsageData.records.forEach((record) => {
      if (!dailyData[record.date]) {
        dailyData[record.date] = { date: record.date, cost: 0, count: 0 };
      }
      dailyData[record.date].cost += record.cost;
      dailyData[record.date].count += record.requests_count || 1;
    });

    return Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
  };

  const chartData = prepareChartData();
  const serviceData = apiUsageData.summary.map((item) => ({
    name: item.service,
    value: item.totalCost,
    count: item.requestsCount,
  }));

  if (loading) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <CosmicBackground />
        <RadialMenu />
        <div className="p-8 pt-24 max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20">
            <div className="mb-8">
              <Skeleton className="h-10 w-64 mb-2" />
              <Skeleton className="h-6 w-48" />
            </div>
            <div className="space-y-8">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="bg-white/5 rounded-lg p-6 border border-white/10">
                  <div className="mb-4">
                    <Skeleton className="h-6 w-32" />
                  </div>
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-10 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <CosmicBackground />
      <RadialMenu />

      <div className="p-8 pt-24 max-w-6xl mx-auto">
        <div className="space-y-8">
          {/* Header */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">Admin Settings</h1>
              <p className="text-cosmic-accent text-lg">
                Configure integrations, budget, and monitor API usage
              </p>
              {user && (
                <p className="text-cosmic-accent text-sm mt-2">Logged in as: {user.email}</p>
              )}
            </div>

            {/* Message Display */}
            {message && (
              <div
                className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
                  message.type === 'success'
                    ? 'bg-green-500/20 text-green-300 border border-green-500/50'
                    : 'bg-red-500/20 text-red-300 border border-red-500/50'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                )}
                <p>{message.text}</p>
              </div>
            )}
          </div>

          {/* Tabbed Interface */}
          <Tabs defaultValue="integrations" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-white/10">
              <TabsTrigger value="integrations" className="data-[state=active]:bg-cosmic-accent">
                <Settings className="w-4 h-4 mr-2" />
                Integrations
              </TabsTrigger>
              <TabsTrigger value="notifications" className="data-[state=active]:bg-cosmic-accent">
                <Zap className="w-4 h-4 mr-2" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="budget" className="data-[state=active]:bg-cosmic-accent">
                <DollarSign className="w-4 h-4 mr-2" />
                Budget & Billing
              </TabsTrigger>
              <TabsTrigger value="usage" className="data-[state=active]:bg-cosmic-accent">
                <BarChart3 className="w-4 h-4 mr-2" />
                API Usage
              </TabsTrigger>
            </TabsList>

            {/* Integrations Tab */}
            <TabsContent value="integrations" className="space-y-6 mt-6">
              {/* Zapier Integration */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/20 rounded-lg">
                      <Zap className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Zapier Integration</h3>
                      <p className="text-cosmic-accent text-sm">
                        Connect with 5,000+ apps and automate workflows
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Label htmlFor="zapier-toggle" className="text-cosmic-accent">
                      {zapierEnabled ? 'Enabled' : 'Disabled'}
                    </Label>
                    <Switch
                      id="zapier-toggle"
                      checked={zapierEnabled}
                      onCheckedChange={handleZapierToggle}
                    />
                  </div>
                </div>

                {zapierEnabled && (
                  <div className="space-y-4 border-t border-white/10 pt-4">
                    <div>
                      <Label htmlFor="zapier-webhook-url" className="text-cosmic-accent">
                        Webhook URL
                      </Label>
                      <Input
                        id="zapier-webhook-url"
                        type="url"
                        value={zapierConfig.webhook_url}
                        onChange={(e) =>
                          setZapierConfig((prev) => ({ ...prev, webhook_url: e.target.value }))
                        }
                        placeholder="https://hooks.zapier.com/hooks/catch/..."
                        className="bg-white/5 border-white/20 text-white placeholder-cosmic-accent mt-1"
                      />
                      <p className="text-xs text-cosmic-accent mt-1">
                        Get this URL from your Zapier webhook trigger
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="zapier-api-key" className="text-cosmic-accent">
                        API Key (Optional)
                      </Label>
                      <Input
                        id="zapier-api-key"
                        type="password"
                        value={zapierConfig.api_key}
                        onChange={(e) =>
                          setZapierConfig((prev) => ({ ...prev, api_key: e.target.value }))
                        }
                        placeholder="Your Zapier API key"
                        className="bg-white/5 border-white/20 text-white placeholder-cosmic-accent mt-1"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <ExternalLink className="w-4 h-4 text-cosmic-accent" />
                      <a
                        href="https://zapier.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cosmic-accent hover:text-white transition-colors text-sm"
                      >
                        Learn more about Zapier
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Tasker Integration */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Smartphone className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Tasker Integration</h3>
                      <p className="text-cosmic-accent text-sm">
                        Automate your Android device and receive notifications
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Label htmlFor="tasker-toggle" className="text-cosmic-accent">
                      {taskerEnabled ? 'Enabled' : 'Disabled'}
                    </Label>
                    <Switch
                      id="tasker-toggle"
                      checked={taskerEnabled}
                      onCheckedChange={handleTaskerToggle}
                    />
                  </div>
                </div>

                {taskerEnabled && (
                  <div className="space-y-4 border-t border-white/10 pt-4">
                    <div>
                      <Label htmlFor="tasker-webhook-url" className="text-cosmic-accent">
                        Webhook URL
                      </Label>
                      <Input
                        id="tasker-webhook-url"
                        type="url"
                        value={taskerConfig.webhook_url}
                        onChange={(e) =>
                          setTaskerConfig((prev) => ({ ...prev, webhook_url: e.target.value }))
                        }
                        placeholder="https://your-tasker-webhook-url"
                        className="bg-white/5 border-white/20 text-white placeholder-cosmic-accent mt-1"
                      />
                      <p className="text-xs text-cosmic-accent mt-1">
                        Configure this in your Tasker HTTP Request context
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="tasker-api-key" className="text-cosmic-accent">
                        API Key (Optional)
                      </Label>
                      <Input
                        id="tasker-api-key"
                        type="password"
                        value={taskerConfig.api_key}
                        onChange={(e) =>
                          setTaskerConfig((prev) => ({ ...prev, api_key: e.target.value }))
                        }
                        placeholder="Your Tasker API key"
                        className="bg-white/5 border-white/20 text-white placeholder-cosmic-accent mt-1"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <ExternalLink className="w-4 h-4 text-cosmic-accent" />
                      <a
                        href="https://tasker.joaoapps.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cosmic-accent hover:text-white transition-colors text-sm"
                      >
                        Learn more about Tasker
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Save Button for Integrations */}
              <div className="flex justify-end">
                <Button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="bg-cosmic-accent hover:bg-cosmic-accent/80 text-white px-8 py-2"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Integration Settings'}
                </Button>
              </div>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6 mt-6">
              {/* Slack Integration */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <Zap className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Slack Notifications</h3>
                      <p className="text-cosmic-accent text-sm">
                        Send notifications to Slack channels
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Label htmlFor="slack-toggle" className="text-cosmic-accent">
                      {slackEnabled ? 'Enabled' : 'Disabled'}
                    </Label>
                    <Switch
                      id="slack-toggle"
                      checked={slackEnabled}
                      onCheckedChange={handleSlackToggle}
                    />
                  </div>
                </div>

                {slackEnabled && (
                  <div className="space-y-4 border-t border-white/10 pt-4">
                    <div>
                      <Label htmlFor="slack-webhook-url" className="text-cosmic-accent">
                        Webhook URL
                      </Label>
                      <Input
                        id="slack-webhook-url"
                        type="url"
                        value={slackConfig.webhook_url}
                        onChange={(e) =>
                          setSlackConfig((prev) => ({ ...prev, webhook_url: e.target.value }))
                        }
                        placeholder="https://hooks.slack.com/services/..."
                        className="bg-white/5 border-white/20 text-white placeholder-cosmic-accent mt-1"
                      />
                      <p className="text-xs text-cosmic-accent mt-1">
                        Get this from Slack's Incoming Webhooks
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="slack-channel" className="text-cosmic-accent">
                        Default Channel
                      </Label>
                      <Input
                        id="slack-channel"
                        value={slackConfig.channel}
                        onChange={(e) =>
                          setSlackConfig((prev) => ({ ...prev, channel: e.target.value }))
                        }
                        placeholder="#general"
                        className="bg-white/5 border-white/20 text-white placeholder-cosmic-accent mt-1"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <ExternalLink className="w-4 h-4 text-cosmic-accent" />
                      <a
                        href="https://api.slack.com/messaging/webhooks"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cosmic-accent hover:text-white transition-colors text-sm"
                      >
                        Learn more about Slack Webhooks
                      </a>
                    </div>

                    {/* Test Button */}
                    <div className="flex justify-end border-t border-white/10 pt-4 mt-4">
                      <Button
                        onClick={handleTestSlack}
                        disabled={saving || !slackConfig.webhook_url}
                        variant="outline"
                        size="sm"
                        className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                      >
                        Test Slack Notification
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Discord Integration */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-lg">
                      <Smartphone className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Discord Notifications</h3>
                      <p className="text-cosmic-accent text-sm">
                        Send notifications to Discord channels
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Label htmlFor="discord-toggle" className="text-cosmic-accent">
                      {discordEnabled ? 'Enabled' : 'Disabled'}
                    </Label>
                    <Switch
                      id="discord-toggle"
                      checked={discordEnabled}
                      onCheckedChange={handleDiscordToggle}
                    />
                  </div>
                </div>

                {discordEnabled && (
                  <div className="space-y-4 border-t border-white/10 pt-4">
                    <div>
                      <Label htmlFor="discord-webhook-url" className="text-cosmic-accent">
                        Webhook URL
                      </Label>
                      <Input
                        id="discord-webhook-url"
                        type="url"
                        value={discordConfig.webhook_url}
                        onChange={(e) =>
                          setDiscordConfig((prev) => ({ ...prev, webhook_url: e.target.value }))
                        }
                        placeholder="https://discord.com/api/webhooks/..."
                        className="bg-white/5 border-white/20 text-white placeholder-cosmic-accent mt-1"
                      />
                      <p className="text-xs text-cosmic-accent mt-1">
                        Create a webhook in your Discord server settings
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="discord-username" className="text-cosmic-accent">
                        Bot Username
                      </Label>
                      <Input
                        id="discord-username"
                        value={discordConfig.username}
                        onChange={(e) =>
                          setDiscordConfig((prev) => ({ ...prev, username: e.target.value }))
                        }
                        placeholder="LytbuB Bot"
                        className="bg-white/5 border-white/20 text-white placeholder-cosmic-accent mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="discord-avatar-url" className="text-cosmic-accent">
                        Avatar URL (Optional)
                      </Label>
                      <Input
                        id="discord-avatar-url"
                        type="url"
                        value={discordConfig.avatar_url}
                        onChange={(e) =>
                          setDiscordConfig((prev) => ({ ...prev, avatar_url: e.target.value }))
                        }
                        placeholder="https://..."
                        className="bg-white/5 border-white/20 text-white placeholder-cosmic-accent mt-1"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <ExternalLink className="w-4 h-4 text-cosmic-accent" />
                      <a
                        href="https://discord.com/developers/docs/resources/webhook"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cosmic-accent hover:text-white transition-colors text-sm"
                      >
                        Learn more about Discord Webhooks
                      </a>
                    </div>

                    {/* Test Button */}
                    <div className="flex justify-end border-t border-white/10 pt-4 mt-4">
                      <Button
                        onClick={handleTestDiscord}
                        disabled={saving || !discordConfig.webhook_url}
                        variant="outline"
                        size="sm"
                        className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                      >
                        Test Discord Notification
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Email Integration */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Mail className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Email Notifications</h3>
                      <p className="text-cosmic-accent text-sm">
                        Send email notifications via SendGrid or Mailgun
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Label htmlFor="email-toggle" className="text-cosmic-accent">
                      {emailEnabled ? 'Enabled' : 'Disabled'}
                    </Label>
                    <Switch
                      id="email-toggle"
                      checked={emailEnabled}
                      onCheckedChange={handleEmailToggle}
                    />
                  </div>
                </div>

                {emailEnabled && (
                  <div className="space-y-4 border-t border-white/10 pt-4">
                    <div>
                      <Label htmlFor="email-provider" className="text-cosmic-accent">
                        Email Provider
                      </Label>
                      <select
                        id="email-provider"
                        value={emailConfig.provider}
                        onChange={(e) =>
                          setEmailConfig((prev) => ({ ...prev, provider: e.target.value }))
                        }
                        className="w-full bg-white/5 border-white/20 text-white rounded-md px-3 py-2 mt-1"
                      >
                        <option value="sendgrid">SendGrid</option>
                        <option value="mailgun">Mailgun</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="email-api-key" className="text-cosmic-accent">
                        API Key
                      </Label>
                      <Input
                        id="email-api-key"
                        type="password"
                        value={emailConfig.api_key}
                        onChange={(e) =>
                          setEmailConfig((prev) => ({ ...prev, api_key: e.target.value }))
                        }
                        placeholder="Your API key"
                        className="bg-white/5 border-white/20 text-white placeholder-cosmic-accent mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email-from-email" className="text-cosmic-accent">
                        From Email Address
                      </Label>
                      <Input
                        id="email-from-email"
                        type="email"
                        value={emailConfig.from_email}
                        onChange={(e) =>
                          setEmailConfig((prev) => ({ ...prev, from_email: e.target.value }))
                        }
                        placeholder="noreply@yourdomain.com"
                        className="bg-white/5 border-white/20 text-white placeholder-cosmic-accent mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email-from-name" className="text-cosmic-accent">
                        From Name
                      </Label>
                      <Input
                        id="email-from-name"
                        value={emailConfig.from_name}
                        onChange={(e) =>
                          setEmailConfig((prev) => ({ ...prev, from_name: e.target.value }))
                        }
                        placeholder="AI OS"
                        className="bg-white/5 border-white/20 text-white placeholder-cosmic-accent mt-1"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <ExternalLink className="w-4 h-4 text-cosmic-accent" />
                      <a
                        href="https://sendgrid.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cosmic-accent hover:text-white transition-colors text-sm mr-4"
                      >
                        SendGrid
                      </a>
                      <a
                        href="https://mailgun.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cosmic-accent hover:text-white transition-colors text-sm"
                      >
                        Mailgun
                      </a>
                    </div>

                    {/* Test Button */}
                    <div className="flex justify-end border-t border-white/10 pt-4 mt-4">
                      <Button
                        onClick={handleTestEmail}
                        disabled={saving || !emailConfig.api_key || !emailConfig.from_email}
                        variant="outline"
                        size="sm"
                        className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                      >
                        Test Email Notification
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* SMS Integration */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <MessageSquare className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">SMS Notifications</h3>
                      <p className="text-cosmic-accent text-sm">
                        Send SMS notifications via Twilio or Nexmo
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Label htmlFor="sms-toggle" className="text-cosmic-accent">
                      {smsEnabled ? 'Enabled' : 'Disabled'}
                    </Label>
                    <Switch
                      id="sms-toggle"
                      checked={smsEnabled}
                      onCheckedChange={handleSmsToggle}
                    />
                  </div>
                </div>

                {smsEnabled && (
                  <div className="space-y-4 border-t border-white/10 pt-4">
                    <div>
                      <Label htmlFor="sms-provider" className="text-cosmic-accent">
                        SMS Provider
                      </Label>
                      <select
                        id="sms-provider"
                        value={smsConfig.provider}
                        onChange={(e) =>
                          setSmsConfig((prev) => ({ ...prev, provider: e.target.value }))
                        }
                        className="w-full bg-white/5 border-white/20 text-white rounded-md px-3 py-2 mt-1"
                      >
                        <option value="twilio">Twilio</option>
                        <option value="nexmo">Nexmo (Vonage)</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="sms-api-key" className="text-cosmic-accent">
                        API Key
                      </Label>
                      <Input
                        id="sms-api-key"
                        type="password"
                        value={smsConfig.api_key}
                        onChange={(e) =>
                          setSmsConfig((prev) => ({ ...prev, api_key: e.target.value }))
                        }
                        placeholder="Your API key"
                        className="bg-white/5 border-white/20 text-white placeholder-cosmic-accent mt-1"
                      />
                    </div>

                    {smsConfig.provider === 'twilio' && (
                      <div>
                        <Label htmlFor="sms-account-sid" className="text-cosmic-accent">
                          Account SID
                        </Label>
                        <Input
                          id="sms-account-sid"
                          value={smsConfig.account_sid}
                          onChange={(e) =>
                            setSmsConfig((prev) => ({ ...prev, account_sid: e.target.value }))
                          }
                          placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                          className="bg-white/5 border-white/20 text-white placeholder-cosmic-accent mt-1"
                        />
                      </div>
                    )}

                    <div>
                      <Label htmlFor="sms-phone-number" className="text-cosmic-accent">
                        From Phone Number
                      </Label>
                      <Input
                        id="sms-phone-number"
                        value={smsConfig.phone_number}
                        onChange={(e) =>
                          setSmsConfig((prev) => ({ ...prev, phone_number: e.target.value }))
                        }
                        placeholder="+1234567890"
                        className="bg-white/5 border-white/20 text-white placeholder-cosmic-accent mt-1"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <ExternalLink className="w-4 h-4 text-cosmic-accent" />
                      <a
                        href="https://twilio.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cosmic-accent hover:text-white transition-colors text-sm mr-4"
                      >
                        Twilio
                      </a>
                      <a
                        href="https://nexmo.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cosmic-accent hover:text-white transition-colors text-sm"
                      >
                        Nexmo
                      </a>
                    </div>

                    {/* Test Button */}
                    <div className="flex justify-end border-t border-white/10 pt-4 mt-4">
                      <Button
                        onClick={handleTestSMS}
                        disabled={saving || !smsConfig.api_key || !smsConfig.phone_number}
                        variant="outline"
                        size="sm"
                        className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                      >
                        Test SMS Notification
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Save Button for Notifications */}
              <div className="flex justify-end">
                <Button
                  onClick={handleSaveNotifications}
                  disabled={saving}
                  className="bg-cosmic-accent hover:bg-cosmic-accent/80 text-white px-8 py-2"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Notification Settings'}
                </Button>
              </div>
            </TabsContent>

            {/* Budget Tab */}
            <TabsContent value="budget" className="space-y-6 mt-6">
              {/* Budget Overview */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Budget Overview</h3>
                    <p className="text-cosmic-accent text-sm">
                      Monitor and manage your API spending
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card className="p-4 bg-white/5 border-white/10">
                    <div className="text-center">
                      <p className="text-cosmic-accent text-sm">Monthly Budget</p>
                      <p className="text-2xl font-bold text-white">
                        {formatCurrency(budgetConfig.monthly_budget_usd)}
                      </p>
                    </div>
                  </Card>
                  <Card className="p-4 bg-white/5 border-white/10">
                    <div className="text-center">
                      <p className="text-cosmic-accent text-sm">Current Spend</p>
                      <p className="text-2xl font-bold text-white">
                        {formatCurrency(budgetConfig.current_spend_usd)}
                      </p>
                    </div>
                  </Card>
                  <Card className="p-4 bg-white/5 border-white/10">
                    <div className="text-center">
                      <p className="text-cosmic-accent text-sm">Remaining</p>
                      <p className="text-2xl font-bold text-white">
                        {formatCurrency(
                          Math.max(
                            0,
                            budgetConfig.monthly_budget_usd - budgetConfig.current_spend_usd,
                          ),
                        )}
                      </p>
                    </div>
                  </Card>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-cosmic-accent text-sm">Budget Usage</span>
                    <span
                      className={`text-sm font-medium ${
                        getBudgetStatus() === 'critical'
                          ? 'text-red-400'
                          : getBudgetStatus() === 'warning'
                          ? 'text-yellow-400'
                          : 'text-green-400'
                      }`}
                    >
                      {getBudgetUsagePercentage().toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={Math.min(getBudgetUsagePercentage(), 100)} className="h-3" />
                  <div className="flex justify-between mt-2 text-xs text-cosmic-accent">
                    <span>$0</span>
                    <span>{formatCurrency(budgetConfig.monthly_budget_usd)}</span>
                  </div>
                </div>

                {/* Alert Thresholds */}
                {budgetConfig.alerts_enabled && (
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm text-cosmic-accent">
                        Warning at {budgetConfig.alert_thresholds.warning}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span className="text-sm text-cosmic-accent">
                        Critical at {budgetConfig.alert_thresholds.critical}%
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Budget Settings */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <DollarSign className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Budget Settings</h3>
                    <p className="text-cosmic-accent text-sm">
                      Configure your monthly budget and alerts
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <Label htmlFor="monthly-budget" className="text-cosmic-accent">
                      Monthly Budget (USD)
                    </Label>
                    <Input
                      id="monthly-budget"
                      type="number"
                      min="0"
                      step="0.01"
                      value={budgetConfig.monthly_budget_usd}
                      onChange={(e) =>
                        setBudgetConfig((prev) => ({
                          ...prev,
                          monthly_budget_usd: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="bg-white/5 border-white/20 text-white mt-1"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="alerts-enabled" className="text-cosmic-accent">
                        Enable Budget Alerts
                      </Label>
                      <p className="text-xs text-cosmic-accent mt-1">
                        Get notified when approaching budget limits
                      </p>
                    </div>
                    <Switch
                      id="alerts-enabled"
                      checked={budgetConfig.alerts_enabled}
                      onCheckedChange={(enabled) =>
                        setBudgetConfig((prev) => ({ ...prev, alerts_enabled: enabled }))
                      }
                    />
                  </div>

                  {budgetConfig.alerts_enabled && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="warning-threshold" className="text-cosmic-accent">
                          Warning Threshold (%)
                        </Label>
                        <Input
                          id="warning-threshold"
                          type="number"
                          min="0"
                          max="100"
                          value={budgetConfig.alert_thresholds.warning}
                          onChange={(e) =>
                            setBudgetConfig((prev) => ({
                              ...prev,
                              alert_thresholds: {
                                ...prev.alert_thresholds,
                                warning: parseInt(e.target.value) || 0,
                              },
                            }))
                          }
                          className="bg-white/5 border-white/20 text-white mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="critical-threshold" className="text-cosmic-accent">
                          Critical Threshold (%)
                        </Label>
                        <Input
                          id="critical-threshold"
                          type="number"
                          min="0"
                          max="100"
                          value={budgetConfig.alert_thresholds.critical}
                          onChange={(e) =>
                            setBudgetConfig((prev) => ({
                              ...prev,
                              alert_thresholds: {
                                ...prev.alert_thresholds,
                                critical: parseInt(e.target.value) || 0,
                              },
                            }))
                          }
                          className="bg-white/5 border-white/20 text-white mt-1"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-cosmic-accent" />
                    <a
                      href="#"
                      className="text-cosmic-accent hover:text-white transition-colors text-sm"
                    >
                      Upgrade Plan or Add Credits
                    </a>
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <Button
                    onClick={handleBudgetChange}
                    disabled={budgetLoading}
                    className="bg-cosmic-accent hover:bg-cosmic-accent/80 text-white px-8 py-2"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {budgetLoading ? 'Saving...' : 'Save Budget Settings'}
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* API Usage Tab */}
            <TabsContent value="usage" className="space-y-6 mt-6">
              {/* Usage Overview */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <BarChart3 className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">API Usage Analytics</h3>
                      <p className="text-cosmic-accent text-sm">
                        Monitor your AI service usage and costs
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {(['7d', '30d', '90d'] as const).map((period) => (
                      <Button
                        key={period}
                        variant={usageTimeframe === period ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setUsageTimeframe(period);
                          loadApiUsageData();
                        }}
                        className={usageTimeframe === period ? 'bg-cosmic-accent' : ''}
                      >
                        {period}
                      </Button>
                    ))}
                  </div>
                </div>

                {apiUsageData.loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-64 w-full" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Skeleton className="h-32" />
                      <Skeleton className="h-32" />
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                      <Card className="p-4 bg-white/5 border-white/10">
                        <h4 className="text-white font-medium mb-4">Daily Cost Trend</h4>
                        <ResponsiveContainer width="100%" height={200}>
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis
                              dataKey="date"
                              stroke="#9CA3AF"
                              fontSize={12}
                              tickFormatter={(value) => new Date(value).toLocaleDateString()}
                            />
                            <YAxis stroke="#9CA3AF" fontSize={12} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#1F2937',
                                border: '1px solid #374151',
                                borderRadius: '8px',
                              }}
                              formatter={(value: number) => [formatCurrency(value), 'Cost']}
                            />
                            <Line
                              type="monotone"
                              dataKey="cost"
                              stroke="#8B5CF6"
                              strokeWidth={2}
                              dot={{ fill: '#8B5CF6' }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </Card>

                      <Card className="p-4 bg-white/5 border-white/10">
                        <h4 className="text-white font-medium mb-4">Cost by Service</h4>
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie
                              data={serviceData}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) =>
                                `${name} ${((percent || 0) * 100).toFixed(0)}%`
                              }
                            >
                              {serviceData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 60%)`} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          </PieChart>
                        </ResponsiveContainer>
                      </Card>
                    </div>

                    {/* Usage Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <Card className="p-4 bg-white/5 border-white/10">
                        <div className="text-center">
                          <p className="text-cosmic-accent text-sm">Total Cost</p>
                          <p className="text-2xl font-bold text-white">
                            {formatCurrency(apiUsageData.totalCost)}
                          </p>
                        </div>
                      </Card>
                      <Card className="p-4 bg-white/5 border-white/10">
                        <div className="text-center">
                          <p className="text-cosmic-accent text-sm">Total Requests</p>
                          <p className="text-2xl font-bold text-white">
                            {apiUsageData.records.reduce(
                              (sum, record) => sum + (record.requests_count || 1),
                              0,
                            )}
                          </p>
                        </div>
                      </Card>
                      <Card className="p-4 bg-white/5 border-white/10">
                        <div className="text-center">
                          <p className="text-cosmic-accent text-sm">Tokens Used</p>
                          <p className="text-2xl font-bold text-white">
                            {apiUsageData.records
                              .reduce((sum, record) => sum + (record.tokens_used || 0), 0)
                              .toLocaleString()}
                          </p>
                        </div>
                      </Card>
                      <Card className="p-4 bg-white/5 border-white/10">
                        <div className="text-center">
                          <p className="text-cosmic-accent text-sm">Avg Cost/Request</p>
                          <p className="text-2xl font-bold text-white">
                            {apiUsageData.records.length > 0
                              ? formatCurrency(apiUsageData.totalCost / apiUsageData.records.length)
                              : formatCurrency(0)}
                          </p>
                        </div>
                      </Card>
                    </div>

                    {/* Usage Table */}
                    <div className="bg-white/5 rounded-lg border border-white/10">
                      <div className="p-4 border-b border-white/10">
                        <h4 className="text-white font-medium">Recent API Usage</h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-white/5">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-cosmic-accent uppercase">
                                Date
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-cosmic-accent uppercase">
                                Service
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-cosmic-accent uppercase">
                                Agent
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-cosmic-accent uppercase">
                                Description
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-cosmic-accent uppercase">
                                Tokens
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-cosmic-accent uppercase">
                                Cost
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/10">
                            {apiUsageData.records.slice(0, 20).map((record) => (
                              <tr key={record.id} className="hover:bg-white/5">
                                <td className="px-4 py-2 text-sm text-white">
                                  {new Date(record.date).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-2 text-sm text-white">{record.service}</td>
                                <td className="px-4 py-2 text-sm text-cosmic-accent">
                                  {record.agent || '-'}
                                </td>
                                <td className="px-4 py-2 text-sm text-white max-w-xs truncate">
                                  {record.description}
                                </td>
                                <td className="px-4 py-2 text-sm text-white">
                                  {record.tokens_used?.toLocaleString() || '-'}
                                </td>
                                <td className="px-4 py-2 text-sm text-white">
                                  {formatCurrency(record.cost)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
