'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Search, 
  PlusCircle, 
  MessageSquare, 
  User,
  Bell
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  activeIcon?: React.ElementType;
  isCenter?: boolean;
  badgeCount?: number;
}

interface MobileBottomNavProps {
  className?: string;
  messageCount?: number;
  notificationCount?: number;
}

const navItems: NavItem[] = [
  {
    href: '/',
    icon: Home,
    label: 'Accueil',
    activeIcon: Home,
  },
  {
    href: '/search',
    icon: Search,
    label: 'Rechercher',
    activeIcon: Search,
  },
  {
    href: '/rfqs/new',
    icon: PlusCircle,
    label: 'Poster AO',
    activeIcon: PlusCircle,
    isCenter: true,
  },
  {
    href: '/dashboard/buyer/messages',
    icon: MessageSquare,
    label: 'Messages',
    activeIcon: MessageSquare,
  },
  {
    href: '/dashboard/buyer/profile',
    icon: User,
    label: 'Profil',
    activeIcon: User,
  },
];

export function MobileBottomNav({ 
  className = '',
  messageCount = 0,
  notificationCount = 0
}: MobileBottomNavProps) {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [activeItem, setActiveItem] = useState('/');

  // Handle scroll to show/hide nav
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show on scroll up, hide on scroll down (with threshold)
      if (currentScrollY < 100) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY - 5) {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  // Update active item based on pathname
  useEffect(() => {
    setActiveItem(pathname);
  }, [pathname]);

  const isActive = useCallback((href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }, [pathname]);

  const totalMessages = messageCount + notificationCount;

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav 
        className={`
          fixed bottom-0 left-0 right-0 z-50 
          bg-white/95 backdrop-blur-md 
          border-t border-gray-200 
          safe-area-inset-bottom
          transition-transform duration-300 ease-out
          md:hidden
          ${isVisible ? 'translate-y-0' : 'translate-y-full'}
          ${className}
        `}
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {/* Main navigation items */}
        <div className="flex items-center justify-around px-2 py-1">
          {navItems.map((item) => {
            const IconComponent = isActive(item.href) && item.activeIcon 
              ? item.activeIcon 
              : item.icon;
            const active = isActive(item.href);

            // Center button (prominent)
            if (item.isCenter) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative flex flex-col items-center justify-center -mt-6"
                  aria-label={item.label}
                >
                  <div className={`
                    w-14 h-14 rounded-full 
                    flex items-center justify-center
                    transition-all duration-200
                    ${active 
                      ? 'bg-[#006233] shadow-lg shadow-[#006233]/30 scale-105' 
                      : 'bg-[#006233] hover:bg-[#004d28] shadow-lg shadow-[#006233]/20'
                    }
                  `}>
                    <IconComponent className={`w-7 h-7 text-white`} />
                  </div>
                  <span className={`
                    text-[10px] mt-1 font-medium
                    ${active ? 'text-[#006233]' : 'text-gray-500'}
                  `}>
                    {item.label}
                  </span>
                </Link>
              );
            }

            // Regular nav items
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  relative flex flex-col items-center justify-center
                  min-w-[60px] py-2 px-2
                  transition-colors duration-200
                  touch-manipulation
                `}
                aria-label={item.label}
              >
                {/* Icon container */}
                <div className={`
                  relative p-1.5 rounded-xl
                  transition-all duration-200
                  ${active ? 'bg-[#006233]/10' : ''}
                `}>
                  <IconComponent className={`
                    w-6 h-6 transition-colors duration-200
                    ${active ? 'text-[#006233]' : 'text-gray-400'}
                  `} />
                  
                  {/* Badge for messages */}
                  {(item.href.includes('message') && totalMessages > 0) && (
                    <Badge 
                      variant="destructive" 
                      className="
                        absolute -top-1 -right-1 
                        h-5 min-w-[20px] px-1 
                        text-[10px] font-bold
                        flex items-center justify-center
                      "
                    >
                      {totalMessages > 99 ? '99+' : totalMessages}
                    </Badge>
                  )}
                  
                  {/* Active indicator dot */}
                  {active && (
                    <div className="
                      absolute -bottom-0 left-1/2 -translate-x-1/2
                      w-1 h-1 rounded-full bg-[#006233]
                    " />
                  )}
                </div>
                
                {/* Label */}
                <span className={`
                  text-[10px] mt-1 font-medium max-w-[60px] truncate
                  ${active ? 'text-[#006233]' : 'text-gray-500'}
                `}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Home indicator area for iOS */}
        <div className="h-1 flex justify-center pb-1">
          <div className="w-32 h-1 bg-gray-300 rounded-full" />
        </div>
      </nav>

      {/* Spacer to prevent content from being hidden behind nav */}
      <div className="h-20 md:hidden" />

      <style jsx>{`
        .safe-area-inset-bottom {
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
        
        .touch-manipulation {
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }

        @media (min-width: 768px) {
          nav {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}

// Hook for managing mobile navigation state
export function useMobileNavigation() {
  const [isNavVisible, setIsNavVisible] = useState(true);

  const hideNav = useCallback(() => setIsNavVisible(false), []);
  const showNav = useCallback(() => setIsNavVisible(true), []);

  return {
    isNavVisible,
    hideNav,
    showNav
  };
}

export default MobileBottomNav;
