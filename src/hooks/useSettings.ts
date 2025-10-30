import { useState, useEffect, useCallback } from 'react';
import { getSettingsByCategory, getSettingByKey, upsertSetting, Setting } from '@/api/settings';

export interface ApiKeys {
  openai_api_key: string;
  stability_api_key: string;
  elevenlabs_api_key: string;
  stripe_secret_key: string;
}

export interface BudgetSettings {
  monthly_budget: number;
  budget_enforce: boolean;
  budget_notify: boolean;
}

export interface ModelPreferences {
  default_llm: string;
  default_image_model: string;
  default_voice_model: string;
  economy_mode: boolean;
  creativity_temperature: number;
}

export interface AccountSettings {
  display_name: string;
  email: string;
}

export interface RunPodSettings {
  enable_runpod: boolean;
  runpod_api_key: string;
  pod_id: string;
  ollama_enabled: boolean;
  comfyui_enabled: boolean;
  auto_start_services: boolean;
  preferred_provider: 'local' | 'api' | 'auto';
}

export interface SettingsData {
  apiKeys: ApiKeys;
  budget: BudgetSettings;
  models: ModelPreferences;
  account: AccountSettings;
  runpod: RunPodSettings;
}

export interface UseSettingsReturn {
  settings: SettingsData | null;
  loading: boolean;
  error: string | null;
  refreshSettings: () => Promise<void>;
  updateApiKey: (key: keyof ApiKeys, value: string) => Promise<boolean>;
  updateBudgetSetting: (key: keyof BudgetSettings, value: boolean | number) => Promise<boolean>;
  updateModelPreference: (
    key: keyof ModelPreferences,
    value: string | boolean | number,
  ) => Promise<boolean>;
  updateAccountSetting: (key: keyof AccountSettings, value: string) => Promise<boolean>;
  updateRunPodSetting: (key: keyof RunPodSettings, value: string | boolean) => Promise<boolean>;
  updateSetting: (key: string, value: string, category?: string) => Promise<boolean>;
  getSetting: (key: string) => string | null;
}

