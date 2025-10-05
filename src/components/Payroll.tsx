import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  getPayrollTransactions,
  createPayrollTransaction,
  updatePayrollTransaction,
  getEmployeesWithAgents,
  getAgentsWithPermissions,
  PayrollTransaction,
  EmployeeWithAgent,
  Agent,
  getPayrollRules,
  createPayrollRule,
  updatePayrollRule,
  deletePayrollRule,
  PayrollRule,
  approvePayrollTransaction,
  markPayrollAsPaid,
  bulkApprovePayrollTransactions,
  getEmployeeNotifications,
  EmployeeNotification,
  markNotificationAsRead,
} from '@/api/hr';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DollarSign,
  Plus,
  Edit,
  TrendingUp,
  Users,
  Bot,
  Calendar,
  Loader2,
  Search,
  Filter,
  Download,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  Bell,
  CheckSquare,
  Square,
  CreditCard,
  Building,
  Percent,
  Timer,
} from 'lucide-react';

interface PayrollProps {
  onTransactionSelect?: (transaction: PayrollTransaction) => void;
}

const Payroll: React.FC<PayrollProps> = ({ onTransactionSelect }) => {
  const [transactions, setTransactions] = useState<PayrollTransaction[]>([]);
  const [employees, setEmployees] = useState<EmployeeWithAgent[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [payrollRules, setPayrollRules] = useState<PayrollRule[]>([]);
  const [notifications, setNotifications] = useState<EmployeeNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<PayrollTransaction | null>(null);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [selectedRule, setSelectedRule] = useState<PayrollRule | null>(null);
  const [activeTab, setActiveTab] = useState<'transactions' | 'rules' | 'notifications'>(
    'transactions',
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [transactionForm, setTransactionForm] = useState({
    employee_id: '',
    agent_id: '',
    service_id: '',
    amount: '',
    period_start: '',
    period_end: '',
    status: 'pending' as const,
    payment_date: '',
    notes: '',
  });

  const [ruleForm, setRuleForm] = useState({
    name: '',
    role: '',
    department: '',
    employee_id: '',
    agent_id: '',
    service_id: '',
    rate_type: 'hourly' as const,
    amount: '',
    is_percentage: false,
    is_active: true,
    priority: 0,
    effective_date: '',
    expiration_date: '',
  });

  const [paymentForm, setPaymentForm] = useState({
    payment_method: 'zelle' as const,
    payment_reference: '',
  });

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [transactionsResult, employeesResult, agentsResult, rulesResult, notificationsResult] =
        await Promise.all([
          getPayrollTransactions(),
          getEmployeesWithAgents(),
          getAgentsWithPermissions(),
          getPayrollRules(),
          getEmployeeNotifications(),
        ]);

      if (transactionsResult.data) {
        setTransactions(transactionsResult.data);
      }
      if (employeesResult.data) {
        setEmployees(employeesResult.data);
      }
      if (agentsResult.data) {
        setAgents(agentsResult.data);
      }
      if (rulesResult.data) {
        setPayrollRules(rulesResult.data);
      }
      if (notificationsResult.data) {
        setNotifications(notificationsResult.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter transactions based on search, status, and date
  const filteredTransactions = transactions.filter((transaction) => {
    const entity = transaction.employee_id
      ? employees.find((e) => e.id === transaction.employee_id)
      : agents.find((a) => a.id === transaction.agent_id);

    const matchesSearch =
      !searchQuery ||
      (entity?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.notes?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;

    const matchesDate = (() => {
      if (dateFilter === 'all') return true;
      const now = new Date();
      const transactionDate = new Date(transaction.created_at);

      switch (dateFilter) {
        case 'this_month':
          return (
            transactionDate.getMonth() === now.getMonth() &&
            transactionDate.getFullYear() === now.getFullYear()
          );
        case 'last_month':
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
          return (
            transactionDate.getMonth() === lastMonth.getMonth() &&
            transactionDate.getFullYear() === lastMonth.getFullYear()
          );
        case 'this_year':
          return transactionDate.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    })();

    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleCreateTransaction = async () => {
    if (!transactionForm.amount || (!transactionForm.employee_id && !transactionForm.agent_id)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const transactionData = {
        employee_id: transactionForm.employee_id || undefined,
        agent_id: transactionForm.agent_id || undefined,
        service_id: transactionForm.service_id || undefined,
        amount: parseFloat(transactionForm.amount),
        period_start: transactionForm.period_start,
        period_end: transactionForm.period_end,
        status: transactionForm.status,
        payment_date: transactionForm.payment_date || undefined,
        notes: transactionForm.notes || undefined,
      };

      const result = await createPayrollTransaction(transactionData);
      if (result.data) {
        setTransactions((prev) => [result.data!, ...prev]);
        setIsCreateDialogOpen(false);
        resetForm();
      } else {
        console.error('Error creating transaction:', result.error);
      }
    } catch (error) {
      console.error('Error creating transaction:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTransaction = async () => {
    if (!selectedTransaction) return;

    setIsSubmitting(true);
    try {
      const updateData = {
        employee_id: transactionForm.employee_id || undefined,
        agent_id: transactionForm.agent_id || undefined,
        service_id: transactionForm.service_id || undefined,
        amount: parseFloat(transactionForm.amount),
        period_start: transactionForm.period_start,
        period_end: transactionForm.period_end,
        status: transactionForm.status,
        payment_date: transactionForm.payment_date || undefined,
        notes: transactionForm.notes || undefined,
      };

      const result = await updatePayrollTransaction(selectedTransaction.id, updateData);
      if (result.data) {
        setTransactions((prev) =>
          prev.map((t) => (t.id === selectedTransaction.id ? result.data! : t)),
        );
        setIsEditDialogOpen(false);
        resetForm();
      } else {
        console.error('Error updating transaction:', result.error);
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async (transactionId: string, newStatus: string) => {
    try {
      const result = await updatePayrollTransaction(transactionId, {
        status: newStatus,
        payment_date: newStatus === 'paid' ? new Date().toISOString().split('T')[0] : undefined,
      });
      if (result.data) {
        setTransactions((prev) => prev.map((t) => (t.id === transactionId ? result.data! : t)));
      }
    } catch (error) {
      console.error('Error updating transaction status:', error);
    }
  };

  const resetForm = () => {
    setTransactionForm({
      employee_id: '',
      agent_id: '',
      service_id: '',
      amount: '',
      period_start: '',
      period_end: '',
      status: 'pending',
      payment_date: '',
      notes: '',
    });
    setSelectedTransaction(null);
  };

  const openEditDialog = (transaction: PayrollTransaction) => {
    setSelectedTransaction(transaction);
    setTransactionForm({
      employee_id: transaction.employee_id || '',
      agent_id: transaction.agent_id || '',
      service_id: transaction.service_id || '',
      amount: transaction.amount.toString(),
      period_start: transaction.period_start,
      period_end: transaction.period_end,
      status: transaction.status,
      payment_date: transaction.payment_date || '',
      notes: transaction.notes || '',
    });
    setIsEditDialogOpen(true);
  };

  // Payroll Rules Handlers
  const handleCreateRule = async () => {
    if (!ruleForm.name || !ruleForm.amount) {
      return;
    }

    setIsSubmitting(true);
    try {
      const ruleData = {
        name: ruleForm.name,
        role: ruleForm.role || undefined,
        department: ruleForm.department || undefined,
        employee_id: ruleForm.employee_id || undefined,
        agent_id: ruleForm.agent_id || undefined,
        service_id: ruleForm.service_id || undefined,
        rate_type: ruleForm.rate_type,
        amount: parseFloat(ruleForm.amount),
        is_percentage: ruleForm.is_percentage,
        is_active: ruleForm.is_active,
        priority: ruleForm.priority,
        effective_date: ruleForm.effective_date || new Date().toISOString().split('T')[0],
        expiration_date: ruleForm.expiration_date || undefined,
      };

      const result = await createPayrollRule(ruleData);
      if (result.data) {
        setPayrollRules((prev) => [result.data!, ...prev]);
        setIsRuleDialogOpen(false);
        resetRuleForm();
      } else {
        console.error('Error creating rule:', result.error);
      }
    } catch (error) {
      console.error('Error creating rule:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRule = async () => {
    if (!selectedRule) return;

    setIsSubmitting(true);
    try {
      const updateData = {
        name: ruleForm.name,
        role: ruleForm.role || undefined,
        department: ruleForm.department || undefined,
        employee_id: ruleForm.employee_id || undefined,
        agent_id: ruleForm.agent_id || undefined,
        service_id: ruleForm.service_id || undefined,
        rate_type: ruleForm.rate_type,
        amount: parseFloat(ruleForm.amount),
        is_percentage: ruleForm.is_percentage,
        is_active: ruleForm.is_active,
        priority: ruleForm.priority,
        effective_date: ruleForm.effective_date,
        expiration_date: ruleForm.expiration_date || undefined,
      };

      const result = await updatePayrollRule(selectedRule.id, updateData);
      if (result.data) {
        setPayrollRules((prev) => prev.map((r) => (r.id === selectedRule.id ? result.data! : r)));
        setIsRuleDialogOpen(false);
        resetRuleForm();
      } else {
        console.error('Error updating rule:', result.error);
      }
    } catch (error) {
      console.error('Error updating rule:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this payroll rule?')) return;

    try {
      const result = await deletePayrollRule(ruleId);
      if (result.data) {
        setPayrollRules((prev) => prev.filter((r) => r.id !== ruleId));
      } else {
        console.error('Error deleting rule:', result.error);
      }
    } catch (error) {
      console.error('Error deleting rule:', error);
    }
  };

  const openRuleEditDialog = (rule: PayrollRule) => {
    setSelectedRule(rule);
    setRuleForm({
      name: rule.name,
      role: rule.role || '',
      department: rule.department || '',
      employee_id: rule.employee_id || '',
      agent_id: rule.agent_id || '',
      service_id: rule.service_id || '',
      rate_type: rule.rate_type,
      amount: rule.amount.toString(),
      is_percentage: rule.is_percentage,
      is_active: rule.is_active,
      priority: rule.priority,
      effective_date: rule.effective_date,
      expiration_date: rule.expiration_date || '',
    });
    setIsRuleDialogOpen(true);
  };

  const resetRuleForm = () => {
    setRuleForm({
      name: '',
      role: '',
      department: '',
      employee_id: '',
      agent_id: '',
      service_id: '',
      rate_type: 'hourly',
      amount: '',
      is_percentage: false,
      is_active: true,
      priority: 0,
      effective_date: '',
      expiration_date: '',
    });
    setSelectedRule(null);
  };

  // Enhanced Approval Workflow Handlers
  const handleApproveTransaction = async (transactionId: string) => {
    try {
      const result = await approvePayrollTransaction(transactionId, 'admin'); // In real app, get current user
      if (result.data) {
        setTransactions((prev) => prev.map((t) => (t.id === transactionId ? result.data! : t)));
      }
    } catch (error) {
      console.error('Error approving transaction:', error);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedTransactions.length === 0) return;

    try {
      const result = await bulkApprovePayrollTransactions(selectedTransactions, 'admin');
      if (result.data) {
        setTransactions((prev) =>
          prev.map((t) => {
            const updated = result.data!.find((u) => u.id === t.id);
            return updated || t;
          }),
        );
        setSelectedTransactions([]);
      }
    } catch (error) {
      console.error('Error bulk approving transactions:', error);
    }
  };

  const handleMarkAsPaid = async (transactionId: string) => {
    setSelectedTransaction(transactions.find((t) => t.id === transactionId) || null);
    setIsPaymentDialogOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedTransaction) return;

    setIsSubmitting(true);
    try {
      const result = await markPayrollAsPaid(
        selectedTransaction.id,
        paymentForm.payment_method,
        paymentForm.payment_reference,
      );
      if (result.data) {
        setTransactions((prev) =>
          prev.map((t) => (t.id === selectedTransaction.id ? result.data! : t)),
        );
        setIsPaymentDialogOpen(false);
        setPaymentForm({ payment_method: 'zelle', payment_reference: '' });
        setSelectedTransaction(null);
      }
    } catch (error) {
      console.error('Error marking as paid:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkNotificationRead = async (notificationId: string) => {
    try {
      const result = await markNotificationAsRead(notificationId);
      if (result.data) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n)),
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Selection handlers
  const handleSelectTransaction = (transactionId: string, selected: boolean) => {
    if (selected) {
      setSelectedTransactions((prev) => [...prev, transactionId]);
    } else {
      setSelectedTransactions((prev) => prev.filter((id) => id !== transactionId));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      const pendingIds = filteredTransactions
        .filter((t) => t.status === 'pending')
        .map((t) => t.id);
      setSelectedTransactions(pendingIds);
    } else {
      setSelectedTransactions([]);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      processed: 'default',
      paid: 'outline',
      failed: 'destructive',
    };
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getEntityName = (transaction: PayrollTransaction) => {
    if (transaction.employee_id) {
      const employee = employees.find((e) => e.id === transaction.employee_id);
      return employee?.name || 'Unknown Employee';
    } else if (transaction.agent_id) {
      const agent = agents.find((a) => a.id === transaction.agent_id);
      return agent?.name || 'Unknown Agent';
    }
    return 'Unknown';
  };

  const getEntityType = (transaction: PayrollTransaction) => {
    return transaction.employee_id ? 'Employee' : 'AI Agent';
  };

  // Helper functions for the new features
  const getRateTypeIcon = (rateType: string) => {
    switch (rateType) {
      case 'hourly':
        return <Timer className="w-4 h-4" />;
      case 'per-job':
        return <CheckCircle className="w-4 h-4" />;
      case 'salary':
        return <Building className="w-4 h-4" />;
      case 'percentage':
        return <Percent className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const getPaymentMethodIcon = (method?: string) => {
    switch (method) {
      case 'zelle':
        return <CreditCard className="w-4 h-4" />;
      case 'ach':
        return <Building className="w-4 h-4" />;
      case 'stripe':
        return <CreditCard className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const getNotificationTypeIcon = (type: string) => {
    switch (type) {
      case 'payout_created':
        return <Plus className="w-4 h-4 text-blue-500" />;
      case 'payout_approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'payout_paid':
        return <DollarSign className="w-4 h-4 text-purple-500" />;
      case 'payout_failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  // Calculate additional totals
  const totalApproved = filteredTransactions
    .filter((t) => t.status === 'processed')
    .reduce((sum, t) => sum + t.final_amount, 0);

  const pendingCount = filteredTransactions.filter((t) => t.status === 'pending').length;
  const approvedCount = filteredTransactions.filter((t) => t.status === 'processed').length;
  const paidCount = filteredTransactions.filter((t) => t.status === 'paid').length;

  // Calculate totals
  const totalPending = filteredTransactions
    .filter((t) => t.status === 'pending')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPaid = filteredTransactions
    .filter((t) => t.status === 'paid')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalProcessed = filteredTransactions
    .filter((t) => t.status === 'processed')
    .reduce((sum, t) => sum + t.amount, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-cosmic-accent" />
        <span className="ml-2 text-white">Loading payroll data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <DollarSign className="w-8 h-8 text-cosmic-accent" />
          <div>
            <h2 className="text-2xl font-bold text-white">Payroll Management</h2>
            <p className="text-gray-400">
              Enhanced HR + Finance integration with automated payouts and approval workflows
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {activeTab === 'transactions' && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-cosmic-accent hover:bg-cosmic-highlight">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Transaction
                </Button>
              </DialogTrigger>
            </Dialog>
          )}
          {activeTab === 'rules' && (
            <Dialog open={isRuleDialogOpen} onOpenChange={setIsRuleDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-cosmic-accent hover:bg-cosmic-highlight">
                  <Settings className="w-4 h-4 mr-2" />
                  Add Rule
                </Button>
              </DialogTrigger>
            </Dialog>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
        <TabsList className="bg-cosmic-light border border-cosmic-accent">
          <TabsTrigger
            value="transactions"
            className="flex items-center gap-2 px-4 py-2 text-white data-[state=active]:bg-cosmic-accent data-[state=active]:text-white"
          >
            <DollarSign className="w-4 h-4" />
            Transactions ({filteredTransactions.length})
          </TabsTrigger>
          <TabsTrigger
            value="rules"
            className="flex items-center gap-2 px-4 py-2 text-white data-[state=active]:bg-cosmic-accent data-[state=active]:text-white"
          >
            <Settings className="w-4 h-4" />
            Rules ({payrollRules.length})
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2 px-4 py-2 text-white data-[state=active]:bg-cosmic-accent data-[state=active]:text-white"
          >
            <Bell className="w-4 h-4" />
            Notifications ({notifications.filter((n) => !n.is_read).length})
          </TabsTrigger>
        </TabsList>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6 mt-6">
          {/* Enhanced Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-cosmic-dark border-cosmic-light">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  Pending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{pendingCount}</div>
                <p className="text-gray-400 text-xs">${totalPending.toFixed(2)}</p>
              </CardContent>
            </Card>

            <Card className="bg-cosmic-dark border-cosmic-light">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                  Approved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{approvedCount}</div>
                <p className="text-gray-400 text-xs">${totalApproved.toFixed(2)}</p>
              </CardContent>
            </Card>

            <Card className="bg-cosmic-dark border-cosmic-light">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  Paid
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{paidCount}</div>
                <p className="text-gray-400 text-xs">${totalPaid.toFixed(2)}</p>
              </CardContent>
            </Card>

            <Card className="bg-cosmic-dark border-cosmic-light">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-500" />
                  Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  ${(totalPending + totalApproved + totalPaid).toFixed(2)}
                </div>
                <p className="text-gray-400 text-xs">All transactions</p>
              </CardContent>
            </Card>
          </div>

          {/* Bulk Actions */}
          {selectedTransactions.length > 0 && (
            <Card className="bg-cosmic-dark border-cosmic-light">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-white">
                      {selectedTransactions.length} transactions selected
                    </span>
                    <Badge variant="outline" className="text-orange-400 border-orange-400">
                      Pending Approval
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleBulkApprove} className="bg-green-600 hover:bg-green-700">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Bulk Approve
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedTransactions([])}
                      className="text-white border-cosmic-accent"
                    >
                      Clear Selection
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filters */}
          <Card className="bg-cosmic-dark border-cosmic-light">
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search transactions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-cosmic-light border-cosmic-accent text-white"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 bg-cosmic-light border-cosmic-accent text-white">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent className="bg-cosmic-dark border-cosmic-light">
                    <SelectItem value="all" className="text-white">
                      All Statuses
                    </SelectItem>
                    <SelectItem value="pending" className="text-white">
                      Pending
                    </SelectItem>
                    <SelectItem value="processed" className="text-white">
                      Approved
                    </SelectItem>
                    <SelectItem value="paid" className="text-white">
                      Paid
                    </SelectItem>
                    <SelectItem value="failed" className="text-white">
                      Failed
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-40 bg-cosmic-light border-cosmic-accent text-white">
                    <SelectValue placeholder="All Dates" />
                  </SelectTrigger>
                  <SelectContent className="bg-cosmic-dark border-cosmic-light">
                    <SelectItem value="all" className="text-white">
                      All Dates
                    </SelectItem>
                    <SelectItem value="this_month" className="text-white">
                      This Month
                    </SelectItem>
                    <SelectItem value="last_month" className="text-white">
                      Last Month
                    </SelectItem>
                    <SelectItem value="this_year" className="text-white">
                      This Year
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Transactions Table */}
          <Card className="bg-cosmic-dark border-cosmic-light">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Payroll Transactions ({filteredTransactions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-cosmic-light">
                    <TableHead className="text-white w-12">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          handleSelectAll(selectedTransactions.length !== pendingCount)
                        }
                        className="text-gray-400 hover:text-white p-0"
                      >
                        {selectedTransactions.length === pendingCount && pendingCount > 0 ? (
                          <CheckSquare className="w-4 h-4" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead className="text-white">Entity</TableHead>
                    <TableHead className="text-white">Type</TableHead>
                    <TableHead className="text-white">Amount</TableHead>
                    <TableHead className="text-white">Status</TableHead>
                    <TableHead className="text-white">Payment Method</TableHead>
                    <TableHead className="text-white">Payment Date</TableHead>
                    <TableHead className="text-white">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id} className="border-cosmic-light">
                      <TableCell>
                        {transaction.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              handleSelectTransaction(
                                transaction.id,
                                !selectedTransactions.includes(transaction.id),
                              )
                            }
                            className="text-gray-400 hover:text-white p-0"
                          >
                            {selectedTransactions.includes(transaction.id) ? (
                              <CheckSquare className="w-4 h-4" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="text-white font-medium">
                        {getEntityName(transaction)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {getEntityType(transaction)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white font-mono">
                        ${transaction.final_amount.toFixed(2)}
                      </TableCell>
                      <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                      <TableCell>
                        {transaction.payment_method ? (
                          <div className="flex items-center gap-2">
                            {getPaymentMethodIcon(transaction.payment_method)}
                            <span className="text-white text-sm capitalize">
                              {transaction.payment_method}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-white text-sm">
                        {transaction.payment_date
                          ? new Date(transaction.payment_date).toLocaleDateString()
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(transaction)}
                            className="text-gray-400 hover:text-white"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {transaction.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleApproveTransaction(transaction.id)}
                              className="text-green-400 hover:text-green-300"
                            >
                              Approve
                            </Button>
                          )}
                          {transaction.status === 'processed' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleMarkAsPaid(transaction.id)}
                              className="text-purple-400 hover:text-purple-300"
                            >
                              Mark Paid
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-6 mt-6">
          <Card className="bg-cosmic-dark border-cosmic-light">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Payroll Rules ({payrollRules.length})
              </CardTitle>
              <p className="text-gray-400 text-sm">
                Configure compensation rules for different roles, services, and scenarios
              </p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-cosmic-light">
                    <TableHead className="text-white">Rule Name</TableHead>
                    <TableHead className="text-white">Target</TableHead>
                    <TableHead className="text-white">Rate Type</TableHead>
                    <TableHead className="text-white">Amount</TableHead>
                    <TableHead className="text-white">Priority</TableHead>
                    <TableHead className="text-white">Status</TableHead>
                    <TableHead className="text-white">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollRules.map((rule) => (
                    <TableRow key={rule.id} className="border-cosmic-light">
                      <TableCell className="text-white font-medium">{rule.name}</TableCell>
                      <TableCell className="text-white text-sm">
                        {rule.role && <div>Role: {rule.role}</div>}
                        {rule.department && <div>Dept: {rule.department}</div>}
                        {rule.employee_id && <div>Employee Override</div>}
                        {rule.agent_id && <div>Agent Override</div>}
                        {rule.service_id && <div>Service Specific</div>}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getRateTypeIcon(rule.rate_type)}
                          <span className="text-white text-sm capitalize">
                            {rule.rate_type.replace('-', ' ')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-white font-mono">
                        {rule.is_percentage ? `${rule.amount}%` : `$${rule.amount.toFixed(2)}`}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {rule.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                          {rule.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openRuleEditDialog(rule)}
                            className="text-gray-400 hover:text-white"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteRule(rule.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6 mt-6">
          <Card className="bg-cosmic-dark border-cosmic-light">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications ({notifications.length})
              </CardTitle>
              <p className="text-gray-400 text-sm">
                Track payout notifications and updates for employees and agents
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border ${
                      notification.is_read
                        ? 'bg-cosmic-light border-cosmic-accent/20'
                        : 'bg-cosmic-accent/10 border-cosmic-accent/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getNotificationTypeIcon(notification.notification_type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-white font-medium">{notification.title}</h4>
                            {!notification.is_read && (
                              <Badge variant="default" className="text-xs bg-cosmic-accent">
                                New
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-400 text-sm mt-1">{notification.message}</p>
                          <p className="text-gray-500 text-xs mt-2">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {!notification.is_read && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleMarkNotificationRead(notification.id)}
                          className="text-gray-400 hover:text-white"
                        >
                          Mark Read
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <div className="text-center py-8">
                    <Bell className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No notifications yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Transaction Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-cosmic-dark border-cosmic-light max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Create Payroll Transaction</DialogTitle>
            <DialogDescription className="text-gray-400">
              Record a new payroll transaction for employee or AI agent compensation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-employee_id" className="text-white">
                  Employee
                </Label>
                <Select
                  value={transactionForm.employee_id}
                  onValueChange={(value) =>
                    setTransactionForm((prev) => ({
                      ...prev,
                      employee_id: value,
                      agent_id: value ? '' : prev.agent_id,
                    }))
                  }
                >
                  <SelectTrigger className="bg-cosmic-light border-cosmic-accent text-white">
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent className="bg-cosmic-dark border-cosmic-light">
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id} className="text-white">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          {employee.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-agent_id" className="text-white">
                  AI Agent
                </Label>
                <Select
                  value={transactionForm.agent_id}
                  onValueChange={(value) =>
                    setTransactionForm((prev) => ({
                      ...prev,
                      agent_id: value,
                      employee_id: value ? '' : prev.employee_id,
                    }))
                  }
                >
                  <SelectTrigger className="bg-cosmic-light border-cosmic-accent text-white">
                    <SelectValue placeholder="Select agent" />
                  </SelectTrigger>
                  <SelectContent className="bg-cosmic-dark border-cosmic-light">
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id} className="text-white">
                        <div className="flex items-center gap-2">
                          <Bot className="w-4 h-4" />
                          {agent.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-amount" className="text-white">
                  Amount *
                </Label>
                <Input
                  id="create-amount"
                  type="number"
                  step="0.01"
                  value={transactionForm.amount}
                  onChange={(e) =>
                    setTransactionForm((prev) => ({ ...prev, amount: e.target.value }))
                  }
                  className="bg-cosmic-light border-cosmic-accent text-white"
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-status" className="text-white">
                  Status
                </Label>
                <Select
                  value={transactionForm.status}
                  onValueChange={(value: any) =>
                    setTransactionForm((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger className="bg-cosmic-light border-cosmic-accent text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-cosmic-dark border-cosmic-light">
                    <SelectItem value="pending" className="text-white">
                      Pending
                    </SelectItem>
                    <SelectItem value="processed" className="text-white">
                      Processed
                    </SelectItem>
                    <SelectItem value="paid" className="text-white">
                      Paid
                    </SelectItem>
                    <SelectItem value="failed" className="text-white">
                      Failed
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-period_start" className="text-white">
                  Period Start
                </Label>
                <Input
                  id="create-period_start"
                  type="date"
                  value={transactionForm.period_start}
                  onChange={(e) =>
                    setTransactionForm((prev) => ({ ...prev, period_start: e.target.value }))
                  }
                  className="bg-cosmic-light border-cosmic-accent text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-period_end" className="text-white">
                  Period End
                </Label>
                <Input
                  id="create-period_end"
                  type="date"
                  value={transactionForm.period_end}
                  onChange={(e) =>
                    setTransactionForm((prev) => ({ ...prev, period_end: e.target.value }))
                  }
                  className="bg-cosmic-light border-cosmic-accent text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-notes" className="text-white">
                Notes
              </Label>
              <Input
                id="create-notes"
                value={transactionForm.notes}
                onChange={(e) => setTransactionForm((prev) => ({ ...prev, notes: e.target.value }))}
                className="bg-cosmic-light border-cosmic-accent text-white"
                placeholder="Additional notes about this transaction"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              className="text-white border-cosmic-accent"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTransaction}
              disabled={isSubmitting}
              className="bg-cosmic-accent hover:bg-cosmic-highlight"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Create Transaction
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Transaction Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-cosmic-dark border-cosmic-light max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Payroll Transaction</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update transaction details and status.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-amount" className="text-white">
                  Amount *
                </Label>
                <Input
                  id="edit-amount"
                  type="number"
                  step="0.01"
                  value={transactionForm.amount}
                  onChange={(e) =>
                    setTransactionForm((prev) => ({ ...prev, amount: e.target.value }))
                  }
                  className="bg-cosmic-light border-cosmic-accent text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status" className="text-white">
                  Status
                </Label>
                <Select
                  value={transactionForm.status}
                  onValueChange={(value: any) =>
                    setTransactionForm((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger className="bg-cosmic-light border-cosmic-accent text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-cosmic-dark border-cosmic-light">
                    <SelectItem value="pending" className="text-white">
                      Pending
                    </SelectItem>
                    <SelectItem value="processed" className="text-white">
                      Processed
                    </SelectItem>
                    <SelectItem value="paid" className="text-white">
                      Paid
                    </SelectItem>
                    <SelectItem value="failed" className="text-white">
                      Failed
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-period_start" className="text-white">
                  Period Start
                </Label>
                <Input
                  id="edit-period_start"
                  type="date"
                  value={transactionForm.period_start}
                  onChange={(e) =>
                    setTransactionForm((prev) => ({ ...prev, period_start: e.target.value }))
                  }
                  className="bg-cosmic-light border-cosmic-accent text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-period_end" className="text-white">
                  Period End
                </Label>
                <Input
                  id="edit-period_end"
                  type="date"
                  value={transactionForm.period_end}
                  onChange={(e) =>
                    setTransactionForm((prev) => ({ ...prev, period_end: e.target.value }))
                  }
                  className="bg-cosmic-light border-cosmic-accent text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes" className="text-white">
                Notes
              </Label>
              <Input
                id="edit-notes"
                value={transactionForm.notes}
                onChange={(e) => setTransactionForm((prev) => ({ ...prev, notes: e.target.value }))}
                className="bg-cosmic-light border-cosmic-accent text-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="text-white border-cosmic-accent"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateTransaction}
              disabled={isSubmitting}
              className="bg-cosmic-accent hover:bg-cosmic-highlight"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Edit className="w-4 h-4 mr-2" />
              )}
              Update Transaction
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payroll Rules Dialog */}
      <Dialog open={isRuleDialogOpen} onOpenChange={setIsRuleDialogOpen}>
        <DialogContent className="bg-cosmic-dark border-cosmic-light max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">
              {selectedRule ? 'Edit Payroll Rule' : 'Create Payroll Rule'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Configure compensation rules for different roles, services, and scenarios.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rule-name" className="text-white">
                  Rule Name *
                </Label>
                <Input
                  id="rule-name"
                  value={ruleForm.name}
                  onChange={(e) => setRuleForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="bg-cosmic-light border-cosmic-accent text-white"
                  placeholder="e.g., Service Agent Compensation"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rule-rate_type" className="text-white">
                  Rate Type *
                </Label>
                <Select
                  value={ruleForm.rate_type}
                  onValueChange={(value: any) =>
                    setRuleForm((prev) => ({ ...prev, rate_type: value }))
                  }
                >
                  <SelectTrigger className="bg-cosmic-light border-cosmic-accent text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-cosmic-dark border-cosmic-light">
                    <SelectItem value="hourly" className="text-white">
                      <div className="flex items-center gap-2">
                        <Timer className="w-4 h-4" />
                        Hourly Rate
                      </div>
                    </SelectItem>
                    <SelectItem value="per-job" className="text-white">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Per Job
                      </div>
                    </SelectItem>
                    <SelectItem value="salary" className="text-white">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        Salary
                      </div>
                    </SelectItem>
                    <SelectItem value="percentage" className="text-white">
                      <div className="flex items-center gap-2">
                        <Percent className="w-4 h-4" />
                        Percentage
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rule-amount" className="text-white">
                  Amount *
                </Label>
                <Input
                  id="rule-amount"
                  type="number"
                  step="0.01"
                  value={ruleForm.amount}
                  onChange={(e) => setRuleForm((prev) => ({ ...prev, amount: e.target.value }))}
                  className="bg-cosmic-light border-cosmic-accent text-white"
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rule-priority" className="text-white">
                  Priority
                </Label>
                <Input
                  id="rule-priority"
                  type="number"
                  value={ruleForm.priority}
                  onChange={(e) =>
                    setRuleForm((prev) => ({ ...prev, priority: parseInt(e.target.value) || 0 }))
                  }
                  className="bg-cosmic-light border-cosmic-accent text-white"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rule-is_active" className="text-white">
                  Status
                </Label>
                <Select
                  value={ruleForm.is_active.toString()}
                  onValueChange={(value) =>
                    setRuleForm((prev) => ({ ...prev, is_active: value === 'true' }))
                  }
                >
                  <SelectTrigger className="bg-cosmic-light border-cosmic-accent text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-cosmic-dark border-cosmic-light">
                    <SelectItem value="true" className="text-white">
                      Active
                    </SelectItem>
                    <SelectItem value="false" className="text-white">
                      Inactive
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-white">Rule Target (at least one required)</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rule-role" className="text-white">
                    Role
                  </Label>
                  <Input
                    id="rule-role"
                    value={ruleForm.role}
                    onChange={(e) => setRuleForm((prev) => ({ ...prev, role: e.target.value }))}
                    className="bg-cosmic-light border-cosmic-accent text-white"
                    placeholder="e.g., service_agent"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rule-department" className="text-white">
                    Department
                  </Label>
                  <Input
                    id="rule-department"
                    value={ruleForm.department}
                    onChange={(e) =>
                      setRuleForm((prev) => ({ ...prev, department: e.target.value }))
                    }
                    className="bg-cosmic-light border-cosmic-accent text-white"
                    placeholder="e.g., engineering"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rule-employee_id" className="text-white">
                    Employee Override
                  </Label>
                  <Select
                    value={ruleForm.employee_id}
                    onValueChange={(value) =>
                      setRuleForm((prev) => ({ ...prev, employee_id: value }))
                    }
                  >
                    <SelectTrigger className="bg-cosmic-light border-cosmic-accent text-white">
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent className="bg-cosmic-dark border-cosmic-light">
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id} className="text-white">
                          {employee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rule-agent_id" className="text-white">
                    Agent Override
                  </Label>
                  <Select
                    value={ruleForm.agent_id}
                    onValueChange={(value) => setRuleForm((prev) => ({ ...prev, agent_id: value }))}
                  >
                    <SelectTrigger className="bg-cosmic-light border-cosmic-accent text-white">
                      <SelectValue placeholder="Select agent" />
                    </SelectTrigger>
                    <SelectContent className="bg-cosmic-dark border-cosmic-light">
                      {agents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id} className="text-white">
                          {agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rule-effective_date" className="text-white">
                    Effective Date
                  </Label>
                  <Input
                    id="rule-effective_date"
                    type="date"
                    value={ruleForm.effective_date}
                    onChange={(e) =>
                      setRuleForm((prev) => ({ ...prev, effective_date: e.target.value }))
                    }
                    className="bg-cosmic-light border-cosmic-accent text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rule-expiration_date" className="text-white">
                    Expiration Date (Optional)
                  </Label>
                  <Input
                    id="rule-expiration_date"
                    type="date"
                    value={ruleForm.expiration_date}
                    onChange={(e) =>
                      setRuleForm((prev) => ({ ...prev, expiration_date: e.target.value }))
                    }
                    className="bg-cosmic-light border-cosmic-accent text-white"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsRuleDialogOpen(false);
                resetRuleForm();
              }}
              className="text-white border-cosmic-accent"
            >
              Cancel
            </Button>
            <Button
              onClick={selectedRule ? handleUpdateRule : handleCreateRule}
              disabled={isSubmitting}
              className="bg-cosmic-accent hover:bg-cosmic-highlight"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : selectedRule ? (
                <Edit className="w-4 h-4 mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {selectedRule ? 'Update Rule' : 'Create Rule'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="bg-cosmic-dark border-cosmic-light max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Mark as Paid</DialogTitle>
            <DialogDescription className="text-gray-400">
              Record payment details for this payroll transaction.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="payment-method" className="text-white">
                Payment Method *
              </Label>
              <Select
                value={paymentForm.payment_method}
                onValueChange={(value: any) =>
                  setPaymentForm((prev) => ({ ...prev, payment_method: value }))
                }
              >
                <SelectTrigger className="bg-cosmic-light border-cosmic-accent text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-cosmic-dark border-cosmic-light">
                  <SelectItem value="zelle" className="text-white">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Zelle
                    </div>
                  </SelectItem>
                  <SelectItem value="ach" className="text-white">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      ACH Transfer
                    </div>
                  </SelectItem>
                  <SelectItem value="stripe" className="text-white">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Stripe
                    </div>
                  </SelectItem>
                  <SelectItem value="check" className="text-white">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Check
                    </div>
                  </SelectItem>
                  <SelectItem value="wire" className="text-white">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      Wire Transfer
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-reference" className="text-white">
                Payment Reference (Optional)
              </Label>
              <Input
                id="payment-reference"
                value={paymentForm.payment_reference}
                onChange={(e) =>
                  setPaymentForm((prev) => ({ ...prev, payment_reference: e.target.value }))
                }
                className="bg-cosmic-light border-cosmic-accent text-white"
                placeholder="Transaction ID, check number, etc."
              />
            </div>

            {selectedTransaction && (
              <div className="p-4 bg-cosmic-light rounded-lg">
                <div className="flex justify-between items-center text-white">
                  <span>Amount:</span>
                  <span className="font-mono font-bold">
                    ${selectedTransaction.final_amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-gray-400 text-sm mt-1">
                  <span>Recipient:</span>
                  <span>{getEntityName(selectedTransaction)}</span>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsPaymentDialogOpen(false)}
              className="text-white border-cosmic-accent"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmPayment}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <DollarSign className="w-4 h-4 mr-2" />
              )}
              Mark as Paid
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Payroll;
