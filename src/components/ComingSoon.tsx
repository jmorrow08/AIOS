import React from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Clock, Sparkles, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ComingSoonProps {
  title?: string;
  description?: string;
  estimatedDate?: string;
  features?: string[];
}

export const ComingSoon: React.FC<ComingSoonProps> = ({
  title = 'Coming Soon',
  description = "We're working hard to bring you this exciting new feature. Stay tuned for updates!",
  estimatedDate,
  features = [],
}) => {
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
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <DashboardLayout title={title}>
      <motion.div
        className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Icon Animation */}
        <motion.div className="mb-8 relative" variants={itemVariants}>
          <div className="relative">
            <div className="w-32 h-32 bg-gradient-to-br from-cosmic-accent to-blue-500 rounded-full flex items-center justify-center shadow-2xl">
              <Rocket className="w-16 h-16 text-white" />
            </div>
            <motion.div
              className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: 'reverse',
              }}
            >
              <Sparkles className="w-4 h-4 text-white" />
            </motion.div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          className="text-4xl md:text-6xl font-bold text-white mb-4"
          variants={itemVariants}
        >
          {title}
        </motion.h1>

        {/* Description */}
        <motion.p
          className="text-xl text-cosmic-accent max-w-2xl mb-8 leading-relaxed"
          variants={itemVariants}
        >
          {description}
        </motion.p>

        {/* Estimated Date */}
        {estimatedDate && (
          <motion.div
            className="flex items-center space-x-2 bg-cosmic-light/10 rounded-lg px-4 py-2 mb-8"
            variants={itemVariants}
          >
            <Clock className="w-5 h-5 text-cosmic-accent" />
            <span className="text-cosmic-accent">Estimated launch: {estimatedDate}</span>
          </motion.div>
        )}

        {/* Features List */}
        {features.length > 0 && (
          <motion.div className="mb-8 w-full max-w-md" variants={itemVariants}>
            <h3 className="text-lg font-semibold text-white mb-4">What to expect:</h3>
            <ul className="space-y-2 text-left">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center space-x-2 text-cosmic-accent">
                  <div className="w-2 h-2 bg-cosmic-accent rounded-full"></div>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div className="flex flex-col sm:flex-row gap-4" variants={itemVariants}>
          <Button
            className="bg-gradient-to-r from-cosmic-accent to-blue-600 hover:from-cosmic-accent/80 hover:to-blue-500 text-white px-8 py-3"
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
          <Button
            variant="outline"
            className="border-cosmic-accent text-cosmic-accent hover:bg-cosmic-accent hover:text-white px-8 py-3"
            onClick={() =>
              (window.location.href = 'mailto:hello@lytbuB.com?subject=Feature Request')
            }
          >
            Request Feature
          </Button>
        </motion.div>

        {/* Newsletter Signup */}
        <motion.div className="mt-12 w-full max-w-md" variants={itemVariants}>
          <p className="text-cosmic-accent mb-4">Want to be notified when this launches?</p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-2 bg-cosmic-light/10 border border-cosmic-light/20 rounded-lg text-white placeholder-cosmic-accent focus:outline-none focus:border-cosmic-accent"
            />
            <Button className="bg-cosmic-accent hover:bg-cosmic-accent/80 text-white px-6">
              Notify Me
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
};













