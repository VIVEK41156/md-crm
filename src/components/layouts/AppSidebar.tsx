import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSite } from '@/contexts/SiteContext';
import { cn } from '@/lib/utils';
import type { UserRole, Profile } from '../../types/types';
import { motion, AnimatePresence } from 'framer-motion';

import {
  LayoutDashboard,
  Users,
  FileText,
  Search,
  Settings,
  Shield,
  BookOpen,
  Globe,
  ChevronDown,
  ArrowRight,
  LogOut,
  PanelLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['super_admin', 'admin', 'sales_manager', 'sales_person', 'seo_manager', 'seo_person', 'client'] as UserRole[] },
  { name: 'Leads', href: '/leads', icon: Users, roles: ['super_admin', 'admin', 'sales_manager', 'sales_person', 'client'] as UserRole[] },
  { name: 'SEO Meta Tags', href: '/seo', icon: Search, roles: ['super_admin', 'admin', 'seo_manager', 'seo_person'] as UserRole[] },
  { name: 'Blogs', href: '/blogs', icon: BookOpen, roles: ['super_admin', 'admin', 'seo_manager', 'seo_person'] as UserRole[] },
  { name: 'Sites', href: '/sites', icon: Globe, roles: ['super_admin'] as UserRole[] },
  { name: 'IP Security', href: '/ip-security', icon: Shield, roles: ['super_admin', 'admin'] as UserRole[] },
  { name: 'Subscription', href: '/subscription', icon: FileText, roles: ['client'] as UserRole[] },
  { name: 'User Management', href: '/users', icon: Settings, roles: ['super_admin', 'admin'] as UserRole[] },
  { name: 'Permissions', href: '/permissions', icon: Shield, roles: ['super_admin'] as UserRole[] },
  { name: 'Activity Logs', href: '/activity', icon: FileText, roles: ['super_admin', 'admin', 'sales_manager', 'seo_manager'] as UserRole[] },
];

interface AppSidebarProps {
  isCollapsed?: boolean;
  toggleSidebar?: () => void;
}

