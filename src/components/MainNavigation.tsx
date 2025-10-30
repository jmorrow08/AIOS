import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useUser } from '@/context/UserContext';
import { Button } from '@/components/ui/button';
import {
  Menu,
  X,
  Home,
  Bot,
  ShoppingBag,
  BookOpen,
  Video,
  Zap,
  Building,
  DollarSign,
  BarChart3,
  Users,
  Palette,
  Settings,
  MessageSquare,
  Shield,
  FileText,
  ChevronRight,
} from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  description: string;
  category: string;
}

const navigationItems: NavItem[] = [
  {
    path: '/mission-control',
    label: 'Mission Control',
    icon: Home,
    description: 'Central dashboard and command center',
    category: 'core',
  },
  {
    path: '/lab',
    label: 'AI Lab',
    icon: Bot,
    description: 'AI agents and automation',
    category: 'ai',
  },
  {
    path: '/marketplace',
    label: 'Marketplace',
    icon: ShoppingBag,
    description: 'Agent templates and tools',
    category: 'ai',
  },
  {
    path: '/library',
    label: 'Knowledge Library',
    icon: BookOpen,
    description: 'Documents and knowledge base',
    category: 'content',
  },
  {
    path: '/media',
    label: 'Media Studio',
    icon: Video,
    description: 'Content creation and media production',
    category: 'content',
  },
  {
    path: '/automation',
    label: 'Automation Builder',
    icon: Zap,
    description: 'Workflow automation',
    category: 'operations',
  },
  {
    path: '/operations',
    label: 'Operations Hub',
    icon: Building,
    description: 'Business operations management',
    category: 'operations',
  },
  {
    path: '/finance',
    label: 'Financial Nexus',
    icon: DollarSign,
    description: 'Financial management and analytics',
    category: 'business',
  },
  {
    path: '/analytics',
    label: 'Analytics',
    icon: BarChart3,
    description: 'Business insights and reporting',
    category: 'business',
  },
  {
    path: '/collaboration',
    label: 'Collaboration',
    icon: Users,
    description: 'Team collaboration and communication',
    category: 'collaboration',
  },
  {
    path: '/whiteboard',
    label: 'Whiteboard',
    icon: Palette,
    description: 'Visual collaboration tools',
    category: 'collaboration',
  },
  {
    path: '/admin',
    label: 'Admin Portal',
    icon: Shield,
    description: 'System administration',
    category: 'admin',
  },
  {
    path: '/portal',
    label: 'Client Portal',
    icon: FileText,
    description: 'Client management',
    category: 'admin',
  },
  {
    path: '/marketing',
    label: 'Marketing Hub',
    icon: MessageSquare,
    description: 'Marketing and campaigns',
    category: 'business',
  },
  {
    path: '/ai',
    label: 'AI Chat',
    icon: MessageSquare,
    description: 'Direct AI conversation',
    category: 'ai',
  },
  {
    path: '/settings',
    label: 'Settings',
    icon: Settings,
    description: 'System configuration',
    category: 'admin',
  },
];

const categories = [
  { id: 'core', label: 'Core', color: 'bg-blue-500' },
  { id: 'ai', label: 'AI & Automation', color: 'bg-purple-500' },
  { id: 'content', label: 'Content & Media', color: 'bg-green-500' },
  { id: 'operations', label: 'Operations', color: 'bg-orange-500' },
  { id: 'business', label: 'Business', color: 'bg-cyan-500' },
  { id: 'collaboration', label: 'Collaboration', color: 'bg-pink-500' },
  { id: 'admin', label: 'Administration', color: 'bg-gray-500' },
];

export const MainNavigation: React.FC = () => {
  const { user, profile, signOut } = useUser();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('core');

  if (!user) return null;

  const filteredItems = navigationItems.filter((item) => item.category === activeCategory);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden bg-cosmic-light/20 backdrop-blur-sm p-3 rounded-lg text-white hover:bg-cosmic-light/30 transition-colors"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Navigation Panel */}
      <div
        className={`fixed left-0 top-0 h-full bg-cosmic-dark/95 backdrop-blur-md border-r border-cosmic-light/20 transition-transform duration-300 z-40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:static md:h-auto md:min-h-screen w-80`}
      >
        {/* Header */}
        <div className="p-6 border-b border-cosmic-light/20">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-cosmic-accent to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">L</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-xl">LytbuB</h1>
              <p className="text-cosmic-accent text-sm">Command Center</p>
            </div>
          </div>

          {/* User Info */}
          <div className="bg-cosmic-light/10 rounded-lg p-3">
            <div className="text-sm text-cosmic-highlight font-medium">
              {profile?.full_name || user?.email}
            </div>
            <div className="text-xs text-cosmic-accent uppercase">{profile?.role || 'User'}</div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="p-4 border-b border-cosmic-light/20">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  activeCategory === category.id
                    ? 'bg-cosmic-accent text-white'
                    : 'bg-cosmic-light/20 text-cosmic-accent hover:bg-cosmic-light/30'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {filteredItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 group ${
                    isActive
                      ? 'bg-cosmic-accent text-white shadow-lg'
                      : 'text-cosmic-accent hover:bg-cosmic-light/20 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={`w-5 h-5 ${
                        isActive ? 'text-white' : 'text-cosmic-accent group-hover:text-white'
                      }`}
                    />
                    <div className="flex-1">
                      <div
                        className={`font-medium ${
                          isActive ? 'text-white' : 'text-cosmic-accent group-hover:text-white'
                        }`}
                      >
                        {item.label}
                      </div>
                      <div className="text-xs text-cosmic-accent/70 group-hover:text-white/70">
                        {item.description}
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${
                        isActive ? 'text-white' : 'text-cosmic-accent/50'
                      }`}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>

        {/* Footer with Logout */}
        <div className="p-4 border-t border-cosmic-light/20">
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500"
          >
            Sign Out
          </Button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};
