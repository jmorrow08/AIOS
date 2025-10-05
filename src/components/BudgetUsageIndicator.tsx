import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, Settings, RefreshCw } from 'lucide-react';
import { getBudgetConfig } from '@/api/apiUsage';

interface BudgetConfig {
  monthly_budget_usd: number;
  current_spend_usd: number;
  alerts_enabled: boolean;
  alert_thresholds: { warning: number; critical: number };
}

interface BudgetUsageIndicatorProps {
  className?: string;
}

const BudgetUsageIndicator: React.FC<BudgetUsageIndicatorProps> = ({ className = '' }) => {
  const [budgetConfig, setBudgetConfig] = useState<BudgetConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBudgetData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getBudgetConfig();
      if (result.error) {
        setError(result.error);
      } else {
        setBudgetConfig(result.data);
      }
    } catch (err) {
      setError('Failed to load budget data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudgetData();
  }, []);

  if (loading) {
    return (
      <div className={`bg-cosmic-light bg-opacity-10 backdrop-blur-sm rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <RefreshCw className="w-5 h-5 text-cosmic-accent mr-3 animate-spin" />
          <div>
            <h4 className="text-sm font-medium text-white">Loading Budget Data...</h4>
          </div>
        </div>
      </div>
    );
  }

  if (error || !budgetConfig) {
    return (
      <div className={`bg-cosmic-light bg-opacity-10 backdrop-blur-sm rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-400 mr-3" />
            <div>
              <h4 className="text-sm font-medium text-white">Budget Data Unavailable</h4>
              <p className="text-xs text-cosmic-accent opacity-75">
                {error || 'Unable to load budget information'}
              </p>
            </div>
          </div>
          <button
            onClick={loadBudgetData}
            className="text-cosmic-accent hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const { monthly_budget_usd, current_spend_usd, alerts_enabled, alert_thresholds } = budgetConfig;
  const percentageUsed =
    monthly_budget_usd > 0 ? (current_spend_usd / monthly_budget_usd) * 100 : 0;
  const isOverBudget = percentageUsed >= 100;

  // Don't render if no budget is set
  if (monthly_budget_usd === 0) {
    return (
      <div className={`bg-cosmic-light bg-opacity-10 backdrop-blur-sm rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Settings className="w-5 h-5 text-cosmic-accent mr-3" />
            <div>
              <h4 className="text-sm font-medium text-white">API Budget</h4>
              <p className="text-xs text-cosmic-accent opacity-75">
                Set up your API budget in Settings
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getProgressColor = () => {
    if (isOverBudget) return 'bg-red-500';
    if (alerts_enabled && percentageUsed >= alert_thresholds.critical) return 'bg-red-500';
    if (alerts_enabled && percentageUsed >= alert_thresholds.warning) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (isOverBudget) return 'Over Budget';
    if (alerts_enabled && percentageUsed >= alert_thresholds.critical) return 'Critical';
    if (alerts_enabled && percentageUsed >= alert_thresholds.warning) return 'Warning';
    return 'Good';
  };

  const getStatusColor = () => {
    if (isOverBudget) return 'text-red-400';
    if (alerts_enabled && percentageUsed >= alert_thresholds.critical) return 'text-red-400';
    if (alerts_enabled && percentageUsed >= alert_thresholds.warning) return 'text-yellow-400';
    return 'text-green-400';
  };

  const shouldShowAlert = () => {
    if (!alerts_enabled) return false;
    return isOverBudget || percentageUsed >= alert_thresholds.warning;
  };

  return (
    <div className={`bg-cosmic-light bg-opacity-10 backdrop-blur-sm rounded-lg p-4 ${className}`}>
      {shouldShowAlert() && (
        <div
          className={`mb-4 p-3 bg-opacity-20 border border-opacity-30 rounded-lg ${
            isOverBudget ? 'bg-red-500 border-red-500' : 'bg-yellow-500 border-yellow-500'
          }`}
        >
          <div className="flex items-center">
            <AlertTriangle
              className={`w-5 h-5 mr-2 ${isOverBudget ? 'text-red-400' : 'text-yellow-400'}`}
            />
            <div>
              <h4
                className={`text-sm font-medium ${
                  isOverBudget ? 'text-red-400' : 'text-yellow-400'
                }`}
              >
                {isOverBudget ? 'Budget Exceeded' : 'Budget Warning'}
              </h4>
              <p className={`text-xs ${isOverBudget ? 'text-red-300' : 'text-yellow-300'}`}>
                {isOverBudget
                  ? 'API usage has exceeded your set budget.'
                  : `API usage is at ${percentageUsed.toFixed(1)}% of budget.`}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <TrendingUp className="w-5 h-5 text-cosmic-highlight mr-3" />
          <div>
            <h4 className="text-sm font-medium text-white">API Budget Usage</h4>
            <p className="text-xs text-cosmic-accent opacity-75">
              ${current_spend_usd.toFixed(2)} of ${monthly_budget_usd.toFixed(2)}
            </p>
          </div>
        </div>

        <div className={`text-right ${getStatusColor()}`}>
          <div className="text-sm font-medium">{percentageUsed.toFixed(1)}%</div>
          <div className="text-xs opacity-75">{getStatusText()}</div>
        </div>
      </div>

      <div className="w-full bg-cosmic-accent bg-opacity-20 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
          style={{
            width: `${Math.min(percentageUsed, 100)}%`,
          }}
        />
      </div>

      <div className="flex justify-between mt-2 text-xs text-cosmic-accent opacity-75">
        <span>$0</span>
        <span>${monthly_budget_usd.toFixed(2)}</span>
      </div>

      {alerts_enabled && (
        <div className="mt-3 flex justify-between text-xs text-cosmic-accent opacity-75">
          <span>Warning: {alert_thresholds.warning}%</span>
          <span>Critical: {alert_thresholds.critical}%</span>
        </div>
      )}
    </div>
  );
};

export default BudgetUsageIndicator;
