import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CosmicBackground } from '@/components/CosmicBackground';
import { useUser } from '@/context/UserContext';
import HomepageLoginForm from '@/components/HomepageLoginForm';
import HeyGenAvatarWidget from '@/components/HeyGenAvatarWidget';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user, role } = useUser();

  // Role-based routing for Jarvis HQ
  const getJarvisHQRoute = () => {
    switch (role) {
      case 'admin':
        return '/admin';
      case 'client':
        return '/portal';
      case 'agent':
        return '/lab';
      default:
        return '/landing';
    }
  };

  const handleLoginSuccess = () => {
    navigate(getJarvisHQRoute());
  };

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
          {/* HeyGen Avatar Widget */}
          <div className="mb-12">
            <HeyGenAvatarWidget />
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

          {/* Authentication Section */}
          <div className="flex flex-col lg:flex-row gap-8 justify-center items-start mb-16">
            {/* Login Form */}
            {!user && (
              <div className="flex-shrink-0">
                <HomepageLoginForm onLoginSuccess={handleLoginSuccess} />
              </div>
            )}

            {/* Jarvis HQ Button for authenticated users */}
            {user && (
              <div className="flex flex-col items-center gap-4">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-cosmic-accent to-blue-600 hover:from-cosmic-accent/80 hover:to-blue-500 text-white px-12 py-6 text-xl font-semibold shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 border-0"
                  onClick={() => navigate(getJarvisHQRoute())}
                >
                  <span className="flex items-center gap-3">
                    <span>🚀</span>
                    <span>Enter Jarvis HQ</span>
                    <span>→</span>
                  </span>
                </Button>
                <p className="text-cosmic-accent text-sm">
                  Welcome back! Access your {role} portal
                </p>
              </div>
            )}
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
              <p className="text-cosmic-accent leading-relaxed mb-4">
                Jarvis AI OS is a comprehensive business operating system that combines artificial
                intelligence with enterprise-grade tools to streamline your operations.
              </p>
              <button
                onClick={() => navigate('/about')}
                className="text-cosmic-highlight hover:text-white transition-colors font-medium"
              >
                Learn More →
              </button>
            </div>

            {/* Docs */}
            <div>
              <h4 className="text-xl font-bold text-white mb-4">Documentation</h4>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => navigate('/library')}
                    className="text-cosmic-accent hover:text-cosmic-highlight transition-colors text-left"
                  >
                    Knowledge Library
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/landing')}
                    className="text-cosmic-accent hover:text-cosmic-highlight transition-colors text-left"
                  >
                    Getting Started
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/lab')}
                    className="text-cosmic-accent hover:text-cosmic-highlight transition-colors text-left"
                  >
                    AI Lab Guide
                  </button>
                </li>
              </ul>
            </div>

            {/* Pricing */}
            <div>
              <h4 className="text-xl font-bold text-white mb-4">Pricing</h4>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => navigate('/pricing')}
                    className="text-cosmic-accent hover:text-cosmic-highlight transition-colors text-left"
                  >
                    View Plans →
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/pricing')}
                    className="text-cosmic-accent hover:text-cosmic-highlight transition-colors text-left"
                  >
                    Free Tier
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/pricing')}
                    className="text-cosmic-accent hover:text-cosmic-highlight transition-colors text-left"
                  >
                    Professional
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/pricing')}
                    className="text-cosmic-accent hover:text-cosmic-highlight transition-colors text-left"
                  >
                    Enterprise
                  </button>
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
