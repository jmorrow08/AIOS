import React from 'react';
import { cn } from '@/lib/utils';
import { Check, Circle } from 'lucide-react';

export interface Step {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'current' | 'completed';
}

interface StepsProps {
  steps: Step[];
  currentStep?: string;
  className?: string;
}

export const Steps: React.FC<StepsProps> = ({ steps, currentStep, className }) => {
  // If currentStep is provided, update the steps based on it
  const updatedSteps = currentStep
    ? steps.map((step, index) => {
        const currentIndex = steps.findIndex((s) => s.id === currentStep);
        if (index < currentIndex) {
          return { ...step, status: 'completed' as const };
        } else if (index === currentIndex) {
          return { ...step, status: 'current' as const };
        } else {
          return { ...step, status: 'pending' as const };
        }
      })
    : steps;

  return (
    <div className={cn('flex items-center justify-between', className)}>
      {updatedSteps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center flex-1">
            <div
              className={cn(
                'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors',
                {
                  'bg-cosmic-accent border-cosmic-accent text-cosmic-dark':
                    step.status === 'completed',
                  'bg-cosmic-accent/20 border-cosmic-accent text-cosmic-accent':
                    step.status === 'current',
                  'bg-white/5 border-white/20 text-cosmic-accent': step.status === 'pending',
                },
              )}
            >
              {step.status === 'completed' ? (
                <Check className="w-5 h-5" />
              ) : (
                <Circle className="w-3 h-3 fill-current" />
              )}
            </div>
            <div className="mt-2 text-center">
              <p
                className={cn('text-sm font-medium', {
                  'text-cosmic-accent': step.status === 'completed' || step.status === 'current',
                  'text-cosmic-accent/60': step.status === 'pending',
                })}
              >
                {step.title}
              </p>
              {step.description && (
                <p className="text-xs text-cosmic-accent/60 mt-1 max-w-24">{step.description}</p>
              )}
            </div>
          </div>
          {index < updatedSteps.length - 1 && (
            <div
              className={cn('flex-1 h-0.5 mx-4 transition-colors', {
                'bg-cosmic-accent': step.status === 'completed',
                'bg-white/20': step.status !== 'completed',
              })}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

interface StepItemProps {
  step: Step;
  isLast?: boolean;
  className?: string;
}

export const StepItem: React.FC<StepItemProps> = ({ step, isLast = false, className }) => {
  return (
    <div className={cn('flex items-start space-x-4', className)}>
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors',
            {
              'bg-cosmic-accent border-cosmic-accent text-cosmic-dark': step.status === 'completed',
              'bg-cosmic-accent/20 border-cosmic-accent text-cosmic-accent':
                step.status === 'current',
              'bg-white/5 border-white/20 text-cosmic-accent': step.status === 'pending',
            },
          )}
        >
          {step.status === 'completed' ? (
            <Check className="w-4 h-4" />
          ) : (
            <Circle className="w-2 h-2 fill-current" />
          )}
        </div>
        {!isLast && (
          <div
            className={cn('w-0.5 h-12 mt-2 transition-colors', {
              'bg-cosmic-accent': step.status === 'completed',
              'bg-white/20': step.status !== 'completed',
            })}
          />
        )}
      </div>
      <div className="flex-1 pb-8">
        <h3
          className={cn('text-sm font-medium', {
            'text-cosmic-accent': step.status === 'completed' || step.status === 'current',
            'text-cosmic-accent/60': step.status === 'pending',
          })}
        >
          {step.title}
        </h3>
        {step.description && (
          <p className="text-sm text-cosmic-accent/60 mt-1">{step.description}</p>
        )}
      </div>
    </div>
  );
};

interface VerticalStepsProps {
  steps: Step[];
  currentStep?: string;
  className?: string;
}

export const VerticalSteps: React.FC<VerticalStepsProps> = ({ steps, currentStep, className }) => {
  // If currentStep is provided, update the steps based on it
  const updatedSteps = currentStep
    ? steps.map((step, index) => {
        const currentIndex = steps.findIndex((s) => s.id === currentStep);
        if (index < currentIndex) {
          return { ...step, status: 'completed' as const };
        } else if (index === currentIndex) {
          return { ...step, status: 'current' as const };
        } else {
          return { ...step, status: 'pending' as const };
        }
      })
    : steps;

  return (
    <div className={cn('space-y-4', className)}>
      {updatedSteps.map((step, index) => (
        <StepItem key={step.id} step={step} isLast={index === updatedSteps.length - 1} />
      ))}
    </div>
  );
};
