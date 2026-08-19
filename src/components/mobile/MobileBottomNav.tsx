'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Search, 
  ClipboardList, 
  MessageSquare, 
  User,
  Bell,
  Package,
  ShoppingCart
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { triggerHapticFeedback, isMobileDevice } from '@/lib/pwa/enhancements';

// ============ Types ============
interface NavItem {
  href: string;
  icon: React.ElementType;
  activeIcon?: React.ElementType;
  label: string;
  labelAr?: string;
  isCenter?: boolean;
  badgeKey?: 'messages' | 'notifications' | 'orders' | 'none';
}

interface MobileBottomNavProps {
  className?: string;
  badges?: {
    messages?: number;
    notifications?: number;
    orders?: number;
  };
  onTabChange?: (tab: string) => void;
}

// ============ Navigation Items ============
const navItems: NavItem[] = [
  {
    href: '/mobile',
    icon: Home,
    label: 'Home',
    labelAr: 'الرئيسية',
    badgeKey: 'none',
  },
  {
    href: '/search',
    icon: Search,
    label: 'Search',
    labelAr: 'بحث',
    badgeKey: 'none',
  },
  {
    href: '/mobile/orders',
    icon: ClipboardList,
    label: 'Orders',
    labelAr: 'الطلبات',
    isCenter: true,
    badgeKey: 'orders',
  },
  {
    href: '/mobile/chat',
    icon: MessageSquare,
    label: 'Messages',
    labelAr: 'الرسائل',
    badgeKey: 'messages',
  },
  {
    href: '/dashboard/buyer/profile',
    icon: User,
    label: 'Profile',
    labelAr: 'الملف الشخصي',
    badgeKey: 'notifications',
  },
];

// ============ Main Component ============
export function MobileBottomNav({ 
  className = '',
  badges = {},
  onTabChange 
}: MobileBottomNavProps) {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [activeTab, setActiveTab] = useState('');
  const [isPressed, setIsPressed] = useState<string | null>(null);
  const touchStartY = useRef(0);
  const isMobileRef = useRef(isMobileDevice());

  // Handle scroll to show/hide nav with smooth animation
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 50) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY + 10) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY - 5) {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Update active tab based on pathname
  useEffect(() => {
    setActiveTab(pathname);
  }, [pathname]);

  const isActive = useCallback((href: string) => {
    if (href === '/mobile') return pathname === '/' || pathname === '/mobile';
    return pathname.startsWith(href);
  }, [pathname]);

  const handleTabPress = useCallback((item: NavItem) => {
    // Haptic feedback for mobile devices
    if (isMobileRef.current) {
      triggerHapticFeedback('light');
    }
    
    setActiveTab(item.href);
    setIsPressed(item.href);
    
    setTimeout(() => setIsPressed(null), 150);
    onTabChange?.(item.label);
  }, [onTabChange]);

  const getBadgeCount = (key: NavItem['badgeKey']): number => {
    if (!key || key === 'none') return 0;
    return badges[key] || 0;
  };

  const totalBadgeCount = Object.values(badges).reduce((sum, count) => sum + (count || 0), 0);

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav 
        role="navigation"
        aria-label="Main navigation"
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50",
          "bg-white/95 backdrop-blur-xl",
          "border-t border-gray-200/80",
          "transition-transform duration-300 ease-out",
          "md:hidden",
          isVisible ? 'translate-y-0' : 'translate-y-full',
          className
        )}
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 8px)',
        }}
      >
        {/* Navigation Items Container */}
        <div className="flex items-center justify-around px-1 pt-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const IconComponent = item.icon;
            const badgeCount = getBadgeCount(item.badgeKey);

            // Center button (prominent action)
            if (item.isCenter) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => handleTabPress(item)}
                  className={cn(
                    "relative flex flex-col items-center justify-center",
                    "-mt-5 min-w-[64px] min-h-[56px]",
                    "touch-manipulation"
                  )}
                  aria-label={item.label}
                  aria-current={active ? 'page' : undefined}
                >
                  {/* Center Button Circle */}
                  <div className={cn(
                    "w-14 h-14 rounded-2xl",
                    "flex items-center justify-center",
                    "shadow-lg shadow-emerald-500/25",
                    "transition-all duration-200 ease-out",
                    "bg-gradient-to-br from-emerald-500 to-emerald-600",
                    active && "scale-105 shadow-xl shadow-emerald-500/40",
                    isPressed === item.href && "scale-95"
                  )}>
                    <IconComponent className="w-6 h-6 text-white" strokeWidth={2} />
                    
                    {/* Pulse animation when has badge */}
                    {badgeCount > 0 && (
                      <span className="absolute inset-0 rounded-2xl animate-ping bg-emerald-400 opacity-30" />
                    )}
                  </div>

                  {/* Badge */}
                  {badgeCount > 0 && (
                    <Badge 
                      variant="destructive"
                      className="
                        absolute top-0 right-1
                        h-5 min-w-[20px] px-1.5
                        text-[10px] font-bold
                        flex items-center justify-center
                        border-2 border-white
                      "
                    >
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </Badge>
                  )}

                  {/* Label */}
                  <span className={cn(
                    "text-[10px] mt-1 font-semibold tracking-tight",
                    active ? "text-emerald-600" : "text-gray-500"
                  )}>
                    {item.label}
                  </span>
                </Link>
              );
            }

            // Regular navigation items
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => handleTabPress(item)}
                className={cn(
                  "relative flex flex-col items-center justify-center",
                  "min-w-[56px] min-h-[48px] py-1.5 px-2",
                  "touch-manipulation",
                  "group"
                )}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
              >
                {/* Icon Container */}
                <div className={cn(
                  "relative p-2 rounded-xl",
                  "transition-all duration-200 ease-out",
                  active && "bg-emerald-50",
                  isPressed === item.href && "scale-90"
                )}>
                  <IconComponent className={cn(
                    "w-6 h-6 transition-all duration-200",
                    active ? "text-emerald-600" : "text-gray-400 group-hover:text-gray-600"
                  )} strokeWidth={active ? 2.5 : 2} />

                  {/* Active Indicator */}
                  {active && (
                    <div className="
                      absolute bottom-0 left-1/2 -translate-x-1/2
                      w-5 h-1 rounded-full bg-emerald-600
                      transition-all duration-300
                    " />
                  )}

                  {/* Notification Badge */}
                  {badgeCount > 0 && (
                    <Badge 
                      variant="destructive"
                      className="
                        absolute -top-0.5 -right-0.5
                        h-4.5 min-w-[18px] px-1
                        text-[9px] font-bold
                        flex items-center justify-center
                        border-2 border-white
                      "
                    >
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </Badge>
                  )}
                </div>

                {/* Label */}
                <span className={cn(
                  "text-[10px] mt-0.5 font-medium max-w-[64px] truncate text-center",
                  "transition-colors duration-200",
                  active ? "text-emerald-600" : "text-gray-500"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* iOS Home Indicator Area */}
        <div className="h-1 flex justify-center pb-1 pt-0.5">
          <div className="w-32 h-1 bg-gray-300 rounded-full opacity-60" />
        </div>
      </nav>

      {/* Spacer to prevent content overlap */}
      <div className="h-20 md:hidden" />

      {/* Touch Optimization Styles */}
      <style jsx global>{`
        .touch-manipulation {
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
          user-select: none;
        }
        
        @media (hover: none) and (pointer: coarse) {
          .touch-manipulation:active {
            opacity: 0.7;
          }
        }
      `}</style>
    </>
  );
}

