import React from 'react';
import { ComingSoon } from '@/components/ComingSoon';

const Privacy: React.FC = () => {
  return (
    <ComingSoon
      title="Privacy Policy"
      description="Learn about how we protect your data and ensure your privacy while using LytbuB."
      features={[
        'Data collection practices',
        'Privacy rights',
        'Security measures',
        'Compliance information',
      ]}
    />
  );
};

export default Privacy;













