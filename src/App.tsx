import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { RadialMenu } from '@/components/RadialMenu';
import { CosmicBackground } from '@/components/CosmicBackground';
import MissionControl from '@/pages/MissionControl';
import OperationsHub from '@/pages/OperationsHub';
import FinancialNexus from '@/pages/FinancialNexus';
import AiLab from '@/pages/AiLab';
import MediaStudio from '@/pages/MediaStudio';
import KnowledgeLibrary from '@/pages/KnowledgeLibrary';
import { UserProvider } from '@/context/UserContext';

const App: React.FC = () => {
  return (
    <UserProvider>
      <Router>
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
      </Router>
    </UserProvider>
  );
};

export default App;
