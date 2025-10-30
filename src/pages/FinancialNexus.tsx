import React, { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { MainNavigation } from '@/components/MainNavigation';
import { CosmicBackground } from '@/components/CosmicBackground';
import InvoiceForm, { InvoiceFormData } from '@/components/InvoiceForm';
import UsageBar from '@/components/UsageBar';

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
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
import {
  Plus,
  AlertTriangle,
  CreditCard,
  TrendingUp,
  DollarSign,
  Calendar,
  Receipt,
  BarChart3,
  Brain,
  ExternalLink,
} from 'lucide-react';

// API imports
import {
  getInvoices,
  createInvoice,
  markInvoicePaid,
  getInvoiceStats,
  Invoice,
  LineItem,
} from '@/api/invoices';
import { getCompanies, Company } from '@/api/companies';
import { getApiUsageSummary, checkBudgetLimit } from '@/api/apiUsage';
import { generateAIForecast } from '@/api/forecast';

interface RevenueData {
  month: string;
  revenue: number;
  invoices: number;
}

interface ApiUsageData {
  service: string;
  totalCost: number;
  tokensUsed?: number;
  imagesGenerated?: number;
  requestsCount: number;
}

interface ForecastData {
  revenueData: Array<{
    month: string;
    revenue: number;
  }>;
  trend: 'increasing' | 'decreasing' | 'stable';
  averageMonthlyRevenue: number;
  forecastNextMonth: number;
  forecastConfidence: number;
  insights: string[];
}

const FinancialNexus: React.FC = () => {
  const { user, role, companyId } = useUser();

  // State for invoices
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [invoicesError, setInvoicesError] = useState<string | null>(null);

  // State for invoice stats
  const [invoiceStats, setInvoiceStats] = useState({
    totalUnpaid: 0,
    totalOverdue: 0,
    totalPaidThisMonth: 0,
    totalOutstanding: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // State for companies
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);

  // State for API usage
  const [apiUsage, setApiUsage] = useState<ApiUsageData[]>([]);
  const [apiUsageLoading, setApiUsageLoading] = useState(true);
  const [budgetInfo, setBudgetInfo] = useState({
    currentUsage: 0,
    budgetLimit: 50, // Default budget
    isWithinBudget: true,
    projectedUsage: 0,
  });

  // State for forecast
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [forecastLoading, setForecastLoading] = useState(false);

  // State for revenue chart
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [chartLoading, setChartLoading] = useState(true);

  // UI state
  const [newInvoiceDialogOpen, setNewInvoiceDialogOpen] = useState(false);
  const [invoiceFormLoading, setInvoiceFormLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Load data on mount
  useEffect(() => {
    loadAllData();
  }, [role, companyId]);

  const loadAllData = async () => {
    setInvoicesLoading(true);
    setStatsLoading(true);
    setApiUsageLoading(true);
    setChartLoading(true);

    try {
      // Load all data in parallel
      const [invoicesRes, statsRes, companiesRes, apiUsageRes, budgetRes] =
        await Promise.allSettled([
          getInvoices(role === 'client' ? companyId : undefined),
          getInvoiceStats(role === 'client' ? companyId : undefined),
          role === 'admin' ? getCompanies() : Promise.resolve({ data: [], error: null }),
          getApiUsageSummary(),
          checkBudgetLimit(),
        ]);

      // Handle invoices
      if (invoicesRes.status === 'fulfilled' && invoicesRes.value.data) {
        const invoiceData = invoicesRes.value.data as Invoice[];
        setInvoices(invoiceData);
        processRevenueData(invoiceData);
      } else if (invoicesRes.status === 'rejected') {
        setInvoicesError('Failed to load invoices');
      }

      // Handle invoice stats
      if (statsRes.status === 'fulfilled' && statsRes.value.data) {
        setInvoiceStats(statsRes.value.data);
      }

      // Handle companies
      if (companiesRes.status === 'fulfilled' && companiesRes.value.data) {
        setCompanies(companiesRes.value.data as Company[]);
      }

      // Handle API usage
      if (apiUsageRes.status === 'fulfilled' && apiUsageRes.value.data) {
        setApiUsage(apiUsageRes.value.data as ApiUsageData[]);
      }

      // Handle budget info
      if (budgetRes.status === 'fulfilled' && budgetRes.value.data) {
        setBudgetInfo(budgetRes.value.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setInvoicesError('Failed to load financial data');
    }

    setInvoicesLoading(false);
    setStatsLoading(false);
    setApiUsageLoading(false);
    setChartLoading(false);
  };

  const processRevenueData = (invoiceData: Invoice[]) => {
    const monthlyData: { [key: string]: { revenue: number; count: number } } = {};

    invoiceData.forEach((invoice) => {
      if (invoice.status === 'paid' && invoice.paid_date) {
        const date = new Date(invoice.paid_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

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
      .slice(-6); // Last 6 months for forecast compatibility

    setRevenueData(chartData);
  };

  const handleCreateInvoice = async (formData: InvoiceFormData) => {
    setInvoiceFormLoading(true);

    try {
      // Convert form data to API format
      const invoiceData = {
        company_id: formData.clientId,
        amount: formData.lineItems.reduce((sum, item) => sum + item.amount, 0),
        due_date: formData.dueDate,
        line_items: formData.lineItems,
      };

      const { data, error } = await createInvoice(invoiceData);

      if (!error && data) {
        setInvoices((prev) => [data as Invoice, ...prev]);
        // Refresh stats and chart data
        const statsRes = await getInvoiceStats(role === 'client' ? companyId : undefined);
        if (statsRes.data) {
          setInvoiceStats(statsRes.data);
        }
        processRevenueData([data as Invoice, ...invoices]);
      } else {
        throw new Error(error || 'Failed to create invoice');
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    } finally {
      setInvoiceFormLoading(false);
    }
  };

  const handleGenerateForecast = async () => {
    setForecastLoading(true);
    try {
      const { data, error } = await generateAIForecast();
      if (error) {
        console.error('Error generating forecast:', error);
        alert('Failed to generate forecast. Please try again.');
      } else if (data) {
        setForecast(data);
      }
    } catch (error) {
      console.error('Error generating forecast:', error);
      alert('Failed to generate forecast. Please try again.');
    } finally {
      setForecastLoading(false);
    }
  };

  const handlePayInvoice = async (invoice: Invoice) => {
    if (!invoice.id) return;

    try {
      const { data, error } = await markInvoicePaid(invoice.id);

      if (!error && data) {
        setInvoices((prev) => prev.map((inv) => (inv.id === invoice.id ? (data as Invoice) : inv)));
        // Refresh stats
        const statsRes = await getInvoiceStats(role === 'client' ? companyId : undefined);
        if (statsRes.data) {
          setInvoiceStats(statsRes.data);
        }
        processRevenueData([data as Invoice, ...invoices.filter((inv) => inv.id !== invoice.id)]);
        alert(`Invoice marked as paid!`);
      } else {
        throw new Error(error || 'Failed to mark invoice as paid');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Payment processing failed. Please try again.');
    }
  };

  const getStatusBadge = (status: string, dueDate?: string) => {
    const now = new Date();
    const due = dueDate ? new Date(dueDate) : null;
    const isOverdue = due && due < now && status === 'pending';

    if (isOverdue) {
      return 'bg-red-500/20 text-red-300 border border-red-500/30';
    }

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

  const getStatusText = (status: string, dueDate?: string) => {
    const now = new Date();
    const due = dueDate ? new Date(dueDate) : null;
    const isOverdue = due && due < now && status === 'pending';

    if (isOverdue) return 'Overdue';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Main Component
  return (
    <div className="relative min-h-screen overflow-hidden flex">
      <MainNavigation />
      {/* cosmic background */}
      <CosmicBackground />

      {/* main content */}
      <div className="flex-1 p-8 pt-24 max-w-7xl mx-auto">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-white">Financial Nexus</h1>
            {role === 'admin' && (
              <Button
                onClick={() => setNewInvoiceDialogOpen(true)}
                className="bg-cosmic-blue hover:bg-cosmic-blue/80"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Invoice
              </Button>
            )}
          </div>

          {/* Financial Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="flex items-center space-x-3">
                <DollarSign className="w-8 h-8 text-green-400" />
                <div>
                  <p className="text-cosmic-blue text-sm">Total Paid (This Month)</p>
                  <p className="text-white text-2xl font-bold">
                    {statsLoading ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      formatCurrency(invoiceStats.totalPaidThisMonth)
                    )}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="flex items-center space-x-3">
                <CreditCard className="w-8 h-8 text-yellow-400" />
                <div>
                  <p className="text-cosmic-blue text-sm">Outstanding</p>
                  <p className="text-white text-2xl font-bold">
                    {statsLoading ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      formatCurrency(invoiceStats.totalOutstanding)
                    )}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="flex items-center space-x-3">
                <Calendar className="w-8 h-8 text-orange-400" />
                <div>
                  <p className="text-cosmic-blue text-sm">Unpaid</p>
                  <p className="text-white text-2xl font-bold">
                    {statsLoading ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      formatCurrency(invoiceStats.totalUnpaid)
                    )}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-8 h-8 text-red-400" />
                <div>
                  <p className="text-cosmic-blue text-sm">Overdue</p>
                  <p className="text-white text-2xl font-bold">
                    {statsLoading ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      formatCurrency(invoiceStats.totalOverdue)
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="invoices" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-800/50">
              <TabsTrigger value="invoices" className="flex items-center space-x-2">
                <Receipt className="w-4 h-4" />
                <span>💵 Invoices & Payments</span>
              </TabsTrigger>
              <TabsTrigger value="usage" className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4" />
                <span>📊 API Usage & Budget</span>
              </TabsTrigger>
            </TabsList>

            {/* Invoices Tab */}
            <TabsContent value="invoices" className="space-y-6">
              {/* Revenue Chart */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white">Revenue Overview</h3>
                  <Button
                    onClick={handleGenerateForecast}
                    disabled={forecastLoading}
                    variant="outline"
                    size="sm"
                    className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    {forecastLoading ? 'Generating...' : 'AI Forecast'}
                  </Button>
                </div>

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
                          return date.toLocaleDateString('en-US', {
                            month: 'long',
                            year: 'numeric',
                          });
                        }}
                        formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
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

                {/* Forecast Display */}
                {forecast && (
                  <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <h4 className="text-white font-semibold mb-3 flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2" />
                      AI Revenue Forecast
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-cosmic-blue text-sm">Next Month</p>
                        <p className="text-white text-xl font-bold">
                          {formatCurrency(forecast.forecastNextMonth)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-cosmic-blue text-sm">Trend</p>
                        <p
                          className={`text-lg font-bold ${
                            forecast.trend === 'increasing'
                              ? 'text-green-400'
                              : forecast.trend === 'decreasing'
                              ? 'text-red-400'
                              : 'text-yellow-400'
                          }`}
                        >
                          {forecast.trend.charAt(0).toUpperCase() + forecast.trend.slice(1)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-cosmic-blue text-sm">Confidence</p>
                        <p className="text-white text-xl font-bold">
                          {forecast.forecastConfidence.toFixed(0)}%
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {forecast.insights.slice(0, 3).map((insight, index) => (
                        <p key={index} className="text-gray-300 text-sm">
                          • {insight}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Invoices Table */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden">
                <div className="p-6 border-b border-white/20">
                  <h3 className="text-xl font-semibold text-white">Invoices</h3>
                </div>

                {invoicesLoading ? (
                  <div className="p-6">
                    <div className="space-y-4">
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
                        {role === 'admin' && <TableHead className="text-white">Client</TableHead>}
                        <TableHead className="text-white">Date</TableHead>
                        <TableHead className="text-white">Amount</TableHead>
                        <TableHead className="text-white">Due Date</TableHead>
                        <TableHead className="text-white">Status</TableHead>
                        <TableHead className="text-white">Actions</TableHead>
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
                            {role === 'admin' && (
                              <TableCell className="text-white">
                                {company?.name || 'Unknown Client'}
                              </TableCell>
                            )}
                            <TableCell className="text-white">
                              {new Date(invoice.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-white font-semibold">
                              {formatCurrency(invoice.amount)}
                            </TableCell>
                            <TableCell className="text-cosmic-blue">
                              {new Date(invoice.due_date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(
                                  invoice.status,
                                  invoice.due_date,
                                )}`}
                              >
                                {getStatusText(invoice.status, invoice.due_date)}
                              </span>
                            </TableCell>
                            <TableCell>
                              {invoice.status !== 'paid' && (
                                <Button
                                  onClick={() => handlePayInvoice(invoice)}
                                  size="sm"
                                  className="bg-cosmic-blue hover:bg-cosmic-blue/80"
                                >
                                  <CreditCard className="w-4 h-4 mr-2" />
                                  Mark Paid
                                </Button>
                              )}
                              {invoice.payment_link && (
                                <Button
                                  onClick={() => window.open(invoice.payment_link, '_blank')}
                                  size="sm"
                                  variant="outline"
                                  className="ml-2"
                                >
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  Pay Now
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
            </TabsContent>

            {/* API Usage Tab */}
            <TabsContent value="usage" className="space-y-6">
              {/* Budget Overview */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
                <h3 className="text-xl font-semibold text-white mb-4">API Budget Overview</h3>
                <UsageBar
                  currentUsage={budgetInfo.currentUsage}
                  budgetLimit={budgetInfo.budgetLimit}
                  title="Monthly API Budget"
                />
              </div>

              {/* API Usage Breakdown */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden">
                <div className="p-6 border-b border-white/20">
                  <h3 className="text-xl font-semibold text-white">API Usage Breakdown</h3>
                </div>

                {apiUsageLoading ? (
                  <div className="p-6">
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-4">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/20 hover:bg-white/5">
                        <TableHead className="text-white">Service</TableHead>
                        <TableHead className="text-white">Requests</TableHead>
                        <TableHead className="text-white">Tokens/Images</TableHead>
                        <TableHead className="text-white">Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {apiUsage.map((usage) => (
                        <TableRow key={usage.service} className="border-white/20 hover:bg-white/5">
                          <TableCell className="text-white font-medium">{usage.service}</TableCell>
                          <TableCell className="text-white">
                            {usage.requestsCount.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-white">
                            {usage.tokensUsed
                              ? `${usage.tokensUsed.toLocaleString()} tokens`
                              : usage.imagesGenerated
                              ? `${usage.imagesGenerated} images`
                              : 'N/A'}
                          </TableCell>
                          <TableCell className="text-white font-semibold">
                            {formatCurrency(usage.totalCost)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {apiUsage.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-gray-400 py-8">
                            No API usage data available for this month
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Invoice Form Dialog */}
          {role === 'admin' && (
            <InvoiceForm
              isOpen={newInvoiceDialogOpen}
              onClose={() => setNewInvoiceDialogOpen(false)}
              onSubmit={handleCreateInvoice}
              clients={companies.map((c) => ({ id: c.id, name: c.name }))}
              loading={invoiceFormLoading}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancialNexus;
