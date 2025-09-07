import React from 'react';
import { LucideIcon } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtitle?: string;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  className?: string;
  onClick?: () => void;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  icon: Icon,
  subtitle,
  trend,
  className = '',
  onClick,
}) => {
  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return `$${(val / 1000000).toFixed(1)}M`;
      } else if (val >= 1000) {
        return `$${(val / 1000).toFixed(1)}K`;
      } else if (title.toLowerCase().includes('revenue') || title.toLowerCase().includes('cost')) {
        return `$${val.toFixed(0)}`;
      }
      return val.toLocaleString();
    }
    return val;
  };

  return (
    <div
      className={`
        bg-cosmic-light bg-opacity-10 backdrop-blur-sm
        rounded-lg p-6 border border-cosmic-accent border-opacity-20
        hover:border-opacity-40 hover:bg-opacity-20
        transition-all duration-200 cursor-pointer
        ${className}
      `}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <Icon className="w-5 h-5 text-cosmic-highlight mr-2" />
            <h3 className="text-sm font-medium text-cosmic-accent uppercase tracking-wide">
              {title}
            </h3>
          </div>

          <div className="text-2xl font-bold text-white mb-1">{formatValue(value)}</div>

          {subtitle && <p className="text-sm text-cosmic-accent opacity-75">{subtitle}</p>}

          {trend && (
            <div
              className={`flex items-center mt-2 text-xs ${
                trend.isPositive ? 'text-green-400' : 'text-red-400'
              }`}
            >
              <span className="mr-1">{trend.isPositive ? '↗' : '↘'}</span>
              <span>
                {trend.value > 0 ? '+' : ''}
                {trend.value}% {trend.label}
              </span>
            </div>
          )}
        </div>

        <div className="ml-4">
          <div className="w-12 h-12 bg-cosmic-highlight bg-opacity-20 rounded-lg flex items-center justify-center">
            <Icon className="w-6 h-6 text-cosmic-highlight" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCard;
