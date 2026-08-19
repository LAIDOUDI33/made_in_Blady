'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { triggerHapticFeedback, isMobileDevice } from '@/lib/pwa/enhancements';
import { 
  ZoomIn, 
  ZoomOut, 
  Heart, 
  Maximize2,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Share2,
  Download
} from 'lucide-react';

// ============ Types ============
interface Point {
  x: number;
  y: number;
}

interface GestureState {
  isPinching: boolean;
  isDoubleTapping: boolean;
  isLongPressing: boolean;
  isSwiping: boolean;
  startDistance: number;
  currentScale: number;
  translateX: number;
  translateY: number;
  lastTapTime: number;
  tapCount: number;
  longPressTimer: ReturnType<typeof setTimeout> | null;
}

interface MobileGestureHandlerProps {
  children: React.ReactNode;
  onPinchZoom?: (scale: number, point: Point) => void;
  onDoubleTap?: (point: Point) => void;
  onLongPress?: (point: Point) => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  enablePinchZoom?: boolean;
  enableDoubleTap?: boolean;
  enableLongPress?: boolean;
  enableSwipe?: boolean;
  maxScale?: number;
  minScale?: number;
  className?: string;
  style?: React.CSSProperties;
}

interface ImageGalleryProps {
  images: string[];
  alt?: string[];
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
  enableZoom?: boolean;
  enableDownload?: boolean;
  enableShare?: boolean;
  className?: string;
}

