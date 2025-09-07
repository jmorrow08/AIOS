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
} from 'lucide-react';

interface PayrollProps {
  onTransactionSelect?: (transaction: PayrollTransaction) => void;
}

const Payroll: React.FC<PayrollProps> = ({ onTransactionSelect }) => {
  const [transactions, setTransactions] = useState<PayrollTransaction[]>([]);
  const [employees, setEmployees] = useState<EmployeeWithAgent[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<PayrollTransaction | null>(null);
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

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [transactionsResult, employeesResult, agentsResult] = await Promise.all([
        getPayrollTransactions(),
        getEmployeesWithAgents(),
        getAgentsWithPermissions(),
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
            <h2 className="text-2xl font-bold text-white">Payroll</h2>
            <p className="text-gray-400">
              Track and manage service payouts for employees and AI agents
            </p>
          </div>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-cosmic-accent hover:bg-cosmic-highlight">
              <Plus className="w-4 h-4 mr-2" />
              Add Transaction
            </Button>
          </DialogTrigger>
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
                  <Label htmlFor="employee_id" className="text-white">
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
                  <Label htmlFor="agent_id" className="text-white">
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
                  <Label htmlFor="amount" className="text-white">
                    Amount *
                  </Label>
                  <Input
                    id="amount"
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
                  <Label htmlFor="status" className="text-white">
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
                  <Label htmlFor="period_start" className="text-white">
                    Period Start
                  </Label>
                  <Input
                    id="period_start"
                    type="date"
                    value={transactionForm.period_start}
                    onChange={(e) =>
                      setTransactionForm((prev) => ({ ...prev, period_start: e.target.value }))
                    }
                    className="bg-cosmic-light border-cosmic-accent text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="period_end" className="text-white">
                    Period End
                  </Label>
                  <Input
                    id="period_end"
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
                <Label htmlFor="notes" className="text-white">
                  Notes
                </Label>
                <Input
                  id="notes"
                  value={transactionForm.notes}
                  onChange={(e) =>
                    setTransactionForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
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
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-cosmic-dark border-cosmic-light">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-yellow-500" />
              Total Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${totalPaid.toFixed(2)}</div>
            <p className="text-gray-400 text-xs">Completed transactions</p>
          </CardContent>
        </Card>

        <Card className="bg-cosmic-dark border-cosmic-light">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              Total Processed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${totalProcessed.toFixed(2)}</div>
            <p className="text-gray-400 text-xs">Ready for payment</p>
          </CardContent>
        </Card>

        <Card className="bg-cosmic-dark border-cosmic-light">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-500" />
              Total Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${totalPending.toFixed(2)}</div>
            <p className="text-gray-400 text-xs">Awaiting processing</p>
          </CardContent>
        </Card>
      </div>

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
                <TableHead className="text-white">Entity</TableHead>
                <TableHead className="text-white">Type</TableHead>
                <TableHead className="text-white">Amount</TableHead>
                <TableHead className="text-white">Period</TableHead>
                <TableHead className="text-white">Status</TableHead>
                <TableHead className="text-white">Payment Date</TableHead>
                <TableHead className="text-white">Notes</TableHead>
                <TableHead className="text-white">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id} className="border-cosmic-light">
                  <TableCell className="text-white font-medium">
                    {getEntityName(transaction)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {getEntityType(transaction)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-white font-mono">
                    ${transaction.amount.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-white text-sm">
                    {new Date(transaction.period_start).toLocaleDateString()} -{' '}
                    {new Date(transaction.period_end).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                  <TableCell className="text-white text-sm">
                    {transaction.payment_date
                      ? new Date(transaction.payment_date).toLocaleDateString()
                      : '-'}
                  </TableCell>
                  <TableCell className="text-white text-sm max-w-xs truncate">
                    {transaction.notes || '-'}
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
                          onClick={() => handleStatusUpdate(transaction.id, 'processed')}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          Process
                        </Button>
                      )}
                      {transaction.status === 'processed' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStatusUpdate(transaction.id, 'paid')}
                          className="text-green-400 hover:text-green-300"
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

      {/* Edit Transaction Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-cosmic-dark border-cosmic-light max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Payroll Transaction</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update transaction details and status.
            </DialogDescription>
          </DialogHeader>
          {/* Same form fields as create dialog */}
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
    </div>
  );
};

export default Payroll;
