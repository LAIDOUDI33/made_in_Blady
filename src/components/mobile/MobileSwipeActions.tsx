'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { triggerHapticFeedback } from '@/lib/pwa/enhancements';
import { 
  Archive, 
  Reply, 
  Trash2, 
  MoreHorizontal,
  Check,
  X,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ============ Types ============
interface SwipeAction {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  action: () => void | Promise<void>;
  requireConfirmation?: boolean;
  confirmationText?: string;
}

interface MobileSwipeActionsProps {
  children: React.ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  onSwipeStart?: (direction: 'left' | 'right') => void;
  onSwipeEnd?: (actionId: string | null) => void;
  onRefresh?: () => void;
  threshold?: number;
  className?: string;
  disabled?: boolean;
}

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
  threshold?: number;
}

// ============ Main Swipe Actions Component ============
export function MobileSwipeActions({
  children,
  leftActions = [],
  rightActions = [],
  onSwipeStart,
  onSwipeEnd,
  onRefresh,
  threshold = 100,
  className,
  disabled = false,
}: MobileSwipeActionsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [translateX, setTranslateX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [activeAction, setActiveAction] = useState<SwipeAction | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<SwipeAction | null>(null);
  
  const startX = useRef(0);
  const startY = useRef(0);
  const currentX = useRef(0);
  const isDragging = useRef(false);

  // Determine which actions to show based on swipe direction
  const getActiveActions = (direction: 'left' | 'right'): SwipeAction[] => {
    return direction === 'left' ? rightActions : leftActions;
  };

  const getActionAtPosition = (offset: number): SwipeAction | null => {
    const actions = offset > 0 ? leftActions : rightActions;
    if (actions.length === 0) return null;

    const absOffset = Math.abs(offset);
    const actionWidth = 80; // Width of each action
    const actionIndex = Math.min(
      Math.floor(absOffset / actionWidth),
      actions.length - 1
    );

    return actions[actionIndex] || null;
  };

  const handleTouchStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (disabled) return;
    
    isDragging.current = true;
    const point = 'touches' in e ? e.touches[0] : e;
    startX.current = point.clientX;
    startY.current = point.clientY;
    currentX.current = 0;
  }, [disabled]);

  const handleTouchMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging.current || disabled) return;

    e.preventDefault();
    const point = 'touches' in e ? e.touches[0] : e;
    const deltaX = point.clientX - startX.current;
    const deltaY = Math.abs(point.clientY - startY.current);

    // Prevent vertical scroll interference
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      isDragging.current = false;
      return;
    }

    // Only allow horizontal swipes in valid directions
    if ((deltaX > 0 && leftActions.length === 0) || 
        (deltaX < 0 && rightActions.length === 0)) {
      return;
    }

    isSwiping.current && setIsSwiping(true);
    currentX.current = deltaX;
    
    // Add resistance at edges
    const maxOffset = Math.max(leftActions.length, rightActions.length) * 80;
    const resistance = Math.abs(deltaX) > maxOffset ? 0.3 : 1;
    setTranslateX(deltaX * resistance);

    // Update active action based on position
    const action = getActionAtPosition(deltaX * resistance);
    setActiveAction(action);

    // Haptic feedback when crossing action thresholds
    if (action && Math.abs(deltaX * resistance) % 80 < 10) {
      triggerHapticFeedback('light');
    }
  }, [disabled, leftActions, rightActions]);

  const handleTouchEnd = useCallback(async () => {
    if (!isDragging.current) return;
    
    isDragging.current = false;
    setIsSwiping(false);

    const absTranslate = Math.abs(translateX);
    
    // Check if we've crossed the threshold for an action
    if (absTranslate >= threshold && activeAction) {
      onSwipeStart?.(translateX > 0 ? 'right' : 'left');

      if (activeAction.requireConfirmation) {
        setPendingAction(activeAction);
        setShowConfirmDialog(true);
        setTranslateX(0);
      } else {
        // Execute action with haptic feedback
        triggerHapticFeedback('success');
        await activeAction.action();
        onSwipeEnd?.(activeAction.id);
      }
    }
    
    // Reset position
    setTranslateX(0);
    setActiveAction(null);
  }, [translateX, threshold, activeAction, onSwipeStart, onSwipeEnd]);

  // Handle confirmation dialog action
  const handleConfirmAction = async () => {
    if (pendingAction) {
      triggerHapticFeedback('success');
      await pendingAction.action();
      onSwipeEnd?.(pendingAction.id);
    }
    setShowConfirmDialog(false);
    setPendingAction(null);
  };

  const handleCancelAction = () => {
    triggerHapticFeedback('light');
    setShowConfirmDialog(false);
    setPendingAction(null);
  };

  // Render action buttons
  const renderActions = (actions: SwipeAction[], direction: 'left' | 'right') => {
    if (actions.length === 0) return null;

    return (
      <div 
        className={cn(
          "absolute top-0 bottom-0 flex items-center",
          direction === 'right' ? 'right-0 flex-row-reverse' : 'left-0'
        )}
        style={{ width: `${actions.length * 80}px` }}
      >
        {actions.map((action, index) => (
          <button
            key={action.id}
            onClick={(e) => {
              e.stopPropagation();
              if (action.requireConfirmation) {
                setPendingAction(action);
                setShowConfirmDialog(true);
              } else {
                triggerHapticFeedback('medium');
                action.action();
              }
            }}
            className={cn(
              "w-20 h-full flex flex-col items-center justify-center gap-1",
              "transition-all duration-200",
              "focus:outline-none focus-visible:ring-2",
              activeAction?.id === action.id && "opacity-100 scale-105",
              activeAction?.id !== action.id && "opacity-70"
            )}
            style={{ backgroundColor: action.bgColor }}
            aria-label={action.label}
          >
            <action.icon className="w-5 h-5 text-white" />
            <span className="text-[10px] font-medium text-white">{action.label}</span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <>
      <div
        ref={containerRef}
        className={cn("relative overflow-hidden rounded-lg", className)}
        style={{
          touchAction: 'pan-y',
        }}
      >
        {/* Action Backgrounds */}
        {renderActions(leftActions, 'left')}
        {renderActions(rightActions, 'right')}

        {/* Content */}
        <div
          className="relative bg-white transition-transform duration-200"
          style={{
            transform: `translateX(${translateX}px)`,
            willChange: isSwiping ? 'transform' : 'auto',
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleTouchStart}
          onMouseMove={handleTouchMove}
          onMouseUp={handleTouchEnd}
          onMouseLeave={handleTouchEnd}
        >
          {children}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && pendingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <p className="text-gray-900 font-medium mb-4">
              {pendingAction.confirmationText || `Are you sure you want to ${pendingAction.label.toLowerCase()}?`}
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleCancelAction} className="flex-1 min-h-[44px]">
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmAction} 
                className="flex-1 min-h-[44px]"
                style={{ backgroundColor: pendingAction.color }}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ============ Pull to Refresh Component ============
export function PullToRefresh({
  onRefresh,
  children,
  className,
  threshold = 80,
}: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canRelease, setCanRelease] = useState(false);
  
  const startY = useRef(0);
  const isPulling = useRef(false);
  const isAtTop = useRef(true);

  // Check if scrolled to top
  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        isAtTop.current = containerRef.current.scrollTop <= 0;
      }
    };
    
    const container = containerRef.current;
    container?.addEventListener('scroll', handleScroll);
    return () => container?.removeEventListener('scroll', handleScroll);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isAtTop.current || isRefreshing) return;
    
    isPulling.current = true;
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling.current || !isAtTop.current || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const distance = Math.min(currentY - startY.current, threshold * 1.5);
    
    if (distance > 0) {
      e.preventDefault();
      // Add resistance
      const resistance = distance > threshold ? 0.3 + (1 - distance / (threshold * 1.5)) * 0.7 : 1;
      setPullDistance(distance * resistance);
      setCanRelease(distance >= threshold);

      if (distance >= threshold && !canRelease) {
        triggerHapticFeedback('light');
      }
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling.current) return;
    
    isPulling.current = false;

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold);
      
      try {
        await onRefresh();
        triggerHapticFeedback('success');
      } catch (error) {
        console.error('Refresh failed:', error);
        triggerHapticFeedback('error');
      }

      setIsRefreshing(false);
    }
    
    setPullDistance(0);
    setCanRelease(false);
  };

  return (
    <div 
      ref={containerRef}
      className={cn("relative overflow-hidden", className)}
      style={{ touchAction: 'pan-x pan-y' }}
    >
      {/* Pull Indicator */}
      <div
        className="
          absolute top-0 left-0 right-0 z-10
          flex items-center justify-center
          overflow-hidden
          transition-none
        "
        style={{
          height: `${Math.max(0, pullDistance)}px`,
          transform: `translateY(-${Math.max(0, pullDistance)}px)`,
        }}
      >
        <div 
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full",
            "bg-white shadow-md",
            canRelease ? "text-emerald-600" : "text-gray-500"
          )}
        >
          <RefreshCw 
            className={cn(
              "w-5 h-5",
              isRefreshing && "animate-spin"
            )} 
          />
          <span className="text-sm font-medium">
            {isRefreshing ? 'Refreshing...' : canRelease ? 'Release to refresh' : 'Pull to refresh'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={isRefreshing ? "transition-transform duration-300" : ""}
        style={{
          transform: isRefreshing ? `translateY(${threshold}px)` : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ============ Predefined Action Sets ============
export const messageSwipeActions = (onArchive: () => void, onDelete: () => void, onReply: () => void): SwipeAction[] => [
  {
    id: 'archive',
    label: 'Archive',
    icon: Archive,
    color: '#6b7280',
    bgColor: '#6b7280',
    action: onArchive,
  },
  ...[
    {
      id: 'reply',
      label: 'Reply',
      icon: Reply,
      color: '#059669',
      bgColor: '#059669',
      action: onReply,
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: Trash2,
      color: '#dc2626',
      bgColor: '#dc2626',
      action: onDelete,
      requireConfirmation: true,
      confirmationText: 'Delete this conversation? This action cannot be undone.',
    },
  ],
];

export const orderSwipeActions = (
  onTrack: () => void, 
  onCancel: () => void,
  onContactSupplier: () => void
): SwipeAction[] => [
  {
    id: 'track',
    label: 'Track',
    icon: MoreHorizontal,
    color: '#2563eb',
    bgColor: '#2563eb',
    action: onTrack,
  },
  ...[
    {
      id: 'contact',
      label: 'Contact',
      icon: Reply,
      color: '#059669',
      bgColor: '#059669',
      action: onContactSupplier,
    },
    {
      id: 'cancel',
      label: 'Cancel',
      icon: X,
      color: '#dc2626',
      bgColor: '#dc2626',
      action: onCancel,
      requireConfirmation: true,
      confirmationText: 'Are you sure you want to cancel this order?',
    },
  ],
];

// ============ Swipeable List Item Component ============
interface SwipeableListItemProps {
  id: string;
  children: React.ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  onActionComplete?: (itemId: string, actionId: string) => void;
  className?: string;
}

export function SwipeableListItem({
  id,
  children,
  leftActions,
  rightActions,
  onActionComplete,
  className,
}: SwipeableListItemProps) {
  const handleActionComplete = (actionId: string) => {
    onActionComplete?.(id, actionId);
  };

  return (
    <MobileSwipeActions
      leftActions={leftActions}
      rightActions={rightActions}
      onSwipeEnd={handleActionComplete}
      className={className}
    >
      {children}
    </MobileSwipeActions>
  );
}

export default MobileSwipeActions;
