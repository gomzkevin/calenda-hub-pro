
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Home,
  Calendar,
  ListPlus,
  Settings,
  Users,
  CalendarClock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);
  
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
  
  const handleMouseEnter = () => {
    if (!isOpen) {
      setIsHovered(true);
    }
  };
  
  const handleMouseLeave = () => {
    setIsHovered(false);
  };
  
  // Reset hover state when sidebar is explicitly opened
  useEffect(() => {
    if (isOpen) {
      setIsHovered(false);
    }
  }, [isOpen]);
  
  // Determine if sidebar should be expanded (either explicitly open or hovered)
  const shouldExpand = isOpen || isHovered;
  
  return (
    <>
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col",
          shouldExpand ? "w-64" : "w-16"
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex justify-end p-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            onClick={toggleSidebar}
          >
            {shouldExpand ? (
              <ChevronLeft size={18} />
            ) : (
              <ChevronRight size={18} />
            )}
          </Button>
        </div>
        
        <div className="flex flex-col h-full">
          <div className="p-4 border-b flex flex-col items-center">
            <div className="flex items-center justify-center mb-1">
              <img 
                src="/lovable-uploads/fc627b57-8457-4065-807e-6048456e3921.png" 
                alt="Alanto Logo" 
                className="h-6" /* Further reduced from h-7 to h-6 */
              />
            </div>
            <p className={cn("text-xs text-gray-500 text-center transition-opacity duration-300", 
              shouldExpand ? "opacity-100" : "opacity-0 h-0")}
            >
              Más ingresos, menos estrés
            </p>
          </div>
          
          <nav className="flex-1 overflow-y-auto p-2 space-y-1">
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
                <span className={cn(
                  "transition-opacity duration-300 whitespace-nowrap",
                  shouldExpand ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
                )}>
                  {link.name}
                </span>
              </Link>
            ))}
          </nav>
          
          <div className={cn(
            "p-4 border-t text-xs text-gray-500 transition-opacity duration-300",
            shouldExpand ? "opacity-100" : "opacity-0 h-0"
          )}>
            <p>© 2025 Alanto</p>
          </div>
        </div>
      </div>
      
      {/* Overlay for mobile when sidebar is open */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/50 z-30 md:hidden transition-opacity duration-300",
          shouldExpand ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={toggleSidebar}
      />
    </>
  );
};

export default Sidebar;
