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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Users,
  Settings,
  CreditCard,
  TrendingUp,
  Plus,
  Building,
  FileText,
  Receipt,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Activity,
} from 'lucide-react';
import { getCompanies, Company, createCompany } from '@/api/companies';
import { getServices, Service, createService } from '@/api/services';
import { getInvoices, Invoice, createInvoice } from '@/api/invoices';
import { getAgents, Agent } from '@/agents/api';

interface CombinedData {
  company: Company;
  services: Service[];
  totalRevenue: number;
  activeServices: number;
}

const AdminPortal: React.FC = () => {
  const { user, profile } = useUser();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [showIssueInvoiceModal, setShowIssueInvoiceModal] = useState(false);

  // Form states
  const [newClient, setNewClient] = useState({ name: '', email: '', phone: '' });
  const [newService, setNewService] = useState({
    company_id: '',
    name: '',
    description: '',
    billing_type: 'subscription' as const,
    price: 0,
  });
  const [newInvoice, setNewInvoice] = useState({
    company_id: '',
    service_id: '',
    amount: 0,
    due_date: '',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [companiesResponse, servicesResponse, invoicesResponse, agentsResponse] =
          await Promise.all([getCompanies(), getServices(), getInvoices(), getAgents()]);

        if (companiesResponse.error)
          setError(`Failed to load companies: ${companiesResponse.error}`);
        else setCompanies(companiesResponse.data as Company[]);

        if (servicesResponse.error) setError(`Failed to load services: ${servicesResponse.error}`);
        else setServices(servicesResponse.data as Service[]);

        if (invoicesResponse.error) setError(`Failed to load invoices: ${invoicesResponse.error}`);
        else setInvoices(invoicesResponse.data as Invoice[]);

        if (agentsResponse.error) setError(`Failed to load agents: ${agentsResponse.error}`);
        else setAgents(agentsResponse.data as Agent[]);
      } catch (err) {
        setError('An unexpected error occurred while loading data');
        console.error('Error loading admin portal data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleAddClient = async () => {
    try {
      const contactInfo = {
        email: newClient.email,
        phone: newClient.phone,
      };

      const response = await createCompany({
        name: newClient.name,
        contact_info: contactInfo,
      });

      if (response.error) {
        setError(`Failed to create client: ${response.error}`);
      } else {
        setCompanies((prev) => [response.data as Company, ...prev]);
        setNewClient({ name: '', email: '', phone: '' });
        setShowAddClientModal(false);
      }
    } catch (err) {
      setError('An unexpected error occurred while creating client');
      console.error('Error creating client:', err);
    }
  };

  const handleAddService = async () => {
    try {
      const response = await createService(newService);

      if (response.error) {
        setError(`Failed to create service: ${response.error}`);
      } else {
        setServices((prev) => [response.data as Service, ...prev]);
        setNewService({
          company_id: '',
          name: '',
          description: '',
          billing_type: 'subscription',
          price: 0,
        });
        setShowAddServiceModal(false);
      }
    } catch (err) {
      setError('An unexpected error occurred while creating service');
      console.error('Error creating service:', err);
    }
  };

  const handleIssueInvoice = async () => {
    try {
      const response = await createInvoice(
        newInvoice.company_id,
        newInvoice.service_id,
        newInvoice.amount,
        newInvoice.due_date,
      );

      if (response.error) {
        setError(`Failed to create invoice: ${response.error}`);
      } else {
        setInvoices((prev) => [response.data as Invoice, ...prev]);
        setNewInvoice({
          company_id: '',
          service_id: '',
          amount: 0,
          due_date: '',
        });
        setShowIssueInvoiceModal(false);
      }
    } catch (err) {
      setError('An unexpected error occurred while creating invoice');
      console.error('Error creating invoice:', err);
    }
  };

  // Calculate KPIs
  const totalClients = companies.length;
  const totalServices = services.length;
  const activeAgents = agents.filter((agent) => agent.status === 'active').length;

  // Calculate MRR (Monthly Recurring Revenue)
  const mrr = services
    .filter((service) => service.billing_type === 'subscription')
    .reduce((sum, service) => sum + service.price, 0);

  // Combine data for DataTable
  const combinedData: CombinedData[] = companies.map((company) => ({
    company,
    services: services.filter((service) => service.company_id === company.id),
    totalRevenue: invoices
      .filter((invoice) => invoice.company_id === company.id)
      .reduce((sum, invoice) => sum + invoice.amount, 0),
    activeServices: services.filter(
      (service) => service.company_id === company.id && service.status === 'active',
    ).length,
  }));

  const filteredData = combinedData.filter(
    (item) =>
      item.company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.services.some((service) =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
  );

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
                  <Skeleton className="h-8 w-16" />
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
              <h1 className="text-4xl font-bold text-white mb-2">Admin Portal</h1>
              <p className="text-cosmic-accent text-lg">Welcome back, {user?.email}</p>
              {error && (
                <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <p className="text-red-400">{error}</p>
                </div>
              )}
            </div>

            {/* KPIs Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <Building className="w-8 h-8 text-cosmic-accent" />
                  <div>
                    <p className="text-sm text-cosmic-accent">Total Clients</p>
                    <p className="text-2xl font-bold text-white">{totalClients}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <Settings className="w-8 h-8 text-green-400" />
                  <div>
                    <p className="text-sm text-cosmic-accent">Total Services</p>
                    <p className="text-2xl font-bold text-white">{totalServices}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <DollarSign className="w-8 h-8 text-yellow-400" />
                  <div>
                    <p className="text-sm text-cosmic-accent">Monthly Recurring Revenue</p>
                    <p className="text-2xl font-bold text-white">${mrr.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <Activity className="w-8 h-8 text-purple-400" />
                  <div>
                    <p className="text-sm text-cosmic-accent">Active Agents</p>
                    <p className="text-2xl font-bold text-white">{activeAgents}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Button
                onClick={() => setShowAddClientModal(true)}
                className="bg-cosmic-accent hover:bg-cosmic-accent/80 text-white h-16 text-lg font-semibold"
              >
                <Plus className="w-6 h-6 mr-2" />
                Add Client
              </Button>

              <Button
                onClick={() => setShowAddServiceModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white h-16 text-lg font-semibold"
              >
                <Settings className="w-6 h-6 mr-2" />
                Add Service
              </Button>

              <Button
                onClick={() => setShowIssueInvoiceModal(true)}
                className="bg-yellow-600 hover:bg-yellow-700 text-white h-16 text-lg font-semibold"
              >
                <Receipt className="w-6 h-6 mr-2" />
                Issue Invoice
              </Button>
            </div>
          </div>

          {/* Overview DataTable */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">Clients & Services Overview</h2>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cosmic-accent w-4 h-4" />
                    <Input
                      placeholder="Search clients or services..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white/5 border-white/20 text-white placeholder-cosmic-accent w-64"
                    />
                  </div>
                  <Button variant="outline" className="border-white/20 text-white">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-6">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-cosmic-accent">Client Name</TableHead>
                    <TableHead className="text-cosmic-accent">Active Services</TableHead>
                    <TableHead className="text-cosmic-accent">Total Services</TableHead>
                    <TableHead className="text-cosmic-accent">Total Revenue</TableHead>
                    <TableHead className="text-cosmic-accent">Created</TableHead>
                    <TableHead className="text-cosmic-accent">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item) => (
                    <TableRow key={item.company.id} className="border-white/10">
                      <TableCell className="text-white font-medium">{item.company.name}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white bg-green-500">
                          {item.activeServices} active
                        </span>
                      </TableCell>
                      <TableCell className="text-cosmic-accent">
                        {item.services.length} total
                      </TableCell>
                      <TableCell className="text-white font-medium">
                        ${item.totalRevenue.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-cosmic-accent">
                        {new Date(item.company.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-white/20 text-white"
                          >
                            View Details
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-white/20 text-white"
                          >
                            Manage
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredData.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-cosmic-accent">
                    {searchTerm ? 'No results found for your search.' : 'No clients found.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Client Modal */}
      {showAddClientModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-6">Add New Client</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="clientName" className="text-cosmic-accent">
                  Company Name
                </Label>
                <Input
                  id="clientName"
                  value={newClient.name}
                  onChange={(e) => setNewClient((prev) => ({ ...prev, name: e.target.value }))}
                  className="bg-white/5 border-white/20 text-white placeholder-cosmic-accent"
                  placeholder="Enter company name"
                />
              </div>
              <div>
                <Label htmlFor="clientEmail" className="text-cosmic-accent">
                  Email
                </Label>
                <Input
                  id="clientEmail"
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient((prev) => ({ ...prev, email: e.target.value }))}
                  className="bg-white/5 border-white/20 text-white placeholder-cosmic-accent"
                  placeholder="Enter contact email"
                />
              </div>
              <div>
                <Label htmlFor="clientPhone" className="text-cosmic-accent">
                  Phone
                </Label>
                <Input
                  id="clientPhone"
                  value={newClient.phone}
                  onChange={(e) => setNewClient((prev) => ({ ...prev, phone: e.target.value }))}
                  className="bg-white/5 border-white/20 text-white placeholder-cosmic-accent"
                  placeholder="Enter phone number"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleAddClient}
                className="flex-1 bg-cosmic-accent hover:bg-cosmic-accent/80"
              >
                Add Client
              </Button>
              <Button
                onClick={() => setShowAddClientModal(false)}
                variant="outline"
                className="flex-1 border-white/20 text-white"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Service Modal */}
      {showAddServiceModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-6">Add New Service</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="serviceCompany" className="text-cosmic-accent">
                  Client
                </Label>
                <select
                  id="serviceCompany"
                  value={newService.company_id}
                  onChange={(e) =>
                    setNewService((prev) => ({ ...prev, company_id: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-md text-white"
                >
                  <option value="">Select a client</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="serviceName" className="text-cosmic-accent">
                  Service Name
                </Label>
                <Input
                  id="serviceName"
                  value={newService.name}
                  onChange={(e) => setNewService((prev) => ({ ...prev, name: e.target.value }))}
                  className="bg-white/5 border-white/20 text-white placeholder-cosmic-accent"
                  placeholder="Enter service name"
                />
              </div>
              <div>
                <Label htmlFor="serviceDescription" className="text-cosmic-accent">
                  Description
                </Label>
                <Textarea
                  id="serviceDescription"
                  value={newService.description}
                  onChange={(e) =>
                    setNewService((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="bg-white/5 border-white/20 text-white placeholder-cosmic-accent"
                  placeholder="Enter service description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="serviceType" className="text-cosmic-accent">
                    Billing Type
                  </Label>
                  <select
                    id="serviceType"
                    value={newService.billing_type}
                    onChange={(e) =>
                      setNewService((prev) => ({
                        ...prev,
                        billing_type: e.target.value as 'subscription' | 'one-time',
                      }))
                    }
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-md text-white"
                  >
                    <option value="subscription">Subscription</option>
                    <option value="one-time">One-time</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="servicePrice" className="text-cosmic-accent">
                    Price ($)
                  </Label>
                  <Input
                    id="servicePrice"
                    type="number"
                    value={newService.price}
                    onChange={(e) =>
                      setNewService((prev) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))
                    }
                    className="bg-white/5 border-white/20 text-white placeholder-cosmic-accent"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button onClick={handleAddService} className="flex-1 bg-green-600 hover:bg-green-700">
                Add Service
              </Button>
              <Button
                onClick={() => setShowAddServiceModal(false)}
                variant="outline"
                className="flex-1 border-white/20 text-white"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Issue Invoice Modal */}
      {showIssueInvoiceModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-6">Issue Invoice</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="invoiceCompany" className="text-cosmic-accent">
                  Client
                </Label>
                <select
                  id="invoiceCompany"
                  value={newInvoice.company_id}
                  onChange={(e) =>
                    setNewInvoice((prev) => ({ ...prev, company_id: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-md text-white"
                >
                  <option value="">Select a client</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="invoiceService" className="text-cosmic-accent">
                  Service
                </Label>
                <select
                  id="invoiceService"
                  value={newInvoice.service_id}
                  onChange={(e) =>
                    setNewInvoice((prev) => ({ ...prev, service_id: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-md text-white"
                  disabled={!newInvoice.company_id}
                >
                  <option value="">Select a service</option>
                  {services
                    .filter((service) => service.company_id === newInvoice.company_id)
                    .map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="invoiceAmount" className="text-cosmic-accent">
                    Amount ($)
                  </Label>
                  <Input
                    id="invoiceAmount"
                    type="number"
                    value={newInvoice.amount}
                    onChange={(e) =>
                      setNewInvoice((prev) => ({
                        ...prev,
                        amount: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="bg-white/5 border-white/20 text-white placeholder-cosmic-accent"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="invoiceDueDate" className="text-cosmic-accent">
                    Due Date
                  </Label>
                  <Input
                    id="invoiceDueDate"
                    type="date"
                    value={newInvoice.due_date}
                    onChange={(e) =>
                      setNewInvoice((prev) => ({ ...prev, due_date: e.target.value }))
                    }
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleIssueInvoice}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700"
              >
                Issue Invoice
              </Button>
              <Button
                onClick={() => setShowIssueInvoiceModal(false)}
                variant="outline"
                className="flex-1 border-white/20 text-white"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPortal;
