
import { DashboardSidebar } from '@/components/layout/DashboardSidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { HeartPulse } from 'lucide-react';
import Link from 'next/link';
import type React from 'react';
import BottomNavigationBar from '@/components/layout/BottomNavigationBar';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/layout/BackButton';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen>
      <DashboardSidebar />
      <SidebarInset className="flex flex-col min-h-screen">
        {/* Header is now hidden on mobile and visible on desktop (md and up) */}
        <header className="sticky top-0 z-40 hidden h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:flex md:px-6">
            <div className="flex items-center gap-4">
                 <BackButton />
                 <Link href="/" className="flex items-center gap-2" title="Back to Homepage">
                    <HeartPulse className="h-7 w-7 text-primary" />
                 </Link>
            </div>
            <div className="flex items-center gap-2">
              <SidebarTrigger className="block" /> 
            </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto pb-20 md:pb-6"> {/* Increased bottom padding for mobile */}
          {children}
        </main>
        {/* Footer is now hidden on mobile to maximize screen space for the app content and bottom nav */}
        <footer className="hidden border-t bg-background/95 p-4 text-center text-xs text-muted-foreground md:block md:pb-4">
          EKTA108 Dashboard &copy; {new Date().getFullYear()}
        </footer>
      </SidebarInset>
      <BottomNavigationBar />
    </SidebarProvider>
  );
}
