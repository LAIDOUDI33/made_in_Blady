'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { 
  X, 
  ChevronRight, 
  Home, 
  Search, 
  FileText, 
  MessageSquare, 
  User, 
  Settings,
  Package,
  Building2,
  Star,
  LogOut,
  Menu,
  HelpCircle,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface DrawerItem {
  href?: string;
  icon: React.ElementType;
  label: string;
  badge?: string | number;
  onClick?: () => void;
  children?: DrawerItem[];
}

interface MobileDrawerProps {
  className?: string;
  isOpen?: boolean;
  onToggle?: () => void;
  user?: {
    name: string;
    email: string;
    avatar?: string;
    company?: string;
    role?: 'buyer' | 'seller';
  };
}

const mainMenuItems: DrawerItem[] = [
  {
    href: '/',
    icon: Home,
    label: 'Accueil',
  },
  {
    href: '/products',
    icon: Package,
    label: 'Produits',
  },
  {
    href: '/search',
    icon: Search,
    label: 'Recherche avancée',
  },
  {
    href: '/categories',
    icon: Building2,
    label: 'Catégories',
  },
  {
    href: '/suppliers',
    icon: Building2,
    label: 'Fournisseurs',
  },
];

const buyerMenuItems: DrawerItem[] = [
  {
    href: '/rfqs/new',
    icon: FileText,
    label: 'Poster un AO',
    badge: '+',
  },
  {
    href: '/dashboard/buyer/rfqs',
    icon: FileText,
    label: 'Mes appels d\'offres',
  },
  {
    href: '/dashboard/buyer/quotations',
    icon: Star,
    label: 'Devis reçus',
  },
  {
    href: '/dashboard/buyer/orders',
    icon: Package,
    label: 'Commandes',
  },
  {
    href: '/dashboard/buyer/favorites',
    icon: Star,
    label: 'Favoris',
  },
];

const accountMenuItems: DrawerItem[] = [
  {
    href: '/dashboard/buyer/messages',
    icon: MessageSquare,
    label: 'Messages',
    badge: 3,
  },
  {
    href: '/dashboard/[role]/notifications',
    icon: BellIcon,
    label: 'Notifications',
  },
  {
    href: '/dashboard/buyer/profile',
    icon: User,
    label: 'Mon profil',
  },
  {
    href: '/dashboard/[role]/settings/notifications',
    icon: Settings,
    label: 'Paramètres',
  },
];

const otherMenuItems: DrawerItem[] = [
  {
    href: '#',
    icon: HelpCircle,
    label: 'Aide & Support',
  },
  {
    href: '#',
    icon: Shield,
    label: 'Conditions d\'utilisation',
  },
];

function BellIcon(props: any) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
    </svg>
  );
}

