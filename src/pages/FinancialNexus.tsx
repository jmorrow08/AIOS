import React, { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { RadialMenu } from '@/components/RadialMenu';
import { CosmicBackground } from '@/components/CosmicBackground';

// shadcn components
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Recharts components
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
} from 'recharts';

// Icons
import { Plus, AlertTriangle, CreditCard, TrendingUp, DollarSign, Calendar } from 'lucide-react';

// API imports
import {
  getInvoices,
  createInvoice,
  markInvoicePaid,
  Invoice,
  CreateInvoiceData,
} from '@/api/invoices';
import { getCompanies, Company } from '@/api/companies';
import { getServices, Service } from '@/api/services';

// Stripe
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe (you'll need to add your publishable key to env)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface RevenueData {
  month: string;
  revenue: number;
  invoices: number;
}

const FinancialNexus: React.FC = () => {
  const { user, role, companyId } = useUser();

  // State for invoices
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [invoicesError, setInvoicesError] = useState<string | null>(null);

  // State for companies and services (admin view)
  const [companies, setCompanies] = useState<Company[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [servicesLoading, setServicesLoading] = useState(false);

  // State for revenue chart
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [chartLoading, setChartLoading] = useState(true);

  // UI state
  const [newInvoiceDialogOpen, setNewInvoiceDialogOpen] = useState(false);

  // Form states
  const [invoiceForm, setInvoiceForm] = useState({
    company_id: '',
    service_id: '',
    amount: '',
    due_date: '',
  });

  // Load data on mount
  useEffect(() => {
    if (role === 'admin') {
      loadAdminData();
    } else if (role === 'client' && companyId) {
      loadClientInvoices();
    }
  }, [role, companyId]);

  const loadAdminData = async () => {
    setInvoicesLoading(true);
    setCompaniesLoading(true);
    setChartLoading(true);

    try {
      // Load all data in parallel
      const [invoicesRes, companiesRes] = await Promise.all([getInvoices(), getCompanies()]);

      // Handle invoices
      if (invoicesRes.error) {
        setInvoicesError(invoicesRes.error);
      } else if (invoicesRes.data) {
        const invoiceData = invoicesRes.data as Invoice[];
        setInvoices(invoiceData);
        processRevenueData(invoiceData);
      }

      // Handle companies
      if (companiesRes.error) {
        console.error('Error loading companies:', companiesRes.error);
      } else if (companiesRes.data) {
        setCompanies(companiesRes.data as Company[]);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
      setInvoicesError('Failed to load financial data');
    }

    setInvoicesLoading(false);
    setCompaniesLoading(false);
    setChartLoading(false);
  };

  const loadClientInvoices = async () => {
    if (!companyId) return;

    setInvoicesLoading(true);
    setInvoicesError(null);

    const { data, error } = await getInvoices(companyId);

    if (error) {
      setInvoicesError(error);
    } else if (data) {
      setInvoices(data as Invoice[]);
    }

    setInvoicesLoading(false);
  };

  const processRevenueData = (invoiceData: Invoice[]) => {
    const monthlyData: { [key: string]: { revenue: number; count: number } } = {};

    invoiceData.forEach((invoice) => {
      if (invoice.status === 'paid' && invoice.paid_date) {
        const date = new Date(invoice.paid_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { revenue: 0, count: 0 };
        }

        monthlyData[monthKey].revenue += invoice.amount;
        monthlyData[monthKey].count += 1;
      }
    });

    const chartData: RevenueData[] = Object.entries(monthlyData)
      .map(([monthKey, data]) => ({
        month: monthKey,
        revenue: data.revenue,
        invoices: data.count,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12); // Last 12 months

    setRevenueData(chartData);
  };

  const handleCreateInvoice = async () => {
    if (
      !invoiceForm.company_id ||
      !invoiceForm.service_id ||
      !invoiceForm.amount ||
      !invoiceForm.due_date
    ) {
      return;
    }

    const invoiceData: CreateInvoiceData = {
      company_id: invoiceForm.company_id,
      service_id: invoiceForm.service_id,
      amount: parseFloat(invoiceForm.amount),
      due_date: invoiceForm.due_date,
    };

    const { data, error } = await createInvoice(
      invoiceData.company_id,
      invoiceData.service_id,
      invoiceData.amount,
      invoiceData.due_date,
    );

    if (!error && data) {
      setInvoices((prev) => [data as Invoice, ...prev]);
      setInvoiceForm({ company_id: '', service_id: '', amount: '', due_date: '' });
      setNewInvoiceDialogOpen(false);
      // Re-process revenue data
      processRevenueData([data as Invoice, ...invoices]);
    }
  };

  const handleCompanyChange = async (companyId: string) => {
    setInvoiceForm((prev) => ({ ...prev, company_id: companyId, service_id: '' }));

    if (companyId) {
      setServicesLoading(true);
      const { data, error } = await getServices(companyId);
      if (!error && data) {
        setServices(data as Service[]);
      }
      setServicesLoading(false);
    } else {
      setServices([]);
    }
  };

  const handlePayInvoice = async (invoice: Invoice) => {
    if (!invoice.id) return;

    try {
      // For demo purposes, we'll just mark as paid
      // In production, this would integrate with Stripe Checkout
      const { data, error } = await markInvoicePaid(invoice.id);

      if (!error && data) {
        setInvoices((prev) => prev.map((inv) => (inv.id === invoice.id ? (data as Invoice) : inv)));
        alert(`Invoice ${invoice.id} marked as paid!`);
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Payment processing failed. Please try again.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500/20 text-green-300';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300';
      case 'overdue':
        return 'bg-red-500/20 text-red-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  // Admin View Component
  const AdminView = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Financial Nexus</h2>
        <Dialog open={newInvoiceDialogOpen} onOpenChange={setNewInvoiceDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-cosmic-blue hover:bg-cosmic-blue/80">
              <Plus className="w-4 h-4 mr-2" />
              New Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-700 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Invoice</DialogTitle>
              <DialogDescription className="text-gray-400">
                Generate an invoice for a company service.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="invoice-company" className="text-white">
                  Company *
                </Label>
                <select
                  id="invoice-company"
                  value={invoiceForm.company_id}
                  onChange={(e) => handleCompanyChange(e.target.value)}
                  className="w-full p-2 bg-gray-800 border border-gray-600 text-white rounded"
                >
                  <option value="">Select a company</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="invoice-service" className="text-white">
                  Service *
                </Label>
                <select
                  id="invoice-service"
                  value={invoiceForm.service_id}
                  onChange={(e) =>
                    setInvoiceForm((prev) => ({ ...prev, service_id: e.target.value }))
                  }
                  className="w-full p-2 bg-gray-800 border border-gray-600 text-white rounded"
                  disabled={servicesLoading}
                >
                  <option value="">
                    {servicesLoading ? 'Loading services...' : 'Select a service'}
                  </option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} - ${service.price}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="invoice-amount" className="text-white">
                    Amount ($)
                  </Label>
                  <Input
                    id="invoice-amount"
                    type="number"
                    step="0.01"
                    value={invoiceForm.amount}
                    onChange={(e) =>
                      setInvoiceForm((prev) => ({ ...prev, amount: e.target.value }))
                    }
                    placeholder="0.00"
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="invoice-due-date" className="text-white">
                    Due Date
                  </Label>
                  <Input
                    id="invoice-due-date"
                    type="date"
                    value={invoiceForm.due_date}
                    onChange={(e) =>
                      setInvoiceForm((prev) => ({ ...prev, due_date: e.target.value }))
                    }
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleCreateInvoice}
                disabled={
                  !invoiceForm.company_id ||
                  !invoiceForm.service_id ||
                  !invoiceForm.amount ||
                  !invoiceForm.due_date
                }
                className="bg-cosmic-blue hover:bg-cosmic-blue/80"
              >
                Create Invoice
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Revenue Overview</h3>
        {chartLoading ? (
          <div className="h-64 flex items-center justify-center">
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="month"
                stroke="#9CA3AF"
                fontSize={12}
                tickFormatter={(value) => {
                  const date = new Date(value + '-01');
                  return date.toLocaleDateString('en-US', { month: 'short' });
                }}
              />
              <YAxis
                stroke="#9CA3AF"
                fontSize={12}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
                labelFormatter={(value) => {
                  const date = new Date(value + '-01');
                  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                }}
                formatter={(value: number, name: string) => [
                  name === 'revenue' ? `$${value.toLocaleString()}` : value,
                  name === 'revenue' ? 'Revenue' : 'Invoices',
                ]}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Invoices Table */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden">
        <div className="p-6 border-b border-white/20">
          <h3 className="text-xl font-semibold text-white">All Invoices</h3>
        </div>
        {invoicesLoading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : invoicesError ? (
          <Alert className="m-6 bg-red-900/20 border-red-500/50">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="text-red-200">Error Loading Invoices</AlertTitle>
            <AlertDescription className="text-red-300">{invoicesError}</AlertDescription>
          </Alert>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/20 hover:bg-white/5">
                <TableHead className="text-white">Invoice ID</TableHead>
                <TableHead className="text-white">Company</TableHead>
                <TableHead className="text-white">Service</TableHead>
                <TableHead className="text-white">Amount</TableHead>
                <TableHead className="text-white">Due Date</TableHead>
                <TableHead className="text-white">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => {
                const company = companies.find((c) => c.id === invoice.company_id);
                return (
                  <TableRow key={invoice.id} className="border-white/20 hover:bg-white/5">
                    <TableCell className="text-white font-mono text-sm">
                      {invoice.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell className="text-white">
                      {company?.name || 'Unknown Company'}
                    </TableCell>
                    <TableCell className="text-white">
                      Service {invoice.service_id.slice(0, 8)}...
                    </TableCell>
                    <TableCell className="text-white font-semibold">
                      ${invoice.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-cosmic-blue">
                      {new Date(invoice.due_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(
                          invoice.status,
                        )}`}
                      >
                        {invoice.status}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );

  // Client View Component
  const ClientView = () => (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Financial Overview</h2>
        <p className="text-cosmic-blue">Manage your invoices and payments</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <div className="flex items-center space-x-3">
            <DollarSign className="w-8 h-8 text-green-400" />
            <div>
              <p className="text-cosmic-blue text-sm">Total Paid</p>
              <p className="text-white text-2xl font-bold">
                $
                {invoices
                  .filter((inv) => inv.status === 'paid')
                  .reduce((sum, inv) => sum + inv.amount, 0)
                  .toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <div className="flex items-center space-x-3">
            <CreditCard className="w-8 h-8 text-yellow-400" />
            <div>
              <p className="text-cosmic-blue text-sm">Pending</p>
              <p className="text-white text-2xl font-bold">
                $
                {invoices
                  .filter((inv) => inv.status === 'pending')
                  .reduce((sum, inv) => sum + inv.amount, 0)
                  .toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <div className="flex items-center space-x-3">
            <Calendar className="w-8 h-8 text-red-400" />
            <div>
              <p className="text-cosmic-blue text-sm">Overdue</p>
              <p className="text-white text-2xl font-bold">
                $
                {invoices
                  .filter((inv) => inv.status === 'overdue')
                  .reduce((sum, inv) => sum + inv.amount, 0)
                  .toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Your Invoices</h3>
        {invoicesLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 bg-white/5 rounded-lg space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </div>
        ) : invoicesError ? (
          <Alert className="bg-red-900/20 border-red-500/50">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="text-red-200">Error Loading Invoices</AlertTitle>
            <AlertDescription className="text-red-300">{invoicesError}</AlertDescription>
          </Alert>
        ) : invoices.length > 0 ? (
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <h4 className="text-white font-medium">
                        Invoice #{invoice.id.slice(0, 8)}...
                      </h4>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(
                          invoice.status,
                        )}`}
                      >
                        {invoice.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-cosmic-blue">Amount</p>
                        <p className="text-white font-semibold">
                          ${invoice.amount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-cosmic-blue">Due Date</p>
                        <p className="text-white">
                          {new Date(invoice.due_date).toLocaleDateString()}
                        </p>
                      </div>
                      {invoice.paid_date && (
                        <div>
                          <p className="text-cosmic-blue">Paid Date</p>
                          <p className="text-white">
                            {new Date(invoice.paid_date).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-cosmic-blue">Service</p>
                        <p className="text-white">Service {invoice.service_id.slice(0, 8)}...</p>
                      </div>
                    </div>
                  </div>
                  {invoice.status !== 'paid' && (
                    <Button
                      onClick={() => handlePayInvoice(invoice)}
                      className="bg-cosmic-blue hover:bg-cosmic-blue/80 ml-4"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Pay Now
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <DollarSign className="w-12 h-12 text-cosmic-blue mx-auto mb-4" />
            <h3 className="text-white font-medium mb-2">No Invoices Yet</h3>
            <p className="text-cosmic-blue">Your invoices will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* cosmic background */}
      <CosmicBackground />
      {/* radial menu */}
      <RadialMenu />
      {/* main content */}
      <div className="p-8 pt-24 max-w-7xl mx-auto">
        {role === 'admin' ? <AdminView /> : <ClientView />}
      </div>
    </div>
  );
};

export default FinancialNexus;
