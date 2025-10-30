import React from 'react';
import { MainNavigation } from '@/components/MainNavigation';
import { CosmicBackground } from '@/components/CosmicBackground';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showWelcome?: boolean;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
  subtitle,
  showWelcome = true,
}) => {
  return (
    <div className="relative min-h-screen bg-cosmic-dark text-white flex">
      <MainNavigation />
      <CosmicBackground />

      <div className="flex-1 relative z-10 p-8">
        {showWelcome && (title || subtitle) && (
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-cosmic-highlight mb-2">
              {title || 'Dashboard'}
            </h1>
            {subtitle && <p className="text-xl text-cosmic-accent">{subtitle}</p>}
          </div>
        )}

        {children}
      </div>
    </div>
  );
};













