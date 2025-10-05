import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';

interface UsageBarProps {
  currentUsage: number;
  budgetLimit: number;
  title?: string;
  showPercentage?: boolean;
  showAlert?: boolean;
  className?: string;
}

const UsageBar: React.FC<UsageBarProps> = ({
  currentUsage,
  budgetLimit,
  title = 'Budget Usage',
  showPercentage = true,
  showAlert = true,
  className = '',
}) => {
  const percentage = budgetLimit > 0 ? (currentUsage / budgetLimit) * 100 : 0;
  const isOverBudget = currentUsage > budgetLimit;
  const isNearLimit = percentage >= 90 && !isOverBudget;

  const getProgressColor = () => {
    if (isOverBudget) return 'bg-red-500';
    if (isNearLimit) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getAlertVariant = () => {
    if (isOverBudget) return 'destructive';
    if (isNearLimit) return 'default';
    return 'default';
  };

  const getAlertIcon = () => {
    if (isOverBudget) return <AlertTriangle className="h-4 w-4" />;
    if (isNearLimit) return <TrendingUp className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-white font-medium">{title}</h4>
        {showPercentage && (
          <span
            className={`text-sm font-medium ${
              isOverBudget ? 'text-red-400' : isNearLimit ? 'text-yellow-400' : 'text-green-400'
            }`}
          >
            {percentage.toFixed(1)}%
          </span>
        )}
      </div>

      <div className="space-y-2">
        <Progress
          value={Math.min(percentage, 100)}
          className="h-3 bg-gray-700"
          // Custom progress bar styling
          style={
            {
              '--progress-background': getProgressColor(),
            } as React.CSSProperties
          }
        />

        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Used: {formatCurrency(currentUsage)}</span>
          <span className="text-gray-400">Budget: {formatCurrency(budgetLimit)}</span>
        </div>
      </div>

      {showAlert && (isOverBudget || isNearLimit) && (
        <Alert
          className={`${
            isOverBudget
              ? 'bg-red-900/20 border-red-500/50'
              : 'bg-yellow-900/20 border-yellow-500/50'
          }`}
        >
          {getAlertIcon()}
          <AlertDescription className={isOverBudget ? 'text-red-200' : 'text-yellow-200'}>
            {isOverBudget
              ? `Budget exceeded by ${formatCurrency(
                  currentUsage - budgetLimit,
                )}. Consider upgrading your plan or reducing usage.`
              : `Approaching budget limit (${percentage.toFixed(1)}%). ${formatCurrency(
                  budgetLimit - currentUsage,
                )} remaining.`}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default UsageBar;
