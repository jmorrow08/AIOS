import React, { useState, useEffect } from 'react';
import { MainNavigation } from '@/components/MainNavigation';
import { CosmicBackground } from '@/components/CosmicBackground';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Icons
import {
  TestTube,
  Play,
  CheckCircle,
  XCircle,
  Loader,
  MessageSquare,
  Image,
  Server,
  Zap,
  Activity,
} from 'lucide-react';

// API imports
import { checkRunPodServices, testRunPodGeneration } from '@/api/runpod';
import { useSettings } from '@/hooks/useSettings';

interface ServiceStatus {
  ollama: boolean;
  comfyui: boolean;
  gpu_available: boolean;
  instance_running: boolean;
}

const RunPodTest: React.FC = () => {
  const { settings } = useSettings();

  // Service status
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  // Test states
  const [chatPrompt, setChatPrompt] = useState('Explain how RunPod + Ollama integration works');
  const [imagePrompt, setImagePrompt] = useState('A beautiful sunset over mountains with a lake');
  const [chatResponse, setChatResponse] = useState('');
  const [imageResult, setImageResult] = useState<any>(null);

  // Test loading states
  const [chatTesting, setChatTesting] = useState(false);
  const [imageTesting, setImageTesting] = useState(false);

  // Test results
  const [chatTestResult, setChatTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [imageTestResult, setImageTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Load service status on mount
  useEffect(() => {
    loadServiceStatus();
  }, []);

  const loadServiceStatus = async () => {
    setStatusLoading(true);
    try {
      const result = await checkRunPodServices();
      if (result.data) {
        setServiceStatus(result.data);
      }
    } catch (error) {
      console.error('Error loading service status:', error);
    } finally {
      setStatusLoading(false);
    }
  };

  const testChat = async () => {
    setChatTesting(true);
    setChatTestResult(null);
    setChatResponse('');

    try {
      const result = await testRunPodGeneration('chat', chatPrompt);
      if (result.error) {
        setChatTestResult({ success: false, message: result.error });
      } else {
        setChatResponse(result.data.response);
        setChatTestResult({ success: true, message: 'Chat generation successful!' });
      }
    } catch (error) {
      setChatTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setChatTesting(false);
    }
  };

  const testImage = async () => {
    setImageTesting(true);
    setImageTestResult(null);
    setImageResult(null);

    try {
      const result = await testRunPodGeneration('image', imagePrompt);
      if (result.error) {
        setImageTestResult({ success: false, message: result.error });
      } else {
        setImageResult(result.data);
        setImageTestResult({ success: true, message: 'Image generation queued successfully!' });
      }
    } catch (error) {
      setImageTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setImageTesting(false);
    }
  };

  const getStatusColor = (status: boolean) => (status ? 'text-green-400' : 'text-red-400');
  const getStatusIcon = (status: boolean) =>
    status ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />;

  return (
    <div className="relative min-h-screen overflow-hidden flex">
      <MainNavigation />
      <CosmicBackground />

      <div className="flex-1 p-8 pt-24 max-w-6xl mx-auto">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <TestTube className="w-8 h-8 text-cosmic-accent" />
              <div>
                <h1 className="text-3xl font-bold text-white">RunPod Integration Test</h1>
                <p className="text-cosmic-blue">
                  Test chat, images, and video generation with RunPod + Ollama
                </p>
              </div>
            </div>

            <Button
              onClick={loadServiceStatus}
              disabled={statusLoading}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              {statusLoading ? (
                <Loader className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Activity className="w-4 h-4 mr-2" />
              )}
              Refresh Status
            </Button>
          </div>

          {/* Service Status */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Server className="w-5 h-5" />
                <span>Service Status</span>
              </CardTitle>
              <CardDescription className="text-cosmic-blue">
                Current status of RunPod services and local AI infrastructure
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statusLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="w-8 h-8 animate-spin text-cosmic-accent" />
                  <span className="ml-2 text-white">Checking services...</span>
                </div>
              ) : serviceStatus ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div
                      className={`flex items-center justify-center space-x-2 mb-2 ${getStatusColor(
                        serviceStatus.ollama,
                      )}`}
                    >
                      {getStatusIcon(serviceStatus.ollama)}
                      <span className="font-semibold">Ollama</span>
                    </div>
                    <Badge variant={serviceStatus.ollama ? 'default' : 'destructive'}>
                      {serviceStatus.ollama ? 'Running' : 'Stopped'}
                    </Badge>
                  </div>

                  <div className="text-center">
                    <div
                      className={`flex items-center justify-center space-x-2 mb-2 ${getStatusColor(
                        serviceStatus.comfyui,
                      )}`}
                    >
                      {getStatusIcon(serviceStatus.comfyui)}
                      <span className="font-semibold">ComfyUI</span>
                    </div>
                    <Badge variant={serviceStatus.comfyui ? 'default' : 'destructive'}>
                      {serviceStatus.comfyui ? 'Running' : 'Stopped'}
                    </Badge>
                  </div>

                  <div className="text-center">
                    <div
                      className={`flex items-center justify-center space-x-2 mb-2 ${getStatusColor(
                        serviceStatus.gpu_available,
                      )}`}
                    >
                      {getStatusIcon(serviceStatus.gpu_available)}
                      <span className="font-semibold">GPU</span>
                    </div>
                    <Badge variant={serviceStatus.gpu_available ? 'default' : 'destructive'}>
                      {serviceStatus.gpu_available ? 'Available' : 'Unavailable'}
                    </Badge>
                  </div>

                  <div className="text-center">
                    <div
                      className={`flex items-center justify-center space-x-2 mb-2 ${getStatusColor(
                        serviceStatus.instance_running,
                      )}`}
                    >
                      {getStatusIcon(serviceStatus.instance_running)}
                      <span className="font-semibold">Instance</span>
                    </div>
                    <Badge variant={serviceStatus.instance_running ? 'default' : 'destructive'}>
                      {serviceStatus.instance_running ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              ) : (
                <Alert className="bg-red-900/20 border-red-500/50">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle className="text-red-200">Status Check Failed</AlertTitle>
                  <AlertDescription className="text-red-100">
                    Unable to check service status. Please ensure services are running.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Configuration Status */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Zap className="w-5 h-5" />
                <span>Configuration Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">RunPod Enabled:</span>
                  <span
                    className={`ml-2 font-semibold ${
                      settings?.runpod.enable_runpod ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {settings?.runpod.enable_runpod ? 'Yes' : 'No'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Preferred Provider:</span>
                  <span className="ml-2 font-semibold text-white capitalize">
                    {settings?.runpod.preferred_provider || 'api'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Ollama Enabled:</span>
                  <span
                    className={`ml-2 font-semibold ${
                      settings?.runpod.ollama_enabled ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {settings?.runpod.ollama_enabled ? 'Yes' : 'No'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">ComfyUI Enabled:</span>
                  <span
                    className={`ml-2 font-semibold ${
                      settings?.runpod.comfyui_enabled ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {settings?.runpod.comfyui_enabled ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Tabs */}
          <Tabs defaultValue="chat" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-800/50">
              <TabsTrigger value="chat" className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4" />
                <span>Chat Test</span>
              </TabsTrigger>
              <TabsTrigger value="image" className="flex items-center space-x-2">
                <Image className="w-4 h-4" />
                <span>Image Test</span>
              </TabsTrigger>
            </TabsList>

            {/* Chat Test Tab */}
            <TabsContent value="chat" className="space-y-6 mt-6">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5" />
                    <span>Test Chat Generation</span>
                  </CardTitle>
                  <CardDescription className="text-cosmic-blue">
                    Test text generation using Ollama with local LLMs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="chat-prompt" className="text-white">
                      Chat Prompt
                    </Label>
                    <Textarea
                      id="chat-prompt"
                      placeholder="Enter your chat prompt..."
                      value={chatPrompt}
                      onChange={(e) => setChatPrompt(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 min-h-20"
                    />
                  </div>

                  <Button
                    onClick={testChat}
                    disabled={chatTesting || !serviceStatus?.ollama}
                    className="bg-cosmic-blue hover:bg-cosmic-blue/80"
                  >
                    {chatTesting ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Testing Chat...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Test Chat Generation
                      </>
                    )}
                  </Button>

                  {chatTestResult && (
                    <Alert
                      className={
                        chatTestResult.success
                          ? 'bg-green-900/20 border-green-500/50'
                          : 'bg-red-900/20 border-red-500/50'
                      }
                    >
                      {chatTestResult.success ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      <AlertTitle
                        className={chatTestResult.success ? 'text-green-200' : 'text-red-200'}
                      >
                        {chatTestResult.success ? 'Success' : 'Error'}
                      </AlertTitle>
                      <AlertDescription
                        className={chatTestResult.success ? 'text-green-100' : 'text-red-100'}
                      >
                        {chatTestResult.message}
                      </AlertDescription>
                    </Alert>
                  )}

                  {chatResponse && (
                    <div className="space-y-2">
                      <Label className="text-white">Response:</Label>
                      <div className="bg-black/30 border border-white/20 rounded-lg p-4 max-h-64 overflow-y-auto">
                        <pre className="text-white whitespace-pre-wrap text-sm">{chatResponse}</pre>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Image Test Tab */}
            <TabsContent value="image" className="space-y-6 mt-6">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <Image className="w-5 h-5" />
                    <span>Test Image Generation</span>
                  </CardTitle>
                  <CardDescription className="text-cosmic-blue">
                    Test image generation using ComfyUI with Stable Diffusion
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="image-prompt" className="text-white">
                      Image Prompt
                    </Label>
                    <Textarea
                      id="image-prompt"
                      placeholder="Describe the image you want to generate..."
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 min-h-20"
                    />
                  </div>

                  <Button
                    onClick={testImage}
                    disabled={imageTesting || !serviceStatus?.comfyui}
                    className="bg-cosmic-blue hover:bg-cosmic-blue/80"
                  >
                    {imageTesting ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Generating Image...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Test Image Generation
                      </>
                    )}
                  </Button>

                  {imageTestResult && (
                    <Alert
                      className={
                        imageTestResult.success
                          ? 'bg-green-900/20 border-green-500/50'
                          : 'bg-red-900/20 border-red-500/50'
                      }
                    >
                      {imageTestResult.success ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      <AlertTitle
                        className={imageTestResult.success ? 'text-green-200' : 'text-red-200'}
                      >
                        {imageTestResult.success ? 'Success' : 'Error'}
                      </AlertTitle>
                      <AlertDescription
                        className={imageTestResult.success ? 'text-green-100' : 'text-red-100'}
                      >
                        {imageTestResult.message}
                      </AlertDescription>
                    </Alert>
                  )}

                  {imageResult && (
                    <div className="space-y-2">
                      <Label className="text-white">Generation Result:</Label>
                      <div className="bg-black/30 border border-white/20 rounded-lg p-4">
                        <pre className="text-white text-sm">
                          {JSON.stringify(imageResult, null, 2)}
                        </pre>
                        <p className="text-gray-400 text-xs mt-2">
                          Image generation has been queued. Check your ComfyUI interface for
                          results.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default RunPodTest;








