import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Auth from '@/components/Auth';
import ProtectedRoute from '@/components/ProtectedRoute';
import Home from '@/pages/Home';
import Landing from '@/pages/Landing';
import About from '@/pages/About';
import Pricing from '@/pages/Pricing';
import AdminPortal from '@/pages/AdminPortal';
import DevPortal from '@/pages/DevPortal';
import HRPortal from '@/pages/HRPortal';
import ClientPortal from '@/pages/ClientPortal';
import Onboarding from '@/pages/Onboarding';
import AiLab from '@/pages/AiLab';
import AgentMarketplace from '@/pages/AgentMarketplace';
import KnowledgeLibrary from '@/pages/KnowledgeLibrary';
import MediaStudio from '@/pages/MediaStudio';
import FinancialNexus from '@/pages/FinancialNexus';
import OperationsHub from '@/pages/OperationsHub';
import MarketingHub from '@/pages/MarketingHub';
import Analytics from '@/pages/Analytics';
import Collaboration from '@/pages/Collaboration';
import Whiteboard from '@/pages/Whiteboard';
import Settings from '@/pages/Settings';
import AutomationBuilder from '@/pages/AutomationBuilder';
import { UserProvider } from '@/context/UserContext';

const AppContent: React.FC = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/auth" element={<Auth onAuthSuccess={() => {}} />} />
      <Route path="/login" element={<Auth onAuthSuccess={() => {}} />} />

      {/* Landing page - public but requires login to access features */}
      <Route
        path="/landing"
        element={
          <ProtectedRoute>
            <Landing />
          </ProtectedRoute>
        }
      />

      {/* Protected routes with role-based access */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminPortal />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dev"
        element={
          <ProtectedRoute requiredRole="admin">
            <DevPortal />
          </ProtectedRoute>
        }
      />

      <Route
        path="/hr"
        element={
          <ProtectedRoute requiredRole="admin">
            <HRPortal />
          </ProtectedRoute>
        }
      />

      <Route
        path="/portal"
        element={
          <ProtectedRoute requiredRole="client">
            <ClientPortal />
          </ProtectedRoute>
        }
      />

      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        }
      />

      <Route
        path="/client-portal"
        element={
          <ProtectedRoute>
            <ClientPortal />
          </ProtectedRoute>
        }
      />

      <Route
        path="/lab"
        element={
          <ProtectedRoute requiredRole="agent">
            <AiLab />
          </ProtectedRoute>
        }
      />

      <Route
        path="/marketplace"
        element={
          <ProtectedRoute>
            <AgentMarketplace />
          </ProtectedRoute>
        }
      />

      <Route
        path="/library"
        element={
          <ProtectedRoute>
            <KnowledgeLibrary />
          </ProtectedRoute>
        }
      />

      <Route
        path="/collaboration"
        element={
          <ProtectedRoute>
            <Collaboration />
          </ProtectedRoute>
        }
      />

      <Route
        path="/whiteboard"
        element={
          <ProtectedRoute>
            <Whiteboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />

      <Route
        path="/media"
        element={
          <ProtectedRoute>
            <MediaStudio />
          </ProtectedRoute>
        }
      />

      <Route
        path="/finance"
        element={
          <ProtectedRoute>
            <FinancialNexus />
          </ProtectedRoute>
        }
      />

      <Route
        path="/operations"
        element={
          <ProtectedRoute>
            <OperationsHub />
          </ProtectedRoute>
        }
      />

      <Route
        path="/marketing"
        element={
          <ProtectedRoute>
            <MarketingHub />
          </ProtectedRoute>
        }
      />

      <Route
        path="/analytics"
        element={
          <ProtectedRoute requiredRole="admin">
            <Analytics />
          </ProtectedRoute>
        }
      />

      <Route
        path="/automation"
        element={
          <ProtectedRoute requiredRole="admin">
            <AutomationBuilder />
          </ProtectedRoute>
        }
      />

      {/* Catch-all route for unmatched paths */}
      <Route
        path="*"
        element={
          <div className="relative min-h-screen bg-cosmic-dark text-white flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
              <p className="text-cosmic-accent">The page you're looking for doesn't exist.</p>
            </div>
          </div>
        }
      />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <UserProvider>
      <Router>
        <AppContent />
      </Router>
    </UserProvider>
  );
};

export default App;
