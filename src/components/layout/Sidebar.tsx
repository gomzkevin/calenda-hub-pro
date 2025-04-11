
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Home,
  Calendar,
  ListPlus,
  Settings,
  Users,
  CalendarClock
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const location = useLocation();
  
  const links = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Properties', path: '/properties', icon: <Home size={20} /> },
    { name: 'Calendar', path: '/calendar', icon: <Calendar size={20} /> },
    { name: 'Reservations', path: '/reservations', icon: <CalendarClock size={20} /> },
    { name: 'iCal Links', path: '/ical-links', icon: <ListPlus size={20} /> },
    { name: 'Users', path: '/users', icon: <Users size={20} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} /> },
  ];
  
  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };
  
  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}
    >
      <div className="flex flex-col h-full">
        <div className="p-4 border-b">
          <div className="flex items-center justify-center mb-1">
            <img 
              src="/lovable-uploads/a72ac6bb-b10f-43f4-a78c-f27f17d50101.png" 
              alt="Alanto Logo" 
              className="h-14" 
            />
          </div>
          <p className="text-xs text-gray-500 text-center">Más ingresos, menos estrés</p>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "flex items-center py-2 px-3 rounded-lg text-sm font-medium transition-colors",
                isActive(link.path)
                  ? "bg-primary/10 text-primary"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <span className={cn(
                "mr-3",
                isActive(link.path) ? "text-primary" : "text-gray-500"
              )}>
                {link.icon}
              </span>
              {link.name}
            </Link>
          ))}
        </nav>
        
        <div className="p-4 border-t text-xs text-gray-500">
          <p>© 2025 Alanto</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
