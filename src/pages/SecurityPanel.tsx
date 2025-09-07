import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Plus,
  Trash2,
  Eye,
  Key,
  Shield,
  Settings,
  Activity,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  getApiKeys,
  addApiKey,
  deleteApiKey,
  getAuditLogs,
  getSecuritySettings,
  updateSecuritySetting,
  validateApiKeyFormat,
} from '@/api/security';
import { enforceKeyRotation, getSecurityPolicies } from '@/api/compliance';
import { supabase } from '@/lib/supabaseClient';
import {
  ApiServiceType,
  MaskedApiKeyRecord,
  AuditLogRecord,
  SecuritySettingRecord,
  AddApiKeyForm,
  SecuritySettingsForm,
  SecurityPolicy,
} from '@/lib/types';

const SecurityPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'api-keys' | 'audit-logs' | 'settings'>('api-keys');
  const [apiKeys, setApiKeys] = useState<MaskedApiKeyRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettingRecord[]>([]);
  const [securityPolicy, setSecurityPolicy] = useState<SecurityPolicy | null>(null);
  const [flaggedKeys, setFlaggedKeys] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingKey, setIsAddingKey] = useState(false);
  const [isDeletingKey, setIsDeletingKey] = useState<string | null>(null);
  const [showAddKeyDialog, setShowAddKeyDialog] = useState(false);
  const [companyId, setCompanyId] = useState<string>('');

  // Form states
  const [addKeyForm, setAddKeyForm] = useState<AddApiKeyForm>({
    service: 'openai',
    apiKey: '',
  });

  const [settingsForm, setSettingsForm] = useState<SecuritySettingsForm>({
    twoFactorEnforced: false,
    keyRotationDays: 90,
    auditRetentionDays: 365,
    maxFailedLoginAttempts: 5,
  });

  // Service options for dropdown
  const serviceOptions: { value: ApiServiceType; label: string; placeholder: string }[] = [
    { value: 'openai', label: 'OpenAI', placeholder: 'sk-...' },
    { value: 'anthropic', label: 'Anthropic Claude', placeholder: 'sk-ant-...' },
    { value: 'elevenlabs', label: 'ElevenLabs', placeholder: 'API Key' },
    { value: 'heygen', label: 'HeyGen', placeholder: 'API Key' },
    { value: 'stability', label: 'Stability AI', placeholder: 'sk-...' },
    { value: 'stripe', label: 'Stripe', placeholder: 'sk_test_...' },
    { value: 'notion', label: 'Notion', placeholder: 'secret_...' },
    { value: 'drive', label: 'Google Drive', placeholder: 'API Key' },
    { value: 'google-gemini', label: 'Google Gemini', placeholder: 'API Key' },
    { value: 'midjourney', label: 'Midjourney', placeholder: 'API Key' },
    { value: 'other', label: 'Other', placeholder: 'API Key' },
  ];

  // Initialize component
  useEffect(() => {
    initializeComponent();
  }, []);

  const initializeComponent = async () => {
    setIsLoading(true);
    try {
      // Get current user and their company
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's company
      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (userData?.company_id) {
        setCompanyId(userData.company_id);
        await loadAllData(userData.company_id);
      }
    } catch (error) {
      console.error('Error initializing security panel:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllData = async (companyId: string) => {
    await Promise.all([
      loadApiKeys(companyId),
      loadAuditLogs(companyId),
      loadSecuritySettings(companyId),
      loadSecurityPolicy(companyId),
      checkKeyRotation(companyId),
    ]);
  };

  const loadApiKeys = async (companyId: string) => {
    const { data, error } = await getApiKeys(companyId);
    if (!error && data) {
      setApiKeys(data);
    }
  };

  const loadAuditLogs = async (companyId: string) => {
    const { data, error } = await getAuditLogs(companyId, 100);
    if (!error && data) {
      setAuditLogs(data as AuditLogRecord[]);
    }
  };

  const loadSecuritySettings = async (companyId: string) => {
    const { data, error } = await getSecuritySettings(companyId);
    if (!error && data) {
      setSecuritySettings(data);
      // Update form with current settings
      const settings = data.reduce((acc: any, setting) => {
        acc[setting.setting_key] = setting.setting_value;
        return acc;
      }, {});

      setSettingsForm({
        twoFactorEnforced: settings.two_factor_enforced || false,
        keyRotationDays: settings.key_rotation_days || 90,
        auditRetentionDays: settings.audit_retention_days || 365,
        maxFailedLoginAttempts: settings.max_failed_login_attempts || 5,
      });
    }
  };

  const loadSecurityPolicy = async (companyId: string) => {
    const { data, error } = await getSecurityPolicies(companyId);
    if (!error && data) {
      setSecurityPolicy(data);
    }
  };

  const checkKeyRotation = async (companyId: string) => {
    const { flaggedKeys: flagged, error } = await enforceKeyRotation(companyId);
    if (!error) {
      setFlaggedKeys(flagged);
    }
  };

  const handleAddApiKey = async () => {
    if (!companyId || !addKeyForm.apiKey.trim()) return;

    // Validate API key format
    if (!validateApiKeyFormat(addKeyForm.service, addKeyForm.apiKey)) {
      alert('Invalid API key format for the selected service. Please check and try again.');
      return;
    }

    setIsAddingKey(true);
    try {
      const { error } = await addApiKey({
        companyId,
        service: addKeyForm.service,
        apiKey: addKeyForm.apiKey,
      });

      if (!error) {
        setShowAddKeyDialog(false);
        setAddKeyForm({ service: 'openai', apiKey: '' });
        await loadApiKeys(companyId);
        await loadAuditLogs(companyId); // Refresh audit logs to show the new entry
        await checkKeyRotation(companyId); // Refresh key rotation status
      } else {
        alert('Failed to add API key: ' + error);
      }
    } catch (error) {
      console.error('Error adding API key:', error);
      alert('An unexpected error occurred while adding the API key.');
    } finally {
      setIsAddingKey(false);
    }
  };

  const handleDeleteApiKey = async (keyId: string, service: string) => {
    setIsDeletingKey(keyId);
    try {
      const { error } = await deleteApiKey(keyId);

      if (!error) {
        await loadApiKeys(companyId);
        await loadAuditLogs(companyId); // Refresh audit logs to show the deletion
        await checkKeyRotation(companyId); // Refresh key rotation status
      } else {
        alert('Failed to delete API key: ' + error);
      }
    } catch (error) {
      console.error('Error deleting API key:', error);
      alert('An unexpected error occurred while deleting the API key.');
    } finally {
      setIsDeletingKey(null);
    }
  };

  const handleUpdateSetting = async (key: string, value: any) => {
    try {
      const { error } = await updateSecuritySetting(companyId, key, value);
      if (!error) {
        await loadSecuritySettings(companyId);
      } else {
        alert('Failed to update setting: ' + error);
      }
    } catch (error) {
      console.error('Error updating setting:', error);
      alert('An unexpected error occurred while updating the setting.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getServiceBadgeColor = (service: ApiServiceType) => {
    const colors: Record<ApiServiceType, string> = {
      openai: 'bg-green-100 text-green-800',
      anthropic: 'bg-purple-100 text-purple-800',
      elevenlabs: 'bg-blue-100 text-blue-800',
      heygen: 'bg-pink-100 text-pink-800',
      stability: 'bg-orange-100 text-orange-800',
      stripe: 'bg-indigo-100 text-indigo-800',
      notion: 'bg-gray-100 text-gray-800',
      drive: 'bg-red-100 text-red-800',
      'google-gemini': 'bg-cyan-100 text-cyan-800',
      claude: 'bg-purple-100 text-purple-800',
      midjourney: 'bg-yellow-100 text-yellow-800',
      other: 'bg-slate-100 text-slate-800',
    };
    return colors[service] || colors.other;
  };

  const getActionBadgeColor = (action: string) => {
    const colors: Record<string, string> = {
      create_api_key: 'bg-green-100 text-green-800',
      delete_api_key: 'bg-red-100 text-red-800',
      use_api_key: 'bg-blue-100 text-blue-800',
      view_api_key: 'bg-gray-100 text-gray-800',
      login: 'bg-green-100 text-green-800',
      logout: 'bg-yellow-100 text-yellow-800',
      failed_login: 'bg-red-100 text-red-800',
      permission_denied: 'bg-orange-100 text-orange-800',
      system_access: 'bg-purple-100 text-purple-800',
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground animate-pulse" />
          <p className="mt-2 text-muted-foreground">Loading security panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <Shield className="h-8 w-8 text-cosmic-accent" />
        <div>
          <h1 className="text-3xl font-bold">Security Panel</h1>
          <p className="text-muted-foreground">
            Manage API keys, audit logs, and security settings
          </p>
        </div>
      </div>

      {/* Main Content */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as any)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="api-keys" className="flex items-center space-x-2">
            <Key className="h-4 w-4" />
            <span>API Keys</span>
          </TabsTrigger>
          <TabsTrigger value="audit-logs" className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Audit Logs</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </TabsTrigger>
        </TabsList>

        {/* API Keys Tab */}
        <TabsContent value="api-keys" className="space-y-4">
          <Card className="bg-gradient-to-br from-cosmic-light/20 to-cosmic-dark/20 border-cosmic-accent/20">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Key className="h-5 w-5" />
                  <span>API Key Vault</span>
                </CardTitle>
                <CardDescription>
                  Securely store and manage your API keys. Keys are encrypted at rest.
                </CardDescription>
              </div>
              <Dialog open={showAddKeyDialog} onOpenChange={setShowAddKeyDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-cosmic-accent hover:bg-cosmic-accent/80">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Key
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add API Key</DialogTitle>
                    <DialogDescription>
                      Add a new API key for a service. The key will be encrypted before storage.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="service" className="text-right">
                        Service
                      </Label>
                      <Select
                        value={addKeyForm.service}
                        onValueChange={(value) =>
                          setAddKeyForm({ ...addKeyForm, service: value as ApiServiceType })
                        }
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select service" />
                        </SelectTrigger>
                        <SelectContent>
                          {serviceOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="apiKey" className="text-right">
                        API Key
                      </Label>
                      <Input
                        id="apiKey"
                        type="password"
                        placeholder={
                          serviceOptions.find((s) => s.value === addKeyForm.service)?.placeholder ||
                          'API Key'
                        }
                        value={addKeyForm.apiKey}
                        onChange={(e) => setAddKeyForm({ ...addKeyForm, apiKey: e.target.value })}
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="submit"
                      onClick={handleAddApiKey}
                      disabled={isAddingKey || !addKeyForm.apiKey.trim()}
                      className="bg-cosmic-accent hover:bg-cosmic-accent/80"
                    >
                      {isAddingKey ? 'Adding...' : 'Add Key'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-4">
              {flaggedKeys.length > 0 && (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>API Key Rotation Required</AlertTitle>
                  <AlertDescription className="flex items-center justify-between">
                    <span>
                      {flaggedKeys.length} API key(s) are older than the rotation period (
                      {securityPolicy?.key_rotation_days || 90} days) and should be renewed.
                    </span>
                    <Link
                      to="/compliance"
                      className="inline-flex items-center text-sm text-orange-600 hover:text-orange-800"
                    >
                      Manage Compliance
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Link>
                  </AlertDescription>
                </Alert>
              )}

              {apiKeys.length === 0 ? (
                <div className="text-center py-8">
                  <Key className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">No API keys stored yet.</p>
                  <p className="text-sm text-muted-foreground">
                    Add your first API key to get started.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Masked Key</TableHead>
                      <TableHead>Last Used</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiKeys.map((key) => (
                      <TableRow key={key.id}>
                        <TableCell>
                          <Badge className={getServiceBadgeColor(key.service)}>{key.service}</Badge>
                        </TableCell>
                        <TableCell className="font-mono">{key.masked_key}</TableCell>
                        <TableCell>{key.last_used ? formatDate(key.last_used) : 'Never'}</TableCell>
                        <TableCell>{formatDate(key.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isDeletingKey === key.id}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete API Key</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete the {key.service} API key? This
                                  action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteApiKey(key.id, key.service)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="audit-logs" className="space-y-4">
          <Card className="bg-gradient-to-br from-cosmic-light/20 to-cosmic-dark/20 border-cosmic-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Audit Logs</span>
              </CardTitle>
              <CardDescription>
                Track all security-related activities and API key usage.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {auditLogs.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">No audit logs available.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{formatDate(log.timestamp)}</TableCell>
                        <TableCell>
                          <Badge className={getActionBadgeColor(log.action)}>
                            {log.action.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{log.target}</TableCell>
                        <TableCell>
                          {log.details && Object.keys(log.details).length > 0 ? (
                            <details className="text-sm">
                              <summary className="cursor-pointer hover:text-cosmic-accent">
                                View details
                              </summary>
                              <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </details>
                          ) : (
                            <span className="text-muted-foreground">No details</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card className="bg-gradient-to-br from-cosmic-light/20 to-cosmic-dark/20 border-cosmic-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Security Settings</span>
              </CardTitle>
              <CardDescription>
                Configure security policies and settings for your organization.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">Require 2FA for all user accounts</p>
                </div>
                <Switch
                  checked={settingsForm.twoFactorEnforced}
                  onCheckedChange={(checked) => {
                    setSettingsForm({ ...settingsForm, twoFactorEnforced: checked });
                    handleUpdateSetting('two_factor_enforced', checked);
                  }}
                />
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="keyRotation">API Key Rotation (days)</Label>
                  <Input
                    id="keyRotation"
                    type="number"
                    value={settingsForm.keyRotationDays}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      setSettingsForm({ ...settingsForm, keyRotationDays: value });
                      handleUpdateSetting('key_rotation_days', value);
                    }}
                    min="30"
                    max="365"
                  />
                  <p className="text-xs text-muted-foreground">
                    Automatically rotate API keys after this many days
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="auditRetention">Audit Log Retention (days)</Label>
                  <Input
                    id="auditRetention"
                    type="number"
                    value={settingsForm.auditRetentionDays}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      setSettingsForm({ ...settingsForm, auditRetentionDays: value });
                      handleUpdateSetting('audit_retention_days', value);
                    }}
                    min="30"
                    max="3650"
                  />
                  <p className="text-xs text-muted-foreground">
                    Keep audit logs for this many days
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="maxFailedAttempts">Max Failed Login Attempts</Label>
                <Input
                  id="maxFailedAttempts"
                  type="number"
                  value={settingsForm.maxFailedLoginAttempts}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setSettingsForm({ ...settingsForm, maxFailedLoginAttempts: value });
                    handleUpdateSetting('max_failed_login_attempts', value);
                  }}
                  min="3"
                  max="20"
                />
                <p className="text-xs text-muted-foreground">
                  Lock account after this many failed login attempts
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityPanel;
