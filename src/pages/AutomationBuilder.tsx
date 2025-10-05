import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  NodeTypes,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CosmicBackground } from '@/components/CosmicBackground';
import { useUser } from '@/context/UserContext';

import { AutomationFlow, AutomationNode, FlowNode, FlowEdge, NodeConfig } from '@/lib/types';

import {
  createAutomationFlow,
  getAutomationFlows,
  updateAutomationFlow,
  deleteAutomationFlow,
  createAutomationNodes,
  getAutomationNodes,
  updateAutomationNodes,
  deleteAutomationNodes,
  testAutomationFlow,
} from '@/api/automation';

import { Plus, Play, Settings, Trash2, Edit, Eye, EyeOff } from 'lucide-react';

// Custom Node Components
const TriggerNode: React.FC<{ data: any }> = ({ data }) => (
  <div className="px-4 py-2 shadow-md rounded-md bg-gradient-to-r from-green-500 to-green-600 border-2 border-green-300">
    <div className="flex items-center">
      <div className="rounded-full w-3 h-3 bg-green-200 mr-2"></div>
      <div className="text-white font-bold">{data.label}</div>
    </div>
  </div>
);

const ActionNode: React.FC<{ data: any }> = ({ data }) => (
  <div className="px-4 py-2 shadow-md rounded-md bg-gradient-to-r from-blue-500 to-blue-600 border-2 border-blue-300">
    <div className="flex items-center">
      <div className="rounded-full w-3 h-3 bg-blue-200 mr-2"></div>
      <div className="text-white font-bold">{data.label}</div>
    </div>
  </div>
);

const ConditionNode: React.FC<{ data: any }> = ({ data }) => (
  <div className="px-4 py-2 shadow-md rounded-md bg-gradient-to-r from-yellow-500 to-orange-500 border-2 border-yellow-300">
    <div className="flex items-center">
      <div className="rounded-full w-3 h-3 bg-yellow-200 mr-2"></div>
      <div className="text-white font-bold">{data.label}</div>
    </div>
  </div>
);

const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
};

