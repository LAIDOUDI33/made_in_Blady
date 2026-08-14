'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  X, 
  Sparkles,
  Bot,
} from 'lucide-react';
import ChatbotWindow from './ChatbotWindow';

interface ChatbotWidgetProps {
  userId?: string;
  position?: 'bottom-right' | 'bottom-left';
}

export default function ChatbotWidget({ 
  userId,
  position = 'bottom-right' 
}: ChatbotWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);

  // Show pulse animation after 10 seconds if not opened
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isOpen) {
        setIsPulsing(true);
        setHasUnread(true);
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [isOpen]);

  // Stop pulsing when opened
  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setIsPulsing(false);
    setHasUnread(false);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
  };

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <ChatbotWindow
          userId={userId}
          onClose={handleClose}
          position={position}
        />
      )}

      {/* Floating Button */}
      <Button
        onClick={handleOpen}
        className={`
          fixed ${positionClasses[position]} z-50 
          w-16 h-16 rounded-full 
          bg-gradient-to-br from-[#006233] to-[#004d28]
          hover:from-[#007a3f] hover:to-[#005c33]
          text-white shadow-xl 
          transition-all duration-300 ease-out
          group
          ${isPulsing ? 'animate-pulse-ring' : ''}
        `}
        aria-label="Ouvrir le chat d'assistance"
      >
        <div className="relative">
          {/* Main icon */}
          {isOpen ? (
            <X className="h-7 w-7 transition-transform duration-300 rotate-0" />
          ) : (
            <MessageSquare className="h-7 w-7 transition-transform duration-300 group-hover:scale-110" />
          )}

          {/* Unread indicator */}
          {hasUnread && !isOpen && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative rounded-full h-5 w-5 bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                1
              </span>
            </span>
          )}

          {/* AI badge */}
          {!isOpen && (
            <Badge className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white text-[#006233] border shadow-md whitespace-nowrap text-xs px-2 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Sparkles className="h-3 w-3 mr-1" />
              Assistant IA
            </Badge>
          )}
        </div>
      </Button>

      {/* Pulse ring animation styles */}
      <style jsx>{`
        @keyframes pulse-ring {
          0% {
            box-shadow: 0 0 0 0 rgba(0, 98, 51, 0.7);
          }
          70% {
            box-shadow: 0 0 0 15px rgba(0, 98, 51, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(0, 98, 51, 0);
          }
        }
        .animate-pulse-ring {
          animation: pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite;
        }
      `}</style>
    </>
  );
}
