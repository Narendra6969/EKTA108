
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { HeartPulse, LayoutDashboard, Hospital as HospitalIcon, AmbulanceIcon, User as UserIcon, Settings, LogOut, Users, Warehouse, BriefcaseMedical, Pill, Video, ScanEye } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, type User as FirebaseUser } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useFirebaseAuth } from '@/lib/firebase';

const mainNavItems = [
  { href: '/dashboard/hospital', label: 'Hospital Management', icon: <HospitalIcon /> },
  { href: '/dashboard/ambulance', label: 'Ambulance Console', icon: <AmbulanceIcon /> },
  { href: '/dashboard/user', label: 'User Dashboard', icon: <UserIcon /> },
];

const adminNavItems = [
  { href: '/dashboard/users', label: 'Manage Users', icon: <Users /> },
  { href: '/dashboard/staff', label: 'Manage Staff', icon: <BriefcaseMedical /> },
  { href: '/dashboard/inventory', label: 'Manage Inventory', icon: <Warehouse /> },
  { href: '/dashboard/donors', label: 'Manage Donors', icon: <HeartPulse /> },
  { href: '/dashboard/medications', label: 'Manage Medications', icon: <Pill /> },
  { href: '/dashboard/video', label: 'Generate Video', icon: <Video /> },
  { href: '/dashboard/retina-scanner', label: 'Retina Scanner', icon: <ScanEye /> },
];

const secondaryNavItems = [
  { href: '/dashboard/settings', label: 'Settings', icon: <Settings /> },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { toast } = useToast();
  const { state: sidebarState } = useSidebar();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const auth = useFirebaseAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, [auth]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      // The user will be redirected via the main layout or page logic
    } catch (error) {
      console.error("Logout Error:", error);
      toast({ variant: "destructive", title: "Logout Failed", description: "An error occurred during logout." });
    }
  };

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="h-16 flex items-center justify-between p-2">
        <Link href="/" className="flex items-center gap-2" title="EKTA108 Homepage">
          <HeartPulse className="h-7 w-7 text-sidebar-primary" />
           {sidebarState === 'expanded' && (
            <span className="text-xl font-bold text-sidebar-primary">EKTA108</span>
          )}
        </Link>
        <div className="md:hidden">
            <SidebarTrigger /> 
        </div>
      </SidebarHeader>
      <SidebarContent className="flex-1 p-2">
        <SidebarMenu>
          {mainNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(item.href)}
                tooltip={{ content: item.label, side: "right", align: "center" }}
              >
                <Link href={item.href}>
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <SidebarMenu className="mt-4 border-t border-sidebar-border pt-4">
           <p className="px-2 text-xs font-semibold text-sidebar-foreground/70 mb-2 group-data-[collapsible=icon]:hidden">Admin</p>
            {adminNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(item.href)}
                tooltip={{ content: item.label, side: "right", align: "center" }}
              >
                <Link href={item.href}>
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2 space-y-2">
         <SidebarMenu>
          {secondaryNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(item.href) && item.href !== '/'}
                tooltip={{ content: item.label, side: "right", align: "center" }}
              >
                <Link href={item.href}>
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
         <div className="border-t border-sidebar-border pt-2">
            {user ? (
               <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                        onClick={handleLogout}
                        tooltip={{ content: "Logout", side: "right", align: "center" }}
                    >
                        <LogOut />
                        <span>Logout</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
               </SidebarMenu>
            ) : null}
         </div>
         {user && sidebarState === 'expanded' && (
            <div className="flex items-center gap-2 p-2 rounded-md bg-sidebar-accent/50 text-sidebar-accent-foreground">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL || undefined} data-ai-hint="user avatar" />
                    <AvatarFallback>{user.displayName ? user.displayName.charAt(0) : user.email?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="overflow-hidden">
                    <p className="text-sm font-semibold truncate">{user.displayName || 'User'}</p>
                    <p className="text-xs text-sidebar-foreground/70 truncate">{user.email}</p>
                </div>
            </div>
         )}
      </SidebarFooter>
    </Sidebar>
  );
}
