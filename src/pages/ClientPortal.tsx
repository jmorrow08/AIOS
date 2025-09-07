import React, { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { RadialMenu } from '@/components/RadialMenu';
import { CosmicBackground } from '@/components/CosmicBackground';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CheckCircle, Clock, CreditCard, MessageCircle, Send } from 'lucide-react';
import { getServices, Service, ServiceStatus } from '@/api/services';
import { getInvoices, markInvoicePaid, Invoice, InvoiceStatus } from '@/api/invoices';

const ClientPortal: React.FC = () => {
  const { user, profile, companyId } = useUser();
  const [services, setServices] = useState<Service[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      text: "Hi! I'm Jarvis, your AI assistant. How can I help you today?",
      isBot: true,
      timestamp: new Date(),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!companyId) return;

      try {
        setLoading(true);
        setError(null);

        const [servicesResponse, invoicesResponse] = await Promise.all([
          getServices(companyId),
          getInvoices(companyId),
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
      } catch (err) {
        setError('An unexpected error occurred while loading data');
        console.error('Error loading client portal data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [companyId]);

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

  const sendChatMessage = () => {
    if (!chatInput.trim()) return;

    const newMessage = {
      id: chatMessages.length + 1,
      text: chatInput,
      isBot: false,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, newMessage]);
    setChatInput('');

    // Simulate AI response
    setTimeout(() => {
      const botResponse = {
        id: chatMessages.length + 2,
        text: 'Thank you for your message! This is a demo AI helpdesk. In a real implementation, this would connect to our AI system to provide intelligent assistance with your services and invoices.',
        isBot: true,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, botResponse]);
    }, 1000);
  };

  const getStatusColor = (status: ServiceStatus | InvoiceStatus) => {
    switch (status) {
      case 'active':
      case 'paid':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'overdue':
        return 'bg-red-500';
      case 'paused':
        return 'bg-gray-500';
      case 'completed':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: ServiceStatus | InvoiceStatus) => {
    switch (status) {
      case 'active':
      case 'paid':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white/5 rounded-lg p-6 border border-white/10">
                  <div className="mb-4">
                    <Skeleton className="h-6 w-32" />
                  </div>
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-24" />
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

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <div className="pb-2">
                  <h4 className="text-white text-sm font-semibold">Active Services</h4>
                </div>
                <div className="text-2xl font-bold text-cosmic-accent">
                  {services.filter((s) => s.status === 'active').length}
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <div className="pb-2">
                  <h4 className="text-white text-sm font-semibold">Pending Invoices</h4>
                </div>
                <div className="text-2xl font-bold text-yellow-400">
                  {invoices.filter((i) => i.status === 'pending').length}
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <div className="pb-2">
                  <h4 className="text-white text-sm font-semibold">Outstanding Amount</h4>
                </div>
                <div className="text-2xl font-bold text-red-400">
                  $
                  {invoices
                    .filter((i) => i.status === 'pending' || i.status === 'overdue')
                    .reduce((sum, i) => sum + i.amount, 0)
                    .toFixed(2)}
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <div className="pb-2">
                  <h4 className="text-white text-sm font-semibold">Paid This Month</h4>
                </div>
                <div className="text-2xl font-bold text-green-400">
                  $
                  {invoices
                    .filter(
                      (i) =>
                        i.status === 'paid' &&
                        new Date(i.paid_date || '').getMonth() === new Date().getMonth(),
                    )
                    .reduce((sum, i) => sum + i.amount, 0)
                    .toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Services List */}
            <div className="lg:col-span-2">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                <div className="p-6 border-b border-white/10">
                  <h3 className="text-white flex items-center gap-2 text-xl font-semibold">
                    <CheckCircle className="w-5 h-5" />
                    Your Services
                  </h3>
                  <p className="text-cosmic-accent mt-2">Manage and monitor your active services</p>
                </div>
                <div className="p-6">
                  {services.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-cosmic-accent">No services found.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {services.map((service) => (
                        <div
                          key={service.id}
                          className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                        >
                          <div className="flex-1">
                            <h4 className="font-semibold text-white">{service.name}</h4>
                            <p className="text-sm text-cosmic-accent mt-1">
                              {service.description || 'No description available'}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span className="text-cosmic-accent">
                                ${service.price}/
                                {service.billing_type === 'subscription' ? 'month' : 'project'}
                              </span>
                              {service.start_date && (
                                <span className="text-cosmic-accent">
                                  Started: {new Date(service.start_date).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(
                              service.status,
                            )}`}
                          >
                            {getStatusIcon(service.status)}
                            {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Invoices Table */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 mt-8">
                <div className="p-6 border-b border-white/10">
                  <h3 className="text-white flex items-center gap-2 text-xl font-semibold">
                    <CreditCard className="w-5 h-5" />
                    Invoices & Billing
                  </h3>
                  <p className="text-cosmic-accent mt-2">View and manage your invoices</p>
                </div>
                <div className="p-6">
                  {invoices.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-cosmic-accent">No invoices found.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/10">
                          <TableHead className="text-cosmic-accent">Amount</TableHead>
                          <TableHead className="text-cosmic-accent">Due Date</TableHead>
                          <TableHead className="text-cosmic-accent">Status</TableHead>
                          <TableHead className="text-cosmic-accent">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoices.map((invoice) => (
                          <TableRow key={invoice.id} className="border-white/10">
                            <TableCell className="text-white font-medium">
                              ${invoice.amount.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-cosmic-accent">
                              {new Date(invoice.due_date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(
                                  invoice.status,
                                )}`}
                              >
                                {getStatusIcon(invoice.status)}
                                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                              </span>
                            </TableCell>
                            <TableCell>
                              {(invoice.status === 'pending' || invoice.status === 'overdue') && (
                                <Button
                                  size="sm"
                                  onClick={() => handlePayInvoice(invoice.id)}
                                  disabled={isProcessingPayment === invoice.id}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  {isProcessingPayment === invoice.id ? 'Processing...' : 'Pay Now'}
                                </Button>
                              )}
                              {invoice.status === 'paid' && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white bg-green-500">
                                  Paid on{' '}
                                  {invoice.paid_date
                                    ? new Date(invoice.paid_date).toLocaleDateString()
                                    : 'N/A'}
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>
            </div>

            {/* AI Helpdesk Chat */}
            <div className="lg:col-span-1">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 h-fit">
                <div className="p-6 border-b border-white/10">
                  <h3 className="text-white flex items-center gap-2 text-xl font-semibold">
                    <MessageCircle className="w-5 h-5" />
                    AI Helpdesk
                  </h3>
                  <p className="text-cosmic-accent mt-2">Get instant help from our AI assistant</p>
                </div>
                <div className="p-6 flex flex-col h-96">
                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-2">
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg ${
                            message.isBot
                              ? 'bg-white/10 text-white'
                              : 'bg-cosmic-accent text-cosmic-dark'
                          }`}
                        >
                          <p className="text-sm">{message.text}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {message.timestamp.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Chat Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                      placeholder="Type your message..."
                      className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-cosmic-accent focus:outline-none focus:ring-2 focus:ring-cosmic-accent"
                    />
                    <Button
                      size="sm"
                      onClick={sendChatMessage}
                      disabled={!chatInput.trim()}
                      className="bg-cosmic-accent hover:bg-cosmic-accent/80 text-cosmic-dark"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientPortal;
