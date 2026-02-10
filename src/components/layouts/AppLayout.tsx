import { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen w-full">
      <aside className="hidden md:block shrink-0 w-72">
        <AppSidebar />
      </aside>
      <div className="flex-1 flex flex-col">
        <AppHeader />
        <main className="flex-1 p-0" style={{ background: '#F9FAFB' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