export function AppSidebar({ isCollapsed = false, toggleSidebar }: AppSidebarProps) {
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const { currentSite, setCurrentSite, getAccessibleSites } = useSite();

  // Get sites based on user role
  const accessibleSites = profile
    ? getAccessibleSites((profile as Profile).id, (profile as Profile).role)
    : [];

  const filteredNavigation = navigation.filter(item =>
    profile && item.roles.includes((profile as Profile).role as UserRole)
  );

  return (
    <div className={cn(
      "flex h-full flex-col bg-gradient-to-b from-[#1F86E0] to-[#0A4F8B] text-white shadow-2xl relative transition-all duration-300",
      isCollapsed ? "w-[80px]" : "w-72"
    )}>

      {/* Header */}
      <div className={cn(
        "flex h-20 items-center z-10 flex-shrink-0 transition-all duration-300",
        isCollapsed ? "justify-center px-2" : "justify-between px-6"
      )}>
        <div className={cn("flex items-center gap-3", isCollapsed ? "justify-center w-full" : "")}>
          {/* Logo / Home */}
          {!isCollapsed ? (
            <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-md border border-white/20 shadow-lg shrink-0">
              <LayoutDashboard className="h-6 w-6 text-white" />
            </div>
          ) : (
            // In collapsed mode, the toggle button acts as the header interaction or we show a simplified logo that acts as toggle?
            // User asked for toggle icon in empty space (Open state).
            // For collapsed state, we often toggle via this button too.
            // Let's show the Toggle Icon ONLY when collapsed? Or both?
            // If I replace logo with toggle when collapsed, it works well.
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="text-white hover:bg-white/10"
            >
              <PanelLeft className="h-6 w-6" />
            </Button>
          )}

          {!isCollapsed && (
            <>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <h1 className="text-lg font-bold tracking-tight text-white leading-none">Marketing</h1>
                <span className="text-xs text-blue-100 font-medium">Dashboard</span>
              </motion.div>

              {/* Toggle Button (Open State) */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="text-white/70 hover:text-white hover:bg-white/10 ml-auto"
              >
                <PanelLeft className="h-5 w-5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Site Switcher */}
      {accessibleSites.length > 0 && !isCollapsed && (
        <div className="px-4 py-3 z-10 flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm h-12 rounded-xl transition-all duration-300 group shadow-lg"
              >
                <span className="flex items-center gap-2.5 truncate">
                  <div className="p-1.5 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
                    <Globe className="h-4 w-4 flex-shrink-0" />
                  </div>
                  <span className="truncate font-medium text-sm">{currentSite?.name || 'Select Site'}</span>
                </span>
                <ChevronDown className="h-4 w-4 flex-shrink-0 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[15rem] p-2 bg-white/95 backdrop-blur-xl border-white/20 shadow-xl rounded-xl">
              {accessibleSites.map((site) => (
                <DropdownMenuItem
                  key={site.id}
                  onClick={() => setCurrentSite(site.id)}
                  className={cn(
                    'cursor-pointer rounded-lg px-3 py-2.5 my-0.5 font-medium transition-colors',
                    currentSite?.id === site.id
                      ? 'bg-[#1F86E0]/10 text-[#1F86E0]'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <Globe className="mr-3 h-4 w-4 opacity-70" />
                  <span className="truncate">{site.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1 px-4 py-2 z-10">
        <nav className="space-y-1.5">
          <TooltipProvider delayDuration={0}>
            <AnimatePresence>
              {filteredNavigation.map((item, index) => {
                const isActive = location.pathname === item.href;
                const content = (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link to={item.href}>
                      <div
                        className={cn(
                          'relative flex items-center rounded-xl transition-all duration-300 group overflow-hidden',
                          isActive
                            ? 'text-[#1F86E0] bg-white shadow-lg shadow-black/10 font-semibold scale-[1.02]'
                            : 'text-white/90 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/20',
                          isCollapsed ? "justify-center px-2 py-3" : "px-4 py-3.5"
                        )}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeTab"
                            className="absolute inset-0 bg-white rounded-xl z-0"
                            transition={{ type: "spring", stiffness: 380, damping: 35 }}
                          />
                        )}

                        <item.icon className={cn(
                          "relative z-10 transition-transform duration-300 group-hover:scale-110",
                          isActive ? "text-[#1F86E0]" : "opacity-90",
                          isCollapsed ? "h-6 w-6" : "mr-3 h-5 w-5"
                        )} />

                        {!isCollapsed && (
                          <span className="relative z-10 text-sm whitespace-nowrap">{item.name}</span>
                        )}

                        {!isActive && !isCollapsed && (
                          <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
                          </div>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                )

                if (isCollapsed) {
                  return (
                    <Tooltip key={item.name}>
                      <TooltipTrigger asChild>
                        {content}
                      </TooltipTrigger>
                      <TooltipContent side="right" className="ml-2 font-medium">
                        {item.name}
                      </TooltipContent>
                    </Tooltip>
                  )
                }

                return content;
              })}
            </AnimatePresence>
          </TooltipProvider>
        </nav>
      </ScrollArea>

      {/* Sign Out Button */}
      <div className={cn("z-10 flex-shrink-0", isCollapsed ? "px-2 pb-4" : "px-4 pb-4")}>
        {isCollapsed ? (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={() => signOut()}
                  className="w-full justify-center text-white/90 hover:text-white hover:bg-white/10 h-11 rounded-xl transition-all border border-transparent hover:border-white/20"
                >
                  <LogOut className="h-5 w-5 opacity-70" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="ml-2 font-medium">Sign Out</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Button
            variant="ghost"
            onClick={() => signOut()}
            className="w-full justify-start text-white/90 hover:text-white hover:bg-white/10 h-11 rounded-xl gap-3 pl-4 transition-all border border-transparent hover:border-white/20"
          >
            <ArrowRight className="h-5 w-5 opacity-70" />
            <span className="text-sm">Sign Out</span>
          </Button>
        )}
      </div>

      {/* User Profile */}
      <div className={cn("z-10 flex-shrink-0 px-4 pb-6", isCollapsed && "px-2")}>
        <div className={cn(
          "flex items-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 transition-all duration-300",
          isCollapsed ? "justify-center p-2" : "gap-3 px-3 py-3"
        )}>
          <Link to="/profile">
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold border-2 border-white/30 shadow-inner shrink-0 cursor-pointer hover:scale-105 transition-transform">
              {(profile as Profile)?.username?.charAt(0).toUpperCase() || 'A'}
            </div>
          </Link>
          {!isCollapsed && (
            <div className="flex flex-col overflow-hidden flex-1">
              <span className="text-sm font-semibold truncate">{(profile as Profile)?.username || 'admin'}</span>
              <span className="text-[10px] text-blue-100 uppercase tracking-wider font-medium">{(profile as Profile)?.role || 'ADMIN'}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
