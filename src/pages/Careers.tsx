import React from 'react';
import { ComingSoon } from '@/components/ComingSoon';

const Careers: React.FC = () => {
  return (
    <ComingSoon
      title="Careers"
      description="Join our mission to revolutionize business operations. We're always looking for talented individuals to help shape the future."
      estimatedDate="Q2 2025"
      features={[
        'Engineering roles',
        'Product management',
        'Design positions',
        'Sales and marketing',
        'Customer success',
      ]}
    />
  );
};

export default Careers;













