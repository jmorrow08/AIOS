import React, { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { RadialMenu } from '@/components/RadialMenu';
import { CosmicBackground } from '@/components/CosmicBackground';
import { ServiceCard } from '@/components/ServiceCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  CreditCard,
  MessageCircle,
  Send,
  Receipt,
  ExternalLink,
  TrendingUp,
  Users,
  DollarSign,
  Star,
  Archive,
  Plus,
  Filter,
  Search,
} from 'lucide-react';
import { getServices, Service, ServiceStatus, updateService } from '@/api/services';
import { getInvoices, markInvoicePaid, Invoice, InvoiceStatus } from '@/api/invoices';
import {
  createCheckoutSession,
  createCustomerPortalSession,
  getCompanyBillingInfo,
} from '@/api/stripe';
import { getPublicTestimonials, getFeedbackStats } from '@/api/serviceFeedback';

const ClientPortal: React.FC = () => {
  const { user, profile, companyId } = useUser();
  const [services, setServices] = useState<Service[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [billingInfo, setBillingInfo] = useState<any>(null);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [feedbackStats, setFeedbackStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ServiceStatus | 'all'>('all');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState<string | null>(null);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!companyId) return;

      try {
        setLoading(true);
        setError(null);

        const [
          servicesResponse,
          invoicesResponse,
          billingResponse,
          testimonialsResponse,
          feedbackStatsResponse,
        ] = await Promise.all([
          getServices(companyId),
          getInvoices(companyId),
          getCompanyBillingInfo(companyId),
          getPublicTestimonials(companyId),
          getFeedbackStats(companyId),
        ]);

        if (servicesResponse.error) {
          setError(`Failed to load services: ${servicesResponse.error}`);
        } else {
          setServices(servicesResponse.data as Service[]);
        }

        if (invoicesResponse.error) {
          setError(`Failed to load invoices: ${invoicesResponse.error}`);
        } else {
          setInvoices(invoicesResponse.data as Invoice[]);
        }

        if (billingResponse.error) {
          console.warn('Failed to load billing info:', billingResponse.error);
        } else {
          setBillingInfo(billingResponse.data);
        }

        if (testimonialsResponse.error) {
          console.warn('Failed to load testimonials:', testimonialsResponse.error);
        } else {
          const testimonialData = testimonialsResponse.data;
          setTestimonials(
            Array.isArray(testimonialData)
              ? testimonialData
              : testimonialData
              ? [testimonialData]
              : [],
          );
        }

        if (feedbackStatsResponse.error) {
          console.warn('Failed to load feedback stats:', feedbackStatsResponse.error);
        } else {
          setFeedbackStats(feedbackStatsResponse.data);
        }
      } catch (err) {
        setError('An unexpected error occurred while loading data');
        console.error('Error loading client portal data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [companyId]);

  // Filter services based on search and status
  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (service.description &&
        service.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || service.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Separate active and completed services
  const activeServices = filteredServices.filter(
    (service) => !['completed', 'archived'].includes(service.status as ServiceStatus),
  );
  const completedServices = filteredServices.filter((service) =>
    ['completed', 'archived'].includes(service.status as ServiceStatus),
  );

  const handleServiceStatusUpdate = async (serviceId: string, newStatus: ServiceStatus) => {
    try {
      setIsUpdatingStatus(serviceId);
      const response = await updateService(serviceId, { status: newStatus });

      if (response.error) {
        setError(`Failed to update service status: ${response.error}`);
      } else {
        // Update the service in the local state
        setServices((prev) =>
          prev.map((service) =>
            service.id === serviceId ? { ...service, status: newStatus } : service,
          ),
        );
      }
    } catch (err) {
      setError('An unexpected error occurred while updating service status');
      console.error('Error updating service status:', err);
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const handlePayInvoice = async (invoiceId: string) => {
    try {
      setIsProcessingPayment(invoiceId);
      const response = await markInvoicePaid(invoiceId);

      if (response.error) {
        setError(`Failed to process payment: ${response.error}`);
      } else {
        // Update the invoice in the local state
        setInvoices((prev) =>
          prev.map((invoice) =>
            invoice.id === invoiceId
              ? { ...invoice, status: 'paid', paid_date: new Date().toISOString().split('T')[0] }
              : invoice,
          ),
        );
      }
    } catch (err) {
      setError('An unexpected error occurred while processing payment');
      console.error('Error processing payment:', err);
    } finally {
      setIsProcessingPayment(null);
    }
  };

  const handleStripeCheckout = async (invoice: Invoice) => {
    if (!companyId) return;

    try {
      setIsProcessingCheckout(invoice.id);
      const response = await createCheckoutSession({
        companyId,
        invoiceId: invoice.id,
        amount: invoice.amount,
        description: `Invoice Payment - ${invoice.id.slice(0, 8)}`,
      });

      if (response.error) {
        setError(`Failed to create checkout session: ${response.error}`);
      } else if (response.data?.url) {
        // Redirect to Stripe Checkout
        window.location.href = response.data.url;
      }
    } catch (err) {
      setError('An unexpected error occurred while creating checkout session');
      console.error('Error creating checkout session:', err);
    } finally {
      setIsProcessingCheckout(null);
    }
  };

  const handleOpenCustomerPortal = async () => {
    if (!companyId) return;

    try {
      setIsLoadingPortal(true);
      const response = await createCustomerPortalSession({
        companyId,
        returnUrl: window.location.href,
      });

      if (response.error) {
        setError(`Failed to open customer portal: ${response.error}`);
      } else if (response.data?.url) {
        // Open Stripe Customer Portal in new tab
        window.open(response.data.url, '_blank');
      }
    } catch (err) {
      setError('An unexpected error occurred while opening customer portal');
      console.error('Error opening customer portal:', err);
    } finally {
      setIsLoadingPortal(false);
    }
  };

  const getStatusColor = (status: ServiceStatus | InvoiceStatus) => {
    switch (status) {
      case 'requested':
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'review':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
      case 'completed':
      case 'paid':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'archived':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
      case 'overdue':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const getStatusIcon = (status: ServiceStatus | InvoiceStatus) => {
    switch (status) {
      case 'requested':
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'in_progress':
        return <AlertCircle className="w-4 h-4" />;
      case 'review':
        return <CheckCircle className="w-4 h-4" />;
      case 'completed':
      case 'paid':
        return <CheckCircle className="w-4 h-4" />;
      case 'archived':
        return <Archive className="w-4 h-4" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <CosmicBackground />
        <RadialMenu />
        <div className="p-8 pt-24 max-w-7xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20">
            <div className="mb-8">
              <Skeleton className="h-10 w-64 mb-2" />
              <Skeleton className="h-6 w-48" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white/5 rounded-lg p-6 border border-white/10">
                  <div className="mb-4">
                    <Skeleton className="h-6 w-32" />
                  </div>
                  <div className="space-y-3">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white/5 rounded-lg p-6 border border-white/10">
                  <Skeleton className="h-6 w-48 mb-4" />
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
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

      <div className="p-8 pt-24 max-w-7xl mx-auto">
        <div className="space-y-8">
          {/* Header */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">Client Portal</h1>
              <p className="text-cosmic-accent text-lg">Welcome back, {user?.email}</p>
              {error && (
                <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <p className="text-red-400">{error}</p>
                </div>
              )}
            </div>

            {/* Enhanced Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white/5 border border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-cosmic-accent text-sm font-medium">Active Services</p>
                      <p className="text-2xl font-bold text-cosmic-accent">
                        {activeServices.length}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-cosmic-accent" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-cosmic-accent text-sm font-medium">Pending Invoices</p>
                      <p className="text-2xl font-bold text-yellow-400">
                        {invoices.filter((i) => i.status === 'pending').length}
                      </p>
                    </div>
                    <Receipt className="w-8 h-8 text-yellow-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-cosmic-accent text-sm font-medium">Outstanding Amount</p>
                      <p className="text-2xl font-bold text-red-400">
                        $
                        {invoices
                          .filter((i) => i.status === 'pending' || i.status === 'overdue')
                          .reduce((sum, i) => sum + i.amount, 0)
                          .toFixed(2)}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-red-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-cosmic-accent text-sm font-medium">Avg Rating</p>
                      <p className="text-2xl font-bold text-purple-400">
                        {feedbackStats?.averageRating?.toFixed(1) || 'N/A'}
                      </p>
                    </div>
                    <Star className="w-8 h-8 text-purple-400" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-white/10">
              <TabsTrigger value="active" className="data-[state=active]:bg-cosmic-accent">
                Active Services ({activeServices.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="data-[state=active]:bg-cosmic-accent">
                Completed ({completedServices.length})
              </TabsTrigger>
              <TabsTrigger value="billing" className="data-[state=active]:bg-cosmic-accent">
                Billing & Payments
              </TabsTrigger>
              <TabsTrigger value="feedback" className="data-[state=active]:bg-cosmic-accent">
                Reviews & Testimonials
              </TabsTrigger>
            </TabsList>

            {/* Active Services Tab */}
            <TabsContent value="active" className="space-y-6">
              {/* Search and Filter Controls */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cosmic-accent w-4 h-4" />
                      <Input
                        placeholder="Search services..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-white/5 border-white/20 text-white placeholder-cosmic-accent"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as ServiceStatus | 'all')}
                      className="px-3 py-2 bg-white/5 border border-white/20 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-cosmic-accent"
                    >
                      <option value="all">All Status</option>
                      <option value="requested">Requested</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">Review</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Services Grid */}
              {activeServices.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-8">
                    <CheckCircle className="w-16 h-16 text-cosmic-accent mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Active Services</h3>
                    <p className="text-cosmic-accent">
                      {searchQuery || statusFilter !== 'all'
                        ? 'No services match your current filters.'
                        : 'All your services are completed or archived.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {activeServices.map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      onStatusUpdate={handleServiceStatusUpdate}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Completed Services Tab */}
            <TabsContent value="completed" className="space-y-6">
              {/* Search and Filter Controls */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cosmic-accent w-4 h-4" />
                      <Input
                        placeholder="Search completed services..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-white/5 border-white/20 text-white placeholder-cosmic-accent"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as ServiceStatus | 'all')}
                      className="px-3 py-2 bg-white/5 border border-white/20 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-cosmic-accent"
                    >
                      <option value="all">All Status</option>
                      <option value="completed">Completed</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Completed Services Grid */}
              {completedServices.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-8">
                    <Archive className="w-16 h-16 text-cosmic-accent mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Completed Services</h3>
                    <p className="text-cosmic-accent">
                      {searchQuery || statusFilter !== 'all'
                        ? 'No services match your current filters.'
                        : "You haven't completed any services yet."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {completedServices.map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      onStatusUpdate={handleServiceStatusUpdate}
                      compact
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Billing & Payments Tab */}
            <TabsContent value="billing" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Invoices and Payments */}
                <div className="lg:col-span-2">
                  <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Receipt className="w-5 h-5" />
                        Invoices & Payments
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {invoices.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-cosmic-accent">No invoices found.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {invoices.map((invoice) => (
                            <div
                              key={invoice.id}
                              className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <div>
                                    <h4 className="font-semibold text-white">
                                      Invoice #{invoice.id.slice(0, 8)}
                                    </h4>
                                    <p className="text-sm text-cosmic-accent">
                                      Due: {new Date(invoice.due_date).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="text-lg font-bold text-white">
                                    ${invoice.amount.toFixed(2)}
                                  </p>
                                  <Badge className={getStatusColor(invoice.status)}>
                                    {getStatusIcon(invoice.status)}
                                    <span className="ml-1 capitalize">{invoice.status}</span>
                                  </Badge>
                                </div>
                                {(invoice.status === 'pending' || invoice.status === 'overdue') && (
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleStripeCheckout(invoice)}
                                      disabled={isProcessingCheckout === invoice.id}
                                      className="bg-blue-600 hover:bg-blue-700"
                                    >
                                      {isProcessingCheckout === invoice.id
                                        ? 'Processing...'
                                        : 'Pay Now'}
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => handlePayInvoice(invoice.id)}
                                      disabled={isProcessingPayment === invoice.id}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      {isProcessingPayment === invoice.id
                                        ? 'Processing...'
                                        : 'Mark Paid'}
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Billing Summary & Portal */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Billing Portal Access */}
                  <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        Billing Portal
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={handleOpenCustomerPortal}
                        disabled={isLoadingPortal}
                        className="w-full bg-cosmic-accent hover:bg-cosmic-accent/80 text-cosmic-dark font-semibold"
                      >
                        {isLoadingPortal ? 'Loading...' : 'Manage Billing'}
                      </Button>
                      <p className="text-xs text-cosmic-accent mt-2">
                        Update payment methods, view receipts, and manage subscriptions
                      </p>
                    </CardContent>
                  </Card>

                  {/* Usage Summary */}
                  <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white">Usage Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-cosmic-accent">Monthly Cost:</span>
                          <span className="text-white font-medium">
                            ${billingInfo?.usage?.totalCost?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-cosmic-accent">API Requests:</span>
                          <span className="text-white font-medium">
                            {billingInfo?.usage?.totalRequests || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-cosmic-accent">Plan Limit:</span>
                          <span className="text-white font-medium">
                            ${billingInfo?.plan?.monthly_limit_usd || 100}
                          </span>
                        </div>
                        <div className="pt-4 border-t border-white/10">
                          <div className="flex justify-between">
                            <span className="text-cosmic-accent">Plan:</span>
                            <span className="text-white font-medium">
                              {billingInfo?.plan?.plan_tier || 'starter'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Reviews & Testimonials Tab */}
            <TabsContent value="feedback" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Feedback Statistics */}
                <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Star className="w-5 h-5" />
                      Your Feedback Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-cosmic-accent mb-2">
                          {feedbackStats?.averageRating?.toFixed(1) || 'N/A'}
                        </div>
                        <div className="flex justify-center mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-5 h-5 ${
                                star <= (feedbackStats?.averageRating || 0)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-400'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-cosmic-accent text-sm">
                          Based on {feedbackStats?.totalFeedback || 0} reviews
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-cosmic-accent">Public Testimonials:</span>
                          <span className="text-white">
                            {feedbackStats?.publicTestimonials || 0}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-cosmic-accent">Total Reviews:</span>
                          <span className="text-white">{feedbackStats?.totalFeedback || 0}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Public Testimonials */}
                <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Public Testimonials</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {testimonials.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-cosmic-accent">No public testimonials yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {testimonials.slice(0, 5).map((testimonial: any) => (
                          <div
                            key={testimonial.id}
                            className="p-4 bg-white/5 rounded-lg border border-white/10"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-4 h-4 ${
                                      star <= testimonial.rating
                                        ? 'text-yellow-400 fill-current'
                                        : 'text-gray-400'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-xs text-cosmic-accent">
                                {new Date(testimonial.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            {testimonial.comment && (
                              <p className="text-white text-sm">"{testimonial.comment}"</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ClientPortal;
