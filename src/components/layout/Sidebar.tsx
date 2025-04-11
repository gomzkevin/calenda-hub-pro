
import React from 'react';
import { Link, useLocation } from "react-router-dom";
import { Calendar, Home, Settings, Building, Users, Link as LinkIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  
  // Calculate if we should show the overlay
  const showOverlay = isOpen;
  
  return (
    <>
      {/* Backdrop overlay for mobile */}
      {showOverlay && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden" 
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}
      
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 bg-white border-r border-gray-200 z-50 transition-all duration-300 ease-in-out",
          isOpen ? "w-64 translate-x-0" : "-translate-x-full md:translate-x-0 md:w-64"
        )}
      >
        <div className="flex items-center justify-between h-14 border-b border-gray-200 px-4">
          <h1 className="text-xl font-bold">CalendaHub</h1>
          {isOpen && (
            <Button variant="ghost" size="sm" className="md:hidden" onClick={toggleSidebar}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <nav className="mt-6 px-2">
          <SidebarLink to="/" icon={<Home />} text="Dashboard" isActive={location.pathname === '/'} />
          <SidebarLink to="/properties" icon={<Building />} text="Properties" isActive={location.pathname === '/properties'} />
          <SidebarLink to="/calendar" icon={<Calendar />} text="Calendar" isActive={location.pathname === '/calendar'} />
          <SidebarLink to="/ical-links" icon={<LinkIcon />} text="iCal Links" isActive={location.pathname === '/ical-links'} />
          <SidebarLink to="/users" icon={<Users />} text="Users" isActive={location.pathname === '/users'} />
          <SidebarLink to="/settings" icon={<Settings />} text="Settings" isActive={location.pathname === '/settings'} />
        </nav>
        
        <div className="absolute bottom-0 w-full p-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-blue-700">Need Help?</p>
            <p className="text-xs text-blue-600 mt-1">Check our documentation or contact support.</p>
          </div>
        </div>
      </aside>
    </>
  );
};

interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  text: string;
  isActive: boolean;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ to, icon, text, isActive }) => {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center py-2 px-3 mb-1 rounded-md transition-colors",
        isActive 
          ? "bg-blue-50 text-blue-700" 
          : "text-gray-600 hover:bg-gray-100"
      )}
    >
      <span className="mr-3">{icon}</span>
      <span>{text}</span>
    </Link>
  );
};

export default Sidebar;
