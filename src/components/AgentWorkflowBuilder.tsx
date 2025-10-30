import React, { useCallback, useState, useRef } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  Panel,
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Play,
  Save,
  TestTube,
  Settings,
  Plus,
  Zap,
  MessageSquare,
  Database,
  Globe,
  Cpu,
  Eye,
  EyeOff,
} from 'lucide-react';

// Node types for different agent workflow components
const nodeTypes: NodeTypes = {
  input: InputNode,
  llm: LLMNode,
  tool: ToolNode,
  decision: DecisionNode,
  output: OutputNode,
};

// Agent Workflow Node Components
function InputNode({ data }: any) {
  return (
    <Card className="min-w-[200px] border-green-500">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Input
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-xs text-gray-600">{data.label}</div>
        <Badge variant="secondary" className="mt-1 text-xs">
          {data.inputType || 'text'}
        </Badge>
      </CardContent>
    </Card>
  );
}

function LLMNode({ data }: any) {
  return (
    <Card className="min-w-[200px] border-blue-500">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Cpu className="w-4 h-4" />
          {data.model || 'LLM'}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-xs text-gray-600">{data.prompt}</div>
        <div className="flex gap-1 mt-1">
          <Badge variant="outline" className="text-xs">
            {data.provider || 'openai'}
          </Badge>
          <Badge variant="outline" className="text-xs">
            temp: {data.temperature || 0.7}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function ToolNode({ data }: any) {
  return (
    <Card className="min-w-[200px] border-purple-500">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Settings className="w-4 h-4" />
          {data.toolName}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-xs text-gray-600">{data.description}</div>
        <Badge variant="secondary" className="mt-1 text-xs">
          {data.category || 'utility'}
        </Badge>
      </CardContent>
    </Card>
  );
}

function DecisionNode({ data }: any) {
  return (
    <Card className="min-w-[200px] border-yellow-500">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Decision
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-xs text-gray-600">{data.condition}</div>
        <div className="flex gap-1 mt-1">
          <Badge variant="outline" className="text-xs bg-green-50">
            True
          </Badge>
          <Badge variant="outline" className="text-xs bg-red-50">
            False
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function OutputNode({ data }: any) {
  return (
    <Card className="min-w-[200px] border-red-500">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Database className="w-4 h-4" />
          Output
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-xs text-gray-600">{data.format}</div>
        <Badge variant="secondary" className="mt-1 text-xs">
          {data.outputType || 'response'}
        </Badge>
      </CardContent>
    </Card>
  );
}

interface AgentWorkflowBuilderProps {
  initialWorkflow?: {
    nodes: Node[];
    edges: Edge[];
  };
  onSave?: (workflow: { nodes: Node[]; edges: Edge[] }) => void;
  onTest?: (workflow: { nodes: Node[]; edges: Edge[] }) => void;
}

const AgentWorkflowBuilder: React.FC<AgentWorkflowBuilderProps> = ({
  initialWorkflow,
  onSave,
  onTest,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialWorkflow?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialWorkflow?.edges || []);
  const [selectedTab, setSelectedTab] = useState('canvas');
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  // Available tools/components for the palette
  const availableTools = [
    { type: 'input', label: 'User Input', category: 'Input' },
    { type: 'llm', label: 'GPT-4', category: 'LLM', provider: 'openai', model: 'gpt-4' },
    { type: 'llm', label: 'Claude', category: 'LLM', provider: 'claude', model: 'claude-3-sonnet' },
    { type: 'tool', label: 'Web Search', category: 'Tool', toolName: 'web_search' },
    { type: 'tool', label: 'Data Query', category: 'Tool', toolName: 'database_query' },
    { type: 'tool', label: 'API Call', category: 'Tool', toolName: 'api_call' },
    { type: 'decision', label: 'Condition', category: 'Logic', condition: 'Check if...' },
    { type: 'output', label: 'Final Response', category: 'Output' },
  ];

  const addNode = (toolType: string, toolData?: any) => {
    const newNode: Node = {
      id: `${toolType}-${Date.now()}`,
      type: toolType,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: {
        label: toolData?.label || toolType,
        ...toolData,
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const handleSave = () => {
    if (onSave) {
      onSave({ nodes, edges });
    }
  };

  const handleTest = () => {
    if (onTest) {
      onTest({ nodes, edges });
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-semibold">Agent Workflow Builder</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleTest}>
            <TestTube className="w-4 h-4 mr-2" />
            Test Workflow
          </Button>
          <Button size="sm" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Workflow
          </Button>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-4">
          <TabsTrigger value="canvas">Canvas</TabsTrigger>
          <TabsTrigger value="tools">Tool Palette</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="canvas" className="flex-1 m-0">
          <div ref={reactFlowWrapper} className="h-full">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
            >
              <Controls />
              <MiniMap />
              <Background />
            </ReactFlow>
          </div>
        </TabsContent>

        <TabsContent value="tools" className="flex-1 p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {availableTools.map((tool, index) => (
              <Card
                key={index}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => addNode(tool.type, tool)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {tool.category === 'Input' && <MessageSquare className="w-4 h-4" />}
                    {tool.category === 'LLM' && <Cpu className="w-4 h-4" />}
                    {tool.category === 'Tool' && <Settings className="w-4 h-4" />}
                    {tool.category === 'Logic' && <Zap className="w-4 h-4" />}
                    {tool.category === 'Output' && <Database className="w-4 h-4" />}
                    <span className="font-medium text-sm">{tool.label}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {tool.category}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="config" className="flex-1 p-4">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Workflow Name</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    placeholder="My Agent Workflow"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    className="w-full p-2 border rounded"
                    rows={3}
                    placeholder="Describe what this workflow does..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Max Execution Time</label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded"
                      placeholder="30"
                      defaultValue={30}
                    />
                    <span className="text-xs text-gray-500">seconds</span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Max Cost</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full p-2 border rounded"
                      placeholder="1.00"
                    />
                    <span className="text-xs text-gray-500">USD</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AgentWorkflowBuilder;
