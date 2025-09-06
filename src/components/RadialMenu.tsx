import React from 'react';
import { NavLink } from 'react-router-dom';

const items = [
  { path: '/', label: 'Mission Control' },
  { path: '/operations', label: 'Operations Hub' },
  { path: '/financial', label: 'Financial Nexus' },
  { path: '/lab', label: 'AI Lab' },
  { path: '/media', label: 'Media Studio' },
  { path: '/library', label: 'Knowledge Library' },
];

export const RadialMenu: React.FC = () => {
  return (
    <nav className="fixed bottom-4 right-4 flex flex-col items-center space-y-2">
      {items.map(item => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `rounded-full p-3 bg-cosmic-light text-white hover:bg-cosmic-accent transition transform hover:scale-110 ${isActive ? 'ring-2 ring-cosmic-highlight' : ''}`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
};