export const useSettings = (): UseSettingsReturn => {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const defaultSettings: SettingsData = {
    apiKeys: {
      openai_api_key: '',
      stability_api_key: '',
      elevenlabs_api_key: '',
      stripe_secret_key: '',
    },
    budget: {
      monthly_budget: 50,
      budget_enforce: true,
      budget_notify: true,
    },
    models: {
      default_llm: 'gpt-4',
      default_image_model: 'dalle-3',
      default_voice_model: 'elevenlabs-tts',
      economy_mode: false,
      creativity_temperature: 0.7,
    },
    account: {
      display_name: '',
      email: '',
    },
    runpod: {
      enable_runpod: false,
      runpod_api_key: '',
      pod_id: '',
      ollama_enabled: false,
      comfyui_enabled: false,
      auto_start_services: false,
      preferred_provider: 'api',
    },
  };

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all settings categories in parallel
      const [apiKeysRes, budgetRes, modelRes, accountRes, runpodRes] = await Promise.allSettled([
        getSettingsByCategory('api_keys'),
        getSettingsByCategory('budget'),
        getSettingsByCategory('models'),
        getSettingsByCategory('account'),
        getSettingsByCategory('runpod'),
      ]);

      const newSettings = { ...defaultSettings };

      // Process API keys
      if (apiKeysRes.status === 'fulfilled' && apiKeysRes.value.data) {
        const apiKeysData = apiKeysRes.value.data as Setting[];
        apiKeysData.forEach((setting: Setting) => {
          if (setting.value && setting.key in newSettings.apiKeys) {
            (newSettings.apiKeys as any)[setting.key] = setting.value;
          }
        });
      }

      // Process budget settings
      if (budgetRes.status === 'fulfilled' && budgetRes.value.data) {
        const budgetData = budgetRes.value.data as Setting[];
        budgetData.forEach((setting: Setting) => {
          if (setting.value) {
            if (setting.key === 'monthly_budget') {
              newSettings.budget.monthly_budget = parseFloat(setting.value) || 50;
            } else if (setting.key === 'budget_enforce') {
              newSettings.budget.budget_enforce = setting.value === 'true';
            } else if (setting.key === 'budget_notify') {
              newSettings.budget.budget_notify = setting.value === 'true';
            }
          }
        });
      }

      // Process model preferences
      if (modelRes.status === 'fulfilled' && modelRes.value.data) {
        const modelData = modelRes.value.data as Setting[];
        modelData.forEach((setting: Setting) => {
          if (setting.value) {
            if (setting.key === 'default_llm') {
              newSettings.models.default_llm = setting.value;
            } else if (setting.key === 'default_image_model') {
              newSettings.models.default_image_model = setting.value;
            } else if (setting.key === 'default_voice_model') {
              newSettings.models.default_voice_model = setting.value;
            } else if (setting.key === 'economy_mode') {
              newSettings.models.economy_mode = setting.value === 'true';
            } else if (setting.key === 'creativity_temperature') {
              newSettings.models.creativity_temperature = parseFloat(setting.value) || 0.7;
            }
          }
        });
      }

      // Process account settings
      if (accountRes.status === 'fulfilled' && accountRes.value.data) {
        const accountData = accountRes.value.data as Setting[];
        accountData.forEach((setting: Setting) => {
          if (setting.value) {
            if (setting.key === 'display_name') {
              newSettings.account.display_name = setting.value;
            }
          }
        });
      }

      // Process RunPod settings
      if (runpodRes.status === 'fulfilled' && runpodRes.value.data) {
        const runpodData = runpodRes.value.data as Setting[];
        runpodData.forEach((setting: Setting) => {
          if (setting.value) {
            if (setting.key === 'enable_runpod') {
              newSettings.runpod.enable_runpod = setting.value === 'true';
            } else if (setting.key === 'runpod_api_key') {
              newSettings.runpod.runpod_api_key = setting.value;
            } else if (setting.key === 'pod_id') {
              newSettings.runpod.pod_id = setting.value;
            } else if (setting.key === 'ollama_enabled') {
              newSettings.runpod.ollama_enabled = setting.value === 'true';
            } else if (setting.key === 'comfyui_enabled') {
              newSettings.runpod.comfyui_enabled = setting.value === 'true';
            } else if (setting.key === 'auto_start_services') {
              newSettings.runpod.auto_start_services = setting.value === 'true';
            } else if (setting.key === 'preferred_provider') {
              newSettings.runpod.preferred_provider = setting.value as 'local' | 'api' | 'auto';
            }
          }
        });
      }

      setSettings(newSettings);
    } catch (err) {
      console.error('Error loading settings:', err);
      setError('Failed to load settings');
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshSettings = useCallback(async () => {
    await loadSettings();
  }, [loadSettings]);

  const updateApiKey = useCallback(async (key: keyof ApiKeys, value: string): Promise<boolean> => {
    try {
      const result = await upsertSetting(key, {
        value: value || null,
        category: 'api_keys',
        is_encrypted: true,
      });

      if (result.error) {
        console.error('Error updating API key:', result.error);
        return false;
      }

      // Update local state
      setSettings((prev) =>
        prev
          ? {
              ...prev,
              apiKeys: {
                ...prev.apiKeys,
                [key]: value,
              },
            }
          : null,
      );

      return true;
    } catch (err) {
      console.error('Error updating API key:', err);
      return false;
    }
  }, []);

  const updateBudgetSetting = useCallback(
    async (key: keyof BudgetSettings, value: boolean | number): Promise<boolean> => {
      try {
        const result = await upsertSetting(key, {
          value: value.toString(),
          category: 'budget',
        });

        if (result.error) {
          console.error('Error updating budget setting:', result.error);
          return false;
        }

        // Update local state
        setSettings((prev) =>
          prev
            ? {
                ...prev,
                budget: {
                  ...prev.budget,
                  [key]: value,
                },
              }
            : null,
        );

        return true;
      } catch (err) {
        console.error('Error updating budget setting:', err);
        return false;
      }
    },
    [],
  );

  const updateModelPreference = useCallback(
    async (key: keyof ModelPreferences, value: string | boolean | number): Promise<boolean> => {
      try {
        const result = await upsertSetting(key, {
          value: value.toString(),
          category: 'models',
        });

        if (result.error) {
          console.error('Error updating model preference:', result.error);
          return false;
        }

        // Update local state
        setSettings((prev) =>
          prev
            ? {
                ...prev,
                models: {
                  ...prev.models,
                  [key]: value,
                },
              }
            : null,
        );

        return true;
      } catch (err) {
        console.error('Error updating model preference:', err);
        return false;
      }
    },
    [],
  );

  const updateAccountSetting = useCallback(
    async (key: keyof AccountSettings, value: string): Promise<boolean> => {
      try {
        const result = await upsertSetting(key, {
          value: value || null,
          category: 'account',
        });

        if (result.error) {
          console.error('Error updating account setting:', result.error);
          return false;
        }

        // Update local state
        setSettings((prev) =>
          prev
            ? {
                ...prev,
                account: {
                  ...prev.account,
                  [key]: value,
                },
              }
            : null,
        );

        return true;
      } catch (err) {
        console.error('Error updating account setting:', err);
        return false;
      }
    },
    [],
  );

  const updateRunPodSetting = useCallback(
    async (key: keyof RunPodSettings, value: string | boolean): Promise<boolean> => {
      try {
        const result = await upsertSetting(key, {
          value: value.toString(),
          category: 'runpod',
          is_encrypted: key === 'runpod_api_key',
        });

        if (result.error) {
          console.error('Error updating RunPod setting:', result.error);
          return false;
        }

        // Update local state
        setSettings((prev) =>
          prev
            ? {
                ...prev,
                runpod: {
                  ...prev.runpod,
                  [key]: value,
                },
              }
            : null,
        );

        return true;
      } catch (err) {
        console.error('Error updating RunPod setting:', err);
        return false;
      }
    },
    [],
  );

  const updateSetting = useCallback(
    async (key: string, value: string, category: string = 'general'): Promise<boolean> => {
      try {
        const result = await upsertSetting(key, {
          value: value || null,
          category,
          is_encrypted: key.includes('api_key') || key.includes('secret'),
        });

        if (result.error) {
          console.error('Error updating setting:', result.error);
          return false;
        }

        // Refresh settings to get updated values
        await refreshSettings();
        return true;
      } catch (err) {
        console.error('Error updating setting:', err);
        return false;
      }
    },
    [refreshSettings],
  );

  const getSetting = useCallback(
    (key: string): string | null => {
      if (!settings) return null;

      // Check all categories for the key
      if (key in settings.apiKeys) return settings.apiKeys[key as keyof ApiKeys];
      if (key in settings.budget)
        return settings.budget[key as keyof BudgetSettings]?.toString() || null;
      if (key in settings.models)
        return settings.models[key as keyof ModelPreferences]?.toString() || null;
      if (key in settings.account) return settings.account[key as keyof AccountSettings];
      if (key in settings.runpod)
        return settings.runpod[key as keyof RunPodSettings]?.toString() || null;

      return null;
    },
    [settings],
  );

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    loading,
    error,
    refreshSettings,
    updateApiKey,
    updateBudgetSetting,
    updateModelPreference,
    updateAccountSetting,
    updateRunPodSetting,
    updateSetting,
    getSetting,
  };
};
