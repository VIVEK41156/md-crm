import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSite } from '@/contexts/SiteContext';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types/types';
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
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

export function AppSidebar() {
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const { currentSite, setCurrentSite, getAccessibleSites } = useSite();

  // Get sites based on user role
  const accessibleSites = profile
    ? getAccessibleSites(String(profile.id), profile.role)
    : [];

  const filteredNavigation = navigation.filter(item =>
    profile && item.roles.includes(profile.role as UserRole)
  );

  return (
    <div className="flex h-full w-72 flex-col bg-gradient-to-b from-[#1F86E0] to-[#0A4F8B] text-white shadow-2xl relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
        <Globe className="w-64 h-64 -mr-24 -mt-24 rotate-12" />
      </div>

      <div className="flex h-20 items-center justify-between px-6 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md border border-white/20 shadow-inner">
            <LayoutDashboard className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white leading-none">Marketing</h1>
            <span className="text-xs text-blue-100 font-medium">Dashboard</span>
          </div>
        </div>
      </div>

      {/* Site Switcher */}
      {accessibleSites.length > 0 && (
        <div className="px-6 py-4 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-sm h-12 rounded-xl transition-all duration-300 group"
              >
                <span className="flex items-center gap-3 truncate">
                  <div className="p-1.5 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
                    <Globe className="h-4 w-4 flex-shrink-0" />
                  </div>
                  <span className="truncate font-medium">{currentSite?.name || 'Select Site'}</span>
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

      <ScrollArea className="flex-1 px-4 py-2 z-10">
        <nav className="space-y-1.5">
          <AnimatePresence>
            {filteredNavigation.map((item, index) => {
              const isActive = location.pathname === item.href;
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link to={item.href}>
                    <div
                      className={cn(
                        'relative flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 group overflow-hidden',
                        isActive
                          ? 'text-[#1F86E0] bg-white shadow-lg shadow-black/5 font-semibold'
                          : 'text-blue-50 hover:bg-white/10 hover:text-white'
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-0 bg-white rounded-xl z-0"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}

                      <item.icon className={cn(
                        "mr-3 h-5 w-5 relative z-10 transition-colors duration-200",
                        isActive ? "text-[#1F86E0]" : "opacity-80 group-hover:opacity-100"
                      )} />
                      <span className="relative z-10">{item.name}</span>

                      {!isActive && (
                        <ChevronDown className="ml-auto h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-50 group-hover:translate-x-0 transition-all duration-200 -rotate-90" />
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </nav>
      </ScrollArea>

      <div className="p-6 mt-auto z-10">
        <Button
          variant="ghost"
          onClick={() => signOut()}
          className="w-full justify-start text-blue-100 hover:text-white hover:bg-white/10 h-11 rounded-xl gap-3 pl-4 transition-all"
        >
          <LogOut className="h-5 w-5 opacity-70" />
          <span>Sign Out</span>
        </Button>

        <div className="mt-6 flex items-center gap-3 px-2 pt-4 border-t border-white/10">
          <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold border border-white/30">
            {profile?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-medium truncate">{profile?.username || 'User'}</span>
            <span className="text-[10px] text-blue-200 uppercase tracking-wider">{profile?.role || 'Role'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

