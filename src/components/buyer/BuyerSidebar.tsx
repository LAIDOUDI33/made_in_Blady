'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Search,
  FileText,
  PlusCircle,
  Inbox,
  ShoppingCart,
  Heart,
  MessageSquare,
  Users,
  UserCog,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

const navItems: NavItem[] = [
  {
    title: 'Tableau de bord',
    href: '/dashboard/buyer',
    icon: LayoutDashboard,
  },
  {
    title: 'Explorer les Produits',
    href: '/products',
    icon: Search,
  },
  {
    title: "Mes Appels d'Offre",
    href: '/dashboard/buyer/rfqs',
    icon: FileText,
  },
  {
    title: 'Nouvel AO',
    href: '/dashboard/buyer/rfqs/new',
    icon: PlusCircle,
  },
  {
    title: 'Mes Devis Reçus',
    href: '/dashboard/buyer/quotations',
    icon: Inbox,
    badge: 3,
  },
  {
    title: 'Mes Commandes',
    href: '/dashboard/buyer/orders',
    icon: ShoppingCart,
  },
  {
    title: 'Favoris',
    href: '/dashboard/buyer/favorites',
    icon: Heart,
  },
  {
    title: 'Messages',
    href: '/dashboard/buyer/messages',
    icon: MessageSquare,
    badge: 2,
  },
  {
    title: 'Fournisseurs Suivis',
    href: '/dashboard/buyer/suppliers',
    icon: Users,
  },
  {
    title: 'Profil',
    href: '/dashboard/buyer/profile',
    icon: UserCog,
  },
  {
    title: 'Paramètres',
    href: '/dashboard/buyer/settings',
    icon: Settings,
  },
];

interface BuyerSidebarProps {
  className?: string;
}

export function BuyerSidebar({ className }: BuyerSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden bg-white shadow-md"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen bg-gray-800 text-white transition-all duration-300 ease-in-out',
          collapsed ? 'w-[70px]' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          className
        )}
      >
        {/* Logo Section */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-700">
          {!collapsed && (
            <Link href="/dashboard/buyer" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-green-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">AT</span>
              </div>
              <span className="font-bold text-lg text-white">AlgeriaTrade</span>
            </Link>
          )}
          {collapsed && (
            <div className="mx-auto h-8 w-8 rounded-lg bg-green-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">AT</span>
            </div>
          )}
          
          {/* Collapse Button (Desktop Only) */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-700"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <nav className="space-y-1 px-3">
            {navItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/dashboard/buyer' && item.href !== '/products' && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 group relative',
                    isActive
                      ? 'bg-green-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  )}
                >
                  <item.icon
                    className={cn(
                      'h-5 w-5 flex-shrink-0',
                      isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                    )}
                  />
                  {!collapsed && (
                    <>
                      <span className="text-sm font-medium flex-1">{item.title}</span>
                      {item.badge && item.badge > 0 && (
                        <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                  
                  {/* Tooltip for collapsed state */}
                  {collapsed && (
                    <div className="absolute left-full ml-3 hidden lg:block opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50">
                      <div className="relative bg-gray-900 text-white text-sm px-3 py-1.5 rounded-md whitespace-nowrap shadow-lg">
                        {item.title}
                        {item.badge && item.badge > 0 && (
                          <span className="ml-2 min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs inline-flex items-center justify-center font-medium">
                            {item.badge}
                          </span>
                        )}
                        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                      </div>
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-gray-700 p-4">
          {!collapsed && (
            <div className="text-xs text-gray-400 text-center">
              <p>AlgeriaTrade.dz</p>
              <p>© 2024 Tous droits réservés</p>
            </div>
          )}
          {collapsed && (
            <div className="text-xs text-gray-400 text-center">© 2024</div>
          )}
        </div>
      </aside>
    </>
  );
}
