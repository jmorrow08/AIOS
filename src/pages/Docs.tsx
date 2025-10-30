import React from 'react';
import { ComingSoon } from '@/components/ComingSoon';

const Docs: React.FC = () => {
  return (
    <ComingSoon
      title="Documentation"
      description="Comprehensive guides, API references, and tutorials to help you make the most of LytbuB."
      estimatedDate="Q1 2025"
      features={[
        'API documentation',
        'Integration guides',
        'Video tutorials',
        'Best practices',
        'Troubleshooting guides',
      ]}
    />
  );
};

export default Docs;













