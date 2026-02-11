import { ReactNode, useState, useEffect } from 'react';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768; // md breakpoint
      setIsMobile(mobile);
      if (mobile) {
        setIsCollapsed(true); // Default to collapsed/hidden logic on mobile if needed, but usually mobile has its own sheet
      } else {
        setIsCollapsed(false);
      }
    };

    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed(prev => !prev);
  };

  const sidebarWidth = isCollapsed ? 80 : 288; // 5rem vs 18rem

  return (
    <div className="flex min-h-screen w-full overflow-hidden bg-[#F9FAFB]">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <motion.aside
          initial={{ width: 288 }}
          animate={{
            width: sidebarWidth,
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={cn(
            "fixed left-0 top-0 h-screen z-40 shadow-xl border-r border-gray-200/50 bg-white", // Added bg-white to ensure no transparency issues
            "overflow-visible" // Allow toggle button to overlap
          )}
        >
          <AppSidebar
            isCollapsed={isCollapsed}
            toggleSidebar={toggleSidebar}
          />
        </motion.aside>
      )}

      {/* Main Content Wrapper */}
      <motion.div
        className="flex-1 flex flex-col min-h-screen relative"
        animate={{
          marginLeft: !isMobile ? sidebarWidth : 0
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <AppHeader />

        <main className="flex-1 p-0 relative overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </motion.div>
    </div>
  );
}
