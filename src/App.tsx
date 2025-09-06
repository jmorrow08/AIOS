import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { RadialMenu } from '@/components/RadialMenu';
import { CosmicBackground } from '@/components/CosmicBackground';
import Auth from '@/components/Auth';
import MissionControl from '@/pages/MissionControl';
import OperationsHub from '@/pages/OperationsHub';
import FinancialNexus from '@/pages/FinancialNexus';
import AiLab from '@/pages/AiLab';
import MediaStudio from '@/pages/MediaStudio';
import KnowledgeLibrary from '@/pages/KnowledgeLibrary';
import { UserProvider, useUser } from '@/context/UserContext';

const AppContent: React.FC = () => {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div className="relative min-h-screen bg-cosmic-dark text-white">
        <CosmicBackground />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-xl">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth onAuthSuccess={() => {}} />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* cosmic background */}
      <CosmicBackground />
      {/* radial menu */}
      <RadialMenu />
      {/* main content */}
      <div className="p-8 pt-24 max-w-5xl mx-auto">
        <Routes>
          <Route path="/" element={<MissionControl />} />
          <Route path="/operations" element={<OperationsHub />} />
          <Route path="/financial" element={<FinancialNexus />} />
          <Route path="/lab" element={<AiLab />} />
          <Route path="/media" element={<MediaStudio />} />
          <Route path="/library" element={<KnowledgeLibrary />} />
        </Routes>
      </div>
    </div>
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
