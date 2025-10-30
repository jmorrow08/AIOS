import React from 'react';
import { ComingSoon } from '@/components/ComingSoon';

const Terms: React.FC = () => {
  return (
    <ComingSoon
      title="Terms of Service"
      description="Our terms of service outline the rules and guidelines for using LytbuB."
      features={[
        'Service usage terms',
        'User responsibilities',
        'Liability limitations',
        'Dispute resolution',
      ]}
    />
  );
};

export default Terms;













