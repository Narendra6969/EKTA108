
"use client";

import Link from 'next/link';
import { HeartPulse, Menu, UserPlus, LogIn, LayoutDashboard, UserCircle, LogOut, HandCoins, Hospital, AmbulanceIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import React, { useState } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';


const navItems = [
  { href: '/report-accident', label: 'Report Accident' },
  { href: '/emergency-services', label: 'Emergency Services' },
  { href: '/donate', label: 'Donate' },
];

const RoleSwitcherMenu = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9 rounded-full">
          <UserCircle className="h-5 w-5" />
          <span className="sr-only">Select Role</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Switch UI Role</p>
            <p className="text-xs leading-none text-muted-foreground">Select a role to view its UI</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/hospital"><Hospital className="mr-2 h-4 w-4" /> Hospital Staff</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/ambulance"><AmbulanceIcon className="mr-2 h-4 w-4" /> Paramedic</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/user"><UserCircle className="mr-2 h-4 w-4" /> Citizen / Patient</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
         <DropdownMenuItem asChild>
            <Link href="/login"><LogIn className="mr-2 h-4 w-4" /> Go to Login Page</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};


export default function AppHeader() {
  const pathname = usePathname();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const closeSheet = () => setIsSheetOpen(false);

  const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <Button variant="ghost" asChild className={cn(
      "text-base font-medium transition-colors hover:text-primary",
      pathname === href ? "text-primary" : "text-muted-foreground"
    )}>
      <Link href={href} onClick={closeSheet}>{children}</Link>
    </Button>
  );
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="flex items-center gap-2 mr-6">
            <Link href="/" className="flex items-center gap-2" onClick={closeSheet}>
              <HeartPulse className="h-7 w-7 text-primary" />
              <span className="text-xl font-bold text-primary">EKTA108</span>
            </Link>
        </div>


        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-2">
          {navItems.map((item) => (
            <NavLink key={item.href} href={item.href}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        
        <div className="flex items-center gap-2 ml-auto">
             <RoleSwitcherMenu />
        </div>


        {/* Mobile Navigation */}
        <div className="ml-auto md:hidden">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col space-y-4 pt-6">
                {navItems.map((item) => (
                  <NavLink key={item.href} href={item.href}>
                    {item.label}
                  </NavLink>
                ))}
                 <div className="border-t pt-4 space-y-2">
                    <Button asChild className="w-full">
                        <Link href="/login" onClick={closeSheet}><LogIn className="mr-2" />Login / Signup</Link>
                    </Button>
                 </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
