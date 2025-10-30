import React from 'react';
import { ComingSoon } from '@/components/ComingSoon';

const Cookies: React.FC = () => {
  return (
    <ComingSoon
      title="Cookie Policy"
      description="Information about how we use cookies and similar technologies on our platform."
      features={[
        'Cookie usage details',
        'Analytics and tracking',
        'Third-party cookies',
        'Cookie preferences',
      ]}
    />
  );
};

export default Cookies;













