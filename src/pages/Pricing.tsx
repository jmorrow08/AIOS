import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CosmicBackground } from '@/components/CosmicBackground';
import { useNavigate } from 'react-router-dom';
import { Check, Star } from 'lucide-react';

const Pricing: React.FC = () => {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 20,
      },
    },
  };

  const plans = [
    {
      name: 'Free',
      price: { monthly: 0, yearly: 0 },
      description: 'Perfect for getting started with LytbuB',
      features: [
        'Up to 5 AI Agents',
        'Basic automation workflows',
        'Knowledge library (100 documents)',
        'Email support',
        'Community access',
      ],
      limitations: ['Limited API calls', 'No custom integrations', 'Basic analytics'],
      popular: false,
      buttonText: 'Get Started',
      buttonVariant: 'outline' as const,
    },
    {
      name: 'Professional',
      price: { monthly: 99, yearly: 990 },
      description: 'Ideal for growing businesses and teams',
      features: [
        'Up to 25 AI Agents',
        'Advanced automation workflows',
        'Knowledge library (1,000 documents)',
        'Priority email support',
        'Custom integrations',
        'Advanced analytics',
        'Team collaboration',
        'API access',
      ],
      limitations: [],
      popular: true,
      buttonText: 'Start Free Trial',
      buttonVariant: 'default' as const,
    },
    {
      name: 'Enterprise',
      price: { monthly: 299, yearly: 2990 },
      description: 'Full-featured solution for large organizations',
      features: [
        'Unlimited AI Agents',
        'Enterprise-grade automation',
        'Unlimited knowledge library',
        '24/7 phone & email support',
        'Custom integrations',
        'Advanced analytics & reporting',
        'Dedicated account manager',
        'SLA guarantees',
        'On-premise deployment option',
        'White-label solution',
      ],
      limitations: [],
      popular: false,
      buttonText: 'Contact Sales',
      buttonVariant: 'outline' as const,
    },
  ];

  const formatPrice = (price: number) => {
    if (price === 0) return 'Free';
    return `$${price}`;
  };

  const getYearlySavings = (monthly: number, yearly: number) => {
    if (monthly === 0) return 0;
    const monthlyTotal = monthly * 12;
    return Math.round(((monthlyTotal - yearly) / monthlyTotal) * 100);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Cosmic Background */}
      <CosmicBackground />

      <motion.div
        className="relative z-10 min-h-screen"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Hero Section */}
        <section className="pt-20 pb-16 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <motion.div variants={itemVariants} className="mb-8">
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                Simple,
                <span className="block text-3xl md:text-5xl text-cosmic-highlight font-light mt-2">
                  Transparent Pricing
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-cosmic-accent max-w-3xl mx-auto leading-relaxed">
                Choose the perfect plan for your business needs. Start free and scale as you grow.
              </p>
            </motion.div>

            {/* Billing Toggle */}
            <motion.div variants={itemVariants} className="mb-12">
              <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-lg p-1 border border-white/20">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-6 py-3 rounded-md text-sm font-medium transition-all duration-300 ${
                    billingCycle === 'monthly'
                      ? 'bg-cosmic-accent text-white shadow-lg'
                      : 'text-cosmic-accent hover:text-white'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-6 py-3 rounded-md text-sm font-medium transition-all duration-300 relative ${
                    billingCycle === 'yearly'
                      ? 'bg-cosmic-accent text-white shadow-lg'
                      : 'text-cosmic-accent hover:text-white'
                  }`}
                >
                  Yearly
                  <Badge className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1">
                    Save up to 17%
                  </Badge>
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="pb-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map((plan, index) => (
                <motion.div
                  key={plan.name}
                  variants={itemVariants}
                  whileHover={{ y: -10 }}
                  className="relative"
                >
                  <Card
                    className={`relative bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all duration-300 ${
                      plan.popular ? 'ring-2 ring-cosmic-accent shadow-2xl' : ''
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-cosmic-accent text-white px-4 py-2 flex items-center gap-2">
                          <Star className="w-4 h-4" />
                          Most Popular
                        </Badge>
                      </div>
                    )}

                    <div className="p-8">
                      <div className="text-center mb-8">
                        <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                        <p className="text-cosmic-accent mb-6">{plan.description}</p>

                        <div className="mb-6">
                          <div className="flex items-baseline justify-center">
                            <span className="text-5xl font-bold text-white">
                              {formatPrice(plan.price[billingCycle])}
                            </span>
                            {plan.price[billingCycle] > 0 && (
                              <span className="text-cosmic-accent ml-2">
                                /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                              </span>
                            )}
                          </div>
                          {billingCycle === 'yearly' && plan.price.monthly > 0 && (
                            <p className="text-green-400 text-sm mt-2">
                              Save {getYearlySavings(plan.price.monthly, plan.price.yearly)}%
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4 mb-8">
                        {plan.features.map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-center gap-3">
                            <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                            <span className="text-white">{feature}</span>
                          </div>
                        ))}
                      </div>

                      <Button
                        className={`w-full py-6 text-lg font-semibold transition-all duration-300 transform hover:scale-105 ${
                          plan.buttonVariant === 'default'
                            ? 'bg-cosmic-accent hover:bg-cosmic-accent/80 text-white'
                            : 'border-2 border-cosmic-highlight text-cosmic-highlight hover:bg-cosmic-highlight hover:text-cosmic-dark'
                        }`}
                        variant={plan.buttonVariant}
                        onClick={() => {
                          if (plan.name === 'Enterprise') {
                            // For enterprise, navigate to contact or about
                            navigate('/about');
                          } else {
                            navigate('/auth');
                          }
                        }}
                      >
                        {plan.buttonText}
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div variants={itemVariants} className="mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Frequently Asked Questions
              </h2>
              <p className="text-xl text-cosmic-accent">Everything you need to know about LytbuB</p>
            </motion.div>

            <motion.div variants={itemVariants} className="text-left">
              <div className="space-y-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <h3 className="text-xl font-bold text-white mb-4">Can I change plans anytime?</h3>
                  <p className="text-cosmic-accent">
                    Yes! You can upgrade or downgrade your plan at any time. Changes take effect
                    immediately, and we'll prorate any charges.
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <h3 className="text-xl font-bold text-white mb-4">Is there a free trial?</h3>
                  <p className="text-cosmic-accent">
                    Absolutely! All paid plans come with a 14-day free trial. No credit card
                    required to start.
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <h3 className="text-xl font-bold text-white mb-4">
                    What kind of support do you offer?
                  </h3>
                  <p className="text-cosmic-accent">
                    Free tier includes community support. Professional plans get priority email
                    support. Enterprise plans include 24/7 phone support and a dedicated account
                    manager.
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <h3 className="text-xl font-bold text-white mb-4">Can I cancel anytime?</h3>
                  <p className="text-cosmic-accent">
                    Yes, you can cancel your subscription at any time. No cancellation fees or
                    long-term contracts.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </motion.div>
    </div>
  );
};

export default Pricing;
