import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PublicLayout } from '@/components/PublicLayout';
import { Footer } from '@/components/Footer';
import { useUser } from '@/context/UserContext';
import HomepageLoginForm from '@/components/HomepageLoginForm';
import {
  Check,
  Star,
  ArrowRight,
  Users,
  Bot,
  Zap,
  Shield,
  Globe,
  BarChart3,
  Clock,
  Award,
  ChevronDown,
  Play,
} from 'lucide-react';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user, role } = useUser();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  // Main dashboard routing for all users
  const getHQRoute = () => '/mission-control';

  const handleLoginSuccess = () => {
    navigate(getHQRoute());
  };

  // Features data
  const features = [
    {
      icon: Bot,
      title: 'AI Agent Platform',
      description:
        'Deploy intelligent agents that automate complex workflows and decision-making processes.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Users,
      title: 'Client Management',
      description:
        'Comprehensive CRM with AI-powered insights and automated client communications.',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: BarChart3,
      title: 'Business Analytics',
      description:
        'Real-time dashboards and predictive analytics to drive data-informed decisions.',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Bank-grade security with end-to-end encryption and compliance certifications.',
      color: 'from-orange-500 to-red-500',
    },
    {
      icon: Globe,
      title: 'Global Operations',
      description: 'Multi-tenant architecture supporting international teams and diverse markets.',
      color: 'from-indigo-500 to-purple-600',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Optimized performance with sub-second response times and 99.9% uptime SLA.',
      color: 'from-yellow-500 to-orange-500',
    },
  ];

  // Testimonials data
  const testimonials = [
    {
      quote:
        'LytbuB has transformed how we operate. Our efficiency increased by 300% in just 3 months.',
      author: 'Sarah Chen',
      role: 'CEO',
      company: 'TechFlow Solutions',
      avatar: 'SC',
    },
    {
      quote:
        'The AI agents are incredible. They handle customer inquiries 24/7 with human-like understanding.',
      author: 'Marcus Rodriguez',
      role: 'Operations Director',
      company: 'Global Services Inc',
      avatar: 'MR',
    },
    {
      quote:
        "Best investment we've made. The ROI was evident within the first week of implementation.",
      author: 'Dr. Emily Watson',
      role: 'CTO',
      company: 'Innovation Labs',
      avatar: 'EW',
    },
  ];

  // Pricing preview data
  const pricingPreview = [
    {
      name: 'Starter',
      price: '$99',
      period: 'month',
      description: 'Perfect for small teams getting started',
      features: ['Up to 10 AI Agents', '5GB Storage', 'Email Support', 'Basic Analytics'],
      popular: false,
    },
    {
      name: 'Professional',
      price: '$299',
      period: 'month',
      description: 'Ideal for growing businesses',
      features: [
        'Unlimited AI Agents',
        '100GB Storage',
        'Priority Support',
        'Advanced Analytics',
        'Custom Integrations',
      ],
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'pricing',
      description: 'For large organizations with complex needs',
      features: [
        'Everything in Pro',
        'Unlimited Storage',
        'Dedicated Support',
        'Custom Development',
        'SLA Guarantee',
      ],
      popular: false,
    },
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 24,
      },
    },
  };

  const fadeInVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.8 },
    },
  };

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <PublicLayout>
      <motion.div initial="hidden" animate="visible" variants={containerVariants}>
        {/* Navigation */}
        <nav className="fixed top-0 w-full z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-cosmic-accent to-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">L</span>
                </div>
                <span className="text-white font-bold text-xl">LytbuB</span>
              </div>

              <div className="hidden md:flex items-center space-x-8">
                <a
                  href="#features"
                  className="text-cosmic-accent hover:text-white transition-colors"
                >
                  Features
                </a>
                <a
                  href="#pricing"
                  className="text-cosmic-accent hover:text-white transition-colors"
                >
                  Pricing
                </a>
                <a href="#about" className="text-cosmic-accent hover:text-white transition-colors">
                  About
                </a>
                <Button
                  variant="outline"
                  className="border-cosmic-accent text-cosmic-accent hover:bg-cosmic-accent hover:text-white"
                  onClick={() => navigate('/login')}
                >
                  Sign In
                </Button>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <motion.div variants={itemVariants} className="mb-8">
              <Badge className="bg-cosmic-accent/20 text-cosmic-accent border-cosmic-accent/30 mb-6">
                🚀 Now in Beta - Join the Revolution
              </Badge>

              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight">
                The Future of
                <span className="block bg-gradient-to-r from-cosmic-accent via-blue-400 to-purple-500 bg-clip-text text-transparent">
                  Business Intelligence
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-cosmic-accent max-w-4xl mx-auto leading-relaxed mb-8">
                Transform your entire business operation with LytbuB - the comprehensive platform
                that combines AI automation, enterprise tools, and intelligent insights into one
                seamless experience.
              </p>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            >
              {!user ? (
                <div className="flex flex-col lg:flex-row gap-4 items-center">
                  <HomepageLoginForm onLoginSuccess={handleLoginSuccess} />
                  <div className="text-center lg:text-left">
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-cosmic-accent to-blue-600 hover:from-cosmic-accent/80 hover:to-blue-500 text-white px-8 py-4 text-lg font-semibold shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 border-0"
                      onClick={() => navigate('/about')}
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Watch Demo
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-cosmic-accent to-blue-600 hover:from-cosmic-accent/80 hover:to-blue-500 text-white px-12 py-6 text-xl font-semibold shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 border-0"
                    onClick={() => navigate(getHQRoute())}
                  >
                    <span className="flex items-center gap-3">
                      <span>🚀</span>
                      <span>Enter LytbuB HQ</span>
                      <span>→</span>
                    </span>
                  </Button>
                  <p className="text-cosmic-accent text-sm mt-2">
                    Welcome back! Access your {role} dashboard
                  </p>
                </div>
              )}
            </motion.div>

            <motion.div
              variants={fadeInVariants}
              className="flex items-center justify-center space-x-8 text-sm text-cosmic-accent"
            >
              <div className="flex items-center">
                <Check className="w-4 h-4 mr-2 text-green-400" />
                Free 14-day trial
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 mr-2 text-green-400" />
                No credit card required
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 mr-2 text-green-400" />
                Cancel anytime
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-black/20">
          <div className="max-w-7xl mx-auto">
            <motion.div variants={itemVariants} className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Everything You Need to Succeed
              </h2>
              <p className="text-xl text-cosmic-accent max-w-3xl mx-auto">
                LytbuB provides a complete suite of tools designed to transform how you run your
                business.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  variants={itemVariants}
                  className="group relative bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-2xl"
                >
                  <div
                    className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6`}
                  >
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>

                  <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
                  <p className="text-cosmic-accent leading-relaxed">{feature.description}</p>

                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cosmic-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div variants={itemVariants} className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Trusted by Industry Leaders
              </h2>
              <p className="text-xl text-cosmic-accent max-w-3xl mx-auto">
                See how businesses are transforming their operations with LytbuB.
              </p>
            </motion.div>

            <div className="relative">
              <motion.div
                key={currentTestimonial}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5 }}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-white/10"
              >
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-1">
                    <div className="flex items-center mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <blockquote className="text-xl md:text-2xl text-white mb-6 italic">
                      "{testimonials[currentTestimonial].quote}"
                    </blockquote>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-cosmic-accent to-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                        {testimonials[currentTestimonial].avatar}
                      </div>
                      <div>
                        <div className="text-white font-semibold">
                          {testimonials[currentTestimonial].author}
                        </div>
                        <div className="text-cosmic-accent text-sm">
                          {testimonials[currentTestimonial].role},{' '}
                          {testimonials[currentTestimonial].company}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              <div className="flex justify-center mt-8 space-x-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === currentTestimonial ? 'bg-cosmic-accent' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Preview Section */}
        <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-black/20">
          <div className="max-w-7xl mx-auto">
            <motion.div variants={itemVariants} className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Simple, Transparent Pricing
              </h2>
              <p className="text-xl text-cosmic-accent max-w-3xl mx-auto mb-8">
                Choose the plan that's right for your business. Upgrade or downgrade at any time.
              </p>

              <Button
                onClick={() => navigate('/pricing')}
                className="bg-gradient-to-r from-cosmic-accent to-blue-600 hover:from-cosmic-accent/80 hover:to-blue-500 text-white px-8 py-4 text-lg font-semibold shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 border-0"
              >
                View All Plans
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {pricingPreview.map((plan, index) => (
                <motion.div
                  key={plan.name}
                  variants={itemVariants}
                  className={`relative bg-white/5 backdrop-blur-sm rounded-xl p-8 border transition-all duration-300 hover:transform hover:scale-105 ${
                    plan.popular
                      ? 'border-cosmic-accent bg-white/10'
                      : 'border-white/10 hover:bg-white/10'
                  }`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-cosmic-accent text-white">
                      Most Popular
                    </Badge>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                    <p className="text-cosmic-accent text-sm mb-4">{plan.description}</p>

                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold text-white">{plan.price}</span>
                      {plan.period !== 'pricing' && (
                        <span className="text-cosmic-accent ml-1">/{plan.period}</span>
                      )}
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-cosmic-accent">
                        <Check className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full ${
                      plan.popular
                        ? 'bg-cosmic-accent hover:bg-cosmic-accent/80 text-white'
                        : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                    }`}
                    onClick={() => navigate('/pricing')}
                  >
                    {plan.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeInVariants}
            className="max-w-4xl mx-auto text-center bg-gradient-to-r from-cosmic-accent/10 to-blue-500/10 rounded-2xl p-12 border border-white/10"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Business?
            </h2>
            <p className="text-xl text-cosmic-accent mb-8 max-w-2xl mx-auto">
              Join thousands of businesses already using LytbuB to streamline operations, boost
              productivity, and drive growth.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!user ? (
                <>
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-cosmic-accent to-blue-600 hover:from-cosmic-accent/80 hover:to-blue-500 text-white px-8 py-4 text-lg font-semibold shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 border-0"
                    onClick={() => navigate('/auth')}
                  >
                    Start Free Trial
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-cosmic-highlight text-cosmic-highlight hover:bg-cosmic-highlight hover:text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    onClick={() => navigate('/about')}
                  >
                    Learn More
                  </Button>
                </>
              ) : (
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-cosmic-accent to-blue-600 hover:from-cosmic-accent/80 hover:to-blue-500 text-white px-12 py-6 text-xl font-semibold shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 border-0"
                  onClick={() => navigate(getHQRoute())}
                >
                  <span className="flex items-center gap-3">
                    <span>🚀</span>
                    <span>Access LytbuB HQ</span>
                    <span>→</span>
                  </span>
                </Button>
              )}
            </div>
          </motion.div>
        </section>

        <Footer />
      </motion.div>
    </PublicLayout>
  );
};

export default Home;
