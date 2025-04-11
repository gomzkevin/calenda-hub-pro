
import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className="flex-1 transition-all duration-300 ease-in-out">
        <Header toggleSidebar={toggleSidebar} />
        
        <main className="p-4 md:p-6 overflow-auto" style={{ height: 'calc(100vh - 57px)' }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
