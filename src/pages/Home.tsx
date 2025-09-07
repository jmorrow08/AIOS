import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CosmicBackground } from '@/components/CosmicBackground';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [currentSpeech, setCurrentSpeech] = useState(0);

  const greetings = [
    'Welcome to Jarvis AI OS - Your intelligent business companion',
    "I'm here to help streamline your operations with AI-powered tools",
    "Let's explore how I can enhance your business productivity",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSpeech((prev) => (prev + 1) % greetings.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      title: 'AI Agents',
      description: 'Intelligent automation agents that handle complex workflows',
      icon: '🤖',
      color: 'from-cosmic-accent to-blue-500',
    },
    {
      title: 'Services',
      description: 'Streamlined service management and client portals',
      icon: '⚡',
      color: 'from-green-400 to-cosmic-accent',
    },
    {
      title: 'Finance',
      description: 'Advanced financial tracking and invoice management',
      icon: '💰',
      color: 'from-yellow-400 to-orange-500',
    },
    {
      title: 'Knowledge',
      description: 'AI-powered knowledge library and document processing',
      icon: '📚',
      color: 'from-purple-400 to-cosmic-accent',
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Cosmic Background */}
      <CosmicBackground />

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="max-w-7xl mx-auto text-center">
          {/* HeyGen Avatar Section */}
          <div className="mb-12">
            <div className="relative mx-auto w-48 h-48 mb-8">
              {/* Avatar Container */}
              <div className="w-full h-full rounded-full bg-gradient-to-br from-cosmic-accent via-blue-500 to-purple-600 flex items-center justify-center shadow-2xl">
                <div className="text-8xl">🤖</div>
              </div>
              {/* Speech Bubble */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-xl border border-white/20 max-w-xs">
                <p className="text-cosmic-dark text-sm font-medium leading-relaxed">
                  {greetings[currentSpeech]}
                </p>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                  <div className="w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-white/95"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Heading */}
          <div className="mb-12">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Jarvis
              <span className="block text-3xl md:text-5xl text-cosmic-highlight font-light mt-2">
                AI Operating System
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-cosmic-accent max-w-3xl mx-auto leading-relaxed">
              Transform your business with intelligent automation, seamless operations, and
              AI-powered insights
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button
              size="lg"
              className="bg-cosmic-accent hover:bg-cosmic-accent/80 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              onClick={() => navigate('/auth')}
            >
              Login
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-cosmic-highlight text-cosmic-highlight hover:bg-cosmic-highlight hover:text-cosmic-dark px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              onClick={() => navigate('/landing')}
            >
              Enter Jarvis HQ
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Powerful Features</h2>
            <p className="text-xl text-cosmic-accent max-w-2xl mx-auto">
              Everything you need to run your business intelligently
            </p>
          </div>

          {/* Features Grid - Responsive: stacked on mobile, radial on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={`group relative bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-2xl ${
                  // Radial positioning for desktop
                  index === 0
                    ? 'lg:col-start-2 lg:row-start-1'
                    : index === 1
                    ? 'lg:col-start-3 lg:row-start-2'
                    : index === 2
                    ? 'lg:col-start-2 lg:row-start-3'
                    : index === 3
                    ? 'lg:col-start-1 lg:row-start-2'
                    : ''
                }`}
              >
                {/* Feature Icon */}
                <div
                  className={`w-16 h-16 rounded-full bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg`}
                >
                  <span className="text-3xl">{feature.icon}</span>
                </div>

                {/* Feature Content */}
                <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                <p className="text-cosmic-accent leading-relaxed">{feature.description}</p>

                {/* Hover Effect */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cosmic-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-white/5 backdrop-blur-sm border-t border-white/10 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            {/* About */}
            <div>
              <h4 className="text-xl font-bold text-white mb-4">About Jarvis</h4>
              <p className="text-cosmic-accent leading-relaxed">
                Jarvis AI OS is a comprehensive business operating system that combines artificial
                intelligence with enterprise-grade tools to streamline your operations.
              </p>
            </div>

            {/* Docs */}
            <div>
              <h4 className="text-xl font-bold text-white mb-4">Documentation</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-cosmic-accent hover:text-cosmic-highlight transition-colors"
                  >
                    Getting Started
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-cosmic-accent hover:text-cosmic-highlight transition-colors"
                  >
                    API Reference
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-cosmic-accent hover:text-cosmic-highlight transition-colors"
                  >
                    Best Practices
                  </a>
                </li>
              </ul>
            </div>

            {/* Pricing */}
            <div>
              <h4 className="text-xl font-bold text-white mb-4">Pricing</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-cosmic-accent hover:text-cosmic-highlight transition-colors"
                  >
                    Free Tier
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-cosmic-accent hover:text-cosmic-highlight transition-colors"
                  >
                    Professional
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-cosmic-accent hover:text-cosmic-highlight transition-colors"
                  >
                    Enterprise
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-12 pt-8 border-t border-white/10 text-center">
            <p className="text-cosmic-accent">© 2024 Jarvis AI OS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
