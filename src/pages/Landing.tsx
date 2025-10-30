import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainNavigation } from '@/components/MainNavigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CosmicBackground } from '@/components/CosmicBackground';

interface MenuItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  path: string;
}

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(true);

  const menuItems: MenuItem[] = [
    {
      id: 'mission-control',
      title: 'Mission Control',
      description: 'Central command center and dashboard overview',
      icon: '🚀',
      color: 'from-cosmic-accent to-blue-500',
      path: '/mission-control',
    },
    {
      id: 'ai-agents',
      title: 'AI Agents',
      description: 'Intelligent automation agents that handle complex workflows',
      icon: '🤖',
      color: 'from-cyan-400 to-cosmic-accent',
      path: '/lab',
    },
    {
      id: 'marketplace',
      title: 'Agent Marketplace',
      description: 'Browse, install, and customize AI agent templates',
      icon: '🛒',
      color: 'from-purple-400 to-cosmic-accent',
      path: '/marketplace',
    },
    {
      id: 'knowledge',
      title: 'Knowledge Library',
      description: 'AI-powered knowledge library and document processing',
      icon: '📚',
      color: 'from-pink-400 to-red-500',
      path: '/library',
    },
    {
      id: 'media-studio',
      title: 'Media Studio',
      description: 'Professional media production and content creation tools',
      icon: '🎬',
      color: 'from-green-400 to-cosmic-accent',
      path: '/media',
    },
    {
      id: 'automation',
      title: 'Automation Builder',
      description: 'Create and manage workflow automation',
      icon: '⚡',
      color: 'from-indigo-400 to-purple-600',
      path: '/automation',
    },
    {
      id: 'operations',
      title: 'Operations Hub',
      description: 'Streamlined operations and workflow management',
      icon: '🏭',
      color: 'from-yellow-400 to-orange-500',
      path: '/operations',
    },
    {
      id: 'finance',
      title: 'Financial Nexus',
      description: 'Advanced financial tracking and invoice management',
      icon: '💰',
      color: 'from-red-400 to-pink-500',
      path: '/finance',
    },
    {
      id: 'analytics',
      title: 'Analytics Dashboard',
      description: 'Comprehensive business insights and performance metrics',
      icon: '📊',
      color: 'from-teal-400 to-cyan-500',
      path: '/analytics',
    },
    {
      id: 'collaboration',
      title: 'Collaboration',
      description: 'Real-time collaborative workspace and communication',
      icon: '👥',
      color: 'from-orange-400 to-red-500',
      path: '/collaboration',
    },
    {
      id: 'whiteboard',
      title: 'Whiteboard',
      description: 'Interactive visual collaboration and brainstorming',
      icon: '🖼️',
      color: 'from-lime-400 to-green-500',
      path: '/whiteboard',
    },
    {
      id: 'admin-portal',
      title: 'Admin Portal',
      description: 'System administration and user management',
      icon: '⚙️',
      color: 'from-slate-400 to-gray-500',
      path: '/admin',
    },
    {
      id: 'client-portal',
      title: 'Client Portal',
      description: 'Client management and service delivery platform',
      icon: '🏢',
      color: 'from-emerald-400 to-teal-500',
      path: '/portal',
    },
    {
      id: 'marketing',
      title: 'Marketing Hub',
      description: 'Marketing campaigns and customer engagement',
      icon: '📢',
      color: 'from-rose-400 to-pink-500',
      path: '/marketing',
    },
    {
      id: 'chat',
      title: 'AI Chat',
      description: 'Direct AI conversation and assistance',
      icon: '💬',
      color: 'from-violet-400 to-purple-500',
      path: '/ai',
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'System configuration and preferences',
      icon: '🔧',
      color: 'from-stone-400 to-slate-500',
      path: '/settings',
    },
  ];

  const getPosition = (index: number, total: number) => {
    const angle = (360 / total) * index - 90; // Start from top
    const radius = 250; // Distance from center - increased for more items
    const radian = (angle * Math.PI) / 180;

    return {
      x: Math.cos(radian) * radius,
      y: Math.sin(radian) * radius,
    };
  };

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
    hidden: {
      opacity: 0,
      scale: 0.5,
      y: 50,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 20,
      },
    },
  };

  const radialItemVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: (index: number) => ({
      opacity: 1,
      scale: 1,
      transition: {
        delay: index * 0.2,
        type: 'spring' as const,
        stiffness: 200,
        damping: 15,
      },
    }),
    floating: {
      y: [-10, 10, -10],
      transition: {
        duration: 3 + Math.random() * 2,
        repeat: Infinity,
        ease: 'easeInOut' as const,
        delay: Math.random() * 2,
      },
    },
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Cosmic Background */}
      <CosmicBackground />

      {/* Main Content */}
      <motion.div
        className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Central Welcome */}
        <motion.div className="text-center mb-16" variants={itemVariants}>
          <motion.h1
            className="text-6xl md:text-8xl font-bold text-white mb-6 leading-tight"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, type: 'spring' }}
          >
            LytbuB
            <motion.span
              className="block text-3xl md:text-4xl text-cosmic-highlight font-light mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              Command Center
            </motion.span>
          </motion.h1>

          <motion.p
            className="text-xl md:text-2xl text-cosmic-accent max-w-2xl mx-auto leading-relaxed"
            variants={itemVariants}
          >
            Your intelligent business operating system awaits
          </motion.p>
        </motion.div>

        {/* Radial Menu */}
        <motion.div
          className="relative flex items-center justify-center mb-16"
          variants={itemVariants}
        >
          {/* Central Hub */}
          <motion.div
            className="w-32 h-32 rounded-full bg-gradient-to-br from-cosmic-accent via-blue-500 to-purple-600 flex items-center justify-center shadow-2xl cursor-pointer"
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <motion.div
              className="text-5xl"
              animate={{ rotate: isMenuOpen ? 0 : 180 }}
              transition={{ duration: 0.3 }}
            >
              ⚙️
            </motion.div>
          </motion.div>

          {/* Menu Items */}
          <AnimatePresence>
            {isMenuOpen &&
              menuItems.map((item, index) => {
                const position = getPosition(index, menuItems.length);

                return (
                  <motion.div
                    key={item.id}
                    className="absolute"
                    style={{
                      left: `calc(50% + ${position.x}px)`,
                      top: `calc(50% + ${position.y}px)`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    initial="hidden"
                    animate={['visible', 'floating']}
                    exit="hidden"
                    variants={radialItemVariants}
                    custom={index}
                    whileHover={{ scale: 1.15, zIndex: 10 }}
                    whileTap={{ scale: 0.95 }}
                    onHoverStart={() => setSelectedItem(item.id)}
                    onHoverEnd={() => setSelectedItem(null)}
                    onClick={() => navigate(item.path)}
                  >
                    <motion.div
                      className={`w-20 h-20 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center shadow-xl cursor-pointer relative`}
                      whileHover={{
                        boxShadow: '0 0 30px rgba(255, 255, 255, 0.3)',
                        transition: { duration: 0.2 },
                      }}
                    >
                      <span className="text-2xl">{item.icon}</span>

                      {/* Hover Tooltip */}
                      <AnimatePresence>
                        {selectedItem === item.id && (
                          <motion.div
                            className="absolute top-full mt-4 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-xl px-4 py-3 shadow-xl border border-white/20 max-w-xs z-50"
                            initial={{ opacity: 0, scale: 0.8, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: -10 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="text-center">
                              <h4 className="font-bold text-cosmic-dark text-sm mb-1">
                                {item.title}
                              </h4>
                              <p className="text-xs text-gray-600 leading-relaxed">
                                {item.description}
                              </p>
                            </div>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2">
                              <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-white/95"></div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </motion.div>
                );
              })}
          </AnimatePresence>
        </motion.div>

        {/* CTA Section */}
        <motion.div className="text-center space-y-6" variants={itemVariants}>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="lg"
              className="bg-gradient-to-r from-cosmic-accent to-blue-600 hover:from-cosmic-accent/80 hover:to-blue-500 text-white px-12 py-6 text-xl font-semibold shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 border-0"
              onClick={() => navigate('/login')}
            >
              <motion.span className="flex items-center gap-3" whileHover={{ gap: 12 }}>
                <span>🚀</span>
                <span>Enter LytbuB HQ</span>
                <span>→</span>
              </motion.span>
            </Button>
          </motion.div>

          {/* Demo Button */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-cosmic-highlight text-cosmic-highlight hover:bg-cosmic-highlight hover:text-cosmic-dark px-12 py-6 text-xl font-semibold shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105"
              onClick={() => navigate('/lab?demo=oria&mode=meeting')}
            >
              <motion.span className="flex items-center gap-3" whileHover={{ gap: 12 }}>
                <span>🎭</span>
                <span>Book a Demo with Oria</span>
                <span>→</span>
              </motion.span>
            </Button>
          </motion.div>

          <motion.p
            className="text-cosmic-accent/70 mt-6 text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
          >
            Ready to transform your business operations?
          </motion.p>
        </motion.div>

        {/* Background Particles Effect */}
        <motion.div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          transition={{ delay: 2, duration: 1 }}
        >
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-cosmic-accent rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [-20, -40, -20],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: Math.random() * 3,
                ease: 'easeInOut',
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Landing;
