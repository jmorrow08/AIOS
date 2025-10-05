import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  UserPlus,
  FileText,
  Briefcase,
  Image,
  Bot,
  FolderOpen,
  Settings,
  Clock,
} from 'lucide-react';
import { ActivityLogEntry } from '@/api/dashboard';

interface ActivityFeedProps {
  activities: ActivityLogEntry[];
  loading?: boolean;
  className?: string;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities,
  loading = false,
  className = '',
}) => {
  const getCategoryIcon = (category: ActivityLogEntry['category']) => {
    const iconProps = { className: 'w-4 h-4' };

    switch (category) {
      case 'client':
        return <UserPlus {...iconProps} className="w-4 h-4 text-blue-400" />;
      case 'invoice':
        return <FileText {...iconProps} className="w-4 h-4 text-green-400" />;
      case 'job':
        return <Briefcase {...iconProps} className="w-4 h-4 text-orange-400" />;
      case 'media':
        return <Image {...iconProps} className="w-4 h-4 text-purple-400" />;
      case 'agent':
        return <Bot {...iconProps} className="w-4 h-4 text-cyan-400" />;
      case 'document':
        return <FolderOpen {...iconProps} className="w-4 h-4 text-yellow-400" />;
      case 'system':
        return <Settings {...iconProps} className="w-4 h-4 text-gray-400" />;
      default:
        return <Clock {...iconProps} className="w-4 h-4 text-cosmic-accent" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 168) {
      // 7 days
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  if (loading) {
    return (
      <div className={`bg-cosmic-light bg-opacity-10 backdrop-blur-sm rounded-lg p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-cosmic-accent bg-opacity-20 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-cosmic-accent bg-opacity-20 rounded w-3/4"></div>
                  <div className="h-3 bg-cosmic-accent bg-opacity-10 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className={`bg-cosmic-light bg-opacity-10 backdrop-blur-sm rounded-lg p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-cosmic-accent opacity-50 mx-auto mb-4" />
          <p className="text-cosmic-accent">No recent activity</p>
          <p className="text-sm text-cosmic-accent opacity-75 mt-2">
            Activity from your operations will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-cosmic-light bg-opacity-10 backdrop-blur-sm rounded-lg p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start space-x-3 p-3 rounded-lg hover:bg-cosmic-accent hover:bg-opacity-5 transition-colors"
          >
            <div className="flex-shrink-0 mt-1">{getCategoryIcon(activity.category)}</div>

            <div className="flex-1 min-w-0">
              {activity.link ? (
                <NavLink
                  to={activity.link}
                  className="text-sm text-white hover:text-cosmic-highlight transition-colors block"
                >
                  {activity.description}
                </NavLink>
              ) : (
                <p className="text-sm text-white">{activity.description}</p>
              )}

              <p className="text-xs text-cosmic-accent opacity-75 mt-1">
                {formatTimestamp(activity.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {activities.length >= 10 && (
        <div className="mt-4 text-center">
          <button className="text-sm text-cosmic-highlight hover:text-white transition-colors">
            View all activity →
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;
