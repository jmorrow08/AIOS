import React from 'react';
import { ComingSoon } from '@/components/ComingSoon';

const Support: React.FC = () => {
  return (
    <ComingSoon
      title="Support Center"
      description="Get help with LytbuB. Our support team is ready to assist you with any questions or issues."
      features={[
        'Help center articles',
        'Video tutorials',
        'Community forums',
        'Live chat support',
        'Ticket system',
      ]}
    />
  );
};

export default Support;













