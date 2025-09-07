import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Filter, Search, Trash2, Eye, EyeOff } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  Notification,
  NotificationType,
} from '@/api/notifications';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const Notifications: React.FC = () => {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all');
  const [readFilter, setReadFilter] = useState<'all' | 'read' | 'unread'>('all');
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  const loadNotifications = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const result = await getNotifications(user.id, {
        limit: 100, // Load more for the full page
      });
      if (result.data) {
        setNotifications(result.data);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
      // Update local state
      setNotifications((prev) =>
        prev.map((notif) => (notif.id === notificationId ? { ...notif, read: true } : notif)),
      );
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
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
      // Update local state
      setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }

    // Handle deep linking
    if (notification.link) {
      window.location.href = notification.link;
    }
  };

  // Filter notifications based on search and filters
  useEffect(() => {
    let filtered = notifications;

    // Apply tab filter
    if (activeTab === 'unread') {
      filtered = filtered.filter((notif) => !notif.read);
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((notif) => notif.type === typeFilter);
    }

    // Apply read filter
    if (readFilter !== 'all') {
      filtered = filtered.filter((notif) => notif.read === (readFilter === 'read'));
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (notif) =>
          notif.title.toLowerCase().includes(query) || notif.body.toLowerCase().includes(query),
      );
    }

    setFilteredNotifications(filtered);
  }, [notifications, activeTab, typeFilter, readFilter, searchQuery]);

  useEffect(() => {
    if (user?.id) {
      loadNotifications();
    }
  }, [user?.id]);

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

  const getTypeColor = (type: NotificationType) => {
    switch (type) {
      case 'message':
        return 'bg-blue-500';
      case 'deliverable':
        return 'bg-green-500';
      case 'feedback':
        return 'bg-yellow-500';
      case 'invoice':
        return 'bg-purple-500';
      case 'budget':
        return 'bg-red-500';
      case 'system':
        return 'bg-gray-500';
      default:
        return 'bg-cosmic-accent';
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

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (!user?.id) {
    return (
      <div className="min-h-screen bg-cosmic-dark flex items-center justify-center">
        <div className="text-center">
          <Bell className="w-16 h-16 text-cosmic-accent mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Notifications</h1>
          <p className="text-cosmic-accent">Please sign in to view your notifications.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cosmic-dark p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Bell className="w-8 h-8 text-cosmic-highlight" />
            <div>
              <h1 className="text-3xl font-bold text-white">Notifications</h1>
              <p className="text-cosmic-accent">
                {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <Button
              onClick={handleMarkAllAsRead}
              variant="outline"
              className="border-cosmic-accent text-cosmic-accent hover:bg-cosmic-accent hover:text-white"
            >
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark All Read
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card className="mb-6 bg-cosmic-light bg-opacity-10 border-cosmic-accent border-opacity-20">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-cosmic-accent" />
                  <Input
                    placeholder="Search notifications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-cosmic-dark border-cosmic-accent border-opacity-20 text-white"
                  />
                </div>
              </div>

              {/* Type Filter */}
              <Select
                value={typeFilter}
                onValueChange={(value) => setTypeFilter(value as NotificationType | 'all')}
              >
                <SelectTrigger className="w-full md:w-48 bg-cosmic-dark border-cosmic-accent border-opacity-20 text-white">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent className="bg-cosmic-light border-cosmic-accent border-opacity-20">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="message">Messages</SelectItem>
                  <SelectItem value="deliverable">Deliverables</SelectItem>
                  <SelectItem value="feedback">Feedback</SelectItem>
                  <SelectItem value="invoice">Invoices</SelectItem>
                  <SelectItem value="budget">Budget</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>

              {/* Read Status Filter */}
              <Select
                value={readFilter}
                onValueChange={(value) => setReadFilter(value as 'all' | 'read' | 'unread')}
              >
                <SelectTrigger className="w-full md:w-32 bg-cosmic-dark border-cosmic-accent border-opacity-20 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-cosmic-light border-cosmic-accent border-opacity-20">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'all' | 'unread')}
          className="w-full"
        >
          <TabsList className="bg-cosmic-light bg-opacity-20 border border-cosmic-accent border-opacity-20">
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-cosmic-accent data-[state=active]:text-white"
            >
              All Notifications
            </TabsTrigger>
            <TabsTrigger
              value="unread"
              className="data-[state=active]:bg-cosmic-accent data-[state=active]:text-white"
            >
              Unread ({unreadCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="text-cosmic-accent">Loading notifications...</div>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <Card className="bg-cosmic-light bg-opacity-10 border-cosmic-accent border-opacity-20">
                <CardContent className="p-12 text-center">
                  <Bell className="w-16 h-16 text-cosmic-accent mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No notifications found</h3>
                  <p className="text-cosmic-accent">
                    {notifications.length === 0
                      ? "You don't have any notifications yet."
                      : 'No notifications match your current filters.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredNotifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`bg-cosmic-light bg-opacity-10 border-cosmic-accent border-opacity-20 hover:bg-opacity-20 transition-colors cursor-pointer ${
                      !notification.read ? 'border-l-4 border-l-cosmic-highlight' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="flex-shrink-0">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center ${getTypeColor(
                                notification.type,
                              )}`}
                            >
                              <span className="text-lg">
                                {getNotificationIcon(notification.type)}
                              </span>
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h3
                                    className={`font-semibold ${
                                      notification.read ? 'text-cosmic-accent' : 'text-white'
                                    }`}
                                  >
                                    {notification.title}
                                  </h3>
                                  <Badge variant="secondary" className="text-xs">
                                    {notification.type}
                                  </Badge>
                                  {!notification.read && (
                                    <Badge
                                      variant="default"
                                      className="text-xs bg-cosmic-highlight"
                                    >
                                      New
                                    </Badge>
                                  )}
                                </div>

                                <p
                                  className={`text-sm mb-2 ${
                                    notification.read
                                      ? 'text-cosmic-accent opacity-75'
                                      : 'text-cosmic-accent'
                                  }`}
                                >
                                  {notification.body}
                                </p>

                                <div className="flex items-center space-x-4 text-xs text-cosmic-accent opacity-75">
                                  <span>{formatTimeAgo(notification.created_at)}</span>
                                  {notification.link && (
                                    <span className="text-cosmic-highlight">Click to view</span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center space-x-2 ml-4">
                                {!notification.read ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMarkAsRead(notification.id);
                                    }}
                                    className="text-cosmic-accent hover:text-white"
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                ) : (
                                  <div className="w-8 h-8 flex items-center justify-center">
                                    <CheckCheck className="w-4 h-4 text-cosmic-accent opacity-50" />
                                  </div>
                                )}

                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => e.stopPropagation()}
                                      className="text-red-400 hover:text-red-300"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="bg-cosmic-light border-cosmic-accent border-opacity-20">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="text-white">
                                        Delete Notification
                                      </AlertDialogTitle>
                                      <AlertDialogDescription className="text-cosmic-accent">
                                        Are you sure you want to delete this notification? This
                                        action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel className="border-cosmic-accent text-cosmic-accent hover:bg-cosmic-accent hover:text-white">
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteNotification(notification.id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Notifications;
