import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
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
  Shield,
  Lock,
  Key,
  Database,
  FileText,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Download,
  UserX,
  Eye,
} from 'lucide-react';
import {
  getSecurityPolicies,
  updateSecurityPolicies,
  enforceKeyRotation,
  createComplianceRequest,
  getComplianceRequests,
  getDataRetentionLogs,
  validateIPAddress,
} from '@/api/compliance';
import { getApiKeys } from '@/api/security';
import { supabase } from '@/lib/supabaseClient';
import {
  SecurityPolicy,
  ComplianceRequest,
  DataRetentionLog,
  MaskedApiKeyRecord,
  IPAllowlistForm,
  ComplianceRequestForm,
} from '@/lib/types';

const Compliance: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'access-control' | 'key-management' | 'data-retention' | 'compliance-requests'
  >('access-control');
  const [securityPolicy, setSecurityPolicy] = useState<SecurityPolicy | null>(null);
  const [complianceRequests, setComplianceRequests] = useState<ComplianceRequest[]>([]);
  const [dataRetentionLogs, setDataRetentionLogs] = useState<DataRetentionLog[]>([]);
  const [apiKeys, setApiKeys] = useState<MaskedApiKeyRecord[]>([]);
  const [flaggedKeys, setFlaggedKeys] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingPolicy, setIsUpdatingPolicy] = useState(false);
  const [isCreatingRequest, setIsCreatingRequest] = useState(false);
  const [companyId, setCompanyId] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<string>('');

  // Form states
  const [ipForm, setIpForm] = useState<IPAllowlistForm>({ newIP: '' });
  const [requestForm, setRequestForm] = useState<ComplianceRequestForm>({
    request_type: 'export_data',
    request_reason: '',
  });
  const [showIPDialog, setShowIPDialog] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);

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

      setCurrentUserId(user.id);

      // Get user's company
      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (userData?.company_id) {
        setCompanyId(userData.company_id);
        await loadAllData(userData.company_id, user.id);
      }
    } catch (error) {
      console.error('Error initializing compliance panel:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllData = async (companyId: string, userId: string) => {
    await Promise.all([
      loadSecurityPolicy(companyId),
      loadComplianceRequests(userId),
      loadDataRetentionLogs(companyId),
      loadApiKeys(companyId),
      checkKeyRotation(companyId),
    ]);
  };

  const loadSecurityPolicy = async (companyId: string) => {
    const { data, error } = await getSecurityPolicies(companyId);
    if (!error && data) {
      setSecurityPolicy(data);
    } else if (!error && !data) {
      // Create default policy if none exists
      const defaultPolicy = {
        enforce_2fa: false,
        ip_allowlist: [],
        key_rotation_days: 90,
        data_retention_days: 365,
        gdpr_request_enabled: true,
      };
      const { data: newPolicy } = await updateSecurityPolicies(companyId, defaultPolicy);
      if (newPolicy) setSecurityPolicy(newPolicy);
    }
  };

  const loadComplianceRequests = async (userId: string) => {
    const { data, error } = await getComplianceRequests(userId);
    if (!error && data) {
      setComplianceRequests(data as ComplianceRequest[]);
    }
  };

  const loadDataRetentionLogs = async (companyId: string) => {
    const { data, error } = await getDataRetentionLogs(companyId);
    if (!error && data) {
      setDataRetentionLogs(data as DataRetentionLog[]);
    }
  };

  const loadApiKeys = async (companyId: string) => {
    const { data, error } = await getApiKeys(companyId);
    if (!error && data) {
      setApiKeys(data);
    }
  };

  const checkKeyRotation = async (companyId: string) => {
    const { flaggedKeys: flagged, error } = await enforceKeyRotation(companyId);
    if (!error) {
      setFlaggedKeys(flagged);
    }
  };

  const handleUpdatePolicy = async (updates: Partial<SecurityPolicy>) => {
    if (!companyId) return;

    setIsUpdatingPolicy(true);
    try {
      const { data, error } = await updateSecurityPolicies(companyId, updates);
      if (!error && data) {
        setSecurityPolicy(data);
        await checkKeyRotation(companyId); // Re-check key rotation if policy changed
      } else {
        alert('Failed to update security policy: ' + error);
      }
    } catch (error) {
      console.error('Error updating policy:', error);
      alert('An unexpected error occurred while updating the security policy.');
    } finally {
      setIsUpdatingPolicy(false);
    }
  };

  const handleAddIP = async () => {
    if (!ipForm.newIP.trim()) return;

    if (!validateIPAddress(ipForm.newIP)) {
      alert('Invalid IP address format. Please enter a valid IPv4 address or CIDR notation.');
      return;
    }

    const currentList = securityPolicy?.ip_allowlist || [];
    if (currentList.includes(ipForm.newIP)) {
      alert('This IP address is already in the allowlist.');
      return;
    }

    await handleUpdatePolicy({
      ip_allowlist: [...currentList, ipForm.newIP],
    });

    setIpForm({ newIP: '' });
    setShowIPDialog(false);
  };

  const handleRemoveIP = async (ipToRemove: string) => {
    const currentList = securityPolicy?.ip_allowlist || [];
    await handleUpdatePolicy({
      ip_allowlist: currentList.filter((ip) => ip !== ipToRemove),
    });
  };

  const handleCreateComplianceRequest = async () => {
    if (!companyId || !currentUserId) return;

    setIsCreatingRequest(true);
    try {
      const { error } = await createComplianceRequest(companyId, currentUserId, requestForm);
      if (!error) {
        setShowRequestDialog(false);
        setRequestForm({ request_type: 'export_data', request_reason: '' });
        await loadComplianceRequests(currentUserId);
      } else {
        alert('Failed to create compliance request: ' + error);
      }
    } catch (error) {
      console.error('Error creating compliance request:', error);
      alert('An unexpected error occurred while creating the compliance request.');
    } finally {
      setIsCreatingRequest(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getRequestTypeIcon = (type: string) => {
    switch (type) {
      case 'export_data':
        return <Download className="h-4 w-4" />;
      case 'delete_data':
        return <UserX className="h-4 w-4" />;
      case 'access_data':
        return <Eye className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getRequestTypeLabel = (type: string) => {
    switch (type) {
      case 'export_data':
        return 'Export Data';
      case 'delete_data':
        return 'Delete Data';
      case 'access_data':
        return 'Access Data';
      default:
        return type;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'processing':
        return <Clock className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground animate-pulse" />
          <p className="mt-2 text-muted-foreground">Loading compliance panel...</p>
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
          <h1 className="text-3xl font-bold">Compliance & Security</h1>
          <p className="text-muted-foreground">
            Manage security policies, compliance requests, and data retention
          </p>
        </div>
      </div>

      {/* Main Content */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as any)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="access-control" className="flex items-center space-x-2">
            <Lock className="h-4 w-4" />
            <span>Access Control</span>
          </TabsTrigger>
          <TabsTrigger value="key-management" className="flex items-center space-x-2">
            <Key className="h-4 w-4" />
            <span>Key Management</span>
          </TabsTrigger>
          <TabsTrigger value="data-retention" className="flex items-center space-x-2">
            <Database className="h-4 w-4" />
            <span>Data Retention</span>
          </TabsTrigger>
          <TabsTrigger value="compliance-requests" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Compliance</span>
          </TabsTrigger>
        </TabsList>

        {/* Access Control Tab */}
        <TabsContent value="access-control" className="space-y-4">
          <Card className="bg-gradient-to-br from-cosmic-light/20 to-cosmic-dark/20 border-cosmic-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lock className="h-5 w-5" />
                <span>Access Control Policies</span>
              </CardTitle>
              <CardDescription>
                Configure authentication and access restrictions for your organization.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">Require 2FA for all user accounts</p>
                </div>
                <Switch
                  checked={securityPolicy?.enforce_2fa || false}
                  onCheckedChange={(checked) => handleUpdatePolicy({ enforce_2fa: checked })}
                  disabled={isUpdatingPolicy}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">IP Allowlist</Label>
                    <p className="text-sm text-muted-foreground">
                      Restrict login access to specific IP addresses
                    </p>
                  </div>
                  <Dialog open={showIPDialog} onOpenChange={setShowIPDialog}>
                    <DialogTrigger asChild>
                      <Button className="bg-cosmic-accent hover:bg-cosmic-accent/80">
                        <Plus className="h-4 w-4 mr-2" />
                        Add IP
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Add IP Address</DialogTitle>
                        <DialogDescription>
                          Add an IP address or CIDR range to the allowlist.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="ip" className="text-right">
                            IP Address
                          </Label>
                          <Input
                            id="ip"
                            placeholder="192.168.1.100 or 192.168.1.0/24"
                            value={ipForm.newIP}
                            onChange={(e) => setIpForm({ newIP: e.target.value })}
                            className="col-span-3"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          type="submit"
                          onClick={handleAddIP}
                          disabled={!ipForm.newIP.trim()}
                          className="bg-cosmic-accent hover:bg-cosmic-accent/80"
                        >
                          Add IP
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {securityPolicy?.ip_allowlist && securityPolicy.ip_allowlist.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>IP Address</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {securityPolicy.ip_allowlist.map((ip) => (
                        <TableRow key={ip}>
                          <TableCell className="font-mono">{ip}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveIP(ip)}
                              disabled={isUpdatingPolicy}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <Lock className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-2 text-muted-foreground">No IP restrictions configured.</p>
                    <p className="text-sm text-muted-foreground">
                      All IP addresses are currently allowed.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Key Management Tab */}
        <TabsContent value="key-management" className="space-y-4">
          <Card className="bg-gradient-to-br from-cosmic-light/20 to-cosmic-dark/20 border-cosmic-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Key className="h-5 w-5" />
                <span>API Key Management</span>
              </CardTitle>
              <CardDescription>Monitor and manage API key rotation and security.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="rotation">Key Rotation Period (days)</Label>
                <div className="flex items-center space-x-4">
                  <Slider
                    id="rotation"
                    min={30}
                    max={365}
                    step={30}
                    value={[securityPolicy?.key_rotation_days || 90]}
                    onValueChange={(value) => handleUpdatePolicy({ key_rotation_days: value[0] })}
                    className="flex-1"
                    disabled={isUpdatingPolicy}
                  />
                  <span className="text-sm font-medium w-12 text-center">
                    {securityPolicy?.key_rotation_days || 90}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  API keys older than this period will be flagged for renewal.
                </p>
              </div>

              <Separator />

              {flaggedKeys.length > 0 && (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Keys Requiring Renewal</AlertTitle>
                  <AlertDescription>
                    {flaggedKeys.length} API key(s) are older than the rotation period and should be
                    renewed.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <Label className="text-base">API Key Status</Label>
                {apiKeys.length === 0 ? (
                  <div className="text-center py-8">
                    <Key className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-2 text-muted-foreground">No API keys configured.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Service</TableHead>
                        <TableHead>Masked Key</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {apiKeys.map((key) => {
                        const isFlagged = flaggedKeys.includes(key.id);
                        const createdDate = new Date(key.created_at);
                        const daysOld = Math.floor(
                          (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24),
                        );

                        return (
                          <TableRow key={key.id}>
                            <TableCell>
                              <Badge className="bg-blue-100 text-blue-800">{key.service}</Badge>
                            </TableCell>
                            <TableCell className="font-mono">{key.masked_key}</TableCell>
                            <TableCell>{formatDate(key.created_at)}</TableCell>
                            <TableCell>
                              {isFlagged ? (
                                <Badge className="bg-orange-100 text-orange-800">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Renewal Due ({daysOld}d old)
                                </Badge>
                              ) : (
                                <Badge className="bg-green-100 text-green-800">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Active ({daysOld}d old)
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Retention Tab */}
        <TabsContent value="data-retention" className="space-y-4">
          <Card className="bg-gradient-to-br from-cosmic-light/20 to-cosmic-dark/20 border-cosmic-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Data Retention Policies</span>
              </CardTitle>
              <CardDescription>
                Configure how long different types of data are retained in the system.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="retention">Data Retention Period (days)</Label>
                <div className="flex items-center space-x-4">
                  <Slider
                    id="retention"
                    min={30}
                    max={1095}
                    step={30}
                    value={[securityPolicy?.data_retention_days || 365]}
                    onValueChange={(value) => handleUpdatePolicy({ data_retention_days: value[0] })}
                    className="flex-1"
                    disabled={isUpdatingPolicy}
                  />
                  <span className="text-sm font-medium w-16 text-center">
                    {securityPolicy?.data_retention_days || 365}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Data older than this period may be automatically archived or deleted.
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label className="text-base">Data Categories</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Retention Status</TableHead>
                      <TableHead>Last Cleanup</TableHead>
                      <TableHead>Next Cleanup</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dataRetentionLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="capitalize">{log.data_category}</TableCell>
                        <TableCell>
                          <Badge className="bg-blue-100 text-blue-800">
                            {log.record_count} records
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {log.last_cleanup ? formatDate(log.last_cleanup) : 'Never'}
                        </TableCell>
                        <TableCell>
                          {log.next_cleanup ? formatDate(log.next_cleanup) : 'Not scheduled'}
                        </TableCell>
                      </TableRow>
                    ))}
                    {dataRetentionLogs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8">
                          <Database className="mx-auto h-12 w-12 text-muted-foreground" />
                          <p className="mt-2 text-muted-foreground">No retention data available.</p>
                          <p className="text-sm text-muted-foreground">
                            Data retention logs will appear after the first cleanup cycle.
                          </p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Requests Tab */}
        <TabsContent value="compliance-requests" className="space-y-4">
          <Card className="bg-gradient-to-br from-cosmic-light/20 to-cosmic-dark/20 border-cosmic-accent/20">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>GDPR Compliance Requests</span>
                </CardTitle>
                <CardDescription>
                  Manage data export, deletion, and access requests.
                </CardDescription>
              </div>
              <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-cosmic-accent hover:bg-cosmic-accent/80">
                    <Plus className="h-4 w-4 mr-2" />
                    New Request
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Create Compliance Request</DialogTitle>
                    <DialogDescription>
                      Submit a GDPR/CCPA compliance request for your data.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="type" className="text-right">
                        Request Type
                      </Label>
                      <select
                        id="type"
                        value={requestForm.request_type}
                        onChange={(e) =>
                          setRequestForm({
                            ...requestForm,
                            request_type: e.target.value as any,
                          })
                        }
                        className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="export_data">Export My Data</option>
                        <option value="delete_data">Delete My Data</option>
                        <option value="access_data">Access My Data</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="reason" className="text-right">
                        Reason
                      </Label>
                      <textarea
                        id="reason"
                        placeholder="Please provide a reason for this request..."
                        value={requestForm.request_reason}
                        onChange={(e) =>
                          setRequestForm({
                            ...requestForm,
                            request_reason: e.target.value,
                          })
                        }
                        className="col-span-3 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="submit"
                      onClick={handleCreateComplianceRequest}
                      disabled={isCreatingRequest || !requestForm.request_reason.trim()}
                      className="bg-cosmic-accent hover:bg-cosmic-accent/80"
                    >
                      {isCreatingRequest ? 'Submitting...' : 'Submit Request'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {complianceRequests.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">No compliance requests yet.</p>
                  <p className="text-sm text-muted-foreground">
                    Your GDPR/CCPA compliance requests will appear here.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {complianceRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getRequestTypeIcon(request.request_type)}
                            <span>{getRequestTypeLabel(request.request_type)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(request.status)}>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(request.status)}
                              <span className="capitalize">{request.status}</span>
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(request.requested_at)}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {request.request_reason || 'No reason provided'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Compliance;
