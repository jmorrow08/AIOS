import React from 'react';
import { CosmicBackground } from '@/components/CosmicBackground';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <CosmicBackground />
      <div className="relative z-10">{children}</div>
    </div>
  );
};













