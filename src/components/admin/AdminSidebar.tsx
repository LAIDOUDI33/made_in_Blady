'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation'; 
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Package, 
  FileText, 
  ShoppingCart, 
  MessageSquare, 
  Star, 
  BarChart3, 
  Settings, 
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Shield,
  UserCheck,
  AlertTriangle,
  Bell,
  ListChecks,
  MapPin,
  ShieldCheck,
  Lock,
  Video,
  ClipboardCheck,
  CalendarDays,
  Truck,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const navigation: NavSection[] = [
  {
    items: [
      {
        title: 'Tableau de bord',
        href: '/admin',
        icon: <LayoutDashboard className="h-5 w-5" />,
      },
    ],
  },
  {
    title: 'Gestion des Utilisateurs',
    items: [
      {
        title: 'Liste des utilisateurs',
        href: '/admin/users',
        icon: <Users className="h-5 w-5" />,
      },
      {
        title: 'Acheteurs',
        href: '/admin/users?role=BUYER',
        icon: <UserCheck className="h-5 w-5" />,
      },
      {
        title: 'Fournisseurs',
        href: '/admin/users?role=SUPPLIER',
        icon: <Building2 className="h-5 w-5" />,
      },
    ],
  },
  {
    title: 'Gestion des Entreprises',
    items: [
      {
        title: 'Entreprises en attente',
        href: '/admin/companies?status=PENDING',
        icon: <AlertTriangle className="h-5 w-5" />,
        badge: 3,
      },
      {
        title: 'Entreprises vérifiées',
        href: '/admin/companies?status=VERIFIED',
        icon: <Shield className="h-5 w-5" />,
      },
    ],
  },
  {
    title: 'Gestion des Produits',
    items: [
      {
        title: 'Tous les produits',
        href: '/admin/products',
        icon: <Package className="h-5 w-5" />,
      },
      {
        title: 'Signalements',
        href: '/admin/products?status=REPORTED',
        icon: <AlertTriangle className="h-5 w-5" />,
        badge: 2,
      },
    ],
  },
  {
    items: [
      {
        title: "Appels d'Offre",
        href: '/admin/rfqs',
        icon: <FileText className="h-5 w-5" />,
      },
      {
        title: 'Commandes',
        href: '/admin/orders',
        icon: <ShoppingCart className="h-5 w-5" />,
      },
      {
        title: 'Modération Messages',
        href: '/admin/messages',
        icon: <MessageSquare className="h-5 w-5" />,
      },
      {
        title: 'Avis & Commentaires',
        href: '/admin/reviews',
        icon: <Star className="h-5 w-5" />,
      },
    ],
  },
  {
    items: [
      {
        title: 'Analytics & Rapports',
        href: '/admin/analytics',
        icon: <BarChart3 className="h-5 w-5" />,
      },
    ],
  },
  {
    title: 'Modules Phase 6',
    items: [
      {
        title: 'Vérifications',
        href: '/admin/verifications',
        icon: <ShieldCheck className="h-5 w-5" />,
        badge: 5,
      },
      {
        title: 'Escrow & Litiges',
        href: '/admin/escrow',
        icon: <Lock className="h-5 w-5" />,
        badge: 1,
      },
      {
        title: 'Modération Contenu',
        href: '/admin/content',
        icon: <Video className="h-5 w-5" />,
        badge: 3,
      },
      {
        title: 'Inspections',
        href: '/admin/inspections',
        icon: <ClipboardCheck className="h-5 w-5" />,
      },
      {
        title: 'Expositions',
        href: '/admin/exhibitions',
        icon: <CalendarDays className="h-5 w-5" />,
      },
      {
        title: 'Expédition',
        href: '/admin/shipping',
        icon: <Truck className="h-5 w-5" />,
      },
      {
        title: 'Métriques Phase 6',
        href: '/admin/analytics/phase6-metrics',
        icon: <TrendingUp className="h-5 w-5" />,
      },
    ],
  },
  {
    title: 'Configuration',
    items: [
      {
        title: 'Catégories',
        href: '/admin/categories',
        icon: <ListChecks className="h-5 w-5" />,
      },
      {
        title: 'Wilayas',
        href: '/admin/wilayas',
        icon: <MapPin className="h-5 w-5" />,
      },
      {
        title: 'Notifications',
        href: '/admin/notifications',
        icon: <Bell className="h-5 w-5" />,
      },
      {
        title: 'Paramètres plateforme',
        href: '/admin/settings',
        icon: <Settings className="h-5 w-5" />,
      },
    ],
  },
];

function SidebarContent({ 
  collapsed, 
  mobileOpen, 
  setMobileOpen 
}: { 
  collapsed: boolean; 
  mobileOpen: boolean; 
  setMobileOpen: (open: boolean) => void;
}) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-3 px-4 py-6 border-b border-gray-700",
        collapsed && "justify-center px-2"
      )}>
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-700">
          <span className="text-white font-bold text-lg">AT</span>
        </div>
        {!collapsed && (
          <div>
            <h1 className="text-white font-bold text-lg">AlgeriaTrade</h1>
            <p className="text-gray-400 text-xs">Administration</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-6 px-3">
          {navigation.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {section.title && !collapsed && (
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2 px-3">
                  {section.title}
                </p>
              )}
              {section.title && collapsed && (
                <div className="w-full h-px bg-gray-700 my-3" />
              )}
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                        isActive(item.href)
                          ? "bg-green-600/20 text-green-400"
                          : "text-gray-300 hover:bg-gray-800 hover:text-white",
                        collapsed && "justify-center px-2"
                      )}
                    >
                      <span className={cn(
                        "flex-shrink-0",
                        isActive(item.href) && "text-green-400"
                      )}>
                        {item.icon}
                      </span>
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-sm font-medium">
                            {item.title}
                          </span>
                          {item.badge !== undefined && item.badge > 0 && (
                            <Badge 
                              variant="destructive" 
                              className="h-5 min-w-5 px-1.5 text-xs flex items-center justify-center"
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Collapse button - Desktop only */}
      <div className="hidden lg:block border-t border-gray-700 p-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center text-gray-400 hover:text-white hover:bg-gray-800"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <span className="text-xs">Réduire</span>
          )}
        </Button>
      </div>
    </div>
  );
}

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-gray-900 transform transition-transform duration-300 ease-in-out lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
        >
          <X className="h-5 w-5" />
        </button>
        <SidebarContent 
          collapsed={false} 
          mobileOpen={mobileOpen} 
          setMobileOpen={setMobileOpen} 
        />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:block fixed inset-y-0 left-0 z-30 bg-gray-900 transition-all duration-300",
          collapsed ? "w-20" : "w-72"
        )}
      >
        <SidebarContent 
          collapsed={collapsed} 
          mobileOpen={mobileOpen} 
          setMobileOpen={setMobileOpen} 
        />
      </aside>
    </>
  );
}
