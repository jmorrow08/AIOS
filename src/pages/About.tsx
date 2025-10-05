import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CosmicBackground } from '@/components/CosmicBackground';
import { useNavigate } from 'react-router-dom';

const About: React.FC = () => {
  const navigate = useNavigate();

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

  const features = [
    {
      title: 'AI-Powered Automation',
      description:
        'Leverage cutting-edge artificial intelligence to automate complex business processes and workflows.',
      icon: '🤖',
    },
    {
      title: 'Unified Platform',
      description: 'All your business tools integrated into a single, cohesive operating system.',
      icon: '⚡',
    },
    {
      title: 'Intelligent Insights',
      description:
        'Get actionable insights from your data with advanced analytics and AI-driven recommendations.',
      icon: '📊',
    },
    {
      title: 'Scalable Architecture',
      description: 'Built to grow with your business, from startup to enterprise-level operations.',
      icon: '📈',
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Cosmic Background */}
      <CosmicBackground />

      <motion.div
        className="relative z-10 min-h-screen flex flex-col"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Hero Section */}
        <section className="flex-1 flex items-center justify-center px-4 py-20">
          <div className="max-w-7xl mx-auto text-center">
            <motion.div variants={itemVariants} className="mb-8">
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                About
                <span className="block text-3xl md:text-5xl text-cosmic-highlight font-light mt-2">
                  Jarvis AI OS
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-cosmic-accent max-w-3xl mx-auto leading-relaxed">
                Revolutionizing business operations through intelligent automation, seamless
                integration, and AI-powered insights.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="mb-16">
              <p className="text-lg text-white/80 max-w-4xl mx-auto leading-relaxed">
                Jarvis AI OS is a comprehensive business operating system that combines artificial
                intelligence with enterprise-grade tools to streamline your operations. From AI
                agents that handle complex workflows to unified platforms that connect all your
                business tools, Jarvis provides everything you need to run your business
                intelligently.
              </p>
            </motion.div>

            {/* CTA Button */}
            <motion.div variants={itemVariants}>
              <Button
                size="lg"
                className="bg-cosmic-accent hover:bg-cosmic-accent/80 text-white px-12 py-6 text-xl font-semibold shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105"
                onClick={() => navigate('/pricing')}
              >
                View Pricing →
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <motion.div className="text-center mb-16" variants={itemVariants}>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Why Choose Jarvis?</h2>
              <p className="text-xl text-cosmic-accent max-w-2xl mx-auto">
                Built for the future of business operations
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  className="group relative bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-2xl"
                  variants={itemVariants}
                  whileHover={{ y: -10 }}
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cosmic-accent to-blue-500 flex items-center justify-center mb-6 shadow-lg mx-auto">
                    <span className="text-3xl">{feature.icon}</span>
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-4 text-center">
                    {feature.title}
                  </h3>
                  <p className="text-cosmic-accent leading-relaxed text-center">
                    {feature.description}
                  </p>

                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cosmic-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div variants={itemVariants}>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">Our Mission</h2>
              <p className="text-xl text-cosmic-accent leading-relaxed mb-12">
                To democratize access to enterprise-grade business tools and AI capabilities,
                enabling businesses of all sizes to operate with unprecedented efficiency and
                intelligence. We believe that every business deserves the power of AI, without the
                complexity.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-cosmic-accent hover:bg-cosmic-accent/80 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  onClick={() => navigate('/landing')}
                >
                  Explore Features
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-cosmic-highlight text-cosmic-highlight hover:bg-cosmic-highlight hover:text-cosmic-dark px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  onClick={() => navigate('/lab?demo=oria&mode=meeting')}
                >
                  Book a Demo
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </motion.div>
    </div>
  );
};

export default About;
