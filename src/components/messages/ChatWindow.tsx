'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MoreVertical, Phone, Video, Info, ChevronLeft } from 'lucide-react';
import type { Message, ConversationWithDetails, SocketMessage, TypingIndicator } from '@/types/message';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';

interface ChatWindowProps {
  conversation: ConversationWithDetails | null;
  messages: Message[];
  isLoadingMessages: boolean;
  hasMoreMessages: boolean;
  onSendMessage: (data: {
    content?: string;
    fileType?: string;
    fileUrl?: string;
    fileName?: string;
  }) => void;
  onLoadMore: () => void;
  onTypingStart: (conversationId: string) => void;
  onTypingStop: (conversationId: string) => void;
  onMarkAsRead: (conversationId: string) => void;
  currentUserId: string;
  typingUsers: TypingIndicator[];
  isMobile?: boolean;
  onBack?: () => void;
}

export function ChatWindow({
  conversation,
  messages,
  isLoadingMessages,
  hasMoreMessages,
  onSendMessage,
  onLoadMore,
  onTypingStart,
  onTypingStop,
  onMarkAsRead,
  currentUserId,
  typingUsers = [],
  isMobile = false,
  onBack,
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isNearTop, setIsNearTop] = useState(false);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  // Mark as read when viewing conversation
  useEffect(() => {
    if (conversation?.id && conversation.unreadCount > 0) {
      onMarkAsRead(conversation.id);
    }
  }, [conversation?.id, conversation?.unreadCount, onMarkAsRead]);

  // Handle scroll for loading more messages
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isAtTop = target.scrollTop < 100;
    
    setIsNearTop(isAtTop);
    
    if (isAtTop && hasMoreMessages && !isLoadingMessages) {
      onLoadMore();
    }
  }, [hasMoreMessages, isLoadingMessages, onLoadMore]);

  // Get other participant info
  const getOtherParticipant = () => {
    return conversation?.otherParticipant;
  };

  // Get display name
  const getDisplayName = (): string => {
    const participant = getOtherParticipant();
    if (!participant) return '';
    
    if (participant.user.company?.name) {
      return participant.user.company.name;
    }
    return participant.user.name || 'Utilisateur';
  };

  // Handle send message
  const handleSend = useCallback((data: {
    content?: string;
    fileType?: string;
    fileUrl?: string;
    fileName?: string;
  }) => {
    if (!conversation) return;

    onSendMessage({
      ...data,
    });
  }, [conversation, onSendMessage]);

  // Handle typing
  const handleTypingStart = useCallback(() => {
    if (conversation) {
      onTypingStart(conversation.id);
    }
  }, [conversation, onTypingStart]);

  const handleTypingStop = useCallback(() => {
    if (conversation) {
      onTypingStop(conversation.id);
    }
  }, [conversation, onTypingStop]);

  // Get active typing users
  const getActiveTypingUsers = (): string[] => {
    if (!conversation) return [];
    
    return typingUsers
      .filter(t => t.conversationId === conversation.id && t.isTyping && t.userId !== currentUserId)
      .map(t => t.userName);
  };

  // Empty state
  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-6">
          <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg 
              className="w-10 h-10 text-gray-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Sélectionnez une conversation
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[280px] mx-auto">
            Choisissez une conversation dans la liste pour commencer à discuter
          </p>
        </div>
      </div>
    );
  }

  const otherParticipant = getOtherParticipant();
  const displayName = getDisplayName();
  const activeTypers = getActiveTypingUsers();

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 min-w-0">
      {/* Header */}
      <div className="px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
        {/* Back button (mobile) */}
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={onBack} className="flex-shrink-0 lg:hidden">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        )}

        {/* User avatar */}
        <Avatar className="w-10 h-10 flex-shrink-0">
          <AvatarImage 
            src={otherParticipant?.user.avatar || otherParticipant?.user.company?.logo || undefined} 
            alt={displayName} 
          />
          <AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm font-medium">
            {displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/* User info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
            {displayName}
          </h3>
          {(activeTypers.length > 0 || isLoadingMessages) ? (
            <p className="text-xs text-[#006233] font-medium">
              {isLoadingMessages 
                ? 'Chargement...' 
                : `${activeTypers.join(', ')} ${activeTypers.length === 1 ? 'est en train' : 'sont en train'} d'écrire...`
              }
            </p>
          ) : (
            <p className="text-xs text-gray-500 truncate">
              {otherParticipant?.user.company?.name !== displayName && otherParticipant?.user.company?.name}
              {otherParticipant?.user.role === 'SUPPLIER' ? ' • Fournisseur' : otherParticipant?.user.role === 'BUYER' ? ' • Acheteur' : ''}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          {/* View profile button - could link to profile page */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="hidden sm:flex h-9 w-9 text-gray-500 hover:text-gray-700"
            title="Voir le profil"
          >
            <Info className="w-4 h-4" />
          </Button>
          
          {/* More options */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 text-gray-500 hover:text-gray-700"
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages area */}
      <ScrollArea 
        ref={scrollAreaRef}
        className="flex-1"
        onScrollCapture={handleScroll}
      >
        <div className="px-4 py-4 space-y-1">
          {/* Load more indicator */}
          {hasMoreMessages && (
            <div className="flex justify-center py-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onLoadMore}
                disabled={isLoadingMessages}
                className="text-xs text-gray-500"
              >
                {isLoadingMessages ? 'Chargement...' : 'Charger les messages précédents'}
              </Button>
            </div>
          )}

          {/* Messages */}
          {messages.map((message, index) => {
            const prevMessage = index > 0 ? messages[index - 1] : null;
            
            // Group consecutive messages from same user within 2 minutes
            const isGrouped = Boolean(
              prevMessage &&
              prevMessage.fromUserId === message.fromUserId &&
              new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime() < 120000
            );

            return (
              <MessageBubble
                key={message.id}
                message={message}
                currentUserId={currentUserId}
                isGrouped={isGrouped}
              />
            );
          })}

          {/* Typing indicator */}
          {activeTypers.length > 0 && (
            <div className="flex items-start gap-2 mb-3">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">
                  {displayName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-gray-200 dark:bg-gray-700">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input area */}
      <MessageInput
        onSend={handleSend}
        onTypingStart={handleTypingStart}
        onTypingStop={handleTypingStop}
        disabled={!conversation}
      />
    </div>
  );
}

export default ChatWindow;
