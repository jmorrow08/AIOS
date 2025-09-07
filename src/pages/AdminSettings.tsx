import React, { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { RadialMenu } from '@/components/RadialMenu';
import { CosmicBackground } from '@/components/CosmicBackground';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Settings,
  Zap,
  Smartphone,
  Save,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import {
  getZapierConfig,
  getTaskerConfig,
  toggleZapierIntegration,
  toggleTaskerIntegration,
  updateZapierConfig,
  updateTaskerConfig,
} from '@/api/companyConfig';

interface IntegrationConfig {
  enabled: boolean;
  webhook_url?: string;
  api_key?: string;
  enabled_events?: string[];
}

const AdminSettings: React.FC = () => {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Integration states
  const [zapierEnabled, setZapierEnabled] = useState(false);
  const [taskerEnabled, setTaskerEnabled] = useState(false);

  // Configuration states
  const [zapierConfig, setZapierConfig] = useState<IntegrationConfig>({
    enabled: false,
    webhook_url: '',
    api_key: '',
    enabled_events: ['client_created', 'invoice_created', 'invoice_overdue'],
  });

  const [taskerConfig, setTaskerConfig] = useState<IntegrationConfig>({
    enabled: false,
    webhook_url: '',
    api_key: '',
    enabled_events: ['client_created', 'invoice_created', 'invoice_overdue'],
  });

  // Load configuration on component mount
  useEffect(() => {
    const loadConfigurations = async () => {
      try {
        setLoading(true);

        // Load Zapier config
        const zapierData = await getZapierConfig();
        if (zapierData) {
          setZapierEnabled(zapierData.enabled);
          setZapierConfig({
            enabled: zapierData.enabled,
            webhook_url: zapierData.config?.webhook_url || '',
            api_key: zapierData.config?.api_key || '',
            enabled_events: zapierData.config?.enabled_events || [
              'client_created',
              'invoice_created',
              'invoice_overdue',
            ],
          });
        }

        // Load Tasker config
        const taskerData = await getTaskerConfig();
        if (taskerData) {
          setTaskerEnabled(taskerData.enabled);
          setTaskerConfig({
            enabled: taskerData.enabled,
            webhook_url: taskerData.config?.webhook_url || '',
            api_key: taskerData.config?.api_key || '',
            enabled_events: taskerData.config?.enabled_events || [
              'client_created',
              'invoice_created',
              'invoice_overdue',
            ],
          });
        }
      } catch (error) {
        console.error('Error loading configurations:', error);
        setMessage({ type: 'error', text: 'Failed to load configuration settings' });
      } finally {
        setLoading(false);
      }
    };

    loadConfigurations();
  }, []);

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setMessage(null);

      // Update Zapier configuration
      const zapierUpdateData = {
        webhook_url: zapierConfig.webhook_url,
        api_key: zapierConfig.api_key,
        enabled_events: zapierConfig.enabled_events,
      };

      const zapierResult = await updateZapierConfig(zapierUpdateData);
      if (zapierResult.error) {
        throw new Error(`Failed to update Zapier config: ${zapierResult.error}`);
      }

      // Update Tasker configuration
      const taskerUpdateData = {
        webhook_url: taskerConfig.webhook_url,
        api_key: taskerConfig.api_key,
        enabled_events: taskerConfig.enabled_events,
      };

      const taskerResult = await updateTaskerConfig(taskerUpdateData);
      if (taskerResult.error) {
        throw new Error(`Failed to update Tasker config: ${taskerResult.error}`);
      }

      // Update enabled states
      await toggleZapierIntegration(zapierEnabled);
      await toggleTaskerIntegration(taskerEnabled);

      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save settings',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleZapierToggle = (enabled: boolean) => {
    setZapierEnabled(enabled);
    setZapierConfig((prev) => ({ ...prev, enabled }));
  };

  const handleTaskerToggle = (enabled: boolean) => {
    setTaskerEnabled(enabled);
    setTaskerConfig((prev) => ({ ...prev, enabled }));
  };

  if (loading) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <CosmicBackground />
        <RadialMenu />
        <div className="p-8 pt-24 max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20">
            <div className="mb-8">
              <Skeleton className="h-10 w-64 mb-2" />
              <Skeleton className="h-6 w-48" />
            </div>
            <div className="space-y-8">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="bg-white/5 rounded-lg p-6 border border-white/10">
                  <div className="mb-4">
                    <Skeleton className="h-6 w-32" />
                  </div>
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-10 w-20" />
                  </div>
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

      <div className="p-8 pt-24 max-w-4xl mx-auto">
        <div className="space-y-8">
          {/* Header */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">Admin Settings</h1>
              <p className="text-cosmic-accent text-lg">
                Configure integrations and system settings
              </p>
              {user && (
                <p className="text-cosmic-accent text-sm mt-2">Logged in as: {user.email}</p>
              )}
            </div>

            {/* Message Display */}
            {message && (
              <div
                className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
                  message.type === 'success'
                    ? 'bg-green-500/20 text-green-300 border border-green-500/50'
                    : 'bg-red-500/20 text-red-300 border border-red-500/50'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                )}
                <p>{message.text}</p>
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleSaveSettings}
                disabled={saving}
                className="bg-cosmic-accent hover:bg-cosmic-accent/80 text-white px-8 py-2"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </div>

          {/* Integration Settings */}
          <div className="space-y-6">
            {/* Zapier Integration */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/20 rounded-lg">
                    <Zap className="w-6 h-6 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Zapier Integration</h3>
                    <p className="text-cosmic-accent text-sm">
                      Connect with 5,000+ apps and automate workflows
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Label htmlFor="zapier-toggle" className="text-cosmic-accent">
                    {zapierEnabled ? 'Enabled' : 'Disabled'}
                  </Label>
                  <Switch
                    id="zapier-toggle"
                    checked={zapierEnabled}
                    onCheckedChange={handleZapierToggle}
                  />
                </div>
              </div>

              {zapierEnabled && (
                <div className="space-y-4 border-t border-white/10 pt-4">
                  <div>
                    <Label htmlFor="zapier-webhook-url" className="text-cosmic-accent">
                      Webhook URL
                    </Label>
                    <Input
                      id="zapier-webhook-url"
                      type="url"
                      value={zapierConfig.webhook_url}
                      onChange={(e) =>
                        setZapierConfig((prev) => ({ ...prev, webhook_url: e.target.value }))
                      }
                      placeholder="https://hooks.zapier.com/hooks/catch/..."
                      className="bg-white/5 border-white/20 text-white placeholder-cosmic-accent mt-1"
                    />
                    <p className="text-xs text-cosmic-accent mt-1">
                      Get this URL from your Zapier webhook trigger
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="zapier-api-key" className="text-cosmic-accent">
                      API Key (Optional)
                    </Label>
                    <Input
                      id="zapier-api-key"
                      type="password"
                      value={zapierConfig.api_key}
                      onChange={(e) =>
                        setZapierConfig((prev) => ({ ...prev, api_key: e.target.value }))
                      }
                      placeholder="Your Zapier API key"
                      className="bg-white/5 border-white/20 text-white placeholder-cosmic-accent mt-1"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-cosmic-accent" />
                    <a
                      href="https://zapier.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cosmic-accent hover:text-white transition-colors text-sm"
                    >
                      Learn more about Zapier
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Tasker Integration */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Smartphone className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Tasker Integration</h3>
                    <p className="text-cosmic-accent text-sm">
                      Automate your Android device and receive notifications
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Label htmlFor="tasker-toggle" className="text-cosmic-accent">
                    {taskerEnabled ? 'Enabled' : 'Disabled'}
                  </Label>
                  <Switch
                    id="tasker-toggle"
                    checked={taskerEnabled}
                    onCheckedChange={handleTaskerToggle}
                  />
                </div>
              </div>

              {taskerEnabled && (
                <div className="space-y-4 border-t border-white/10 pt-4">
                  <div>
                    <Label htmlFor="tasker-webhook-url" className="text-cosmic-accent">
                      Webhook URL
                    </Label>
                    <Input
                      id="tasker-webhook-url"
                      type="url"
                      value={taskerConfig.webhook_url}
                      onChange={(e) =>
                        setTaskerConfig((prev) => ({ ...prev, webhook_url: e.target.value }))
                      }
                      placeholder="https://your-tasker-webhook-url"
                      className="bg-white/5 border-white/20 text-white placeholder-cosmic-accent mt-1"
                    />
                    <p className="text-xs text-cosmic-accent mt-1">
                      Configure this in your Tasker HTTP Request context
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="tasker-api-key" className="text-cosmic-accent">
                      API Key (Optional)
                    </Label>
                    <Input
                      id="tasker-api-key"
                      type="password"
                      value={taskerConfig.api_key}
                      onChange={(e) =>
                        setTaskerConfig((prev) => ({ ...prev, api_key: e.target.value }))
                      }
                      placeholder="Your Tasker API key"
                      className="bg-white/5 border-white/20 text-white placeholder-cosmic-accent mt-1"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-cosmic-accent" />
                    <a
                      href="https://tasker.joaoapps.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cosmic-accent hover:text-white transition-colors text-sm"
                    >
                      Learn more about Tasker
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Information Section */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="flex items-start gap-3">
              <Settings className="w-6 h-6 text-cosmic-accent mt-0.5" />
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Integration Information</h3>
                <div className="text-cosmic-accent text-sm space-y-2">
                  <p>
                    <strong>Zapier:</strong> Receives webhook events when clients are created,
                    invoices are issued, or become overdue. Configure your Zaps to respond to these
                    events.
                  </p>
                  <p>
                    <strong>Tasker:</strong> Can receive notifications on your Android device and
                    trigger custom automations based on business events.
                  </p>
                  <p>
                    <strong>Security:</strong> Webhook URLs and API keys are stored securely in your
                    database. Consider using HTTPS and API authentication for production use.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
