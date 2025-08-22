import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { Outlet, useLocation } from "react-router";
import { useState } from "react";

const Layout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/admin/users')) return 'User Payments';
    if (path.includes('/admin/addplans')) return 'Add Plans';
    if (path.includes('/admin/viewplans')) return 'View Plans';
    if (path.includes('/admin/dashboard')) return 'Admin Panel';
    if (path.includes('/admin/kicked-users')) return 'Kicked Users';
    return 'Admin Panel';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar title={getPageTitle()} />
      <div className="flex pt-16">
        <Sidebar onCollapse={setIsCollapsed} />
        <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-14' : 'ml-48'}`}>
          <main>
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
