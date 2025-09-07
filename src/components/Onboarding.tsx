import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  getOnboardingWorkflows,
  createOnboardingWorkflow,
  updateOnboardingWorkflow,
  getEmployeesWithAgents,
  getAgentsWithPermissions,
  OnboardingWorkflow,
  OnboardingStep,
  EmployeeWithAgent,
  Agent,
} from '@/api/hr';
import { queryKnowledge, addDocumentToIndex } from '@/utils/rag';
import OpenAI from 'openai';
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  UserPlus,
  Bot,
  Play,
  CheckCircle,
  Circle,
  Plus,
  Edit,
  Trash2,
  Loader2,
  FileText,
  Users,
  Clock,
  Check,
  X,
  Wand2,
} from 'lucide-react';

interface OnboardingProps {
  onWorkflowSelect?: (workflow: OnboardingWorkflow) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onWorkflowSelect }) => {
  const [workflows, setWorkflows] = useState<OnboardingWorkflow[]>([]);
  const [employees, setEmployees] = useState<EmployeeWithAgent[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isWorkflowDialogOpen, setIsWorkflowDialogOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<OnboardingWorkflow | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingSOP, setIsGeneratingSOP] = useState(false);

  // Form states
  const [workflowForm, setWorkflowForm] = useState({
    workflow_name: '',
    employee_id: '',
    agent_id: '',
    steps: [] as OnboardingStep[],
  });

  const [newStep, setNewStep] = useState({
    title: '',
    description: '',
  });

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [workflowsResult, employeesResult, agentsResult] = await Promise.all([
        getOnboardingWorkflows(),
        getEmployeesWithAgents(),
        getAgentsWithPermissions(),
      ]);

      if (workflowsResult.data) {
        setWorkflows(workflowsResult.data);
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

  const handleCreateWorkflow = async () => {
    if (!workflowForm.workflow_name || (!workflowForm.employee_id && !workflowForm.agent_id)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const workflowData = {
        workflow_name: workflowForm.workflow_name,
        employee_id: workflowForm.employee_id || undefined,
        agent_id: workflowForm.agent_id || undefined,
        steps: workflowForm.steps,
        status: 'pending' as const,
      };

      const result = await createOnboardingWorkflow(workflowData);
      if (result.data) {
        setWorkflows((prev) => [result.data!, ...prev]);
        setIsCreateDialogOpen(false);
        resetForm();
      } else {
        console.error('Error creating workflow:', result.error);
      }
    } catch (error) {
      console.error('Error creating workflow:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddStep = () => {
    if (!newStep.title || !newStep.description) return;

    const step: OnboardingStep = {
      id: Date.now().toString(),
      title: newStep.title,
      description: newStep.description,
      completed: false,
    };

    setWorkflowForm((prev) => ({
      ...prev,
      steps: [...prev.steps, step],
    }));

    setNewStep({ title: '', description: '' });
  };

  const handleRemoveStep = (stepId: string) => {
    setWorkflowForm((prev) => ({
      ...prev,
      steps: prev.steps.filter((step) => step.id !== stepId),
    }));
  };

  const handleStartWorkflow = async (workflow: OnboardingWorkflow) => {
    try {
      const result = await updateOnboardingWorkflow(workflow.id, {
        status: 'in_progress',
        current_step: 0,
      });
      if (result.data) {
        setWorkflows((prev) => prev.map((w) => (w.id === workflow.id ? result.data! : w)));
      }
    } catch (error) {
      console.error('Error starting workflow:', error);
    }
  };

  const handleCompleteStep = async (workflow: OnboardingWorkflow, stepIndex: number) => {
    try {
      const updatedSteps = [...workflow.steps];
      updatedSteps[stepIndex] = {
        ...updatedSteps[stepIndex],
        completed: true,
        completed_at: new Date().toISOString(),
      };

      const nextStep = stepIndex + 1;
      const isCompleted = nextStep >= updatedSteps.length;

      const result = await updateOnboardingWorkflow(workflow.id, {
        steps: updatedSteps,
        current_step: isCompleted ? updatedSteps.length : nextStep,
        status: isCompleted ? 'completed' : 'in_progress',
        completed_at: isCompleted ? new Date().toISOString() : undefined,
      });

      if (result.data) {
        setWorkflows((prev) => prev.map((w) => (w.id === workflow.id ? result.data! : w)));
      }
    } catch (error) {
      console.error('Error completing step:', error);
    }
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    try {
      const { error } = await supabase.from('employee_onboarding').delete().eq('id', workflowId);
      if (error) throw error;

      setWorkflows((prev) => prev.filter((w) => w.id !== workflowId));
    } catch (error) {
      console.error('Error deleting workflow:', error);
    }
  };

  const generateSOPDocument = async (workflow: OnboardingWorkflow) => {
    setIsGeneratingSOP(true);
    try {
      // Find the entity (employee or agent)
      const entity = workflow.employee_id
        ? employees.find((e) => e.id === workflow.employee_id)
        : agents.find((a) => a.id === workflow.agent_id);

      if (!entity) return;

      const entityName = workflow.employee_id ? entity.name : entity.name;
      const entityRole = workflow.employee_id ? (entity as EmployeeWithAgent).role : entity.role;
      const entityType = workflow.employee_id ? 'employee' : 'AI agent';

      // Generate SOP content using OpenAI
      const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!openaiApiKey) {
        console.error('OpenAI API key not configured');
        return;
      }

      const openai = new OpenAI({
        apiKey: openaiApiKey,
        dangerouslyAllowBrowser: true,
      });

      const prompt = `
Generate a comprehensive Standard Operating Procedure (SOP) document for a new ${entityType} onboarding.

Entity Details:
- Name: ${entityName}
- Role: ${entityRole}
- Type: ${entityType}

Workflow Steps: ${workflow.steps
        .map((step, index) => `${index + 1}. ${step.title}: ${step.description}`)
        .join('\n')}

Please generate a detailed SOP document that includes:
1. Role overview and responsibilities
2. Required tools and access rights
3. Step-by-step onboarding process
4. Key contacts and resources
5. Performance expectations
6. Training requirements
7. Compliance and security requirements

Format the document in a professional, structured manner with clear sections and actionable guidance.
      `;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.7,
      });

      const sopContent = response.choices[0]?.message?.content;
      if (!sopContent) return;

      // Create document in Knowledge Library
      const documentData = {
        title: `SOP: ${entityName} Onboarding - ${entityRole}`,
        category: 'SOPs',
        content: sopContent,
        description: `Standard Operating Procedure for ${entityName}'s onboarding as ${entityRole}`,
      };

      const { data: doc, error: docError } = await supabase
        .from('documents')
        .insert([documentData])
        .select()
        .single();

      if (docError) throw docError;

      // Add to vector index for RAG
      await addDocumentToIndex(sopContent, {
        title: documentData.title,
        source: 'internal',
        document_id: doc.id,
      });

      // Update workflow with SOP document reference
      const result = await updateOnboardingWorkflow(workflow.id, {
        sop_document_id: doc.id,
      });

      if (result.data) {
        setWorkflows((prev) => prev.map((w) => (w.id === workflow.id ? result.data! : w)));
      }

      alert('SOP document generated successfully and added to Knowledge Library!');
    } catch (error) {
      console.error('Error generating SOP:', error);
      alert('Failed to generate SOP document. Please try again.');
    } finally {
      setIsGeneratingSOP(false);
    }
  };

  const resetForm = () => {
    setWorkflowForm({
      workflow_name: '',
      employee_id: '',
      agent_id: '',
      steps: [],
    });
    setNewStep({ title: '', description: '' });
  };

  const openWorkflowDialog = (workflow: OnboardingWorkflow) => {
    setSelectedWorkflow(workflow);
    setIsWorkflowDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      in_progress: 'default',
      completed: 'outline',
      failed: 'destructive',
    };
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getProgressPercentage = (workflow: OnboardingWorkflow) => {
    if (workflow.steps.length === 0) return 0;
    const completedSteps = workflow.steps.filter((step) => step.completed).length;
    return Math.round((completedSteps / workflow.steps.length) * 100);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-cosmic-accent" />
        <span className="ml-2 text-white">Loading onboarding workflows...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <UserPlus className="w-8 h-8 text-cosmic-accent" />
          <div>
            <h2 className="text-2xl font-bold text-white">Onboarding</h2>
            <p className="text-gray-400">Manage onboarding workflows for employees and AI agents</p>
          </div>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-cosmic-accent hover:bg-cosmic-highlight">
              <Plus className="w-4 h-4 mr-2" />
              Create Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-cosmic-dark border-cosmic-light max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Create Onboarding Workflow</DialogTitle>
              <DialogDescription className="text-gray-400">
                Set up a structured onboarding process for employees or AI agents.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="workflow_name" className="text-white">
                  Workflow Name *
                </Label>
                <Input
                  id="workflow_name"
                  value={workflowForm.workflow_name}
                  onChange={(e) =>
                    setWorkflowForm((prev) => ({ ...prev, workflow_name: e.target.value }))
                  }
                  className="bg-cosmic-light border-cosmic-accent text-white"
                  placeholder="New Employee Onboarding - Software Engineer"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employee_id" className="text-white">
                    Employee (Optional)
                  </Label>
                  <Select
                    value={workflowForm.employee_id}
                    onValueChange={(value) =>
                      setWorkflowForm((prev) => ({ ...prev, employee_id: value }))
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
                            {employee.name} - {employee.role}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agent_id" className="text-white">
                    AI Agent (Optional)
                  </Label>
                  <Select
                    value={workflowForm.agent_id}
                    onValueChange={(value) =>
                      setWorkflowForm((prev) => ({ ...prev, agent_id: value }))
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
                            {agent.name} - {agent.role}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Add Steps */}
              <div className="space-y-4">
                <Label className="text-white">Onboarding Steps</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={newStep.title}
                    onChange={(e) => setNewStep((prev) => ({ ...prev, title: e.target.value }))}
                    className="bg-cosmic-light border-cosmic-accent text-white"
                    placeholder="Step title"
                  />
                  <div className="flex gap-2">
                    <Input
                      value={newStep.description}
                      onChange={(e) =>
                        setNewStep((prev) => ({ ...prev, description: e.target.value }))
                      }
                      className="bg-cosmic-light border-cosmic-accent text-white flex-1"
                      placeholder="Step description"
                    />
                    <Button
                      onClick={handleAddStep}
                      size="sm"
                      className="bg-cosmic-accent hover:bg-cosmic-highlight"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Display Steps */}
                {workflowForm.steps.length > 0 && (
                  <div className="space-y-2">
                    {workflowForm.steps.map((step, index) => (
                      <div
                        key={step.id}
                        className="flex items-center gap-2 p-2 bg-cosmic-light rounded"
                      >
                        <span className="text-white text-sm font-medium">{index + 1}.</span>
                        <span className="text-white text-sm flex-1">{step.title}</span>
                        <Button
                          onClick={() => handleRemoveStep(step.id)}
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
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
                onClick={handleCreateWorkflow}
                disabled={isSubmitting}
                className="bg-cosmic-accent hover:bg-cosmic-highlight"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Create Workflow
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Workflows Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workflows.map((workflow) => {
          const entity = workflow.employee_id
            ? employees.find((e) => e.id === workflow.employee_id)
            : agents.find((a) => a.id === workflow.agent_id);

          return (
            <Card key={workflow.id} className="bg-cosmic-dark border-cosmic-light">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-lg">{workflow.workflow_name}</CardTitle>
                  {getStatusBadge(workflow.status)}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  {workflow.employee_id ? (
                    <Users className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                  <span>{entity?.name || 'Unknown'}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-white">
                      {workflow.steps.filter((s) => s.completed).length}/{workflow.steps.length}
                    </span>
                  </div>
                  <Progress value={getProgressPercentage(workflow)} className="h-2" />
                </div>

                {/* Steps Preview */}
                {workflow.steps.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-white text-sm font-medium">Steps:</h4>
                    <div className="space-y-1">
                      {workflow.steps.slice(0, 3).map((step, index) => (
                        <div key={step.id} className="flex items-center gap-2">
                          {step.completed ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <Circle className="w-4 h-4 text-gray-500" />
                          )}
                          <span className="text-white text-sm truncate">{step.title}</span>
                        </div>
                      ))}
                      {workflow.steps.length > 3 && (
                        <span className="text-gray-400 text-sm">
                          +{workflow.steps.length - 3} more steps
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => openWorkflowDialog(workflow)}
                    size="sm"
                    variant="outline"
                    className="flex-1 text-white border-cosmic-accent"
                  >
                    <Play className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  {workflow.status === 'pending' && (
                    <Button
                      onClick={() => handleStartWorkflow(workflow)}
                      size="sm"
                      className="bg-cosmic-accent hover:bg-cosmic-highlight"
                    >
                      Start
                    </Button>
                  )}
                  <Button
                    onClick={() => generateSOPDocument(workflow)}
                    size="sm"
                    variant="outline"
                    disabled={isGeneratingSOP}
                    className="text-white border-cosmic-accent"
                  >
                    {isGeneratingSOP ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Wand2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Workflow Detail Dialog */}
      <Dialog open={isWorkflowDialogOpen} onOpenChange={setIsWorkflowDialogOpen}>
        <DialogContent className="bg-cosmic-dark border-cosmic-light max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">{selectedWorkflow?.workflow_name}</DialogTitle>
            <DialogDescription className="text-gray-400">
              Manage onboarding workflow steps and progress
            </DialogDescription>
          </DialogHeader>

          {selectedWorkflow && (
            <div className="space-y-4 py-4">
              {/* Progress Overview */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-white">Overall Progress</span>
                  <span className="text-white">
                    {selectedWorkflow.steps.filter((s) => s.completed).length}/
                    {selectedWorkflow.steps.length} steps
                  </span>
                </div>
                <Progress value={getProgressPercentage(selectedWorkflow)} className="h-3" />
              </div>

              {/* Steps List */}
              <div className="space-y-3">
                <h4 className="text-white font-medium">Onboarding Steps</h4>
                {selectedWorkflow.steps.map((step, index) => (
                  <Card key={step.id} className="bg-cosmic-light border-cosmic-accent">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {step.completed ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : selectedWorkflow.current_step === index ? (
                            <div className="w-5 h-5 rounded-full bg-cosmic-accent flex items-center justify-center">
                              <Play className="w-3 h-3 text-white" />
                            </div>
                          ) : (
                            <Circle className="w-5 h-5 text-gray-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h5 className="text-white font-medium">{step.title}</h5>
                          <p className="text-gray-300 text-sm mt-1">{step.description}</p>
                          {step.completed_at && (
                            <p className="text-green-400 text-xs mt-2">
                              Completed: {new Date(step.completed_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        {!step.completed &&
                          selectedWorkflow.status === 'in_progress' &&
                          selectedWorkflow.current_step === index && (
                            <Button
                              onClick={() => handleCompleteStep(selectedWorkflow, index)}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Complete
                            </Button>
                          )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Actions */}
              <div className="flex justify-between pt-4 border-t border-cosmic-light">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Workflow
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-cosmic-dark border-cosmic-light">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white">Delete Workflow</AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-400">
                        Are you sure you want to delete this onboarding workflow? This action cannot
                        be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="text-white border-cosmic-accent">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteWorkflow(selectedWorkflow.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <div className="flex gap-2">
                  {selectedWorkflow.sop_document_id && (
                    <Button
                      onClick={() =>
                        window.open(`/library?doc=${selectedWorkflow.sop_document_id}`, '_blank')
                      }
                      variant="outline"
                      size="sm"
                      className="text-white border-cosmic-accent"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      View SOP
                    </Button>
                  )}
                  <Button
                    onClick={() => setIsWorkflowDialogOpen(false)}
                    variant="outline"
                    size="sm"
                    className="text-white border-cosmic-accent"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Onboarding;
