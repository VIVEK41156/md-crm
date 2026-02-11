import { ReactNode, useState, useEffect } from 'react';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768; // md breakpoint
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  return (
    <div className="flex min-h-screen w-full overflow-hidden bg-[#F9FAFB]">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <motion.aside
          initial={{ width: 288 }} // w-72 = 18rem = 288px
          animate={{
            width: isSidebarOpen ? 288 : 0,
            opacity: isSidebarOpen ? 1 : 0
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={cn(
            "fixed left-0 top-0 h-screen z-40 overflow-hidden shadow-xl border-r border-gray-200/50",
            !isSidebarOpen && "pointer-events-none"
          )}
        >
          <div className="w-72 h-full">
            <AppSidebar />
          </div>
        </motion.aside>
      )}

      {/* Main Content Wrapper */}
      <motion.div
        className="flex-1 flex flex-col min-h-screen relative"
        animate={{
          marginLeft: !isMobile && isSidebarOpen ? 288 : 0
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <AppHeader
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
          isMobile={isMobile}
        />

        <main className="flex-1 p-0 relative overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </motion.div>
    </div>
  );
}
