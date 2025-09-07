import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LucideIcon, Plus } from 'lucide-react';

interface QuickActionButtonProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  link?: string;
  onClick?: () => void;
  modalComponent?: React.ComponentType<{
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
  }>;
  className?: string;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  title,
  description,
  icon: Icon,
  color,
  link,
  onClick,
  modalComponent: ModalComponent,
  className = '',
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (ModalComponent) {
      setIsModalOpen(true);
    }
  };

  const handleModalSuccess = () => {
    setIsModalOpen(false);
    // Could trigger a refresh of dashboard data here
    window.location.reload(); // Simple refresh for now
  };

  const buttonContent = (
    <div
      className={`
        group relative bg-cosmic-light bg-opacity-10 backdrop-blur-sm
        rounded-lg p-4 border border-cosmic-accent border-opacity-20
        hover:border-opacity-40 hover:bg-opacity-20 hover:scale-105
        transition-all duration-200 cursor-pointer overflow-hidden
        ${className}
      `}
      onClick={handleClick}
    >
      {/* Background gradient effect */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 transition-opacity duration-200`}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${color} bg-opacity-20`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <Plus className="w-4 h-4 text-cosmic-accent opacity-60 group-hover:opacity-100 transition-opacity" />
        </div>

        <h4 className="text-sm font-semibold text-white mb-1">{title}</h4>

        <p className="text-xs text-cosmic-accent opacity-75 leading-relaxed">{description}</p>
      </div>
    </div>
  );

  if (link && !ModalComponent) {
    return <NavLink to={link}>{buttonContent}</NavLink>;
  }

  return (
    <>
      {buttonContent}

      {ModalComponent && (
        <ModalComponent
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleModalSuccess}
        />
      )}
    </>
  );
};

export default QuickActionButton;
