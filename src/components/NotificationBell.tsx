import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Eye, EyeOff } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  Notification,
  NotificationType,
} from '@/api/notifications';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NotificationBellProps {
  className?: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ className = '' }) => {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const loadNotifications = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const result = await getNotifications(user.id, { limit: 10 });
      if (result.data) {
        setNotifications(result.data);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    if (!user?.id) return;

    try {
      const result = await getUnreadCount(user.id);
      if (result.data !== null) {
        setUnreadCount(result.data);
      }
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
      // Update local state
      setNotifications((prev) =>
        prev.map((notif) => (notif.id === notificationId ? { ...notif, read: true } : notif)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;

    try {
      await markAllAsRead(user.id);
      // Update local state
      setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadUnreadCount();
      loadNotifications();
    }
  }, [user?.id]);

  // Refresh unread count when dropdown opens
  useEffect(() => {
    if (dropdownOpen && user?.id) {
      loadUnreadCount();
      loadNotifications();
    }
  }, [dropdownOpen, user?.id]);

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'message':
        return '💬';
      case 'deliverable':
        return '📎';
      case 'feedback':
        return '⭐';
      case 'invoice':
        return '📄';
      case 'budget':
        return '💰';
      case 'system':
        return '⚙️';
      default:
        return '🔔';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString();
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }

    // Handle deep linking
    if (notification.link) {
      window.location.href = notification.link;
      setDropdownOpen(false);
    }
  };

  if (!user?.id) {
    return null;
  }

  return (
    <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={`relative ${className}`}>
          <Bell className="w-5 h-5 text-cosmic-accent" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 bg-cosmic-light bg-opacity-95 backdrop-blur-sm border-cosmic-accent border-opacity-20"
      >
        <DropdownMenuLabel className="flex items-center justify-between">
          <span className="text-white">Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs text-cosmic-accent hover:text-white"
            >
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-cosmic-accent bg-opacity-20" />

        <ScrollArea className="h-96">
          {loading ? (
            <div className="p-4 text-center text-cosmic-accent">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-cosmic-accent">No notifications yet</div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={`p-3 cursor-pointer hover:bg-cosmic-accent hover:bg-opacity-10 ${
                    !notification.read ? 'bg-cosmic-accent bg-opacity-5' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3 w-full">
                    <span className="text-lg flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p
                            className={`text-sm font-medium ${
                              notification.read ? 'text-cosmic-accent' : 'text-white'
                            }`}
                          >
                            {notification.title}
                          </p>
                          <p
                            className={`text-xs mt-1 ${
                              notification.read
                                ? 'text-cosmic-accent opacity-75'
                                : 'text-cosmic-accent'
                            }`}
                          >
                            {notification.body}
                          </p>
                          <p className="text-xs text-cosmic-accent opacity-50 mt-2">
                            {formatTimeAgo(notification.created_at)}
                          </p>
                        </div>

                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification.id);
                            }}
                            className="ml-2 p-1 h-6 w-6 text-cosmic-accent hover:text-white"
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator className="bg-cosmic-accent bg-opacity-20" />
            <DropdownMenuItem
              className="p-3 cursor-pointer hover:bg-cosmic-accent hover:bg-opacity-10 text-center justify-center text-cosmic-accent hover:text-white"
              onClick={() => {
                window.location.href = '/notifications';
                setDropdownOpen(false);
              }}
            >
              View All Notifications
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;
