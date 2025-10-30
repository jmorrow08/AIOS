import React, { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { MainNavigation } from '@/components/MainNavigation';
import { CosmicBackground } from '@/components/CosmicBackground';
import UsageBar from '@/components/UsageBar';

// shadcn components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// Icons
import {
  Settings as SettingsIcon,
  Key,
  DollarSign,
  Brain,
  User,
  Save,
  Eye,
  EyeOff,
  RefreshCw,
  Shield,
  Mail,
  Lock,
  AlertTriangle,
  CheckCircle,
  Server,
  Zap,
  Activity,
  Cloud,
} from 'lucide-react';

// API imports
import { getApiUsageSummary, checkBudgetLimit } from '@/api/apiUsage';
import { supabase } from '@/lib/supabaseClient';

// Hooks
import { useSettings } from '@/hooks/useSettings';

interface ApiKey {
  key: string;
  value: string;
  masked: boolean;
  label: string;
  placeholder: string;
}

interface ModelOption {
  value: string;
  label: string;
  description: string;
}

const Settings: React.FC = () => {
  const { user } = useUser();

  // Use the settings hook
  const {
    settings,
    loading: settingsLoading,
    error: settingsError,
    updateApiKey,
    updateBudgetSetting,
    updateModelPreference,
    updateAccountSetting,
    updateRunPodSetting,
    refreshSettings,
  } = useSettings();

  // Local loading state for save operations
  const [saving, setSaving] = useState(false);

  // Local form state for editing (synced with settings)
  const [formData, setFormData] = useState<SettingsData | null>(null);

  // UI state
  const [maskedKeys, setMaskedKeys] = useState<{ [key: string]: boolean }>({
    openai_api_key: true,
    stability_api_key: true,
    elevenlabs_api_key: true,
    stripe_secret_key: true,
    runpod_api_key: true,
  });

  // GPU control state
  const [gpuStatus, setGpuStatus] = useState<{
    status: 'running' | 'stopped' | 'starting' | 'stopping' | 'unknown';
    baseUrl: string;
    isLoading: boolean;
  }>({
    status: 'unknown',
    baseUrl: 'Local fallback',
    isLoading: false,
  });

  const [budgetInfo, setBudgetInfo] = useState({
    currentUsage: 0,
    budgetLimit: 50,
    isWithinBudget: true,
    projectedUsage: 0,
  });

  const [saveStatus, setSaveStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // Model options
  const llmOptions: ModelOption[] = [
    { value: 'gpt-4', label: 'GPT-4', description: 'Most capable model, higher cost' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', description: 'Fast and capable, good balance' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', description: 'Fast and cost-effective' },
  ];

  const imageModelOptions: ModelOption[] = [
    { value: 'dalle-3', label: 'DALL-E 3', description: 'Highest quality image generation' },
    { value: 'dalle-2', label: 'DALL-E 2', description: 'Good quality, faster generation' },
    {
      value: 'stable-diffusion',
      label: 'Stable Diffusion',
      description: 'Open-source alternative',
    },
  ];

  const voiceModelOptions: ModelOption[] = [
    {
      value: 'elevenlabs-tts',
      label: 'ElevenLabs TTS',
      description: 'High-quality voice synthesis',
    },
    { value: 'openai-tts', label: 'OpenAI TTS', description: 'Natural voice synthesis' },
  ];

  const temperatureOptions = [
    { value: 0.2, label: 'Low', description: 'More focused and deterministic' },
    { value: 0.7, label: 'Medium', description: 'Balanced creativity and coherence' },
    { value: 1.0, label: 'High', description: 'More creative and varied' },
  ];

  // Load budget info on mount
  useEffect(() => {
    loadBudgetInfo();
  }, [user]);

  // Sync form data with settings
  useEffect(() => {
    if (settings && !formData) {
      setFormData(JSON.parse(JSON.stringify(settings))); // Deep copy
    }
  }, [settings, formData]);

  const loadBudgetInfo = async () => {
    if (!user) return;

    try {
      const budgetInfoRes = await checkBudgetLimit();
      if (budgetInfoRes.data) {
        setBudgetInfo(budgetInfoRes.value.data);
      }
    } catch (error) {
      console.error('Error loading budget info:', error);
    }
  };

  // Helper function to update form data
  const updateFormData = (path: string, value: any) => {
    if (!formData) return;

    const newFormData = JSON.parse(JSON.stringify(formData)); // Deep copy
    const keys = path.split('.');
    let current: any = newFormData;

    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
    setFormData(newFormData);
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setSaveStatus({ type: null, message: '' });

    try {
      // Save API keys
      const apiKeyPromises = Object.entries(formData.apiKeys).map(([key, value]) =>
        updateApiKey(key as keyof typeof formData.apiKeys, value),
      );

      // Save budget settings
      const budgetPromises = [
        updateBudgetSetting('monthly_budget', formData.budget.monthly_budget),
        updateBudgetSetting('budget_enforce', formData.budget.budget_enforce),
        updateBudgetSetting('budget_notify', formData.budget.budget_notify),
      ];

      // Save model preferences
      const modelPromises = [
        updateModelPreference('default_llm', formData.models.default_llm),
        updateModelPreference('default_image_model', formData.models.default_image_model),
        updateModelPreference('default_voice_model', formData.models.default_voice_model),
        updateModelPreference('economy_mode', formData.models.economy_mode),
        updateModelPreference('creativity_temperature', formData.models.creativity_temperature),
      ];

      // Save RunPod settings
      const runpodPromises = [
        updateRunPodSetting('enable_runpod', formData.runpod.enable_runpod),
        updateRunPodSetting('runpod_api_key', formData.runpod.runpod_api_key),
        updateRunPodSetting('pod_id', formData.runpod.pod_id),
        updateRunPodSetting('ollama_enabled', formData.runpod.ollama_enabled),
        updateRunPodSetting('comfyui_enabled', formData.runpod.comfyui_enabled),
        updateRunPodSetting('auto_start_services', formData.runpod.auto_start_services),
        updateRunPodSetting('preferred_provider', formData.runpod.preferred_provider),
      ];

      // Save account settings
      const accountPromises = [updateAccountSetting('display_name', formData.account.display_name)];

      // Execute all saves in parallel
      const results = await Promise.all([
        ...apiKeyPromises,
        ...budgetPromises,
        ...modelPromises,
        ...runpodPromises,
        ...accountPromises,
      ]);

      // Check if all saves were successful
      const allSuccessful = results.every((result) => result === true);

      if (allSuccessful) {
        setSaveStatus({
          type: 'success',
          message: 'Settings saved successfully!',
        });

        // Refresh budget info after save
        const budgetInfoRes = await checkBudgetLimit();
        if (budgetInfoRes.data) {
          setBudgetInfo(budgetInfoRes.value.data);
        }
      } else {
        throw new Error('Some settings failed to save');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveStatus({
        type: 'error',
        message: 'Failed to save settings. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleKeyMask = (key: string) => {
    setMaskedKeys((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const maskApiKey = (key: string) => {
    if (!key) return '';
    if (key.length <= 8) return key;
    return key.substring(0, 4) + '****' + key.substring(key.length - 4);
  };

  // GPU control functions
  const checkGpuStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('runpod-control', {
        method: 'GET',
      });

      if (error) {
        console.error('Error checking GPU status:', error);
        setGpuStatus((prev) => ({ ...prev, status: 'unknown', baseUrl: 'Local fallback' }));
        return;
      }

      if (data?.success && data?.data) {
        const status = data.data.status?.toLowerCase() || 'unknown';
        const isRunning = status === 'running';
        // If running, show "RunPod (Remote)", otherwise "Local fallback"
        const baseUrl = isRunning ? 'RunPod (Remote)' : 'Local fallback';

        setGpuStatus((prev) => ({
          ...prev,
          status: status as any,
          baseUrl,
        }));
      } else {
        setGpuStatus((prev) => ({ ...prev, status: 'unknown', baseUrl: 'Local fallback' }));
      }
    } catch (err) {
      console.error('Failed to check GPU status:', err);
      setGpuStatus((prev) => ({ ...prev, status: 'unknown', baseUrl: 'Local fallback' }));
    }
  };

  const toggleGpu = async (start: boolean) => {
    if (!formData?.runpod?.pod_id) {
      alert('Please set a Pod ID in your RunPod settings first.');
      return;
    }

    setGpuStatus((prev) => ({ ...prev, isLoading: true }));

    try {
      const { data, error } = await supabase.functions.invoke('runpod-control', {
        body: {
          action: start ? 'start' : 'stop',
          podId: formData.runpod.pod_id,
        },
      });

      if (error) {
        console.error('Error toggling GPU:', error);
        alert(`Failed to ${start ? 'start' : 'stop'} GPU: ${error.message}`);
        return;
      }

      if (data?.success) {
        // Update status after a short delay to allow the pod to change state
        setTimeout(() => {
          checkGpuStatus();
        }, 2000);
      } else {
        alert(`Failed to ${start ? 'start' : 'stop'} GPU: ${data?.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Failed to toggle GPU:', err);
      alert(`Failed to ${start ? 'start' : 'stop'} GPU: ${err.message}`);
    } finally {
      setGpuStatus((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // Load GPU status on mount and when RunPod settings change
  useEffect(() => {
    if (formData?.runpod?.enable_runpod && formData?.runpod?.pod_id) {
      checkGpuStatus();
    }
  }, [formData?.runpod?.enable_runpod, formData?.runpod?.pod_id]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (settingsLoading) {
    return (
      <div className="relative min-h-screen overflow-hidden flex">
        <MainNavigation />
        <CosmicBackground />
        <div className="p-8 pt-24 max-w-4xl mx-auto">
          <div className="space-y-8">
            <div className="flex items-center space-x-3">
              <SettingsIcon className="w-8 h-8 text-cosmic-accent" />
              <h1 className="text-3xl font-bold text-white">Settings</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden flex">
      <MainNavigation />
      <CosmicBackground />

      <div className="flex-1 p-8 pt-24 max-w-4xl mx-auto">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <SettingsIcon className="w-8 h-8 text-cosmic-accent" />
              <h1 className="text-3xl font-bold text-white">Settings</h1>
            </div>

            <Button
              onClick={handleSaveSettings}
              disabled={saving}
              className="bg-cosmic-blue hover:bg-cosmic-blue/80"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>

          {/* Status Alert */}
          {saveStatus.type && (
            <Alert
              className={
                saveStatus.type === 'success'
                  ? 'bg-green-900/20 border-green-500/50'
                  : 'bg-red-900/20 border-red-500/50'
              }
            >
              {saveStatus.type === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertDescription
                className={saveStatus.type === 'success' ? 'text-green-200' : 'text-red-200'}
              >
                {saveStatus.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Settings Tabs */}
          <Tabs defaultValue="api-keys" className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-gray-800/50">
              <TabsTrigger value="api-keys" className="flex items-center space-x-2">
                <Key className="w-4 h-4" />
                <span>API Keys</span>
              </TabsTrigger>
              <TabsTrigger value="budget" className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4" />
                <span>Budget</span>
              </TabsTrigger>
              <TabsTrigger value="models" className="flex items-center space-x-2">
                <Brain className="w-4 h-4" />
                <span>AI Models</span>
              </TabsTrigger>
              <TabsTrigger value="runpod" className="flex items-center space-x-2">
                <SettingsIcon className="w-4 h-4" />
                <span>RunPod</span>
              </TabsTrigger>
              <TabsTrigger value="account" className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Account</span>
              </TabsTrigger>
            </TabsList>

            {/* API Keys Tab */}
            <TabsContent value="api-keys" className="space-y-6 mt-6">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <Key className="w-5 h-5" />
                    <span>API Keys Configuration</span>
                  </CardTitle>
                  <CardDescription className="text-cosmic-blue">
                    Configure your API keys for various AI services. Keys are securely encrypted and
                    stored.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* OpenAI API Key */}
                  <div className="space-y-2">
                    <Label htmlFor="openai-key" className="text-white flex items-center space-x-2">
                      <span>OpenAI API Key</span>
                      <Badge variant="outline" className="text-xs">
                        Required
                      </Badge>
                    </Label>
                    <div className="flex space-x-2">
                      <div className="relative flex-1">
                        <Input
                          id="openai-key"
                          type={maskedKeys.openai_api_key ? 'password' : 'text'}
                          placeholder="sk-..."
                          value={
                            maskedKeys.openai_api_key
                              ? maskApiKey(formData?.apiKeys.openai_api_key || '')
                              : formData?.apiKeys.openai_api_key || ''
                          }
                          onChange={(e) => {
                            const value = e.target.value;
                            if (!maskedKeys.openai_api_key) {
                              updateFormData('apiKeys.openai_api_key', value);
                            }
                          }}
                          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => toggleKeyMask('openai_api_key')}
                        className="border-white/20"
                      >
                        {maskedKeys.openai_api_key ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-400">
                      Used for GPT models, embeddings, and other OpenAI services
                    </p>
                  </div>

                  {/* Stability AI API Key */}
                  <div className="space-y-2">
                    <Label htmlFor="stability-key" className="text-white">
                      Stability AI API Key
                    </Label>
                    <div className="flex space-x-2">
                      <div className="relative flex-1">
                        <Input
                          id="stability-key"
                          type={maskedKeys.stability_api_key ? 'password' : 'text'}
                          placeholder="sk-..."
                          value={
                            maskedKeys.stability_api_key
                              ? maskApiKey(apiKeys.stability_api_key)
                              : apiKeys.stability_api_key
                          }
                          onChange={(e) => {
                            const value = e.target.value;
                            if (!maskedKeys.stability_api_key) {
                              setApiKeys((prev) => ({ ...prev, stability_api_key: value }));
                            }
                          }}
                          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => toggleKeyMask('stability_api_key')}
                        className="border-white/20"
                      >
                        {maskedKeys.stability_api_key ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-400">
                      Used for Stable Diffusion image generation
                    </p>
                  </div>

                  {/* ElevenLabs API Key */}
                  <div className="space-y-2">
                    <Label htmlFor="elevenlabs-key" className="text-white">
                      ElevenLabs API Key
                    </Label>
                    <div className="flex space-x-2">
                      <div className="relative flex-1">
                        <Input
                          id="elevenlabs-key"
                          type={maskedKeys.elevenlabs_api_key ? 'password' : 'text'}
                          placeholder="..."
                          value={
                            maskedKeys.elevenlabs_api_key
                              ? maskApiKey(apiKeys.elevenlabs_api_key)
                              : apiKeys.elevenlabs_api_key
                          }
                          onChange={(e) => {
                            const value = e.target.value;
                            if (!maskedKeys.elevenlabs_api_key) {
                              setApiKeys((prev) => ({ ...prev, elevenlabs_api_key: value }));
                            }
                          }}
                          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => toggleKeyMask('elevenlabs_api_key')}
                        className="border-white/20"
                      >
                        {maskedKeys.elevenlabs_api_key ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-400">
                      Used for high-quality text-to-speech synthesis
                    </p>
                  </div>

                  {/* Stripe Secret Key */}
                  <div className="space-y-2">
                    <Label htmlFor="stripe-key" className="text-white">
                      Stripe Secret Key
                    </Label>
                    <div className="flex space-x-2">
                      <div className="relative flex-1">
                        <Input
                          id="stripe-key"
                          type={maskedKeys.stripe_secret_key ? 'password' : 'text'}
                          placeholder="sk_live_..."
                          value={
                            maskedKeys.stripe_secret_key
                              ? maskApiKey(apiKeys.stripe_secret_key)
                              : apiKeys.stripe_secret_key
                          }
                          onChange={(e) => {
                            const value = e.target.value;
                            if (!maskedKeys.stripe_secret_key) {
                              setApiKeys((prev) => ({ ...prev, stripe_secret_key: value }));
                            }
                          }}
                          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => toggleKeyMask('stripe_secret_key')}
                        className="border-white/20"
                      >
                        {maskedKeys.stripe_secret_key ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-400">
                      Used for payment processing and invoice generation
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Budget Tab */}
            <TabsContent value="budget" className="space-y-6 mt-6">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <DollarSign className="w-5 h-5" />
                    <span>AI Usage & Budget</span>
                  </CardTitle>
                  <CardDescription className="text-cosmic-blue">
                    Monitor your API usage and set budget limits to control costs.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Current Usage Overview */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Current Usage</h3>
                    <UsageBar
                      currentUsage={budgetInfo.currentUsage}
                      budgetLimit={budgetInfo.budgetLimit}
                      title="Monthly API Budget"
                    />
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center">
                        <p className="text-cosmic-blue">Current Usage</p>
                        <p className="text-white font-semibold">
                          {formatCurrency(budgetInfo.currentUsage)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-cosmic-blue">Remaining</p>
                        <p className="text-white font-semibold">
                          {formatCurrency(
                            Math.max(0, budgetInfo.budgetLimit - budgetInfo.currentUsage),
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-white/20" />

                  {/* Budget Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Budget Settings</h3>

                    <div className="space-y-2">
                      <Label htmlFor="monthly-budget" className="text-white">
                        Monthly Budget Limit ($)
                      </Label>
                      <Input
                        id="monthly-budget"
                        type="number"
                        min="0"
                        step="0.01"
                        value={budgetSettings.monthly_budget}
                        onChange={(e) =>
                          setBudgetSettings((prev) => ({
                            ...prev,
                            monthly_budget: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="bg-white/10 border-white/20 text-white"
                      />
                      <p className="text-xs text-gray-400">
                        Set your monthly spending limit for AI services
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label htmlFor="budget-enforce" className="text-white">
                          Enforce Budget Limits
                        </Label>
                        <p className="text-xs text-gray-400">
                          Block API calls when budget is exceeded
                        </p>
                      </div>
                      <Switch
                        id="budget-enforce"
                        checked={budgetSettings.budget_enforce}
                        onCheckedChange={(checked) =>
                          setBudgetSettings((prev) => ({
                            ...prev,
                            budget_enforce: checked,
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label htmlFor="budget-notify" className="text-white">
                          Notify When Nearing Limit
                        </Label>
                        <p className="text-xs text-gray-400">
                          Get alerts when usage reaches 90% of budget
                        </p>
                      </div>
                      <Switch
                        id="budget-notify"
                        checked={budgetSettings.budget_notify}
                        onCheckedChange={(checked) =>
                          setBudgetSettings((prev) => ({
                            ...prev,
                            budget_notify: checked,
                          }))
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* AI Models Tab */}
            <TabsContent value="models" className="space-y-6 mt-6">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <Brain className="w-5 h-5" />
                    <span>AI Model Preferences</span>
                  </CardTitle>
                  <CardDescription className="text-cosmic-blue">
                    Configure default AI models and generation settings.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Default Models */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Default Models</h3>

                    <div className="space-y-2">
                      <Label htmlFor="default-llm" className="text-white">
                        Default Language Model
                      </Label>
                      <Select
                        value={modelPreferences.default_llm}
                        onValueChange={(value) =>
                          setModelPreferences((prev) => ({
                            ...prev,
                            default_llm: value,
                          }))
                        }
                      >
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {llmOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div>
                                <div className="font-medium">{option.label}</div>
                                <div className="text-xs text-gray-400">{option.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="default-image" className="text-white">
                        Default Image Model
                      </Label>
                      <Select
                        value={modelPreferences.default_image_model}
                        onValueChange={(value) =>
                          setModelPreferences((prev) => ({
                            ...prev,
                            default_image_model: value,
                          }))
                        }
                      >
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {imageModelOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div>
                                <div className="font-medium">{option.label}</div>
                                <div className="text-xs text-gray-400">{option.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="default-voice" className="text-white">
                        Default Voice Model
                      </Label>
                      <Select
                        value={modelPreferences.default_voice_model}
                        onValueChange={(value) =>
                          setModelPreferences((prev) => ({
                            ...prev,
                            default_voice_model: value,
                          }))
                        }
                      >
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {voiceModelOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div>
                                <div className="font-medium">{option.label}</div>
                                <div className="text-xs text-gray-400">{option.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator className="bg-white/20" />

                  {/* Generation Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Generation Settings</h3>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label htmlFor="economy-mode" className="text-white">
                          Economy Mode
                        </Label>
                        <p className="text-xs text-gray-400">
                          Use cheaper models automatically (may reduce quality)
                        </p>
                      </div>
                      <Switch
                        id="economy-mode"
                        checked={modelPreferences.economy_mode}
                        onCheckedChange={(checked) =>
                          setModelPreferences((prev) => ({
                            ...prev,
                            economy_mode: checked,
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="creativity" className="text-white">
                        Default Creativity Level
                      </Label>
                      <Select
                        value={modelPreferences.creativity_temperature.toString()}
                        onValueChange={(value) =>
                          setModelPreferences((prev) => ({
                            ...prev,
                            creativity_temperature: parseFloat(value),
                          }))
                        }
                      >
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {temperatureOptions.map((option) => (
                            <SelectItem
                              key={option.value.toString()}
                              value={option.value.toString()}
                            >
                              <div>
                                <div className="font-medium">
                                  {option.label} ({option.value})
                                </div>
                                <div className="text-xs text-gray-400">{option.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* RunPod Tab */}
            <TabsContent value="runpod" className="space-y-6 mt-6">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <Server className="w-5 h-5" />
                    <span>RunPod Configuration</span>
                  </CardTitle>
                  <CardDescription className="text-cosmic-blue">
                    Configure RunPod GPU services for local AI processing. Enable Ollama and ComfyUI
                    for cost-effective, private AI generation.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Enable RunPod */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label
                        htmlFor="enable-runpod"
                        className="text-white flex items-center space-x-2"
                      >
                        <Server className="w-4 h-4" />
                        <span>Enable RunPod Integration</span>
                      </Label>
                      <p className="text-xs text-gray-400">
                        Enable local AI processing with RunPod GPU instances
                      </p>
                    </div>
                    <Switch
                      id="enable-runpod"
                      checked={formData?.runpod.enable_runpod || false}
                      onCheckedChange={(checked) => updateFormData('runpod.enable_runpod', checked)}
                    />
                  </div>

                  {/* RunPod API Key */}
                  <div className="space-y-2">
                    <Label htmlFor="runpod-key" className="text-white">
                      RunPod API Key
                    </Label>
                    <div className="flex space-x-2">
                      <div className="relative flex-1">
                        <Input
                          id="runpod-key"
                          type={maskedKeys.runpod_api_key ? 'password' : 'text'}
                          placeholder="rp_..."
                          value={
                            maskedKeys.runpod_api_key
                              ? maskApiKey(formData?.runpod.runpod_api_key || '')
                              : formData?.runpod.runpod_api_key || ''
                          }
                          onChange={(e) => {
                            const value = e.target.value;
                            if (!maskedKeys.runpod_api_key) {
                              updateFormData('runpod.runpod_api_key', value);
                            }
                          }}
                          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => toggleKeyMask('runpod_api_key')}
                        className="border-white/20"
                      >
                        {maskedKeys.runpod_api_key ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-400">
                      Used to manage RunPod instances and deployments
                    </p>
                  </div>

                  {/* Pod ID */}
                  <div className="space-y-2">
                    <Label htmlFor="pod-id" className="text-white">
                      Pod ID
                    </Label>
                    <Input
                      id="pod-id"
                      type="text"
                      placeholder="abc123..."
                      value={formData?.runpod.pod_id || ''}
                      onChange={(e) => updateFormData('runpod.pod_id', e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    />
                    <p className="text-xs text-gray-400">
                      Your RunPod pod identifier for GPU control
                    </p>
                  </div>

                  <Separator className="bg-white/20" />

                  {/* Service Configuration */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Local AI Services</h3>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label
                          htmlFor="ollama-enabled"
                          className="text-white flex items-center space-x-2"
                        >
                          <Brain className="w-4 h-4" />
                          <span>Ollama (Chat & Code)</span>
                        </Label>
                        <p className="text-xs text-gray-400">
                          Enable local LLM inference for chat and code generation
                        </p>
                      </div>
                      <Switch
                        id="ollama-enabled"
                        checked={formData?.runpod.ollama_enabled || false}
                        onCheckedChange={(checked) =>
                          updateFormData('runpod.ollama_enabled', checked)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label
                          htmlFor="comfyui-enabled"
                          className="text-white flex items-center space-x-2"
                        >
                          <Activity className="w-4 h-4" />
                          <span>ComfyUI (Images & Video)</span>
                        </Label>
                        <p className="text-xs text-gray-400">
                          Enable local image and video generation with Stable Diffusion
                        </p>
                      </div>
                      <Switch
                        id="comfyui-enabled"
                        checked={formData?.runpod.comfyui_enabled || false}
                        onCheckedChange={(checked) =>
                          updateFormData('runpod.comfyui_enabled', checked)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label
                          htmlFor="auto-start"
                          className="text-white flex items-center space-x-2"
                        >
                          <Zap className="w-4 h-4" />
                          <span>Auto-start Services</span>
                        </Label>
                        <p className="text-xs text-gray-400">
                          Automatically start RunPod instances when needed
                        </p>
                      </div>
                      <Switch
                        id="auto-start"
                        checked={formData?.runpod.auto_start_services || false}
                        onCheckedChange={(checked) =>
                          updateFormData('runpod.auto_start_services', checked)
                        }
                      />
                    </div>
                  </div>

                  <Separator className="bg-white/20" />

                  {/* GPU Control */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                      <Server className="w-5 h-5" />
                      <span>GPU Control</span>
                    </h3>

                    {/* GPU Toggle */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-white flex items-center space-x-2">
                          <Zap className="w-4 h-4" />
                          <span>GPU On/Off</span>
                        </Label>
                        <p className="text-xs text-gray-400">
                          Start or stop your RunPod GPU instance
                        </p>
                      </div>
                      <Button
                        onClick={() => toggleGpu(gpuStatus.status !== 'running')}
                        disabled={
                          gpuStatus.isLoading ||
                          !formData?.runpod?.enable_runpod ||
                          !formData?.runpod?.pod_id
                        }
                        className={`${
                          gpuStatus.status === 'running'
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-green-600 hover:bg-green-700'
                        } text-white`}
                      >
                        {gpuStatus.isLoading ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : gpuStatus.status === 'running' ? (
                          <span>Stop GPU</span>
                        ) : (
                          <span>Start GPU</span>
                        )}
                      </Button>
                    </div>

                    {/* Status Display */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-white text-sm">Status</Label>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={gpuStatus.status === 'running' ? 'default' : 'secondary'}
                            className={
                              gpuStatus.status === 'running'
                                ? 'bg-green-600 text-white'
                                : gpuStatus.status === 'stopped'
                                ? 'bg-gray-600 text-white'
                                : 'bg-yellow-600 text-white'
                            }
                          >
                            {gpuStatus.status === 'running' && (
                              <CheckCircle className="w-3 h-3 mr-1" />
                            )}
                            {gpuStatus.status === 'stopped' && (
                              <AlertTriangle className="w-3 h-3 mr-1" />
                            )}
                            {(gpuStatus.status === 'starting' ||
                              gpuStatus.status === 'stopping') && (
                              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                            )}
                            {gpuStatus.status.charAt(0).toUpperCase() + gpuStatus.status.slice(1)}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-white text-sm">Mode</Label>
                        <div className="text-sm text-cosmic-blue">{gpuStatus.baseUrl}</div>
                      </div>
                    </div>

                    {!formData?.runpod?.enable_runpod && (
                      <Alert className="bg-yellow-900/20 border-yellow-500/50">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle className="text-yellow-200">Enable RunPod First</AlertTitle>
                        <AlertDescription className="text-yellow-100">
                          Enable RunPod integration above to control your GPU instance.
                        </AlertDescription>
                      </Alert>
                    )}

                    {!formData?.runpod?.pod_id && formData?.runpod?.enable_runpod && (
                      <Alert className="bg-yellow-900/20 border-yellow-500/50">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle className="text-yellow-200">Set Pod ID</AlertTitle>
                        <AlertDescription className="text-yellow-100">
                          Enter your RunPod Pod ID above to enable GPU control.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <Separator className="bg-white/20" />

                  {/* Provider Preferences */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Provider Preferences</h3>

                    <div className="space-y-2">
                      <Label htmlFor="preferred-provider" className="text-white">
                        Default AI Provider
                      </Label>
                      <Select
                        value={formData?.runpod.preferred_provider || 'api'}
                        onValueChange={(value) =>
                          updateFormData('runpod.preferred_provider', value)
                        }
                      >
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="local">
                            <div>
                              <div className="font-medium">Local First</div>
                              <div className="text-xs text-gray-400">
                                Prefer RunPod services, fallback to APIs
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="api">
                            <div>
                              <div className="font-medium">API First</div>
                              <div className="text-xs text-gray-400">
                                Prefer cloud APIs, use local as backup
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="auto">
                            <div>
                              <div className="font-medium">Auto Balance</div>
                              <div className="text-xs text-gray-400">
                                Smart routing based on cost and availability
                              </div>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-400">
                        Choose how the system routes AI requests between local and cloud services
                      </p>
                    </div>
                  </div>

                  {/* Status Information */}
                  <Alert className="bg-blue-900/20 border-blue-500/50">
                    <Cloud className="h-4 w-4" />
                    <AlertTitle className="text-blue-200">Service Status</AlertTitle>
                    <AlertDescription className="text-blue-100">
                      {formData?.runpod.enable_runpod
                        ? 'RunPod integration is enabled. Local AI services will be used when available.'
                        : 'RunPod integration is disabled. Only cloud API services will be used.'}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Account Tab */}
            <TabsContent value="account" className="space-y-6 mt-6">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>Account Settings</span>
                  </CardTitle>
                  <CardDescription className="text-cosmic-blue">
                    Manage your account information and security settings.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Profile Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Profile Information</h3>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white">
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={accountSettings.email}
                        disabled
                        className="bg-white/5 border-white/10 text-gray-300 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-400">
                        Email cannot be changed here. Contact support if needed.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="display-name" className="text-white">
                        Display Name
                      </Label>
                      <Input
                        id="display-name"
                        type="text"
                        placeholder="Enter your display name"
                        value={accountSettings.display_name}
                        onChange={(e) =>
                          setAccountSettings((prev) => ({
                            ...prev,
                            display_name: e.target.value,
                          }))
                        }
                        className="bg-white/10 border-white/20 text-white"
                      />
                      <p className="text-xs text-gray-400">
                        This name will be displayed throughout the application
                      </p>
                    </div>
                  </div>

                  <Separator className="bg-white/20" />

                  {/* Security Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Security</h3>

                    <div className="space-y-2">
                      <Label className="text-white">Password</Label>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10"
                        onClick={() => {
                          // TODO: Implement password change flow
                          alert('Password change functionality will be implemented soon.');
                        }}
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        Change Password
                      </Button>
                      <p className="text-xs text-gray-400">
                        You'll receive an email with password reset instructions
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Settings;
