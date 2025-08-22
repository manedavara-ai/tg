import { useEffect, useState, useRef } from "react";
import { Sun, Moon, Bell, User, Check, Trash2 } from "lucide-react";
import { io } from "socket.io-client";
import { formatDistanceToNow } from "date-fns";

const NOTIFICATION_TYPES = {
  NEW_USER: {
    icon: '👤',
    color: 'blue',
    label: 'New User'
  },
  PAYMENT: {
    icon: '💰',
    color: 'green',
    label: 'Payment'
  },
  KYC: {
    icon: '📝',
    color: 'purple',
    label: 'KYC'
  },
  DIGIO: {
    icon: '📄',
    color: 'red',
    label: 'Digio Error'
  },
  TELEGRAM_KICK: {
    icon: '🚫',
    color: 'orange',
    label: 'Telegram Kick'
  },
  SYSTEM: {
    icon: '⚙️',
    color: 'gray',
    label: 'System'
  }
};

const MAX_NOTIFICATIONS = 50; 
const NOTIFICATION_EXPIRY_DAYS = 7; 

const Navbar = ({ title = "Admin Panel" }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('notifications');
    return saved ? JSON.parse(saved) : [];
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [groupedNotifications, setGroupedNotifications] = useState({});
  const notificationRef = useRef(null);

  useEffect(() => {
   
    const now = new Date();
    const cleanedNotifications = notifications
      .filter(notification => {
        const notificationDate = new Date(notification.time);
        const daysDiff = (now - notificationDate) / (1000 * 60 * 60 * 24);
        return daysDiff <= NOTIFICATION_EXPIRY_DAYS;
      })
      .slice(0, MAX_NOTIFICATIONS);

    if (cleanedNotifications.length !== notifications.length) {
      setNotifications(cleanedNotifications);
    } else {
      localStorage.setItem('notifications', JSON.stringify(notifications));
    }

    setUnreadCount(notifications.filter(n => !n.read).length);
    
   
    const grouped = notifications.reduce((acc, notification) => {
      const type = notification.type || 'SYSTEM';
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(notification);
      return acc;
    }, {});
    setGroupedNotifications(grouped);
  }, [notifications]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const socket = io('http://localhost:4000');
    const telegramSocket = io('http://localhost:4000'); // Now using same port

    socket.on('connect', () => {
      console.log('Connected to main WebSocket server');
    });

    telegramSocket.on('connect', () => {
      console.log('Connected to Telegram bot WebSocket server');
    });

    socket.on('newUser', (user) => {
     
      const existingNotification = notifications.find(
        n => n.type === 'NEW_USER' && 
        n.message.includes(user.email || user.phone)
      );

      if (!existingNotification) {
        const newNotification = {
          id: Date.now(),
          type: 'NEW_USER',
          message: `New user registered: ${user.name || user.email || user.phone}`,
          time: new Date(),
          read: false,
          priority: 'high',
          userId: user._id || user.id 
        };
        
        setNotifications(prev => [newNotification, ...prev].slice(0, MAX_NOTIFICATIONS));
      }
    });

    socket.on('payment', (data) => {
      const newNotification = {
        id: Date.now(),
        type: 'PAYMENT',
        message: `New payment received: ${data.amount} from ${data.user}`,
        time: new Date(),
        read: false,
        priority: 'high',
        paymentId: data.paymentId 
      };
      
      setNotifications(prev => [newNotification, ...prev].slice(0, MAX_NOTIFICATIONS));
    });

    // Listen for Telegram bot kick notifications
    telegramSocket.on('telegramKick', (data) => {
      const newNotification = {
        id: Date.now(),
        type: 'TELEGRAM_KICK',
        message: `User kicked from Telegram: ${data.user} (${data.userId})`,
        time: new Date(),
        read: false,
        priority: 'high',
        userId: data.userId,
        reason: data.reason,
        channelId: data.channelId
      };
      
      setNotifications(prev => [newNotification, ...prev].slice(0, MAX_NOTIFICATIONS));
    });

    // Listen for Telegram bot error notifications
    telegramSocket.on('telegramError', (data) => {
      const newNotification = {
        id: Date.now(),
        type: 'TELEGRAM_KICK',
        message: `Telegram bot error: ${data.error} for user ${data.userId}`,
        time: new Date(),
        read: false,
        priority: 'high',
        userId: data.userId,
        error: data.error
      };
      
      setNotifications(prev => [newNotification, ...prev].slice(0, MAX_NOTIFICATIONS));
    });

    if (notifications.length === 0) {
      fetchInitialNotifications();
    }

    return () => {
      socket.disconnect();
      telegramSocket.disconnect();
    };
  }, [notifications]);

  const fetchInitialNotifications = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/kyc/all');
      const users = await response.json();
      
      
      const recentUsers = users
        .filter(user => {
          const userDate = new Date(user.createdAt || Date.now());
          const daysDiff = (new Date() - userDate) / (1000 * 60 * 60 * 24);
          return daysDiff <= NOTIFICATION_EXPIRY_DAYS;
        })
        .slice(0, 10);

      const initialNotifications = recentUsers.map(user => ({
        id: user._id || Date.now(),
        type: 'NEW_USER',
        message: `User registered: ${user.name || user.email || user.phone}`,
        time: new Date(user.createdAt || Date.now()),
        read: false,
        priority: 'normal',
        userId: user._id || user.id
      }));

      setNotifications(initialNotifications);
    } catch (error) {
      console.error('Error fetching initial notifications:', error);
    }
  };

 
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
    setShowNotifications(false);
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setShowNotifications(false);
  };

  let role
  const adminRole= localStorage.getItem('adminRole');
  if (adminRole === 'superadmin') {
    role = 'Super Admin';
  }else if (adminRole === 'admin') {
    role = 'Admin';
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] w-full flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold font-sans tracking-tight text-gray-900 dark:text-white">{title}</span>
        <span className="px-3 py-1 text-sm bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200 rounded-full">Dashboard</span>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="relative notification-container" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={clearAllNotifications}
                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="Clear all notifications"
                  >
                    <Trash2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
              </div>
              <div className="max-h-[60vh] overflow-y-auto">
                {Object.entries(groupedNotifications).length > 0 ? (
                  Object.entries(groupedNotifications).map(([type, typeNotifications]) => (
                    <div key={type} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                      <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700/50">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {NOTIFICATION_TYPES[type]?.icon} {NOTIFICATION_TYPES[type]?.label}
                        </span>
                      </div>
                      {typeNotifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 last:border-b-0 ${
                            !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="text-sm text-gray-900 dark:text-white">{notification.message}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {formatDistanceToNow(new Date(notification.time), { addSuffix: true })}
                              </p>
                            </div>
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="ml-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                              title="Delete notification"
                            >
                              <Trash2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-center text-gray-500 dark:text-gray-400">
                    No notifications
                  </div>
                )}
              </div>
              {notifications.length > 0 && (
                <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={markAllAsRead}
                    className="w-full text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Mark all as read
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          aria-label="Toggle dark mode"
        >
          {theme === 'dark' ? (
            <Sun className="text-yellow-400 w-5 h-5" />
          ) : (
            <Moon className="text-gray-600 w-5 h-5" />
          )}
        </button>

        <div className="flex items-center gap-2 pl-4 border-l border-gray-200 dark:border-gray-700">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{role}</span>

        </div>
      </div>
    </div>
  );
};

export default Navbar;
