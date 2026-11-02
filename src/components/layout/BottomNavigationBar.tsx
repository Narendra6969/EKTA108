
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Hospital as HospitalIcon, AmbulanceIcon, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard/hospital', label: 'Hospital', icon: <HospitalIcon className="h-5 w-5" /> },
  { href: '/dashboard/ambulance', label: 'Ambulance', icon: <AmbulanceIcon className="h-5 w-5" /> },
  { href: '/dashboard/user', label: 'User', icon: <User className="h-5 w-5" /> },
];

export default function BottomNavigationBar() {
  const pathname = usePathname();

  // On the main dashboard page, no icon should be active.
  const isDashboardRoot = pathname === '/dashboard';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 p-1 shadow-[0_-2px_5px_-1px_rgba(0,0,0,0.1)] md:hidden">
      <div className="container mx-auto flex justify-around items-center h-14">
        {navItems.map((item) => {
          const isActive = !isDashboardRoot && pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center space-y-1 rounded-md p-2 text-xs transition-colors w-1/3", // Adjusted for 3 items
                isActive ? "text-primary font-medium" : "text-muted-foreground hover:text-primary/80"
              )}
            >
              {item.icon}
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

    