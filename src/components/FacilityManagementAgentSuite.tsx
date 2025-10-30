import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building,
  Wrench,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Users,
  Zap,
  Shield,
  BarChart3,
  Settings,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';

interface FacilityMetrics {
  totalEquipment: number;
  activeAlerts: number;
  maintenanceScheduled: number;
  uptime: number;
  costSavings: number;
  responseTime: number;
}

interface MaintenanceTask {
  id: string;
  equipment: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed';
  dueDate: string;
  assignedTo?: string;
  estimatedCost: number;
}

interface FacilityAgent {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'inactive';
  specialization: string;
  tasksCompleted: number;
  accuracy: number;
  responseTime: number;
}

const FacilityManagementAgentSuite: React.FC = () => {
  const [metrics, setMetrics] = useState<FacilityMetrics>({
    totalEquipment: 1247,
    activeAlerts: 8,
    maintenanceScheduled: 23,
    uptime: 98.7,
    costSavings: 45000,
    responseTime: 2.3,
  });

  const [agents] = useState<FacilityAgent[]>([
    {
      id: '1',
      name: 'Maintenance Scheduler',
      role: 'scheduler',
      status: 'active',
      specialization: 'Preventive Maintenance',
      tasksCompleted: 145,
      accuracy: 97.2,
      responseTime: 1.8,
    },
    {
      id: '2',
      name: 'Equipment Monitor',
      role: 'monitor',
      status: 'active',
      specialization: 'IoT Integration',
      tasksCompleted: 289,
      accuracy: 99.1,
      responseTime: 0.5,
    },
    {
      id: '3',
      name: 'Work Order Manager',
      role: 'dispatcher',
      status: 'active',
      specialization: 'Resource Allocation',
      tasksCompleted: 76,
      accuracy: 95.8,
      responseTime: 3.2,
    },
  ]);

  const [maintenanceTasks] = useState<MaintenanceTask[]>([
    {
      id: '1',
      equipment: 'HVAC Unit - Floor 12',
      type: 'Filter Replacement',
      priority: 'medium',
      status: 'pending',
      dueDate: '2025-01-15',
      estimatedCost: 250,
    },
    {
      id: '2',
      equipment: 'Elevator Bank A',
      type: 'Safety Inspection',
      priority: 'high',
      status: 'in_progress',
      dueDate: '2025-01-10',
      assignedTo: 'John Smith',
      estimatedCost: 1200,
    },
    {
      id: '3',
      equipment: 'Generator Backup',
      type: 'Load Testing',
      priority: 'critical',
      status: 'pending',
      dueDate: '2025-01-08',
      estimatedCost: 800,
    },
  ]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in_progress':
        return 'bg-blue-500';
      case 'pending':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-cosmic-highlight flex items-center gap-3">
            <Building className="w-8 h-8" />
            Facility Management Agent Suite
          </h1>
          <p className="text-cosmic-light mt-1">
            AI-powered facility operations and maintenance management
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-green-500">System Online</Badge>
          <Button className="bg-cosmic-accent hover:bg-cosmic-highlight">
            <Settings className="w-4 h-4 mr-2" />
            Configure Suite
          </Button>
        </div>
      </div>

      {/* Key Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-400">Equipment Monitored</p>
                <p className="text-2xl font-bold text-white">
                  {metrics.totalEquipment.toLocaleString()}
                </p>
              </div>
              <Building className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-400">Active Alerts</p>
                <p className="text-2xl font-bold text-white">{metrics.activeAlerts}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-400">System Uptime</p>
                <p className="text-2xl font-bold text-white">{metrics.uptime}%</p>
                <Progress value={metrics.uptime} className="mt-2" />
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-400">Cost Savings</p>
                <p className="text-2xl font-bold text-white">
                  ${metrics.costSavings.toLocaleString()}
                </p>
                <p className="text-xs text-purple-300">This quarter</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="agents" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="agents">Agent Team</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance Tasks</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <Card key={agent.id} className="bg-cosmic-light bg-opacity-10 border-cosmic-light">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-cosmic-highlight flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      {agent.name}
                    </CardTitle>
                    <Badge className={agent.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}>
                      {agent.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-cosmic-light">{agent.specialization}</p>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-cosmic-light">Tasks Completed</span>
                      <span className="text-white font-medium">{agent.tasksCompleted}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-cosmic-light">Accuracy</span>
                      <span className="text-white font-medium">{agent.accuracy}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-cosmic-light">Avg Response Time</span>
                      <span className="text-white font-medium">{agent.responseTime}s</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      disabled={agent.status === 'active'}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      disabled={agent.status === 'inactive'}
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="maintenance" className="mt-6">
          <div className="space-y-4">
            {maintenanceTasks.map((task) => (
              <Card key={task.id} className="bg-cosmic-light bg-opacity-5 border-cosmic-light">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-white">{task.equipment}</h3>
                        <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                        <Badge className={getStatusColor(task.status)}>
                          {task.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-cosmic-light mb-3">{task.type}</p>
                      <div className="flex items-center gap-4 text-sm text-cosmic-light">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Zap className="w-4 h-4" />
                          Est. Cost: ${task.estimatedCost}
                        </span>
                        {task.assignedTo && (
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {task.assignedTo}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Wrench className="w-4 h-4 mr-2" />
                        Assign
                      </Button>
                      <Button size="sm" className="bg-cosmic-accent hover:bg-cosmic-highlight">
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-cosmic-light bg-opacity-10 border-cosmic-light">
              <CardHeader>
                <CardTitle className="text-cosmic-highlight">Maintenance Efficiency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-cosmic-light">Preventive Maintenance</span>
                      <span className="text-white">87%</span>
                    </div>
                    <Progress value={87} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-cosmic-light">Response Time</span>
                      <span className="text-white">2.3h avg</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-cosmic-light">Cost Reduction</span>
                      <span className="text-white">$45K saved</span>
                    </div>
                    <Progress value={90} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-cosmic-light bg-opacity-10 border-cosmic-light">
              <CardHeader>
                <CardTitle className="text-cosmic-highlight">Agent Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {agents.map((agent) => (
                    <div key={agent.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">{agent.name}</p>
                        <p className="text-xs text-cosmic-light">{agent.tasksCompleted} tasks</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">{agent.accuracy}%</p>
                        <p className="text-xs text-cosmic-light">{agent.responseTime}s avg</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <Card className="bg-cosmic-light bg-opacity-10 border-cosmic-light">
            <CardHeader>
              <CardTitle className="text-cosmic-highlight">Agent Suite Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-white mb-3">Active Integrations</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <Badge className="bg-green-500">IoT Sensors</Badge>
                    <Badge className="bg-green-500">Work Order System</Badge>
                    <Badge className="bg-green-500">CMMS Integration</Badge>
                    <Badge className="bg-yellow-500">Predictive Analytics</Badge>
                    <Badge className="bg-blue-500">Mobile App</Badge>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-white mb-3">Agent Behaviors</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-cosmic-light">Auto-escalation for critical alerts</span>
                      <Badge className="bg-green-500">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-cosmic-light">Predictive maintenance scheduling</span>
                      <Badge className="bg-green-500">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-cosmic-light">Cost optimization recommendations</span>
                      <Badge className="bg-yellow-500">Beta</Badge>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button className="bg-cosmic-accent hover:bg-cosmic-highlight">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset to Defaults
                  </Button>
                  <Button variant="outline">
                    <Shield className="w-4 h-4 mr-2" />
                    Security Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FacilityManagementAgentSuite;













