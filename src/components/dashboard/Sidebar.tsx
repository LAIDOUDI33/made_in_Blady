'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  FileText,
  Send,
  ShoppingCart,
  MessageSquare,
  Building2,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  {
    title: 'Tableau de bord',
    href: '/dashboard/seller',
    icon: LayoutDashboard,
  },
  {
    title: 'Mes Produits',
    href: '/dashboard/seller/products',
    icon: Package,
  },
  {
    title: 'Ajouter Produit',
    href: '/dashboard/seller/products/new',
    icon: PlusCircle,
  },
  {
    title: "Appels d'Offres",
    href: '/dashboard/seller/rfqs',
    icon: FileText,
  },
  {
    title: 'Mes Devis',
    href: '/dashboard/seller/quotations',
    icon: Send,
  },
  {
    title: 'Commandes',
    href: '/dashboard/seller/orders',
    icon: ShoppingCart,
  },
  {
    title: 'Messages',
    href: '/dashboard/seller/messages',
    icon: MessageSquare,
  },
  {
    title: 'Profil Entreprise',
    href: '/dashboard/seller/company',
    icon: Building2,
  },
  {
    title: 'Paramètres',
    href: '/dashboard/seller/settings',
    icon: Settings,
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
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
            <Link href="/dashboard/seller" className="flex items-center gap-2">
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
                (item.href !== '/dashboard/seller' && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 group',
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
                    <span className="text-sm font-medium">{item.title}</span>
                  )}
                  
                  {/* Tooltip for collapsed state */}
                  {collapsed && (
                    <div className="absolute left-full ml-3 hidden lg:block opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none">
                      <div className="relative bg-gray-900 text-white text-sm px-3 py-1.5 rounded-md whitespace-nowrap shadow-lg">
                        {item.title}
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
