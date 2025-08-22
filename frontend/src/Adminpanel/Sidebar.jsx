import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  NotebookPen,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  UserX,
  UserPlus,
  UsersRound 
} from "lucide-react";
import axios from "axios";

const Sidebar = ({ onCollapse }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [hasDigioErrors, setHasDigioErrors] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkDigioErrors = async () => {
      try {
        console.log('Checking for Digio errors...');
        const response = await axios.get('http://localhost:4000/api/digio/errors');
        console.log('Digio errors response:', response.data);
        const hasUnresolvedErrors = response.data.some(error => error.status === 'unresolved');
        console.log('Has unresolved errors:', hasUnresolvedErrors);
        setHasDigioErrors(hasUnresolvedErrors);
      } catch (err) {
        console.error('Error checking Digio errors:', err);
        setHasDigioErrors(false);
      }
    };

    checkDigioErrors();
    const interval = setInterval(checkDigioErrors, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCollapse = () => {
    setCollapsed(!collapsed);
    onCollapse?.(!collapsed);
  };

  const role = localStorage.getItem('adminRole');

  const navItems = [
    { path: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/admin/users", label: "Users", icon: Users },
    { path: "/admin/viewplans", label: "View Plans", icon: Sparkles },
    { path: "/admin/addplans", label: "Add Plans", icon: NotebookPen },
    { path: "/admin/digio-errors", label: "Digio Errors", icon: AlertTriangle },
    { path: "/admin/kicked-users", label: "Kicked Users", icon: UserX },
    ...(role === 'superadmin' ? [{ path: "/admin/create-admin", label: "Create Admin", icon: UserPlus }] : []),
    { path: "/admin/Group", label: "Group", icon: UsersRound  },
  ];

  const logout = () => {
    localStorage.removeItem("auth");
    localStorage.removeItem("token");
    localStorage.removeItem("adminRole");
    window.location.href = "/loginAdmin";
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 text-gray-800 dark:text-white h-[calc(100vh-3rem)] overflow-y-auto transition-all duration-300 ${
        collapsed ? "w-14" : "w-48"
      } fixed top-16 left-0 z-40 border-r border-gray-200 dark:border-gray-700 shadow-sm`}
      style={{ position: 'fixed', height: 'calc(100vh - 3rem)' }}
    >
      {/* className="flex justify-end p-2.5"  */}
      <div className={`flex p-2.5 ${collapsed ? "justify-center" : "justify-end"}`}>
        <button
          onClick={handleCollapse} 
          className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          {collapsed ? <ChevronRight className="justify-center" size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="space-y-1 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2 px-2.5 py-2 rounded-lg transition-all duration-200 group relative ${
                isActive
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700/50"
              }`}
            >
              <Icon size={18} className={`shrink-0 ${isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}`} />
              {!collapsed && (
                <span className={`text-sm ${isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-300"}`}>
                  {item.label}
                </span>
              )}
              {isActive && !collapsed && (
                <span className="absolute left-0 top-0 h-full w-1 bg-blue-500 rounded-r-full"></span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-8 w-full px-2">
        <button
          onClick={logout}
          className="flex items-center gap-2 text-red-600 px-2.5 py-2 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg w-full"
        >
          <LogOut size={18} />
          {!collapsed && <span className="text-sm">Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
