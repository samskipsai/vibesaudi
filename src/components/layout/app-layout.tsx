import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './app-sidebar';
import { GlobalHeader } from './global-header';
import { AppsDataProvider } from '@/contexts/apps-data-context';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

interface AppLayoutProps {
  children?: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { pathname } = useLocation();
  const { i18n } = useTranslation();
  
  // Update document direction based on language
  useEffect(() => {
    const currentLang = i18n.language || 'en';
    const dir = currentLang === 'ar-SA' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = currentLang;
  }, [i18n.language]);
  
  return (
    <AppsDataProvider>
      <SidebarProvider 
        defaultOpen={false}
        style={{
          "--sidebar-width": "320px",
          "--sidebar-width-mobile": "280px",
          "--sidebar-width-icon": "52px"
        } as React.CSSProperties}
      >
        <AppSidebar />
        <SidebarInset className={clsx("bg-bg-3 flex flex-col h-screen relative", pathname !== "/" && "overflow-hidden")}>
          <GlobalHeader />
          <div className={clsx("flex-1 bg-bg-3", pathname !== "/" && "min-h-0 overflow-auto")}>
            {children || <Outlet />}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AppsDataProvider>
  );
}