export function MobileDrawer({
  className = '',
  isOpen: controlledIsOpen,
  onToggle,
  user
}: MobileDrawerProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);
  
  // Use controlled or uncontrolled state
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const toggleDrawer = useCallback(() => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalIsOpen(prev => !prev);
    }
  }, [onToggle]);

  const closeDrawer = useCallback(() => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalIsOpen(false);
    }
  }, [onToggle]);

  // Close on route change
  useEffect(() => {
    closeDrawer();
  }, [pathname, closeDrawer]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeDrawer();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeDrawer]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleDragEnd = (event: any, info: PanInfo) => {
    if (info.offset.x > 100 || info.velocity.x > 500) {
      closeDrawer();
    }
  };

  const handleItemClick = (item: DrawerItem) => {
    if (item.onClick) {
      item.onClick();
      closeDrawer();
    } else if (item.href && item.href !== '#') {
      closeDrawer();
    }
  };

  return (
    <>
      {/* Hamburger menu button */}
      {!isOpen && (
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleDrawer}
          className={`
            md:hidden fixed top-4 left-4 z-40
            w-10 h-10 rounded-xl
            bg-white/90 backdrop-blur-sm
            shadow-md hover:bg-white
            ${className}
          `}
          aria-label="Ouvrir le menu"
        >
          <Menu className="w-5 h-5 text-gray-700" />
        </Button>
      )}

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="
              fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm
              md:hidden
            "
            onClick={closeDrawer}
          />
        )}
      </AnimatePresence>

      {/* Drawer panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            ref={drawerRef}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className={`
              fixed top-0 left-0 bottom-0 z-[70]
              w-[85%] max-w-sm
              bg-white shadow-2xl
              overflow-y-auto overscroll-contain
              md:hidden
              ${className}
            `}
          >
            {/* Header with user info */}
            <div className="bg-gradient-to-br from-[#006233] to-[#007a3d] p-6 pb-8">
              <div className="flex items-center justify-between mb-6">
                <span className="text-white font-bold text-lg">AlgeriaTrade</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeDrawer}
                  className="text-white hover:bg-white/20"
                  aria-label="Fermer le menu"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {user ? (
                <div className="flex items-center gap-4">
                  <Avatar className="w-14 h-14 border-2 border-white/30">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="bg-white/20 text-white text-lg font-semibold">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">{user.name}</p>
                    <p className="text-white/70 text-sm truncate">{user.email}</p>
                    {user.company && (
                      <Badge variant="secondary" className="mt-1 bg-white/20 text-white text-xs border-none">
                        {user.company}
                      </Badge>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link href="/login" className="block">
                    <Button variant="outline" className="w-full border-white text-white hover:bg-white/10">
                      Se connecter
                    </Button>
                  </Link>
                  <Link href="/register" className="block">
                    <Button className="w-full bg-white text-[#006233] hover:bg-gray-100">
                      S'inscrire gratuitement
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Navigation sections */}
            <div className="py-4">
              {/* Main navigation */}
              <div className="px-4 mb-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
                  Navigation
                </p>
                <nav className="space-y-1">
                  {mainMenuItems.map((item) => (
                    <DrawerNavItem
                      key={item.label}
                      item={item}
                      isActive={pathname === item.href}
                      onClick={() => handleItemClick(item)}
                    />
                  ))}
                </nav>
              </div>

              {/* Buyer/Seller specific */}
              {user && (
                <div className="px-4 mb-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
                    Mes activités
                  </p>
                  <nav className="space-y-1">
                    {buyerMenuItems.map((item) => (
                      <DrawerNavItem
                        key={item.label}
                        item={item}
                        isActive={pathname.startsWith(item.href || '')}
                        onClick={() => handleItemClick(item)}
                      />
                    ))}
                  </nav>
                </div>
              )}

              {/* Account */}
              <div className="px-4 mb-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
                  Compte
                </p>
                <nav className="space-y-1">
                  {accountMenuItems.map((item) => (
                    <DrawerNavItem
                      key={item.label}
                      item={item}
                      isActive={pathname.startsWith(item.href || '')}
                      onClick={() => handleItemClick(item)}
                    />
                  ))}
                </nav>
              </div>

              {/* Other links */}
              <div className="px-4 mb-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
                  Autres
                </p>
                <nav className="space-y-1">
                  {otherMenuItems.map((item) => (
                    <DrawerNavItem
                      key={item.label}
                      item={item}
                      onClick={() => handleItemClick(item)}
                    />
                  ))}
                  
                  {user && (
                    <button
                      onClick={() => {
                        // Handle logout
                        closeDrawer();
                      }}
                      className="
                        flex items-center gap-3 w-full px-3 py-3 rounded-xl
                        text-red-600 hover:bg-red-50
                        transition-colors duration-150
                      "
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="font-medium">Déconnexion</span>
                    </button>
                  )}
                </nav>
              </div>

              {/* App version */}
              <div className="px-8 py-4 text-center">
                <p className="text-xs text-gray-400">AlgeriaTrade v1.0.0</p>
                <p className="text-xs text-gray-400 mt-1">© 2024 AlgeriaTrade.dz</p>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

// Individual nav item component
function DrawerNavItem({ 
  item, 
  isActive = false, 
  onClick 
}: { 
  item: DrawerItem; 
  isActive?: boolean; 
  onClick: () => void;
}) {
  const content = (
    <div
      className={`
        flex items-center gap-3 w-full px-3 py-3 rounded-xl
        transition-all duration-150 cursor-pointer
        ${isActive 
          ? 'bg-[#006233]/10 text-[#006233]' 
          : 'text-gray-700 hover:bg-gray-100'
        }
      `}
      onClick={onClick}
    >
      <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#006233]' : 'text-gray-400'}`} />
      
      <span className={`font-medium flex-1 text-left ${isActive ? 'text-[#006233]' : ''}`}>
        {item.label}
      </span>
      
      {item.badge && (
        <Badge 
          variant={typeof item.badge === 'string' && item.badge === '+' ? 'default' : 'secondary'}
          className={`
            shrink-0 text-xs font-bold
            ${typeof item.badge === 'string' && item.badge === '+' 
              ? 'bg-[#006233] text-white' 
              : isActive ? 'bg-[#006233]/20 text-[#006233]' : ''
            }
          `}
        >
          {item.badge}
        </Badge>
      )}
      
      <ChevronRight className={`w-4 h-4 shrink-0 opacity-30`} />
    </div>
  );

  if (item.href && item.href !== '#') {
    return <Link href={item.href}>{content}</Link>;
  }

  return content;
}

// Hook for managing drawer state
export function useMobileDrawer() {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  return {
    isOpen,
    open,
    close,
    toggle
  };
}

export default MobileDrawer;
