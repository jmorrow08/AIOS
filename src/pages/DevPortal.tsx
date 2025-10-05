import React, { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { CosmicBackground } from '@/components/CosmicBackground';
import BudgetUsageIndicator from '@/components/BudgetUsageIndicator';
import {
  getSystemLogs,
  getSystemHealth,
  getDevPortalSettings,
  updateDevPortalSettings,
  LogEntry,
  SystemHealthData,
  DevPortalSettings,
} from '@/api/devPortal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Activity,
  AlertTriangle,
  Bug,
  CheckCircle,
  Clock,
  Database,
  Eye,
  Filter,
  RefreshCw,
  Search,
  Server,
  Settings,
  Shield,
  TrendingUp,
  XCircle,
} from 'lucide-react';

const DevPortal: React.FC = () => {
  const { user, role } = useUser();

  // Logs state
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState<string | null>(null);

  // Health state
  const [healthData, setHealthData] = useState<SystemHealthData | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthError, setHealthError] = useState<string | null>(null);

  // Settings state
  const [settings, setSettings] = useState<DevPortalSettings>({
    safeMode: false,
    debugMode: false,
  });
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Filters state
  const [filters, setFilters] = useState({
    agentId: '',
    category: '',
    severity: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    searchTerm: '',
  });

  // Load data on component mount
  useEffect(() => {
    loadLogs();
    loadHealthData();
    loadSettings();
  }, []);

  const loadLogs = async () => {
    setLogsLoading(true);
    const result = await getSystemLogs(50, filters);
    if (result.error) {
      setLogsError(result.error);
    } else {
      setLogs(result.data || []);
      setLogsError(null);
    }
    setLogsLoading(false);
  };

  const loadHealthData = async () => {
    setHealthLoading(true);
    const result = await getSystemHealth();
    if (result.error) {
      setHealthError(result.error);
    } else {
      setHealthData(result.data);
      setHealthError(null);
    }
    setHealthLoading(false);
  };

  const loadSettings = async () => {
    setSettingsLoading(true);
    const result = await getDevPortalSettings();
    if (result.data) {
      setSettings(result.data);
    }
    setSettingsLoading(false);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSettingsChange = async (key: keyof DevPortalSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    setSettingsSaving(true);
    const result = await updateDevPortalSettings(newSettings);
    if (!result.success) {
      // Revert on error
      setSettings(settings);
      console.error('Failed to save settings:', result.error);
    }
    setSettingsSaving(false);
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'critical':
      case 'error':
        return 'destructive';
      case 'warning':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (!user || role !== 'admin') {
    return (
      <div className="relative min-h-screen bg-cosmic-dark text-white flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-cosmic-accent">Admin access required for Dev Portal</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-cosmic-dark text-white">
      <CosmicBackground />
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cosmic-accent to-cosmic-highlight bg-clip-text text-transparent">
            Dev Portal
          </h1>
          <p className="text-cosmic-accent opacity-75">
            System monitoring, logs, and administrative controls
          </p>
        </div>

        <Tabs defaultValue="logs" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-cosmic-light bg-opacity-20 backdrop-blur-sm">
            <TabsTrigger value="logs" className="data-[state=active]:bg-cosmic-accent">
              <Bug className="w-4 h-4 mr-2" />
              Error Logs
            </TabsTrigger>
            <TabsTrigger value="health" className="data-[state=active]:bg-cosmic-accent">
              <Server className="w-4 h-4 mr-2" />
              System Health
            </TabsTrigger>
            <TabsTrigger value="controls" className="data-[state=active]:bg-cosmic-accent">
              <Settings className="w-4 h-4 mr-2" />
              Controls
            </TabsTrigger>
          </TabsList>

          {/* Logs Tab */}
          <TabsContent value="logs" className="mt-6">
            <Card className="bg-cosmic-light bg-opacity-10 backdrop-blur-sm border-cosmic-accent border-opacity-30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <Bug className="w-5 h-5 mr-2 text-cosmic-highlight" />
                      System Logs
                    </CardTitle>
                    <CardDescription className="text-cosmic-accent opacity-75">
                      Activity logs and agent interactions
                    </CardDescription>
                  </div>
                  <Button
                    onClick={loadLogs}
                    disabled={logsLoading}
                    className="bg-cosmic-accent hover:bg-cosmic-highlight"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${logsLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div>
                    <Label htmlFor="search" className="text-cosmic-accent">
                      Search
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-cosmic-accent opacity-50" />
                      <Input
                        id="search"
                        placeholder="Search logs..."
                        value={filters.searchTerm}
                        onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                        className="pl-10 bg-cosmic-dark border-cosmic-accent border-opacity-30 text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="category" className="text-cosmic-accent">
                      Category
                    </Label>
                    <Select
                      value={filters.category}
                      onValueChange={(value) => handleFilterChange('category', value)}
                    >
                      <SelectTrigger className="bg-cosmic-dark border-cosmic-accent border-opacity-30">
                        <SelectValue placeholder="All categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All categories</SelectItem>
                        <SelectItem value="agent">Agent</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                        <SelectItem value="client">Client</SelectItem>
                        <SelectItem value="invoice">Invoice</SelectItem>
                        <SelectItem value="job">Job</SelectItem>
                        <SelectItem value="media">Media</SelectItem>
                        <SelectItem value="document">Document</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="severity" className="text-cosmic-accent">
                      Severity
                    </Label>
                    <Select
                      value={filters.severity}
                      onValueChange={(value) => handleFilterChange('severity', value)}
                    >
                      <SelectTrigger className="bg-cosmic-dark border-cosmic-accent border-opacity-30">
                        <SelectValue placeholder="All severities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All severities</SelectItem>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status" className="text-cosmic-accent">
                      Status
                    </Label>
                    <Select
                      value={filters.status}
                      onValueChange={(value) => handleFilterChange('status', value)}
                    >
                      <SelectTrigger className="bg-cosmic-dark border-cosmic-accent border-opacity-30">
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All statuses</SelectItem>
                        <SelectItem value="success">Success</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Logs Table */}
                <div className="bg-cosmic-dark bg-opacity-50 rounded-lg overflow-hidden">
                  {logsLoading ? (
                    <div className="p-4">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <Skeleton
                          key={i}
                          className="h-12 w-full mb-2 bg-cosmic-accent bg-opacity-20"
                        />
                      ))}
                    </div>
                  ) : logsError ? (
                    <div className="p-4 text-center text-red-400">
                      <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                      {logsError}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-cosmic-accent border-opacity-30">
                          <TableHead className="text-cosmic-accent">Time</TableHead>
                          <TableHead className="text-cosmic-accent">Source</TableHead>
                          <TableHead className="text-cosmic-accent">Agent</TableHead>
                          <TableHead className="text-cosmic-accent">Severity</TableHead>
                          <TableHead className="text-cosmic-accent">Status</TableHead>
                          <TableHead className="text-cosmic-accent">Message</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {logs.map((log) => (
                          <TableRow
                            key={log.id}
                            className="border-cosmic-accent border-opacity-20 hover:bg-cosmic-accent hover:bg-opacity-10"
                          >
                            <TableCell className="text-sm text-cosmic-accent opacity-75">
                              {formatTimestamp(log.timestamp)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {log.source}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {log.agent_name || log.agent_id || 'System'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={getSeverityColor(log.severity)} className="text-xs">
                                {log.severity || 'info'}
                              </Badge>
                            </TableCell>
                            <TableCell>{getStatusIcon(log.status)}</TableCell>
                            <TableCell className="max-w-md">
                              <div className="text-sm truncate">
                                {log.description || log.input || 'No message'}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Health Tab */}
          <TabsContent value="health" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* API Uptime */}
              <Card className="bg-cosmic-light bg-opacity-10 backdrop-blur-sm border-cosmic-accent border-opacity-30">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Server className="w-5 h-5 mr-2 text-cosmic-highlight" />
                    API Uptime
                  </CardTitle>
                  <CardDescription className="text-cosmic-accent opacity-75">
                    Integration service status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {healthLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-8 w-full bg-cosmic-accent bg-opacity-20" />
                      ))}
                    </div>
                  ) : healthData ? (
                    <div className="space-y-3">
                      {Object.entries(healthData.apiUptime).map(([service, status]) => (
                        <div
                          key={service}
                          className="flex items-center justify-between p-3 bg-cosmic-dark bg-opacity-50 rounded-lg"
                        >
                          <div className="flex items-center">
                            {status ? (
                              <CheckCircle className="w-4 h-4 text-green-500 mr-3" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500 mr-3" />
                            )}
                            <span className="text-sm font-medium capitalize">{service}</span>
                          </div>
                          <Badge variant={status ? 'default' : 'destructive'} className="text-xs">
                            {status ? 'Online' : 'Offline'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-red-400 py-8">
                      <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                      {healthError || 'Failed to load health data'}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Budget Status */}
              <div className="space-y-6">
                <Card className="bg-cosmic-light bg-opacity-10 backdrop-blur-sm border-cosmic-accent border-opacity-30">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2 text-cosmic-highlight" />
                      Budget Usage
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BudgetUsageIndicator />
                  </CardContent>
                </Card>

                {/* Agent Stats */}
                <Card className="bg-cosmic-light bg-opacity-10 backdrop-blur-sm border-cosmic-accent border-opacity-30">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Activity className="w-5 h-5 mr-2 text-cosmic-highlight" />
                      Agent Performance
                    </CardTitle>
                    <CardDescription className="text-cosmic-accent opacity-75">
                      Success rates and activity metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {healthLoading ? (
                      <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <Skeleton key={i} className="h-8 w-full bg-cosmic-accent bg-opacity-20" />
                        ))}
                      </div>
                    ) : healthData ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-cosmic-accent">Total Agents</span>
                          <span className="font-medium">{healthData.agentStats.totalAgents}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-cosmic-accent">Active Agents</span>
                          <span className="font-medium">{healthData.agentStats.activeAgents}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-cosmic-accent">Success Rate</span>
                          <span className="font-medium text-green-400">
                            {healthData.agentStats.successRate.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-cosmic-accent">Failure Rate</span>
                          <span className="font-medium text-red-400">
                            {healthData.agentStats.failureRate.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-red-400 py-4">
                        <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
                        {healthError || 'Failed to load agent stats'}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* System Stats */}
            <Card className="mt-6 bg-cosmic-light bg-opacity-10 backdrop-blur-sm border-cosmic-accent border-opacity-30">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="w-5 h-5 mr-2 text-cosmic-highlight" />
                  System Statistics (24h)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {healthLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full bg-cosmic-accent bg-opacity-20" />
                    ))}
                  </div>
                ) : healthData ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-cosmic-dark bg-opacity-50 rounded-lg">
                      <div className="text-2xl font-bold text-cosmic-highlight">
                        {healthData.systemStats.totalLogs}
                      </div>
                      <div className="text-sm text-cosmic-accent opacity-75">Total Logs</div>
                    </div>
                    <div className="text-center p-4 bg-cosmic-dark bg-opacity-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-400">
                        {healthData.systemStats.errorCount}
                      </div>
                      <div className="text-sm text-cosmic-accent opacity-75">Errors</div>
                    </div>
                    <div className="text-center p-4 bg-cosmic-dark bg-opacity-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-400">
                        {healthData.systemStats.warningCount}
                      </div>
                      <div className="text-sm text-cosmic-accent opacity-75">Warnings</div>
                    </div>
                    <div className="text-center p-4 bg-cosmic-dark bg-opacity-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-400">
                        {healthData.systemStats.recentActivity}
                      </div>
                      <div className="text-sm text-cosmic-accent opacity-75">Recent Activity</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-red-400 py-8">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                    {healthError || 'Failed to load system stats'}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Controls Tab */}
          <TabsContent value="controls" className="mt-6">
            <Card className="bg-cosmic-light bg-opacity-10 backdrop-blur-sm border-cosmic-accent border-opacity-30">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2 text-cosmic-highlight" />
                  System Controls
                </CardTitle>
                <CardDescription className="text-cosmic-accent opacity-75">
                  Administrative settings and system modes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {settingsLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full bg-cosmic-accent bg-opacity-20" />
                    ))}
                  </div>
                ) : (
                  <>
                    {/* Safe Mode */}
                    <div className="flex items-center justify-between p-4 bg-cosmic-dark bg-opacity-50 rounded-lg">
                      <div className="flex items-center">
                        <Shield className="w-8 h-8 text-cosmic-highlight mr-4" />
                        <div>
                          <h3 className="font-medium text-white">Safe Mode</h3>
                          <p className="text-sm text-cosmic-accent opacity-75">
                            Force GPT-3.5 for all AI requests to reduce costs and improve
                            reliability
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.safeMode}
                        onCheckedChange={(checked) => handleSettingsChange('safeMode', checked)}
                        disabled={settingsSaving}
                        className="data-[state=checked]:bg-cosmic-accent"
                      />
                    </div>

                    {/* Debug Mode */}
                    <div className="flex items-center justify-between p-4 bg-cosmic-dark bg-opacity-50 rounded-lg">
                      <div className="flex items-center">
                        <Eye className="w-8 h-8 text-cosmic-highlight mr-4" />
                        <div>
                          <h3 className="font-medium text-white">Debug Mode</h3>
                          <p className="text-sm text-cosmic-accent opacity-75">
                            Enable verbose agent reasoning and detailed logging for troubleshooting
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.debugMode}
                        onCheckedChange={(checked) => handleSettingsChange('debugMode', checked)}
                        disabled={settingsSaving}
                        className="data-[state=checked]:bg-cosmic-accent"
                      />
                    </div>

                    {settingsSaving && (
                      <div className="text-center text-cosmic-accent opacity-75">
                        <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2" />
                        Saving settings...
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DevPortal;
