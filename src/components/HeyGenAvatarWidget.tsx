import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useUser } from '@/context/UserContext';

const HeyGenAvatarWidget: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [currentMessage, setCurrentMessage] = useState(0);
  const [showDemoQuestion, setShowDemoQuestion] = useState(false);

  const greetings = user
    ? [
        `Welcome back, ${user.email?.split('@')[0]}! Ready to explore Jarvis HQ?`,
        "I'm your AI assistant, here to help streamline your operations",
        'Would you like to see a demo of our latest AI capabilities?',
      ]
    : [
        "Hello! I'm Jarvis, your intelligent business companion",
        'Welcome to the future of business operations',
        "Do you want a demo? I'd love to show you around!",
      ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % greetings.length);
    }, 5000);

    // Show demo question after first cycle
    const demoTimer = setTimeout(() => {
      setShowDemoQuestion(true);
    }, 15000);

    return () => {
      clearInterval(interval);
      clearTimeout(demoTimer);
    };
  }, []);

  const handleDemoClick = () => {
    navigate('/landing');
  };

  return (
    <motion.div
      className="relative mx-auto w-48 h-48 mb-8"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Avatar Container */}
      <motion.div
        className="w-full h-full rounded-full bg-gradient-to-br from-cosmic-accent via-blue-500 to-purple-600 flex items-center justify-center shadow-2xl"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          className="text-8xl"
          animate={{
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          🤖
        </motion.div>
      </motion.div>

      {/* Speech Bubble */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentMessage}
          className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-xl border border-white/20 max-w-xs z-10"
          initial={{ opacity: 0, scale: 0.8, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-center">
            <p className="text-cosmic-dark text-sm font-medium leading-relaxed mb-3">
              {greetings[currentMessage]}
            </p>

            {showDemoQuestion && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Button
                  size="sm"
                  onClick={handleDemoClick}
                  className="bg-cosmic-accent hover:bg-cosmic-accent/80 text-white text-xs px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105"
                >
                  🚀 Show Me a Demo
                </Button>
              </motion.div>
            )}
          </div>

          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
            <div className="w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-white/95"></div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Floating particles around avatar */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-cosmic-accent rounded-full opacity-60"
            style={{
              left: `${20 + Math.random() * 60}%`,
              top: `${20 + Math.random() * 60}%`,
            }}
            animate={{
              y: [-10, -20, -10],
              x: [-5, 5, -5],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default HeyGenAvatarWidget;
