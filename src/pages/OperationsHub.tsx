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
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Icons
import { Plus, Building2, ChevronDown, ChevronRight, AlertTriangle, Briefcase } from 'lucide-react';

// API imports
import { getCompanies, createCompany, Company } from '@/api/companies';
import {
  getServices,
  createService,
  Service,
  CreateServiceData,
  ServiceStatus,
  BillingType,
} from '@/api/services';

const OperationsHub: React.FC = () => {
  const { user, role, companyId } = useUser();

  // State for companies (admin view)
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [companiesError, setCompaniesError] = useState<string | null>(null);

  // State for services (both views)
  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [servicesError, setServicesError] = useState<string | null>(null);

  // UI state
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());
  const [newCompanyDialogOpen, setNewCompanyDialogOpen] = useState(false);
  const [newServiceDialogOpen, setNewServiceDialogOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  // Form states
  const [companyForm, setCompanyForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    billing_type: 'subscription' as BillingType,
    price: '',
    start_date: '',
    end_date: '',
  });

  // Load data on mount
  useEffect(() => {
    if (role === 'admin') {
      loadCompanies();
    } else if (role === 'client' && companyId) {
      loadClientServices();
    }
  }, [role, companyId]);

  const loadCompanies = async () => {
    setCompaniesLoading(true);
    setCompaniesError(null);

    const { data, error } = await getCompanies();

    if (error) {
      setCompaniesError(error);
    } else if (data) {
      setCompanies(data as Company[]);
    }

    setCompaniesLoading(false);
  };

  const loadClientServices = async () => {
    if (!companyId) return;

    setServicesLoading(true);
    setServicesError(null);

    const { data, error } = await getServices(companyId);

    if (error) {
      setServicesError(error);
    } else if (data) {
      setServices(data as Service[]);
    }

    setServicesLoading(false);
  };

  const loadCompanyServices = async (companyId: string) => {
    setServicesLoading(true);
    setServicesError(null);

    const { data, error } = await getServices(companyId);

    if (error) {
      setServicesError(error);
    } else if (data) {
      setServices(data as Service[]);
    }

    setServicesLoading(false);
  };

  const handleCreateCompany = async () => {
    if (!companyForm.name.trim()) return;

    const contactInfo = {
      email: companyForm.email || undefined,
      phone: companyForm.phone || undefined,
      address: companyForm.address || undefined,
    };

    const { data, error } = await createCompany({
      name: companyForm.name,
      contact_info: Object.keys(contactInfo).length > 0 ? contactInfo : undefined,
    });

    if (!error && data) {
      setCompanies((prev) => [data as Company, ...prev]);
      setCompanyForm({ name: '', email: '', phone: '', address: '' });
      setNewCompanyDialogOpen(false);
    }
  };

  const handleCreateService = async () => {
    if (!serviceForm.name.trim() || !selectedCompanyId) return;

    const serviceData: CreateServiceData = {
      company_id: selectedCompanyId,
      name: serviceForm.name,
      description: serviceForm.description || undefined,
      billing_type: serviceForm.billing_type,
      price: parseFloat(serviceForm.price) || 0,
      start_date: serviceForm.start_date || undefined,
      end_date: serviceForm.end_date || undefined,
    };

    const { data, error } = await createService(serviceData);

    if (!error && data) {
      // Reload services for the expanded company
      if (expandedCompanies.has(selectedCompanyId)) {
        await loadCompanyServices(selectedCompanyId);
      }
      setServiceForm({
        name: '',
        description: '',
        billing_type: 'subscription',
        price: '',
        start_date: '',
        end_date: '',
      });
      setNewServiceDialogOpen(false);
      setSelectedCompanyId(null);
    }
  };

  const toggleCompanyExpansion = async (companyId: string) => {
    const newExpanded = new Set(expandedCompanies);

    if (newExpanded.has(companyId)) {
      newExpanded.delete(companyId);
    } else {
      newExpanded.add(companyId);
      await loadCompanyServices(companyId);
    }

    setExpandedCompanies(newExpanded);
  };

  // Admin View Component
  const AdminView = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Operations Hub</h2>
        <Dialog open={newCompanyDialogOpen} onOpenChange={setNewCompanyDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-cosmic-blue hover:bg-cosmic-blue/80">
              <Plus className="w-4 h-4 mr-2" />
              New Company
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Company</DialogTitle>
              <DialogDescription className="text-gray-400">
                Add a new company to the system.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="company-name" className="text-white">
                  Company Name *
                </Label>
                <Input
                  id="company-name"
                  value={companyForm.name}
                  onChange={(e) => setCompanyForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter company name"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="company-email" className="text-white">
                  Email
                </Label>
                <Input
                  id="company-email"
                  type="email"
                  value={companyForm.email}
                  onChange={(e) => setCompanyForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="contact@company.com"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="company-phone" className="text-white">
                  Phone
                </Label>
                <Input
                  id="company-phone"
                  value={companyForm.phone}
                  onChange={(e) => setCompanyForm((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1 (555) 123-4567"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="company-address" className="text-white">
                  Address
                </Label>
                <Textarea
                  id="company-address"
                  value={companyForm.address}
                  onChange={(e) => setCompanyForm((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="123 Business St, City, ST 12345"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleCreateCompany}
                disabled={!companyForm.name.trim()}
                className="bg-cosmic-blue hover:bg-cosmic-blue/80"
              >
                Create Company
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Companies Table */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden">
        {companiesLoading ? (
          <div className="p-6 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        ) : companiesError ? (
          <Alert className="m-6 bg-red-900/20 border-red-500/50">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="text-red-200">Error Loading Companies</AlertTitle>
            <AlertDescription className="text-red-300">{companiesError}</AlertDescription>
          </Alert>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/20 hover:bg-white/5">
                <TableHead className="text-white">Company</TableHead>
                <TableHead className="text-white">Contact Info</TableHead>
                <TableHead className="text-white">Created</TableHead>
                <TableHead className="text-white">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((company) => (
                <React.Fragment key={company.id}>
                  <TableRow className="border-white/20 hover:bg-white/5">
                    <TableCell className="text-white">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleCompanyExpansion(company.id)}
                          className="p-0 h-auto text-white hover:text-cosmic-blue"
                        >
                          {expandedCompanies.has(company.id) ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </Button>
                        <Building2 className="w-4 h-4" />
                        <span>{company.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-cosmic-blue">
                      {company.contact_info?.email || 'No contact info'}
                    </TableCell>
                    <TableCell className="text-cosmic-blue">
                      {new Date(company.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCompanyId(company.id);
                          setNewServiceDialogOpen(true);
                        }}
                        className="border-cosmic-blue text-cosmic-blue hover:bg-cosmic-blue hover:text-white"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Service
                      </Button>
                    </TableCell>
                  </TableRow>
                  {expandedCompanies.has(company.id) && (
                    <TableRow className="bg-white/5">
                      <TableCell colSpan={4} className="p-4">
                        <div className="space-y-2">
                          <h4 className="text-white font-medium">Services</h4>
                          {servicesLoading ? (
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-48" />
                              <Skeleton className="h-4 w-32" />
                            </div>
                          ) : servicesError ? (
                            <Alert className="bg-red-900/20 border-red-500/50">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription className="text-red-300">
                                {servicesError}
                              </AlertDescription>
                            </Alert>
                          ) : services.length > 0 ? (
                            <div className="space-y-2">
                              {services.map((service) => (
                                <div
                                  key={service.id}
                                  className="flex items-center justify-between p-2 bg-white/5 rounded"
                                >
                                  <div>
                                    <span className="text-white font-medium">{service.name}</span>
                                    <span className="text-cosmic-blue text-sm ml-2">
                                      ${service.price} • {service.billing_type}
                                    </span>
                                  </div>
                                  <span
                                    className={`text-xs px-2 py-1 rounded ${
                                      service.status === 'active'
                                        ? 'bg-green-500/20 text-green-300'
                                        : service.status === 'paused'
                                        ? 'bg-yellow-500/20 text-yellow-300'
                                        : 'bg-gray-500/20 text-gray-300'
                                    }`}
                                  >
                                    {service.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-cosmic-blue text-sm">No services yet</p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* New Service Dialog */}
      <Dialog open={newServiceDialogOpen} onOpenChange={setNewServiceDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Create New Service</DialogTitle>
            <DialogDescription className="text-gray-400">
              Add a new service for the selected company.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="service-name" className="text-white">
                Service Name *
              </Label>
              <Input
                id="service-name"
                value={serviceForm.name}
                onChange={(e) => setServiceForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter service name"
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="service-description" className="text-white">
                Description
              </Label>
              <Textarea
                id="service-description"
                value={serviceForm.description}
                onChange={(e) =>
                  setServiceForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Describe the service"
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="billing-type" className="text-white">
                  Billing Type
                </Label>
                <select
                  id="billing-type"
                  value={serviceForm.billing_type}
                  onChange={(e) =>
                    setServiceForm((prev) => ({
                      ...prev,
                      billing_type: e.target.value as BillingType,
                    }))
                  }
                  className="w-full p-2 bg-gray-800 border border-gray-600 text-white rounded"
                >
                  <option value="subscription">Subscription</option>
                  <option value="one-time">One-time</option>
                </select>
              </div>
              <div>
                <Label htmlFor="service-price" className="text-white">
                  Price ($)
                </Label>
                <Input
                  id="service-price"
                  type="number"
                  step="0.01"
                  value={serviceForm.price}
                  onChange={(e) => setServiceForm((prev) => ({ ...prev, price: e.target.value }))}
                  placeholder="0.00"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date" className="text-white">
                  Start Date
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  value={serviceForm.start_date}
                  onChange={(e) =>
                    setServiceForm((prev) => ({ ...prev, start_date: e.target.value }))
                  }
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="end-date" className="text-white">
                  End Date
                </Label>
                <Input
                  id="end-date"
                  type="date"
                  value={serviceForm.end_date}
                  onChange={(e) =>
                    setServiceForm((prev) => ({ ...prev, end_date: e.target.value }))
                  }
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleCreateService}
              disabled={!serviceForm.name.trim() || !serviceForm.price}
              className="bg-cosmic-blue hover:bg-cosmic-blue/80"
            >
              Create Service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  // Client View Component
  const ClientView = () => (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">My Services</h2>
        <p className="text-cosmic-blue">View your active services and billing information</p>
      </div>

      {/* Services List */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
        {servicesLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 bg-white/5 rounded-lg space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-64" />
              </div>
            ))}
          </div>
        ) : servicesError ? (
          <Alert className="bg-red-900/20 border-red-500/50">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="text-red-200">Error Loading Services</AlertTitle>
            <AlertDescription className="text-red-300">{servicesError}</AlertDescription>
          </Alert>
        ) : services.length > 0 ? (
          <div className="space-y-4">
            {services.map((service) => (
              <div key={service.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <Briefcase className="w-5 h-5 text-cosmic-blue mt-1" />
                    <div>
                      <h3 className="text-white font-medium">{service.name}</h3>
                      {service.description && (
                        <p className="text-cosmic-blue text-sm mt-1">{service.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-sm">
                        <span className="text-white">
                          ${service.price} • {service.billing_type}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            service.status === 'active'
                              ? 'bg-green-500/20 text-green-300'
                              : service.status === 'paused'
                              ? 'bg-yellow-500/20 text-yellow-300'
                              : 'bg-gray-500/20 text-gray-300'
                          }`}
                        >
                          {service.status}
                        </span>
                      </div>
                      {service.start_date && (
                        <p className="text-cosmic-blue text-xs mt-1">
                          Started: {new Date(service.start_date).toLocaleDateString()}
                          {service.end_date &&
                            ` • Ends: ${new Date(service.end_date).toLocaleDateString()}`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Briefcase className="w-12 h-12 text-cosmic-blue mx-auto mb-4" />
            <h3 className="text-white font-medium mb-2">No Services Yet</h3>
            <p className="text-cosmic-blue">Your active services will appear here.</p>
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

export default OperationsHub;
