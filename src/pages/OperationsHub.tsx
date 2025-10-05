import React, { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { RadialMenu } from '@/components/RadialMenu';
import { CosmicBackground } from '@/components/CosmicBackground';

// shadcn components
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Icons
import {
  Plus,
  Users,
  UserCheck,
  Briefcase,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Clock,
} from 'lucide-react';

// API imports
import {
  getClients,
  createClient,
  updateClient,
  deleteClient,
  Client,
  CreateClientData,
  UpdateClientData,
} from '@/api/clients';
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  Employee,
  CreateEmployeeData,
  UpdateEmployeeData,
} from '@/api/employees';
import {
  getJobs,
  createJob,
  updateJob,
  deleteJob,
  Job,
  CreateJobData,
  UpdateJobData,
} from '@/api/jobs';
import { getInvoices } from '@/api/invoices';
import { sendLLMMessage, createLLMConfig } from '@/agents/llm';

const OperationsHub: React.FC = () => {
  const { user, role, companyId } = useUser();

  // State for clients
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientsError, setClientsError] = useState<string | null>(null);

  // State for employees
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [employeesError, setEmployeesError] = useState<string | null>(null);

  // State for jobs
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);

  // State for invoices
  const [invoices, setInvoices] = useState<any[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);

  // State for AI assistance
  const [aiAssisting, setAiAssisting] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>('');

  // UI state
  const [activeTab, setActiveTab] = useState('clients');
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [editingMode, setEditingMode] = useState(false);

  // Form states
  const [clientForm, setClientForm] = useState<CreateClientData>({
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    status: 'Active',
    notes: '',
  });

  const [employeeForm, setEmployeeForm] = useState<CreateEmployeeData>({
    name: '',
    email: '',
    phone: '',
    role: '',
    department: '',
    hire_date: '',
    status: 'Active',
    notes: '',
  });

  const [jobForm, setJobForm] = useState<CreateJobData>({
    title: '',
    description: '',
    client_id: '',
    assigned_to: '',
    status: 'Planned',
    priority: 'Medium',
    due_date: '',
    estimated_hours: undefined,
    notes: '',
  });

  // Load data on mount
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    await Promise.all([loadClients(), loadEmployees(), loadJobs()]);
  };

  const loadClients = async () => {
    setClientsLoading(true);
    setClientsError(null);

    const { data, error } = await getClients();

    if (error) {
      setClientsError(error);
    } else if (data) {
      setClients(data as Client[]);
    }

    setClientsLoading(false);
  };

  const loadEmployees = async () => {
    setEmployeesLoading(true);
    setEmployeesError(null);

    const { data, error } = await getEmployees();

    if (error) {
      setEmployeesError(error);
    } else if (data) {
      setEmployees(data as Employee[]);
    }

    setEmployeesLoading(false);
  };

  const loadJobs = async () => {
    setJobsLoading(true);
    setJobsError(null);

    const { data, error } = await getJobs();

    if (error) {
      setJobsError(error);
    } else if (data) {
      setJobs(data as Job[]);
    }

    setJobsLoading(false);
  };

  const loadInvoicesForClient = async (clientName: string) => {
    setInvoicesLoading(true);

    // Since the current invoices API doesn't have a filter by client_name,
    // we'll get all invoices and filter them client-side
    const { data, error } = await getInvoices();

    if (!error && data) {
      // Filter invoices by client name
      const clientInvoices = data.filter(
        (invoice: any) => invoice.client_name?.toLowerCase() === clientName.toLowerCase(),
      );
      setInvoices(clientInvoices);
    } else {
      setInvoices([]);
    }

    setInvoicesLoading(false);
  };

  const handleCreateClient = async () => {
    if (!clientForm.name.trim()) return;

    const { data, error } = await createClient(clientForm);

    if (!error && data) {
      setClients((prev) => [data as Client, ...prev]);
      resetClientForm();
      setClientDialogOpen(false);
    }
  };

  const handleCreateEmployee = async () => {
    if (!employeeForm.name.trim() || !employeeForm.email.trim()) return;

    const { data, error } = await createEmployee(employeeForm);

    if (!error && data) {
      setEmployees((prev) => [data as Employee, ...prev]);
      resetEmployeeForm();
      setEmployeeDialogOpen(false);
    }
  };

  const handleCreateJob = async () => {
    if (!jobForm.title.trim()) return;

    const { data, error } = await createJob(jobForm);

    if (!error && data) {
      await loadJobs(); // Reload to get populated client/employee data
      resetJobForm();
      setJobDialogOpen(false);
    }
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setClientForm({
      name: client.name,
      company: client.company || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      status: client.status,
      notes: client.notes || '',
    });
    setEditingMode(true);
    setClientDialogOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEmployeeForm({
      name: employee.name,
      email: employee.email,
      phone: employee.phone || '',
      role: employee.role,
      department: employee.department || '',
      hire_date: employee.hire_date || '',
      status: employee.status,
      notes: employee.notes || '',
    });
    setEditingMode(true);
    setEmployeeDialogOpen(true);
  };

  const handleEditJob = (job: Job) => {
    setSelectedJob(job);
    setJobForm({
      title: job.title,
      description: job.description || '',
      client_id: job.client_id || '',
      assigned_to: job.assigned_to || '',
      status: job.status,
      priority: job.priority,
      due_date: job.due_date || '',
      estimated_hours: job.estimated_hours,
      notes: job.notes || '',
    });
    setEditingMode(true);
    setJobDialogOpen(true);
  };

  const handleUpdateClient = async () => {
    if (!selectedClient || !clientForm.name.trim()) return;

    const { data, error } = await updateClient(selectedClient.id, clientForm);

    if (!error && data) {
      setClients((prev) =>
        prev.map((client) => (client.id === selectedClient.id ? (data as Client) : client)),
      );
      resetClientForm();
      setClientDialogOpen(false);
      setSelectedClient(null);
      setEditingMode(false);
    }
  };

  const handleUpdateEmployee = async () => {
    if (!selectedEmployee || !employeeForm.name.trim()) return;

    const { data, error } = await updateEmployee(selectedEmployee.id, employeeForm);

    if (!error && data) {
      setEmployees((prev) =>
        prev.map((emp) => (emp.id === selectedEmployee.id ? (data as Employee) : emp)),
      );
      resetEmployeeForm();
      setEmployeeDialogOpen(false);
      setSelectedEmployee(null);
      setEditingMode(false);
    }
  };

  const handleUpdateJob = async () => {
    if (!selectedJob || !jobForm.title.trim()) return;

    const { data, error } = await updateJob(selectedJob.id, jobForm);

    if (!error && data) {
      await loadJobs(); // Reload to get updated populated data
      resetJobForm();
      setJobDialogOpen(false);
      setSelectedJob(null);
      setEditingMode(false);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return;

    const { error } = await deleteClient(clientId);

    if (!error) {
      setClients((prev) => prev.filter((client) => client.id !== clientId));
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;

    const { error } = await deleteEmployee(employeeId);

    if (!error) {
      setEmployees((prev) => prev.filter((emp) => emp.id !== employeeId));
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return;

    const { error } = await deleteJob(jobId);

    if (!error) {
      setJobs((prev) => prev.filter((job) => job.id !== jobId));
    }
  };

  const resetClientForm = () => {
    setClientForm({
      name: '',
      company: '',
      email: '',
      phone: '',
      address: '',
      status: 'Active',
      notes: '',
    });
  };

  const resetEmployeeForm = () => {
    setEmployeeForm({
      name: '',
      email: '',
      phone: '',
      role: '',
      department: '',
      hire_date: '',
      status: 'Active',
      notes: '',
    });
  };

  const resetJobForm = () => {
    setJobForm({
      title: '',
      description: '',
      client_id: '',
      assigned_to: '',
      status: 'Planned',
      priority: 'Medium',
      due_date: '',
      estimated_hours: undefined,
      notes: '',
    });
  };

  const handleViewClientDetails = async (client: Client) => {
    setSelectedClient(client);
    // Load related invoices and jobs
    await loadInvoicesForClient(client.name);
    setDetailDialogOpen(true);
  };

  const handleViewEmployeeDetails = (employee: Employee) => {
    setSelectedEmployee(employee);
    setDetailDialogOpen(true);
  };

  const handleViewJobDetails = (job: Job) => {
    setSelectedJob(job);
    setDetailDialogOpen(true);
  };

  const isOverdue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    return due < today;
  };

  const handleAiAssist = async (job: Job) => {
    if (!job.description) {
      alert('Job description is required for AI assistance');
      return;
    }

    setAiAssisting(true);
    setAiResponse('');

    try {
      // Create LLM configuration (defaulting to OpenAI)
      const config = createLLMConfig('openai');
      if (!config) {
        setAiResponse('AI assistance is not configured. Please check your API keys.');
        return;
      }

      const prompt = `You are an expert project manager and business consultant. Help analyze this project and provide actionable insights, potential challenges, and recommendations.`;

      const task = `
Project Title: ${job.title}
Description: ${job.description}
Client: ${job.client?.name || 'Not specified'}
Assigned to: ${job.employee?.name || 'Not assigned'}
Priority: ${job.priority}
Status: ${job.status}
Due Date: ${job.due_date ? new Date(job.due_date).toLocaleDateString() : 'Not set'}
Estimated Hours: ${job.estimated_hours || 'Not set'}

Please provide:
1. A brief analysis of the project scope and complexity
2. Potential challenges or risks
3. Recommended approach or steps to complete the project
4. Any suggestions for improvement or optimization
5. Timeline considerations if applicable

Keep your response concise but comprehensive.`;

      const response = await sendLLMMessage(config, prompt, task);

      if (response.error) {
        setAiResponse(`Error: ${response.error}`);
      } else {
        setAiResponse(response.content);
      }
    } catch (error) {
      console.error('AI Assist error:', error);
      setAiResponse('An error occurred while getting AI assistance. Please try again.');
    } finally {
      setAiAssisting(false);
    }
  };

  // Clients Tab Component
  const ClientsTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Clients</h2>
          <p className="text-cosmic-blue">Manage your client relationships</p>
        </div>
        <Dialog
          open={clientDialogOpen}
          onOpenChange={(open) => {
            setClientDialogOpen(open);
            if (!open) {
              setEditingMode(false);
              setSelectedClient(null);
              resetClientForm();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-cosmic-blue hover:bg-cosmic-blue/80">
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingMode ? 'Edit Client' : 'Create New Client'}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                {editingMode ? 'Update client information.' : 'Add a new client to the system.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="client-name" className="text-white">
                  Name *
                </Label>
                <Input
                  id="client-name"
                  value={clientForm.name}
                  onChange={(e) => setClientForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Client name"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="client-company" className="text-white">
                  Company
                </Label>
                <Input
                  id="client-company"
                  value={clientForm.company}
                  onChange={(e) => setClientForm((prev) => ({ ...prev, company: e.target.value }))}
                  placeholder="Company name"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="client-email" className="text-white">
                  Email
                </Label>
                <Input
                  id="client-email"
                  type="email"
                  value={clientForm.email}
                  onChange={(e) => setClientForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="client@company.com"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="client-phone" className="text-white">
                  Phone
                </Label>
                <Input
                  id="client-phone"
                  value={clientForm.phone}
                  onChange={(e) => setClientForm((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1 (555) 123-4567"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="client-address" className="text-white">
                  Address
                </Label>
                <Textarea
                  id="client-address"
                  value={clientForm.address}
                  onChange={(e) => setClientForm((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="Street address, city, state, zip"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="client-status" className="text-white">
                  Status
                </Label>
                <Select
                  value={clientForm.status}
                  onValueChange={(value: 'Active' | 'Inactive' | 'Prospect') =>
                    setClientForm((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Prospect">Prospect</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label htmlFor="client-notes" className="text-white">
                  Notes
                </Label>
                <Textarea
                  id="client-notes"
                  value={clientForm.notes}
                  onChange={(e) => setClientForm((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about the client"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={editingMode ? handleUpdateClient : handleCreateClient}
                disabled={!clientForm.name.trim()}
                className="bg-cosmic-blue hover:bg-cosmic-blue/80"
              >
                {editingMode ? 'Update Client' : 'Create Client'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Clients Table */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden">
        {clientsLoading ? (
          <div className="p-6 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : clientsError ? (
          <Alert className="m-6 bg-red-900/20 border-red-500/50">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="text-red-200">Error Loading Clients</AlertTitle>
            <AlertDescription className="text-red-300">{clientsError}</AlertDescription>
          </Alert>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/20 hover:bg-white/5">
                <TableHead className="text-white">Name</TableHead>
                <TableHead className="text-white">Company</TableHead>
                <TableHead className="text-white">Contact</TableHead>
                <TableHead className="text-white">Status</TableHead>
                <TableHead className="text-white">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id} className="border-white/20 hover:bg-white/5">
                  <TableCell className="text-white font-medium">{client.name}</TableCell>
                  <TableCell className="text-cosmic-blue">{client.company || '-'}</TableCell>
                  <TableCell className="text-cosmic-blue">
                    {client.email || client.phone || 'No contact info'}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        client.status === 'Active'
                          ? 'bg-green-500/20 text-green-300'
                          : client.status === 'Prospect'
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-gray-500/20 text-gray-300'
                      }`}
                    >
                      {client.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewClientDetails(client)}
                        className="text-cosmic-blue hover:text-white hover:bg-cosmic-blue/20"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClient(client)}
                        className="text-cosmic-blue hover:text-white hover:bg-cosmic-blue/20"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClient(client.id)}
                        className="text-red-400 hover:text-white hover:bg-red-500/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );

  // Employees Tab Component
  const EmployeesTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Employees</h2>
          <p className="text-cosmic-blue">Manage your team members</p>
        </div>
        <Dialog
          open={employeeDialogOpen}
          onOpenChange={(open) => {
            setEmployeeDialogOpen(open);
            if (!open) {
              setEditingMode(false);
              setSelectedEmployee(null);
              resetEmployeeForm();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-cosmic-blue hover:bg-cosmic-blue/80">
              <Plus className="w-4 h-4 mr-2" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingMode ? 'Edit Employee' : 'Create New Employee'}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                {editingMode ? 'Update employee information.' : 'Add a new employee to the system.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="employee-name" className="text-white">
                  Name *
                </Label>
                <Input
                  id="employee-name"
                  value={employeeForm.name}
                  onChange={(e) => setEmployeeForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Employee name"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="employee-email" className="text-white">
                  Email *
                </Label>
                <Input
                  id="employee-email"
                  type="email"
                  value={employeeForm.email}
                  onChange={(e) => setEmployeeForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="employee@company.com"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="employee-phone" className="text-white">
                  Phone
                </Label>
                <Input
                  id="employee-phone"
                  value={employeeForm.phone}
                  onChange={(e) => setEmployeeForm((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1 (555) 123-4567"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="employee-role" className="text-white">
                  Role *
                </Label>
                <Input
                  id="employee-role"
                  value={employeeForm.role}
                  onChange={(e) => setEmployeeForm((prev) => ({ ...prev, role: e.target.value }))}
                  placeholder="Job title/role"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="employee-department" className="text-white">
                  Department
                </Label>
                <Input
                  id="employee-department"
                  value={employeeForm.department}
                  onChange={(e) =>
                    setEmployeeForm((prev) => ({ ...prev, department: e.target.value }))
                  }
                  placeholder="Department name"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="employee-hire-date" className="text-white">
                  Hire Date
                </Label>
                <Input
                  id="employee-hire-date"
                  type="date"
                  value={employeeForm.hire_date}
                  onChange={(e) =>
                    setEmployeeForm((prev) => ({ ...prev, hire_date: e.target.value }))
                  }
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="employee-status" className="text-white">
                  Status
                </Label>
                <Select
                  value={employeeForm.status}
                  onValueChange={(value: 'Active' | 'Inactive' | 'Terminated') =>
                    setEmployeeForm((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Terminated">Terminated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label htmlFor="employee-notes" className="text-white">
                  Notes
                </Label>
                <Textarea
                  id="employee-notes"
                  value={employeeForm.notes}
                  onChange={(e) => setEmployeeForm((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about the employee"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={editingMode ? handleUpdateEmployee : handleCreateEmployee}
                disabled={!employeeForm.name.trim() || !employeeForm.email.trim()}
                className="bg-cosmic-blue hover:bg-cosmic-blue/80"
              >
                {editingMode ? 'Update Employee' : 'Create Employee'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Employees Table */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden">
        {employeesLoading ? (
          <div className="p-6 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : employeesError ? (
          <Alert className="m-6 bg-red-900/20 border-red-500/50">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="text-red-200">Error Loading Employees</AlertTitle>
            <AlertDescription className="text-red-300">{employeesError}</AlertDescription>
          </Alert>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/20 hover:bg-white/5">
                <TableHead className="text-white">Name</TableHead>
                <TableHead className="text-white">Role</TableHead>
                <TableHead className="text-white">Email</TableHead>
                <TableHead className="text-white">Status</TableHead>
                <TableHead className="text-white">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id} className="border-white/20 hover:bg-white/5">
                  <TableCell className="text-white font-medium">{employee.name}</TableCell>
                  <TableCell className="text-cosmic-blue">{employee.role}</TableCell>
                  <TableCell className="text-cosmic-blue">{employee.email}</TableCell>
                  <TableCell>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        employee.status === 'Active'
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-gray-500/20 text-gray-300'
                      }`}
                    >
                      {employee.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewEmployeeDetails(employee)}
                        className="text-cosmic-blue hover:text-white hover:bg-cosmic-blue/20"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditEmployee(employee)}
                        className="text-cosmic-blue hover:text-white hover:bg-cosmic-blue/20"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteEmployee(employee.id)}
                        className="text-red-400 hover:text-white hover:bg-red-500/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );

  // Jobs Tab Component
  const JobsTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Jobs</h2>
          <p className="text-cosmic-blue">Manage projects and assignments</p>
        </div>
        <Dialog
          open={jobDialogOpen}
          onOpenChange={(open) => {
            setJobDialogOpen(open);
            if (!open) {
              setEditingMode(false);
              setSelectedJob(null);
              resetJobForm();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-cosmic-blue hover:bg-cosmic-blue/80">
              <Plus className="w-4 h-4 mr-2" />
              Add Job
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingMode ? 'Edit Job' : 'Create New Job'}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                {editingMode ? 'Update job information.' : 'Add a new job to the system.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="job-title" className="text-white">
                  Title *
                </Label>
                <Input
                  id="job-title"
                  value={jobForm.title}
                  onChange={(e) => setJobForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Job title"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="job-description" className="text-white">
                  Description
                </Label>
                <Textarea
                  id="job-description"
                  value={jobForm.description}
                  onChange={(e) => setJobForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Job description and requirements"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="job-client" className="text-white">
                  Client
                </Label>
                <Select
                  value={jobForm.client_id}
                  onValueChange={(value) => setJobForm((prev) => ({ ...prev, client_id: value }))}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="Select client (optional)" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} {client.company && `(${client.company})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="job-assigned-to" className="text-white">
                  Assigned To
                </Label>
                <Select
                  value={jobForm.assigned_to}
                  onValueChange={(value) => setJobForm((prev) => ({ ...prev, assigned_to: value }))}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="Select assignee (optional)" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name} ({employee.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="job-status" className="text-white">
                  Status
                </Label>
                <Select
                  value={jobForm.status}
                  onValueChange={(
                    value: 'Planned' | 'In Progress' | 'Completed' | 'On Hold' | 'Cancelled',
                  ) => setJobForm((prev) => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="Planned">Planned</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="On Hold">On Hold</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="job-priority" className="text-white">
                  Priority
                </Label>
                <Select
                  value={jobForm.priority}
                  onValueChange={(value: 'Low' | 'Medium' | 'High' | 'Urgent') =>
                    setJobForm((prev) => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="job-due-date" className="text-white">
                  Due Date
                </Label>
                <Input
                  id="job-due-date"
                  type="date"
                  value={jobForm.due_date}
                  onChange={(e) => setJobForm((prev) => ({ ...prev, due_date: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="job-estimated-hours" className="text-white">
                  Estimated Hours
                </Label>
                <Input
                  id="job-estimated-hours"
                  type="number"
                  step="0.5"
                  value={jobForm.estimated_hours || ''}
                  onChange={(e) =>
                    setJobForm((prev) => ({
                      ...prev,
                      estimated_hours: e.target.value ? parseFloat(e.target.value) : undefined,
                    }))
                  }
                  placeholder="0.0"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="job-notes" className="text-white">
                  Notes
                </Label>
                <Textarea
                  id="job-notes"
                  value={jobForm.notes}
                  onChange={(e) => setJobForm((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about the job"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={editingMode ? handleUpdateJob : handleCreateJob}
                disabled={!jobForm.title.trim()}
                className="bg-cosmic-blue hover:bg-cosmic-blue/80"
              >
                {editingMode ? 'Update Job' : 'Create Job'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Jobs Table */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden">
        {jobsLoading ? (
          <div className="p-6 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : jobsError ? (
          <Alert className="m-6 bg-red-900/20 border-red-500/50">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="text-red-200">Error Loading Jobs</AlertTitle>
            <AlertDescription className="text-red-300">{jobsError}</AlertDescription>
          </Alert>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/20 hover:bg-white/5">
                <TableHead className="text-white">Title</TableHead>
                <TableHead className="text-white">Client</TableHead>
                <TableHead className="text-white">Assignee</TableHead>
                <TableHead className="text-white">Due Date</TableHead>
                <TableHead className="text-white">Status</TableHead>
                <TableHead className="text-white">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id} className="border-white/20 hover:bg-white/5">
                  <TableCell className="text-white font-medium">{job.title}</TableCell>
                  <TableCell className="text-cosmic-blue">{job.client?.name || '-'}</TableCell>
                  <TableCell className="text-cosmic-blue">{job.employee?.name || '-'}</TableCell>
                  <TableCell
                    className={`text-cosmic-blue ${
                      job.due_date && isOverdue(job.due_date) && job.status !== 'Completed'
                        ? 'text-red-400'
                        : ''
                    }`}
                  >
                    {job.due_date ? new Date(job.due_date).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        job.status === 'Completed'
                          ? 'bg-green-500/20 text-green-300'
                          : job.status === 'In Progress'
                          ? 'bg-blue-500/20 text-blue-300'
                          : job.status === 'Planned'
                          ? 'bg-yellow-500/20 text-yellow-300'
                          : 'bg-gray-500/20 text-gray-300'
                      }`}
                    >
                      {job.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewJobDetails(job)}
                        className="text-cosmic-blue hover:text-white hover:bg-cosmic-blue/20"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditJob(job)}
                        className="text-cosmic-blue hover:text-white hover:bg-cosmic-blue/20"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteJob(job.id)}
                        className="text-red-400 hover:text-white hover:bg-red-500/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Operations Hub</h1>
            <p className="text-cosmic-blue">Manage clients, employees, and jobs</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-800/50 border border-gray-600">
              <TabsTrigger
                value="clients"
                className="data-[state=active]:bg-cosmic-blue data-[state=active]:text-white"
              >
                <Users className="w-4 h-4 mr-2" />
                Clients ({clients.length})
              </TabsTrigger>
              <TabsTrigger
                value="employees"
                className="data-[state=active]:bg-cosmic-blue data-[state=active]:text-white"
              >
                <UserCheck className="w-4 h-4 mr-2" />
                Employees ({employees.length})
              </TabsTrigger>
              <TabsTrigger
                value="jobs"
                className="data-[state=active]:bg-cosmic-blue data-[state=active]:text-white"
              >
                <Briefcase className="w-4 h-4 mr-2" />
                Jobs ({jobs.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="clients" className="mt-6">
              <ClientsTab />
            </TabsContent>

            <TabsContent value="employees" className="mt-6">
              <EmployeesTab />
            </TabsContent>

            <TabsContent value="jobs" className="mt-6">
              <JobsTab />
            </TabsContent>
          </Tabs>

          {/* Detail Dialog */}
          <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
            <DialogContent className="bg-gray-900 border-gray-700 max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {selectedClient && 'Client Details'}
                  {selectedEmployee && 'Employee Details'}
                  {selectedJob && 'Job Details'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {selectedClient && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white">Name</Label>
                        <p className="text-cosmic-blue font-medium">{selectedClient.name}</p>
                      </div>
                      <div>
                        <Label className="text-white">Company</Label>
                        <p className="text-cosmic-blue">{selectedClient.company || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-white">Email</Label>
                        <p className="text-cosmic-blue">{selectedClient.email || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-white">Phone</Label>
                        <p className="text-cosmic-blue">{selectedClient.phone || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-white">Status</Label>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            selectedClient.status === 'Active'
                              ? 'bg-green-500/20 text-green-300'
                              : selectedClient.status === 'Prospect'
                              ? 'bg-blue-500/20 text-blue-300'
                              : 'bg-gray-500/20 text-gray-300'
                          }`}
                        >
                          {selectedClient.status}
                        </span>
                      </div>
                      <div>
                        <Label className="text-white">Created</Label>
                        <p className="text-cosmic-blue">
                          {new Date(selectedClient.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {selectedClient.address && (
                      <div>
                        <Label className="text-white">Address</Label>
                        <p className="text-cosmic-blue">{selectedClient.address}</p>
                      </div>
                    )}
                    {selectedClient.notes && (
                      <div>
                        <Label className="text-white">Notes</Label>
                        <p className="text-cosmic-blue">{selectedClient.notes}</p>
                      </div>
                    )}

                    {/* Related Jobs */}
                    <div className="mt-6">
                      <Label className="text-white text-lg font-medium">Related Jobs</Label>
                      <div className="mt-2 space-y-2">
                        {jobs.filter((job) => job.client_id === selectedClient.id).length > 0 ? (
                          jobs
                            .filter((job) => job.client_id === selectedClient.id)
                            .map((job) => (
                              <div
                                key={job.id}
                                className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/10"
                              >
                                <div>
                                  <p className="text-white font-medium">{job.title}</p>
                                  <p className="text-cosmic-blue text-sm">
                                    {job.employee?.name
                                      ? `Assigned to: ${job.employee.name}`
                                      : 'Unassigned'}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span
                                    className={`text-xs px-2 py-1 rounded ${
                                      job.status === 'Completed'
                                        ? 'bg-green-500/20 text-green-300'
                                        : job.status === 'In Progress'
                                        ? 'bg-blue-500/20 text-blue-300'
                                        : job.status === 'Planned'
                                        ? 'bg-yellow-500/20 text-yellow-300'
                                        : 'bg-gray-500/20 text-gray-300'
                                    }`}
                                  >
                                    {job.status}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setDetailDialogOpen(false);
                                      handleViewJobDetails(job);
                                    }}
                                    className="text-cosmic-blue hover:text-white hover:bg-cosmic-blue/20"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))
                        ) : (
                          <p className="text-cosmic-blue text-sm">No jobs found for this client</p>
                        )}
                      </div>
                    </div>

                    {/* Related Invoices */}
                    <div className="mt-6">
                      <Label className="text-white text-lg font-medium">Recent Invoices</Label>
                      <div className="mt-2 space-y-2">
                        {invoicesLoading ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cosmic-blue"></div>
                            <span className="text-cosmic-blue text-sm">Loading invoices...</span>
                          </div>
                        ) : invoices.length > 0 ? (
                          invoices.slice(0, 5).map((invoice: any) => (
                            <div
                              key={invoice.id}
                              className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/10"
                            >
                              <div>
                                <p className="text-white font-medium">
                                  Invoice #{invoice.id.slice(-8)}
                                </p>
                                <p className="text-cosmic-blue text-sm">
                                  Due: {new Date(invoice.due_date).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-white font-medium">${invoice.amount}</span>
                                <span
                                  className={`text-xs px-2 py-1 rounded ${
                                    invoice.status === 'Paid'
                                      ? 'bg-green-500/20 text-green-300'
                                      : invoice.status === 'Overdue'
                                      ? 'bg-red-500/20 text-red-300'
                                      : 'bg-yellow-500/20 text-yellow-300'
                                  }`}
                                >
                                  {invoice.status}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-cosmic-blue text-sm">
                            No invoices found for this client
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 flex space-x-2">
                      <Button
                        onClick={() => {
                          setDetailDialogOpen(false);
                          setJobForm((prev) => ({ ...prev, client_id: selectedClient.id }));
                          setJobDialogOpen(true);
                        }}
                        className="bg-cosmic-blue hover:bg-cosmic-blue/80"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        New Job for Client
                      </Button>
                    </div>
                  </div>
                )}

                {selectedEmployee && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white">Name</Label>
                        <p className="text-cosmic-blue font-medium">{selectedEmployee.name}</p>
                      </div>
                      <div>
                        <Label className="text-white">Role</Label>
                        <p className="text-cosmic-blue">{selectedEmployee.role}</p>
                      </div>
                      <div>
                        <Label className="text-white">Email</Label>
                        <p className="text-cosmic-blue">{selectedEmployee.email}</p>
                      </div>
                      <div>
                        <Label className="text-white">Phone</Label>
                        <p className="text-cosmic-blue">{selectedEmployee.phone || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-white">Department</Label>
                        <p className="text-cosmic-blue">{selectedEmployee.department || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-white">Status</Label>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            selectedEmployee.status === 'Active'
                              ? 'bg-green-500/20 text-green-300'
                              : 'bg-gray-500/20 text-gray-300'
                          }`}
                        >
                          {selectedEmployee.status}
                        </span>
                      </div>
                      {selectedEmployee.hire_date && (
                        <div>
                          <Label className="text-white">Hire Date</Label>
                          <p className="text-cosmic-blue">
                            {new Date(selectedEmployee.hire_date).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      <div>
                        <Label className="text-white">Created</Label>
                        <p className="text-cosmic-blue">
                          {new Date(selectedEmployee.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {selectedEmployee.notes && (
                      <div>
                        <Label className="text-white">Notes</Label>
                        <p className="text-cosmic-blue">{selectedEmployee.notes}</p>
                      </div>
                    )}

                    {/* Related Jobs */}
                    <div className="mt-6">
                      <Label className="text-white text-lg font-medium">Assigned Jobs</Label>
                      <div className="mt-2 space-y-2">
                        {jobs.filter((job) => job.assigned_to === selectedEmployee.id).length >
                        0 ? (
                          jobs
                            .filter((job) => job.assigned_to === selectedEmployee.id)
                            .map((job) => (
                              <div
                                key={job.id}
                                className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/10"
                              >
                                <div>
                                  <p className="text-white font-medium">{job.title}</p>
                                  <p className="text-cosmic-blue text-sm">
                                    {job.client?.name
                                      ? `Client: ${job.client.name}`
                                      : 'No client assigned'}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span
                                    className={`text-xs px-2 py-1 rounded ${
                                      job.status === 'Completed'
                                        ? 'bg-green-500/20 text-green-300'
                                        : job.status === 'In Progress'
                                        ? 'bg-blue-500/20 text-blue-300'
                                        : job.status === 'Planned'
                                        ? 'bg-yellow-500/20 text-yellow-300'
                                        : 'bg-gray-500/20 text-gray-300'
                                    }`}
                                  >
                                    {job.status}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setDetailDialogOpen(false);
                                      handleViewJobDetails(job);
                                    }}
                                    className="text-cosmic-blue hover:text-white hover:bg-cosmic-blue/20"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))
                        ) : (
                          <p className="text-cosmic-blue text-sm">
                            No jobs assigned to this employee
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {selectedJob && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white">Title</Label>
                        <p className="text-cosmic-blue font-medium">{selectedJob.title}</p>
                      </div>
                      <div>
                        <Label className="text-white">Status</Label>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            selectedJob.status === 'Completed'
                              ? 'bg-green-500/20 text-green-300'
                              : selectedJob.status === 'In Progress'
                              ? 'bg-blue-500/20 text-blue-300'
                              : selectedJob.status === 'Planned'
                              ? 'bg-yellow-500/20 text-yellow-300'
                              : 'bg-gray-500/20 text-gray-300'
                          }`}
                        >
                          {selectedJob.status}
                        </span>
                      </div>
                      <div>
                        <Label className="text-white">Client</Label>
                        <p className="text-cosmic-blue">{selectedJob.client?.name || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-white">Assignee</Label>
                        <p className="text-cosmic-blue">{selectedJob.employee?.name || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-white">Priority</Label>
                        <p className="text-cosmic-blue">{selectedJob.priority}</p>
                      </div>
                      {selectedJob.due_date && (
                        <div>
                          <Label className="text-white">Due Date</Label>
                          <p
                            className={`${
                              isOverdue(selectedJob.due_date) && selectedJob.status !== 'Completed'
                                ? 'text-red-400'
                                : 'text-cosmic-blue'
                            }`}
                          >
                            {new Date(selectedJob.due_date).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      {selectedJob.estimated_hours && (
                        <div>
                          <Label className="text-white">Estimated Hours</Label>
                          <p className="text-cosmic-blue">{selectedJob.estimated_hours}h</p>
                        </div>
                      )}
                      {selectedJob.actual_hours && (
                        <div>
                          <Label className="text-white">Actual Hours</Label>
                          <p className="text-cosmic-blue">{selectedJob.actual_hours}h</p>
                        </div>
                      )}
                    </div>
                    {selectedJob.description && (
                      <div>
                        <Label className="text-white">Description</Label>
                        <p className="text-cosmic-blue">{selectedJob.description}</p>
                      </div>
                    )}
                    {selectedJob.notes && (
                      <div>
                        <Label className="text-white">Notes</Label>
                        <p className="text-cosmic-blue">{selectedJob.notes}</p>
                      </div>
                    )}

                    {/* AI Assist Section */}
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-4">
                        <Label className="text-white text-lg font-medium">AI Assistance</Label>
                        <Button
                          onClick={() => handleAiAssist(selectedJob)}
                          disabled={aiAssisting || !selectedJob.description}
                          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                        >
                          {aiAssisting ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <Clock className="w-4 h-4 mr-2" />
                              Get AI Insights
                            </>
                          )}
                        </Button>
                      </div>

                      {aiResponse && (
                        <div className="bg-white/5 rounded-lg border border-white/10 p-4">
                          <Label className="text-white text-sm font-medium mb-2 block">
                            AI Analysis:
                          </Label>
                          <div className="text-cosmic-blue text-sm whitespace-pre-wrap leading-relaxed">
                            {aiResponse}
                          </div>
                        </div>
                      )}

                      {!selectedJob.description && (
                        <p className="text-yellow-400 text-sm">
                          Add a description to this job to enable AI assistance.
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 flex flex-wrap gap-2">
                      <Button
                        onClick={() => {
                          setDetailDialogOpen(false);
                          handleEditJob(selectedJob);
                        }}
                        variant="outline"
                        className="border-cosmic-blue text-cosmic-blue hover:bg-cosmic-blue hover:text-white"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Job
                      </Button>
                      <Button
                        onClick={() => {
                          const newStatus =
                            selectedJob.status === 'Completed' ? 'In Progress' : 'Completed';
                          handleUpdateJob(selectedJob.id, { status: newStatus });
                          setSelectedJob((prev) => (prev ? { ...prev, status: newStatus } : null));
                        }}
                        className={`${
                          selectedJob.status === 'Completed'
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-cosmic-blue hover:bg-cosmic-blue/80'
                        }`}
                      >
                        {selectedJob.status === 'Completed' ? 'Mark In Progress' : 'Mark Completed'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default OperationsHub;