const AutomationBuilder: React.FC = () => {
  const { user } = useUser();
  const [flows, setFlows] = useState<AutomationFlow[]>([]);
  const [selectedFlow, setSelectedFlow] = useState<AutomationFlow | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isFlowDialogOpen, setIsFlowDialogOpen] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [testPayload, setTestPayload] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Flow form state
  const [flowForm, setFlowForm] = useState({
    title: '',
    description: '',
    enabled: false,
  });

  // Node palette
  const nodePalette = useMemo(
    () => [
      {
        type: 'trigger',
        nodeType: 'new_service',
        label: 'New Service',
        category: 'Trigger',
        color: 'from-green-500 to-green-600',
      },
      {
        type: 'trigger',
        nodeType: 'new_invoice',
        label: 'New Invoice',
        category: 'Trigger',
        color: 'from-green-500 to-green-600',
      },
      {
        type: 'trigger',
        nodeType: 'new_client',
        label: 'New Client',
        category: 'Trigger',
        color: 'from-green-500 to-green-600',
      },
      {
        type: 'trigger',
        nodeType: 'budget_warning',
        label: 'Budget Warning',
        category: 'Trigger',
        color: 'from-green-500 to-green-600',
      },
      {
        type: 'action',
        nodeType: 'send_email',
        label: 'Send Email',
        category: 'Action',
        color: 'from-blue-500 to-blue-600',
      },
      {
        type: 'action',
        nodeType: 'send_slack',
        label: 'Send Slack',
        category: 'Action',
        color: 'from-blue-500 to-blue-600',
      },
      {
        type: 'action',
        nodeType: 'generate_doc',
        label: 'Generate Doc',
        category: 'Action',
        color: 'from-blue-500 to-blue-600',
      },
      {
        type: 'action',
        nodeType: 'start_agent_task',
        label: 'Start Agent Task',
        category: 'Action',
        color: 'from-blue-500 to-blue-600',
      },
      {
        type: 'condition',
        nodeType: 'invoice_status',
        label: 'Invoice Status',
        category: 'Condition',
        color: 'from-yellow-500 to-orange-500',
      },
      {
        type: 'condition',
        nodeType: 'budget_threshold',
        label: 'Budget Threshold',
        category: 'Condition',
        color: 'from-yellow-500 to-orange-500',
      },
      {
        type: 'condition',
        nodeType: 'service_status',
        label: 'Service Status',
        category: 'Condition',
        color: 'from-yellow-500 to-orange-500',
      },
    ],
    [],
  );

  // Load flows on component mount
  useEffect(() => {
    loadFlows();
  }, []);

  // Load nodes when flow is selected
  useEffect(() => {
    if (selectedFlow) {
      loadNodes(selectedFlow.id);
    }
  }, [selectedFlow]);

  const loadFlows = async () => {
    setLoading(true);
    try {
      const response = await getAutomationFlows();
      if (response.data) {
        setFlows(Array.isArray(response.data) ? response.data : [response.data]);
      }
    } catch (error) {
      console.error('Error loading flows:', error);
    }
    setLoading(false);
  };

  const loadNodes = async (flowId: string) => {
    try {
      const response = await getAutomationNodes(flowId);
      if (response.data && Array.isArray(response.data)) {
        const flowNodes: FlowNode[] = response.data.map((node: AutomationNode) => ({
          id: node.id,
          type: node.type,
          position: node.position,
          data: {
            label: node.label,
            nodeType: node.node_type,
            config: node.config,
          },
        }));
        setNodes(flowNodes);
      }
    } catch (error) {
      console.error('Error loading nodes:', error);
    }
  };

  const onConnect = useCallback(
    (params: Connection | Edge) => {
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges],
  );

  const addNode = (nodeTemplate: any) => {
    const newNode: FlowNode = {
      id: `${nodeTemplate.type}_${Date.now()}`,
      type: nodeTemplate.type,
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 300 + 100,
      },
      data: {
        label: nodeTemplate.label,
        nodeType: nodeTemplate.nodeType,
        config: {},
      },
    };

    setNodes((nds) => [...nds, newNode]);
  };

  const saveFlow = async () => {
    if (!selectedFlow) return;

    try {
      setLoading(true);

      // Save nodes to database
      const nodeData = nodes.map((node) => ({
        flow_id: selectedFlow.id,
        type: node.type as 'trigger' | 'action' | 'condition',
        node_type: node.data.nodeType,
        label: node.data.label,
        config: node.data.config,
        position: node.position,
      }));

      // Delete existing nodes and create new ones
      await deleteAutomationNodes(nodes.map((n) => n.id));
      if (nodeData.length > 0) {
        await createAutomationNodes(nodeData);
      }

      await loadNodes(selectedFlow.id);
    } catch (error) {
      console.error('Error saving flow:', error);
    }
    setLoading(false);
  };

  const createNewFlow = async () => {
    if (!user?.company_id) return;

    try {
      setLoading(true);
      const response = await createAutomationFlow({
        company_id: user.company_id,
        title: flowForm.title,
        description: flowForm.description,
        enabled: flowForm.enabled,
      });

      if (response.data) {
        await loadFlows();
        setIsFlowDialogOpen(false);
        setFlowForm({ title: '', description: '', enabled: false });
      }
    } catch (error) {
      console.error('Error creating flow:', error);
    }
    setLoading(false);
  };

  const toggleFlowEnabled = async (flow: AutomationFlow) => {
    try {
      await updateAutomationFlow(flow.id, { enabled: !flow.enabled });
      await loadFlows();
    } catch (error) {
      console.error('Error toggling flow:', error);
    }
  };

  const deleteFlow = async (flowId: string) => {
    try {
      await deleteAutomationFlow(flowId);
      await loadFlows();
      if (selectedFlow?.id === flowId) {
        setSelectedFlow(null);
        setNodes([]);
        setEdges([]);
      }
    } catch (error) {
      console.error('Error deleting flow:', error);
    }
  };

  const runTest = async () => {
    if (!selectedFlow) return;

    try {
      const payload = JSON.parse(testPayload);
      const result = await testAutomationFlow(selectedFlow.id, payload);
      setTestResult(result);
    } catch (error) {
      console.error('Error running test:', error);
      setTestResult({ error: 'Invalid JSON payload or execution error' });
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <CosmicBackground />

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Automation Builder</h1>
          <p className="text-cosmic-accent text-lg">
            Create no-code automation flows to streamline your business processes
          </p>
        </div>

        <Tabs defaultValue="flows" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/10 backdrop-blur-sm">
            <TabsTrigger value="flows" className="text-white data-[state=active]:bg-cosmic-accent">
              Flow Management
            </TabsTrigger>
            <TabsTrigger
              value="builder"
              className="text-white data-[state=active]:bg-cosmic-accent"
            >
              Flow Builder
            </TabsTrigger>
          </TabsList>

          <TabsContent value="flows" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Flow List */}
              <div className="lg:col-span-1">
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-white">Automation Flows</CardTitle>
                      <Dialog open={isFlowDialogOpen} onOpenChange={setIsFlowDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" className="bg-cosmic-accent hover:bg-cosmic-accent/80">
                            <Plus className="w-4 h-4 mr-2" />
                            New Flow
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-cosmic-dark border-white/20">
                          <DialogHeader>
                            <DialogTitle className="text-white">Create New Flow</DialogTitle>
                            <DialogDescription className="text-cosmic-accent">
                              Set up a new automation flow for your business processes.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Input
                              placeholder="Flow Title"
                              value={flowForm.title}
                              onChange={(e) => setFlowForm({ ...flowForm, title: e.target.value })}
                              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                            />
                            <Textarea
                              placeholder="Flow Description"
                              value={flowForm.description}
                              onChange={(e) =>
                                setFlowForm({ ...flowForm, description: e.target.value })
                              }
                              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                            />
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={flowForm.enabled}
                                onCheckedChange={(enabled) => setFlowForm({ ...flowForm, enabled })}
                              />
                              <label className="text-white">Enable Flow</label>
                            </div>
                            <Button
                              onClick={createNewFlow}
                              disabled={loading}
                              className="w-full bg-cosmic-accent hover:bg-cosmic-accent/80"
                            >
                              {loading ? 'Creating...' : 'Create Flow'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {flows.map((flow) => (
                        <div
                          key={flow.id}
                          className={`p-3 rounded-lg cursor-pointer transition-all ${
                            selectedFlow?.id === flow.id
                              ? 'bg-cosmic-accent/20 border border-cosmic-accent'
                              : 'bg-white/5 hover:bg-white/10 border border-white/10'
                          }`}
                          onClick={() => setSelectedFlow(flow)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-white font-medium">{flow.title}</h3>
                              <p className="text-cosmic-accent text-sm">{flow.description}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={flow.enabled}
                                onCheckedChange={() => toggleFlowEnabled(flow)}
                                size="sm"
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteFlow(flow.id);
                                }}
                                className="text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Flow Details */}
              <div className="lg:col-span-2">
                {selectedFlow ? (
                  <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white">{selectedFlow.title}</CardTitle>
                      <CardDescription className="text-cosmic-accent">
                        {selectedFlow.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-4">
                        <Badge variant={selectedFlow.enabled ? 'default' : 'secondary'}>
                          {selectedFlow.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                        <div className="flex space-x-2">
                          <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-white/20 text-white"
                              >
                                <Play className="w-4 h-4 mr-2" />
                                Test Run
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-cosmic-dark border-white/20 max-w-2xl">
                              <DialogHeader>
                                <DialogTitle className="text-white">
                                  Test Automation Flow
                                </DialogTitle>
                                <DialogDescription className="text-cosmic-accent">
                                  Simulate a trigger payload to test your automation flow.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Textarea
                                  placeholder='{"triggerType": "new_service", "data": {"serviceId": "123", "amount": 1000}}'
                                  value={testPayload}
                                  onChange={(e) => setTestPayload(e.target.value)}
                                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 min-h-32"
                                />
                                <Button
                                  onClick={runTest}
                                  className="w-full bg-cosmic-accent hover:bg-cosmic-accent/80"
                                >
                                  Run Test
                                </Button>
                                {testResult && (
                                  <div className="mt-4 p-3 bg-white/5 rounded-lg">
                                    <pre className="text-cosmic-accent text-sm overflow-auto">
                                      {JSON.stringify(testResult, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                    <CardContent className="flex items-center justify-center h-64">
                      <p className="text-cosmic-accent">Select a flow to view details</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="builder" className="mt-6">
            {selectedFlow ? (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Node Palette */}
                <div className="lg:col-span-1">
                  <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">Node Palette</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {['Trigger', 'Action', 'Condition'].map((category) => (
                          <div key={category}>
                            <h4 className="text-cosmic-accent font-medium mb-2">{category}</h4>
                            <div className="space-y-2">
                              {nodePalette
                                .filter((node) => node.category === category)
                                .map((node) => (
                                  <div
                                    key={node.nodeType}
                                    className={`p-3 rounded-lg cursor-pointer transition-all bg-gradient-to-r ${node.color} hover:scale-105`}
                                    onClick={() => addNode(node)}
                                  >
                                    <div className="text-white font-medium text-sm">
                                      {node.label}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Save Button */}
                  <div className="mt-4">
                    <Button
                      onClick={saveFlow}
                      disabled={loading}
                      className="w-full bg-cosmic-accent hover:bg-cosmic-accent/80"
                    >
                      {loading ? 'Saving...' : 'Save Flow'}
                    </Button>
                  </div>
                </div>

                {/* Flow Editor */}
                <div className="lg:col-span-3">
                  <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white">
                        Flow Editor - {selectedFlow.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-96">
                        <ReactFlowProvider>
                          <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onConnect={onConnect}
                            nodeTypes={nodeTypes}
                            fitView
                            className="bg-cosmic-dark"
                          >
                            <Controls className="bg-white/10 border-white/20" />
                            <MiniMap className="bg-white/10 border-white/20" nodeColor="#5d8bf4" />
                            <Background color="#ffffff20" gap={20} size={1} />
                          </ReactFlow>
                        </ReactFlowProvider>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="flex items-center justify-center h-64">
                  <p className="text-cosmic-accent">Select a flow to start building</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AutomationBuilder;
