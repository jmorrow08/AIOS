import React from 'react';
import { ComingSoon } from '@/components/ComingSoon';

const Contact: React.FC = () => {
  return (
    <ComingSoon
      title="Contact Us"
      description="Get in touch with our team. We're here to help you succeed with LytbuB."
      features={[
        '24/7 customer support',
        'Technical assistance',
        'Partnership inquiries',
        'Feedback and suggestions',
      ]}
    />
  );
};

export default Contact;













