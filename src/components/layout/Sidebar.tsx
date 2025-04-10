
import React from 'react';
import { Link } from "react-router-dom";
import { Calendar, Home, Settings, Building, Users, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  return (
    <aside 
      className={cn(
        "fixed inset-y-0 left-0 bg-white border-r border-gray-200 z-50 transition-all duration-300 ease-in-out",
        isOpen ? "w-64" : "w-0 -translate-x-full md:translate-x-0 md:w-16"
      )}
    >
      <div className="flex items-center justify-center h-14 border-b border-gray-200">
        {isOpen ? (
          <h1 className="text-xl font-bold">CalendaHub</h1>
        ) : (
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 text-white font-bold text-lg">
            C
          </div>
        )}
      </div>
      
      <nav className="mt-6 px-2">
        <SidebarLink to="/" icon={<Home />} text="Dashboard" isOpen={isOpen} />
        <SidebarLink to="/properties" icon={<Building />} text="Properties" isOpen={isOpen} />
        <SidebarLink to="/calendar" icon={<Calendar />} text="Calendar" isOpen={isOpen} />
        <SidebarLink to="/ical-links" icon={<LinkIcon />} text="iCal Links" isOpen={isOpen} />
        <SidebarLink to="/users" icon={<Users />} text="Users" isOpen={isOpen} />
        <SidebarLink to="/settings" icon={<Settings />} text="Settings" isOpen={isOpen} />
      </nav>
      
      <div className="absolute bottom-0 w-full p-4">
        {isOpen && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-blue-700">Need Help?</p>
            <p className="text-xs text-blue-600 mt-1">Check our documentation or contact support.</p>
          </div>
        )}
      </div>
    </aside>
  );
};

interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  text: string;
  isOpen: boolean;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ to, icon, text, isOpen }) => {
  const isActive = location.pathname === to;
  
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center py-2 px-3 mb-1 rounded-md transition-colors",
        isActive 
          ? "bg-blue-50 text-blue-700" 
          : "text-gray-600 hover:bg-gray-100",
        !isOpen && "justify-center"
      )}
    >
      <span className={isOpen ? "mr-3" : ""}>{icon}</span>
      {isOpen && <span>{text}</span>}
    </Link>
  );
};

export default Sidebar;