// ============ Main Gesture Handler Component ============
export function MobileGestureHandler({
  children,
  onPinchZoom,
  onDoubleTap,
  onLongPress,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  enablePinchZoom = true,
  enableDoubleTap = true,
  enableLongPress = true,
  enableSwipe = true,
  maxScale = 4,
  minScale = 0.5,
  className,
  style,
}: MobileGestureHandlerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gestureState, setGestureState] = useState<GestureState>({
    isPinching: false,
    isDoubleTapping: false,
    isLongPressing: false,
    isSwiping: false,
    startDistance: 0,
    currentScale: 1,
    translateX: 0,
    translateY: 0,
    lastTapTime: 0,
    tapCount: 0,
    longPressTimer: null,
  });
  
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState<Point>({ x: 0, y: 0 });
  const isMobileRef = useRef(isMobileDevice());
  
  const gestureStateRef = useRef(gestureState);
  useEffect(() => { gestureStateRef.current = gestureState; }, [gestureState]);

  // Calculate distance between two touch points
  const getDistance = useCallback((touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Get center point between two touches
  const getCenter = useCallback((touch1: Touch, touch2: Touch): Point => ({
    x: (touch1.clientX + touch2.clientX) / 2,
    y: (touch1.clientY + touch2.clientY) / 2,
  }), []);

  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1 && enableDoubleTap) {
      const now = Date.now();
      const timeSinceLastTap = now - gestureStateRef.current.lastTapTime;
      
      // Detect double tap (within 300ms)
      if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
        e.preventDefault();
        triggerHapticFeedback('selection');
        setGestureState(prev => ({ ...prev, isDoubleTapping: true }));
        
        const point: Point = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        onDoubleTap?.(point);
        
        setTimeout(() => {
          setGestureState(prev => ({ ...prev, isDoubleTapping: false }));
        }, 200);
        
        return;
      }
      
      setGestureState(prev => ({
        ...prev,
        lastTapTime: now,
        tapCount: prev.tapCount + 1,
      }));

      // Start long press timer
      if (enableLongPress) {
        const timer = setTimeout(() => {
          triggerHapticFeedback('medium');
          setGestureState(prev => ({ ...prev, isLongPressing: true }));
          
          const point: Point = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          onLongPress?.(point);
        }, 500);

        setGestureState(prev => ({ ...prev, longPressTimer: timer }));
      }
    }

    // Pinch zoom detection
    if (e.touches.length === 2 && enablePinchZoom) {
      e.preventDefault();
      const distance = getDistance(e.touches[0], e.touches[1]);
      setGestureState(prev => ({
        ...prev,
        isPinching: true,
        startDistance: distance,
      }));
    }
  }, [
    enableDoubleTap, 
    enableLongPress, 
    enablePinchZoom, 
    getDistance, 
    onDoubleTap, 
    onLongPress
  ]);

  // Handle touch move
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    // Cancel long press if finger moved
    if (gestureStateRef.current.longPressTimer) {
      clearTimeout(gestureStateRef.current.longPressTimer);
      setGestureState(prev => ({ ...prev, longPressTimer: null }));
    }

    // Pinch zoom handling
    if (e.touches.length === 2 && enablePinchZoom && gestureStateRef.current.isPinching) {
      e.preventDefault();
      const distance = getDistance(e.touches[0], e.touches[1]);
      const center = getCenter(e.touches[0], e.touches[1]);
      const newScale = Math.min(maxScale, Math.max(minScale, (distance / gestureStateRef.current.startDistance) * scale));
      
      setScale(newScale);
      onPinchZoom?.(newScale, center);
    }

    // Swipe detection for single touch
    if (e.touches.length === 1 && enableSwipe) {
      // Swipe logic handled in touchEnd for better accuracy
    }
  }, [enablePinchZoom, enableSwipe, getDistance, getCenter, scale, maxScale, minScale, onPinchZoom]);

  // Handle touch end
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    // Cancel long press timer
    if (gestureStateRef.current.longPressTimer) {
      clearTimeout(gestureStateRef.current.longPressTimer);
      setGestureState(prev => ({ ...prev, longPressTimer: null }));
    }

    // End pinch
    if (e.touches.length === 0) {
      setGestureState(prev => ({
        ...prev,
        isPinching: false,
        isLongPressing: false,
      }));
    }
  }, []);

  // Mouse events for desktop testing
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!enableLongPress) return;
    
    const timer = setTimeout(() => {
      triggerHapticFeedback('medium');
      setGestureState(prev => ({ ...prev, isLongPressing: true }));
      onLongPress?.({ x: e.clientX, y: e.clientY });
    }, 500);

    setGestureState(prev => ({ ...prev, longPressTimer: timer }));
  }, [enableLongPress, onLongPress]);

  const handleMouseUp = useCallback(() => {
    if (gestureStateRef.current.longPressTimer) {
      clearTimeout(gestureStateRef.current.longPressTimer);
      setGestureState(prev => ({ ...prev, longPressTimer: null }));
    }
    setGestureState(prev => ({ ...prev, isLongPressing: false }));
  }, []);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (!enableDoubleTap) return;
    
    triggerHapticFeedback('selection');
    setGestureState(prev => ({ ...prev, isDoubleTapping: true }));
    onDoubleTap?.({ x: e.clientX, y: e.clientY });
    
    setTimeout(() => {
      setGestureState(prev => ({ ...prev, isDoubleTapping: false }));
    }, 200);
  }, [enableDoubleTap, onDoubleTap]);

  // Reset scale function
  const resetTransform = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    triggerHapticFeedback('light');
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden select-none",
        "touch-none md:touch-auto",
        className
      )}
      style={{
        ...style,
        transformOrigin: 'center center',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
    >
      {/* Content with transforms */}
      <div
        className="w-full h-full"
        style={{
          transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
          transition: gestureState.isPinching ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {children}
      </div>

      {/* Zoom Controls Overlay */}
      {enablePinchZoom && scale !== 1 && (
        <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
          <button
            onClick={() => {
              setScale(s => Math.min(maxScale, s + 0.25));
              triggerHapticFeedback('light');
            }}
            disabled={scale >= maxScale}
            className="
              w-10 h-10 rounded-full bg-white/90 shadow-lg
              flex items-center justify-center
              hover:bg-white transition-colors
              disabled:opacity-50
              min-w-[44px] min-h-[44px]
            "
            aria-label="Zoom in"
          >
            <ZoomIn className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={resetTransform}
            className="
              w-10 h-10 rounded-full bg-white/90 shadow-lg
              flex items-center justify-center
              hover:bg-white transition-colors
              min-w-[44px] min-h-[44px]
            "
            aria-label="Reset zoom"
          >
            <Maximize2 className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={() => {
              setScale(s => Math.max(minScale, s - 0.25));
              triggerHapticFeedback('light');
            }}
            disabled={scale <= minScale}
            className="
              w-10 h-10 rounded-full bg-white/90 shadow-lg
              flex items-center justify-center
              hover:bg-white transition-colors
              disabled:opacity-50
              min-w-[44px] min-h-[44px]
            "
            aria-label="Zoom out"
          >
            <ZoomOut className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      )}

      {/* Long Press Indicator */}
      {gestureState.isLongPressing && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
          <div className="w-12 h-12 rounded-full border-2 border-white border-t-transparent animate-spin" />
        </div>
      )}
    </div>
  );
}

// ============ Image Gallery with Gestures ============
export function ImageGallery({
  images,
  alt = [],
  initialIndex = 0,
  onIndexChange,
  enableZoom = true,
  enableDownload = false,
  enableShare = false,
  className,
}: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const isSwiping = useRef(false);

  const goToImage = useCallback((index: number) => {
    if (index >= 0 && index < images.length) {
      setCurrentIndex(index);
      onIndexChange?.(index);
      triggerHapticFeedback('selection');
    }
  }, [images.length, onIndexChange]);

  const goNext = useCallback(() => {
    goToImage(currentIndex + 1);
  }, [currentIndex, goToImage]);

  const goPrev = useCallback(() => {
    goToImage(currentIndex - 1);
  }, [currentIndex, goToImage]);

  // Swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    isSwiping.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping.current) return;
    // Visual feedback could be added here
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isSwiping.current) return;
    
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        goNext(); // Swiped left, go next
      } else {
        goPrev(); // Swiped right, go prev
      }
    }

    isSwiping.current = false;
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFullscreen) {
        switch (e.key) {
          case 'ArrowRight':
            goNext();
            break;
          case 'ArrowLeft':
            goPrev();
            break;
          case 'Escape':
            setIsFullscreen(false);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, goNext, goPrev]);

  const handleDoubleTap = () => {
    setIsFullscreen(prev => !prev);
    triggerHapticFeedback(isFullscreen ? 'light' : 'success');
  };

  return (
    <>
      <div
        ref={containerRef}
        className={cn(
          "relative overflow-hidden rounded-xl bg-black",
          className
        )}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Images Container */}
        <MobileGestureHandler
          enablePinchZoom={enableZoom}
          enableDoubleTap={true}
          onDoubleTap={handleDoubleTap}
          className="aspect-square w-full"
        >
          <img
            src={images[currentIndex]}
            alt={alt[currentIndex] || `Image ${currentIndex + 1}`}
            className="w-full h-full object-contain"
            draggable={false}
          />
        </MobileGestureHandler>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={goPrev}
              disabled={currentIndex === 0}
              className="
                absolute left-2 top-1/2 -translate-y-1/2
                w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm
                flex items-center justify-center
                text-white opacity-0 hover:opacity-100
                focus:opacity-100 transition-opacity
                disabled:opacity-30 disabled:cursor-not-allowed
                min-w-[44px] min-h-[44px]
              "
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={goNext}
              disabled={currentIndex === images.length - 1}
              className="
                absolute right-2 top-1/2 -translate-y-1/2
                w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm
                flex items-center justify-center
                text-white opacity-0 hover:opacity-100
                focus:opacity-100 transition-opacity
                disabled:opacity-30 disabled:cursor-not-allowed
                min-w-[44px] min-h-[44px]
              "
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm">
            <span className="text-white text-xs font-medium">
              {currentIndex + 1} / {images.length}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        {(enableDownload || enableShare) && (
          <div className="absolute top-3 right-3 flex gap-2">
            {enableShare && (
              <button
                onClick={() => {
                  navigator.share?.({ url: images[currentIndex] });
                  triggerHapticFeedback('success');
                }}
                className="
                  w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm
                  flex items-center justify-center
                  text-white hover:bg-black/60 transition-colors
                  min-w-[44px] min-h-[44px]
                "
                aria-label="Share image"
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}
            {enableDownload && (
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = images[currentIndex];
                  link.download = `image-${currentIndex}.jpg`;
                  link.click();
                  triggerHapticFeedback('success');
                }}
                className="
                  w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm
                  flex items-center justify-center
                  text-white hover:bg-black/60 transition-colors
                  min-w-[44px] min-h-[44px]
                "
                aria-label="Download image"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Dots Indicator */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 mt-8">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToImage(idx)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-200",
                  idx === currentIndex
                    ? "bg-white w-6"
                    : "bg-white/50 hover:bg-white/75"
                )}
                aria-label={`Go to image ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          onClick={() => setIsFullscreen(false)}
        >
          <img
            src={images[currentIndex]}
            alt={alt[currentIndex] || `Image ${currentIndex + 1} fullscreen`}
            className="max-w-full max-h-full object-contain"
            draggable={false}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsFullscreen(false);
            }}
            className="
              absolute top-4 right-4
              w-10 h-10 rounded-full bg-white/20
              flex items-center justify-center
              text-white hover:bg-white/30
              min-w-[44px] min-h-[44px]
            "
            aria-label="Close fullscreen"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}

// ============ Like/Favorite Button with Double Tap ============
interface LikeButtonProps {
  isLiked: boolean;
  onToggle: () => void;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  count?: number;
}

export function LikeButton({
  isLiked,
  onToggle,
  size = 'md',
  showLabel = false,
  count,
}: LikeButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = () => {
    triggerHapticFeedback(isLiked ? 'light' : 'success');
    setIsAnimating(true);
    onToggle();
    setTimeout(() => setIsAnimating(false), 600);
  };

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-14 h-14',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  };

  return (
    <button
      onClick={handleToggle}
      className={cn(
        "flex items-center gap-1.5 group",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded-full",
        "min-w-[44px] min-h-[44px] p-2"
      )}
      aria-label={isLiked ? 'Unlike' : 'Like'}
      aria-pressed={isLiked}
    >
      <div className={cn(
        sizeClasses[size],
        "rounded-full flex items-center justify-center",
        "transition-all duration-200",
        "group-hover:bg-red-50",
        isLiked && "bg-red-50"
      )}>
        <Heart
          className={cn(
            iconSizes[size],
            "transition-all duration-300",
            isLiked
              ? "text-red-500 fill-red-500 scale-110"
              : "text-gray-400 group-hover:text-red-400",
            isAnimating && "animate-ping-once"
          )}
          strokeWidth={isLiked ? 0 : 2}
        />
      </div>
      {showLabel && (
        <span className={cn(
          "text-sm font-medium transition-colors",
          isLiked ? "text-red-500" : "text-gray-500"
        )}>
          {count !== undefined ? count : isLiked ? 'Liked' : 'Like'}
        </span>
      )}
    </button>
  );
}

// ============ Context Menu Component ============
interface ContextMenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  action: () => void;
  destructive?: boolean;
}

interface ContextMenuProps {
  trigger: React.ReactNode;
  items: ContextMenuItem[];
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export function ContextMenu({
  trigger,
  items,
  position = 'bottom-right',
}: ContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const positionClasses = {
    'bottom-right': 'right-0 top-full mt-1',
    'bottom-left': 'left-0 top-full mt-1',
    'top-right': 'right-0 bottom-full mb-1',
    'top-left': 'left-0 bottom-full mb-1',
  };

  return (
    <div className="relative inline-block" ref={menuRef}>
      <div onClick={() => {
        setIsOpen(!isOpen);
        triggerHapticFeedback('selection');
      }}>
        {trigger}
      </div>

      {isOpen && (
        <div
          className={cn(
            "absolute z-50 py-2 min-w-[180px]",
            "bg-white rounded-xl shadow-xl border border-gray-100",
            "animate-in fade-in-0 zoom-in-95 duration-150",
            positionClasses[position]
          )}
          role="menu"
        >
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                item.action();
                setIsOpen(false);
                triggerHapticFeedback(item.destructive ? 'warning' : 'light');
              }}
              className={cn(
                "w-full px-4 py-3 flex items-center gap-3",
                "text-left text-sm font-medium",
                "hover:bg-gray-50 active:bg-gray-100",
                "transition-colors duration-100",
                "min-h-[48px]",
                item.destructive
                  ? "text-red-600 hover:bg-red-50"
                  : "text-gray-700"
              )}
              role="menuitem"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default MobileGestureHandler;
