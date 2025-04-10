
import React from 'react';
import { Button } from '@/components/ui/button';
import { sampleUsers } from '@/data/mockData';
import { Bell, Calendar, ChevronDown, Menu } from 'lucide-react';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const currentUser = sampleUsers[0]; // Using admin user for now

  return (
    <header className="bg-white border-b border-gray-200 py-3 px-4 flex items-center justify-between">
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar}
          className="mr-2 md:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold hidden md:block">CalendaHub Pro</h1>
      </div>
      
      <div className="flex items-center space-x-3">
        <Button variant="ghost" size="icon" className="text-gray-500">
          <Bell className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center">
          <div className="rounded-full bg-blue-500 w-8 h-8 flex items-center justify-center text-white font-medium">
            {currentUser.name.charAt(0)}
          </div>
          <div className="ml-2 hidden md:block">
            <p className="text-sm font-medium">{currentUser.name}</p>
            <p className="text-xs text-gray-500">{currentUser.role}</p>
          </div>
          <ChevronDown className="h-4 w-4 ml-1 text-gray-500" />
        </div>
      </div>
    </header>
  );
};

export default Header;
