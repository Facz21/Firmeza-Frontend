import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { CartDrawer } from '../../features/orders/components/CartDrawer';

export const MainLayout: React.FC = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f6f8]">
      <Navbar onOpenMobileMenu={() => setIsMobileSidebarOpen(true)} />
      <div className="flex flex-1">
        <Sidebar
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
      <CartDrawer />
    </div>
  );
};
