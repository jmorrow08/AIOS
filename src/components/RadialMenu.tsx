import React from 'react';
import { NavLink } from 'react-router-dom';
import { useUser } from '@/context/UserContext';

const items = [
  { path: '/', label: 'Mission Control' },
  { path: '/operations', label: 'Operations Hub' },
  { path: '/financial', label: 'Financial Nexus' },
  { path: '/lab', label: 'AI Lab' },
  { path: '/media', label: 'Media Studio' },
  { path: '/library', label: 'Knowledge Library' },
];

export const RadialMenu: React.FC = () => {
  const { user, profile, signOut } = useUser();

  if (!user) return null;

  return (
    <nav className="fixed bottom-4 right-4 flex flex-col items-center space-y-2">
      {items.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `rounded-full p-3 bg-cosmic-light text-white hover:bg-cosmic-accent transition transform hover:scale-110 ${
              isActive ? 'ring-2 ring-cosmic-highlight' : ''
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}

      {/* User info and logout */}
      <div className="bg-cosmic-light bg-opacity-20 backdrop-blur-sm rounded-lg p-3 mt-4 text-center">
        <div className="text-xs text-cosmic-highlight mb-1">
          {profile?.full_name || user?.email}
        </div>
        <div className="text-xs text-cosmic-accent uppercase font-semibold mb-2">
          {profile?.role}
        </div>
        <button
          onClick={signOut}
          className="w-full bg-red-600 hover:bg-red-700 text-white text-xs py-1 px-2 rounded transition-colors"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};
