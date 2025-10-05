import React from 'react';

// Placeholder cosmic background component
export const CosmicBackground: React.FC = () => {
  return (
    <div
      className="absolute inset-0 bg-gradient-to-b from-cosmic-dark via-cosmic-light to-cosmic-dark opacity-80 pointer-events-none"
      aria-hidden="true"
    />
  );
};
