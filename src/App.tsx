import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Auth from '@/components/Auth';
import ProtectedRoute from '@/components/ProtectedRoute';
import Home from '@/pages/Home';
import Landing from '@/pages/Landing';
import AdminPortal from '@/pages/AdminPortal';
import ClientPortal from '@/pages/ClientPortal';
import AiLab from '@/pages/AiLab';
import KnowledgeLibrary from '@/pages/KnowledgeLibrary';
import { UserProvider } from '@/context/UserContext';

const AppContent: React.FC = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
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
        path="/portal"
        element={
          <ProtectedRoute requiredRole="client">
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
        path="/library"
        element={
          <ProtectedRoute>
            <KnowledgeLibrary />
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
