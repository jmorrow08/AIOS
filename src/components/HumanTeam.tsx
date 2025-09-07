import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  getEmployeesWithAgents,
  createEmployeeWithAgent,
  updateEmployeeWithAgent,
  linkEmployeeToAgent,
  unlinkEmployeeFromAgent,
  updateEmployeePermissions,
  EmployeeWithAgent,
  CreateEmployeeWithAgentData,
  UpdateEmployeeWithAgentData,
} from '@/api/hr';
import { getAgents } from '@/agents/api';
import { Agent } from '@/agents/api';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Link,
  Unlink,
  Settings,
  Search,
  Loader2,
  User,
  Bot,
  Shield,
  ShieldCheck,
} from 'lucide-react';

const DEPARTMENTS = ['hr', 'sales', 'marketing', 'ops', 'finance', 'support', 'executive'];

const PERMISSION_LABELS = {
  services: 'Services',
  finance: 'Finance',
  media: 'Media Studio',
  knowledge: 'Knowledge Library',
  hr: 'HR Portal',
  admin: 'Admin Portal',
};

interface HumanTeamProps {
  onEmployeeSelect?: (employee: EmployeeWithAgent) => void;
}

const HumanTeam: React.FC<HumanTeamProps> = ({ onEmployeeSelect }) => {
  const [employees, setEmployees] = useState<EmployeeWithAgent[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithAgent | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState<CreateEmployeeWithAgentData>({
    employeeData: {
      name: '',
      email: '',
      phone: '',
      role: '',
      department: '',
      hire_date: '',
      status: 'Active',
      notes: '',
    },
    permissions: {
      services: true,
      finance: false,
      media: false,
      knowledge: false,
      hr: false,
      admin: false,
    },
  });

  const [permissionsData, setPermissionsData] = useState<EmployeeWithAgent['permissions']>({
    services: true,
    finance: false,
    media: false,
    knowledge: false,
    hr: false,
    admin: false,
  });

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [employeesResult, agentsResult] = await Promise.all([
        getEmployeesWithAgents(),
        getAgents(),
      ]);

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

  // Filter employees based on search and department
  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.role.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDepartment =
      selectedDepartment === 'all' || employee.department === selectedDepartment;

    return matchesSearch && matchesDepartment;
  });

  const handleCreateEmployee = async () => {
    setIsSubmitting(true);
    try {
      const result = await createEmployeeWithAgent(formData);
      if (result.data) {
        setEmployees((prev) => [result.data!, ...prev]);
        setIsCreateDialogOpen(false);
        resetForm();
      } else {
        console.error('Error creating employee:', result.error);
      }
    } catch (error) {
      console.error('Error creating employee:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateEmployee = async () => {
    if (!selectedEmployee) return;

    setIsSubmitting(true);
    try {
      const updateData: UpdateEmployeeWithAgentData = {
        employeeData: {
          name: formData.employeeData.name,
          email: formData.employeeData.email,
          phone: formData.employeeData.phone,
          role: formData.employeeData.role,
          department: formData.employeeData.department,
          hire_date: formData.employeeData.hire_date,
          status: formData.employeeData.status,
          notes: formData.employeeData.notes,
        },
        permissions: formData.permissions,
      };

      const result = await updateEmployeeWithAgent(selectedEmployee.id, updateData);
      if (result.data) {
        setEmployees((prev) =>
          prev.map((emp) => (emp.id === selectedEmployee.id ? result.data! : emp)),
        );
        setIsEditDialogOpen(false);
        resetForm();
      } else {
        console.error('Error updating employee:', result.error);
      }
    } catch (error) {
      console.error('Error updating employee:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    try {
      const { error } = await supabase.from('employees').delete().eq('id', employeeId);
      if (error) throw error;

      setEmployees((prev) => prev.filter((emp) => emp.id !== employeeId));
    } catch (error) {
      console.error('Error deleting employee:', error);
    }
  };

  const handleLinkToAgent = async (employeeId: string, agentId: string) => {
    try {
      const result = await linkEmployeeToAgent(employeeId, agentId);
      if (result.data) {
        setEmployees((prev) => prev.map((emp) => (emp.id === employeeId ? result.data! : emp)));
      }
    } catch (error) {
      console.error('Error linking employee to agent:', error);
    }
  };

  const handleUnlinkFromAgent = async (employeeId: string) => {
    try {
      const result = await unlinkEmployeeFromAgent(employeeId);
      if (result.data) {
        setEmployees((prev) => prev.map((emp) => (emp.id === employeeId ? result.data! : emp)));
      }
    } catch (error) {
      console.error('Error unlinking employee from agent:', error);
    }
  };

  const handleUpdatePermissions = async () => {
    if (!selectedEmployee) return;

    setIsSubmitting(true);
    try {
      const result = await updateEmployeePermissions(selectedEmployee.id, permissionsData);
      if (result.data) {
        setEmployees((prev) =>
          prev.map((emp) => (emp.id === selectedEmployee.id ? result.data! : emp)),
        );
        setIsPermissionsDialogOpen(false);
      }
    } catch (error) {
      console.error('Error updating permissions:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      employeeData: {
        name: '',
        email: '',
        phone: '',
        role: '',
        department: '',
        hire_date: '',
        status: 'Active',
        notes: '',
      },
      permissions: {
        services: true,
        finance: false,
        media: false,
        knowledge: false,
        hr: false,
        admin: false,
      },
    });
    setSelectedEmployee(null);
  };

  const openEditDialog = (employee: EmployeeWithAgent) => {
    setSelectedEmployee(employee);
    setFormData({
      employeeData: {
        name: employee.name,
        email: employee.email,
        phone: employee.phone || '',
        role: employee.role,
        department: employee.department || '',
        hire_date: employee.hire_date || '',
        status: employee.status,
        notes: employee.notes || '',
      },
      permissions: employee.permissions,
    });
    setIsEditDialogOpen(true);
  };

  const openPermissionsDialog = (employee: EmployeeWithAgent) => {
    setSelectedEmployee(employee);
    setPermissionsData(employee.permissions);
    setIsPermissionsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      Active: 'default',
      Inactive: 'secondary',
      Terminated: 'destructive',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const renderPermissions = (permissions: EmployeeWithAgent['permissions']) => {
    const activePermissions = Object.entries(permissions)
      .filter(([_, enabled]) => enabled)
      .map(([key]) => PERMISSION_LABELS[key as keyof typeof PERMISSION_LABELS]);

    return activePermissions.length > 0 ? (
      <div className="flex flex-wrap gap-1">
        {activePermissions.slice(0, 3).map((permission) => (
          <Badge key={permission} variant="outline" className="text-xs">
            {permission}
          </Badge>
        ))}
        {activePermissions.length > 3 && (
          <Badge variant="outline" className="text-xs">
            +{activePermissions.length - 3}
          </Badge>
        )}
      </div>
    ) : (
      <span className="text-gray-500 text-sm">No permissions</span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-cosmic-accent" />
        <span className="ml-2 text-white">Loading employees...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Users className="w-8 h-8 text-cosmic-accent" />
          <div>
            <h2 className="text-2xl font-bold text-white">Human Team</h2>
            <p className="text-gray-400">Manage human employees and their AI agent linkages</p>
          </div>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-cosmic-accent hover:bg-cosmic-highlight">
              <Plus className="w-4 h-4 mr-2" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-cosmic-dark border-cosmic-light max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Add New Employee</DialogTitle>
              <DialogDescription className="text-gray-400">
                Create a new employee profile with optional AI agent linkage.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white">
                  Name *
                </Label>
                <Input
                  id="name"
                  value={formData.employeeData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      employeeData: { ...prev.employeeData, name: e.target.value },
                    }))
                  }
                  className="bg-cosmic-light border-cosmic-accent text-white"
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.employeeData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      employeeData: { ...prev.employeeData, email: e.target.value },
                    }))
                  }
                  className="bg-cosmic-light border-cosmic-accent text-white"
                  placeholder="john@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-white">
                  Phone
                </Label>
                <Input
                  id="phone"
                  value={formData.employeeData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      employeeData: { ...prev.employeeData, phone: e.target.value },
                    }))
                  }
                  className="bg-cosmic-light border-cosmic-accent text-white"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role" className="text-white">
                  Role *
                </Label>
                <Input
                  id="role"
                  value={formData.employeeData.role}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      employeeData: { ...prev.employeeData, role: e.target.value },
                    }))
                  }
                  className="bg-cosmic-light border-cosmic-accent text-white"
                  placeholder="Software Engineer"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department" className="text-white">
                  Department
                </Label>
                <Select
                  value={formData.employeeData.department}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      employeeData: { ...prev.employeeData, department: value },
                    }))
                  }
                >
                  <SelectTrigger className="bg-cosmic-light border-cosmic-accent text-white">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent className="bg-cosmic-dark border-cosmic-light">
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept} className="text-white">
                        {dept.charAt(0).toUpperCase() + dept.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hire_date" className="text-white">
                  Hire Date
                </Label>
                <Input
                  id="hire_date"
                  type="date"
                  value={formData.employeeData.hire_date}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      employeeData: { ...prev.employeeData, hire_date: e.target.value },
                    }))
                  }
                  className="bg-cosmic-light border-cosmic-accent text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-white">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={formData.employeeData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    employeeData: { ...prev.employeeData, notes: e.target.value },
                  }))
                }
                className="bg-cosmic-light border-cosmic-accent text-white"
                placeholder="Additional notes about the employee..."
                rows={3}
              />
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
                onClick={handleCreateEmployee}
                disabled={isSubmitting}
                className="bg-cosmic-accent hover:bg-cosmic-highlight"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Create Employee
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="bg-cosmic-dark border-cosmic-light">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-cosmic-light border-cosmic-accent text-white"
                />
              </div>
            </div>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-48 bg-cosmic-light border-cosmic-accent text-white">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent className="bg-cosmic-dark border-cosmic-light">
                <SelectItem value="all" className="text-white">
                  All Departments
                </SelectItem>
                {DEPARTMENTS.map((dept) => (
                  <SelectItem key={dept} value={dept} className="text-white">
                    {dept.charAt(0).toUpperCase() + dept.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Employees Table */}
      <Card className="bg-cosmic-dark border-cosmic-light">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <User className="w-5 h-5" />
            Employees ({filteredEmployees.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-cosmic-light">
                <TableHead className="text-white">Name</TableHead>
                <TableHead className="text-white">Email</TableHead>
                <TableHead className="text-white">Role</TableHead>
                <TableHead className="text-white">Department</TableHead>
                <TableHead className="text-white">Status</TableHead>
                <TableHead className="text-white">AI Agent</TableHead>
                <TableHead className="text-white">Permissions</TableHead>
                <TableHead className="text-white">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => (
                <TableRow key={employee.id} className="border-cosmic-light">
                  <TableCell className="text-white">{employee.name}</TableCell>
                  <TableCell className="text-white">{employee.email}</TableCell>
                  <TableCell className="text-white">{employee.role}</TableCell>
                  <TableCell className="text-white">
                    {employee.department ? (
                      <Badge variant="outline">{employee.department}</Badge>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(employee.status)}</TableCell>
                  <TableCell>
                    {employee.agent ? (
                      <div className="flex items-center gap-2">
                        <Bot className="w-4 h-4 text-cosmic-accent" />
                        <span className="text-white text-sm">{employee.agent.name}</span>
                      </div>
                    ) : (
                      <span className="text-gray-500 text-sm">No agent linked</span>
                    )}
                  </TableCell>
                  <TableCell>{renderPermissions(employee.permissions)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditDialog(employee)}
                        className="text-gray-400 hover:text-white"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openPermissionsDialog(employee)}
                        className="text-gray-400 hover:text-white"
                      >
                        <Shield className="w-4 h-4" />
                      </Button>
                      {employee.agent ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUnlinkFromAgent(employee.id)}
                          className="text-gray-400 hover:text-white"
                        >
                          <Unlink className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Select
                          onValueChange={(agentId) => handleLinkToAgent(employee.id, agentId)}
                        >
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-gray-400 hover:text-white"
                          >
                            <Link className="w-4 h-4" />
                          </Button>
                          <SelectContent className="bg-cosmic-dark border-cosmic-light">
                            {agents.map((agent) => (
                              <SelectItem key={agent.id} value={agent.id} className="text-white">
                                {agent.name} ({agent.role})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-gray-400 hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-cosmic-dark border-cosmic-light">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-white">
                              Delete Employee
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-400">
                              Are you sure you want to delete {employee.name}? This action cannot be
                              undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="text-white border-cosmic-accent">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteEmployee(employee.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Employee Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-cosmic-dark border-cosmic-light max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Employee</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update employee information and permissions.
            </DialogDescription>
          </DialogHeader>
          {/* Same form fields as create dialog */}
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-white">
                Name *
              </Label>
              <Input
                id="edit-name"
                value={formData.employeeData.name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    employeeData: { ...prev.employeeData, name: e.target.value },
                  }))
                }
                className="bg-cosmic-light border-cosmic-accent text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email" className="text-white">
                Email *
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.employeeData.email}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    employeeData: { ...prev.employeeData, email: e.target.value },
                  }))
                }
                className="bg-cosmic-light border-cosmic-accent text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone" className="text-white">
                Phone
              </Label>
              <Input
                id="edit-phone"
                value={formData.employeeData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    employeeData: { ...prev.employeeData, phone: e.target.value },
                  }))
                }
                className="bg-cosmic-light border-cosmic-accent text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role" className="text-white">
                Role *
              </Label>
              <Input
                id="edit-role"
                value={formData.employeeData.role}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    employeeData: { ...prev.employeeData, role: e.target.value },
                  }))
                }
                className="bg-cosmic-light border-cosmic-accent text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-department" className="text-white">
                Department
              </Label>
              <Select
                value={formData.employeeData.department}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    employeeData: { ...prev.employeeData, department: value },
                  }))
                }
              >
                <SelectTrigger className="bg-cosmic-light border-cosmic-accent text-white">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent className="bg-cosmic-dark border-cosmic-light">
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept} value={dept} className="text-white">
                      {dept.charAt(0).toUpperCase() + dept.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-hire_date" className="text-white">
                Hire Date
              </Label>
              <Input
                id="edit-hire_date"
                type="date"
                value={formData.employeeData.hire_date}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    employeeData: { ...prev.employeeData, hire_date: e.target.value },
                  }))
                }
                className="bg-cosmic-light border-cosmic-accent text-white"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-notes" className="text-white">
              Notes
            </Label>
            <Textarea
              id="edit-notes"
              value={formData.employeeData.notes}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  employeeData: { ...prev.employeeData, notes: e.target.value },
                }))
              }
              className="bg-cosmic-light border-cosmic-accent text-white"
              rows={3}
            />
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
              onClick={handleUpdateEmployee}
              disabled={isSubmitting}
              className="bg-cosmic-accent hover:bg-cosmic-highlight"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Edit className="w-4 h-4 mr-2" />
              )}
              Update Employee
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
        <DialogContent className="bg-cosmic-dark border-cosmic-light max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Manage Permissions</DialogTitle>
            <DialogDescription className="text-gray-400">
              Configure access permissions for {selectedEmployee?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between">
                <Label htmlFor={`perm-${key}`} className="text-white">
                  {label}
                </Label>
                <Switch
                  id={`perm-${key}`}
                  checked={permissionsData[key as keyof typeof permissionsData]}
                  onCheckedChange={(checked) =>
                    setPermissionsData((prev) => ({
                      ...prev,
                      [key]: checked,
                    }))
                  }
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsPermissionsDialogOpen(false)}
              className="text-white border-cosmic-accent"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdatePermissions}
              disabled={isSubmitting}
              className="bg-cosmic-accent hover:bg-cosmic-highlight"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Settings className="w-4 h-4 mr-2" />
              )}
              Update Permissions
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HumanTeam;