// ============ Tab Bar Indicator Component ============
export function TabBarIndicator({ tabs }: { tabs: Array<{ id: string; label: string; count?: number }> }) {
  return (
    <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className="
            flex-1 px-3 py-2 rounded-md
            text-sm font-medium
            transition-all duration-200
            hover:bg-white/80
            focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
            min-h-[44px]
          "
        >
          {tab.label}
          {tab.count !== undefined && tab.count > 0 && (
            <Badge variant="secondary" className="ml-1.5 text-xs">
              {tab.count}
            </Badge>
          )}
        </button>
      ))}
    </div>
  );
}

// ============ Floating Action Button ============
export function MobileFAB({
  icon: Icon,
  onClick,
  label,
  position = 'bottom-right',
  size = 'default'
}: {
  icon: React.ElementType;
  onClick: () => void;
  label?: string;
  position?: 'bottom-right' | 'bottom-left' | 'center';
  size?: 'small' | 'default' | 'large';
}) {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    if (isMobileRef.current) {
      triggerHapticFeedback('medium');
    }
    onClick();
  };

  const sizeClasses = {
    small: 'w-12 h-12',
    default: 'w-14 h-14',
    large: 'w-16 h-16',
  };

  const iconSizes = {
    small: 'w-5 h-5',
    default: 'w-6 h-6',
    large: 'w-7 h-7',
  };

  const positions = {
    'bottom-right': 'right-4 md:right-6',
    'bottom-left': 'left-4 md:left-6',
    center: 'left-1/2 -translate-x-1/2',
  };

  return (
    <button
      onClick={handleClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      className={cn(
        "fixed z-40 bottom-20 md:bottom-6",
        positions[position],
        "rounded-2xl",
        "bg-gradient-to-br from-emerald-500 to-emerald-600",
        "text-white shadow-lg shadow-emerald-500/30",
        "flex items-center justify-center",
        "transition-all duration-150 ease-out",
        "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/50",
        "active:scale-95",
        sizeClasses[size],
        isPressed && "scale-95"
      )}
      style={{ marginBottom: 'env(safe-area-inset-bottom, 16px)' }}
      aria-label={label || 'Action'}
    >
      <Icon className={iconSizes[size]} strokeWidth={2} />
      
      {/* Ripple effect container */}
      <span className="absolute inset-0 rounded-2xl overflow-hidden">
        {isPressed && (
          <span className="absolute inset-0 bg-white/20 animate-ping" />
        )}
      </span>
    </button>
  );
}

// ============ Hook for managing mobile navigation state ============
export function useMobileNavigation() {
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [currentTab, setCurrentTab] = useState('');

  const hideNav = useCallback(() => setIsVisible(false), []);
  const showNav = useCallback(() => setIsVisible(true), []);
  const toggleNav = useCallback(() => setIsNavigationVisible(prev => !prev), []);

  return {
    isNavVisible,
    currentTab,
    hideNav,
    showNav,
    toggleNav,
    setCurrentTab,
  };
}

// ============ Context for Navigation State ============
import { createContext, useContext } from 'react';

interface NavigationContextType {
  isNavVisible: boolean;
  currentTab: string;
  hideNav: () => void;
  showNav: () => void;
  setCurrentTab: (tab: string) => void;
}

export const MobileNavigationContext = createContext<NavigationContextType>({
  isNavVisible: true,
  currentTab: '',
  hideNav: () => {},
  showNav: () => {},
  setCurrentTab: () => {},
});

export function useMobileNavigationContext() {
  return useContext(MobileNavigationContext);
}

export default MobileBottomNav;
