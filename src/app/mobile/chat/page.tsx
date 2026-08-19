'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Send,
  Mic,
  MicOff,
  Image,
  Paperclip,
  Smile,
  MoreVertical,
  Phone,
  Video,
  Search,
  Check,
  CheckCheck,
  Clock,
  Trash2,
  Archive,
  Reply
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MobileBottomNav } from '@/components/mobile/MobileBottomNav';
import { MobileSwipeActions, SwipeableListItem } from '@/components/mobile/MobileSwipeActions';
import { MobileOfflineIndicator } from '@/components/mobile/MobileOfflineIndicator';

// ============ Types ============
interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  isRead: boolean;
  type: 'text' | 'image' | 'voice' | 'system';
  attachmentUrl?: string;
  voiceDuration?: number;
}

interface Conversation {
  id: string;
  participantName: string;
  participantAvatar?: string;
  participantCompany?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
  isTyping: boolean;
  messages: Message[];
}

// ============ Mock Data ============
const mockConversations: Conversation[] = [
  {
    id: '1',
    participantName: 'Karim Bouzid',
    participantCompany: 'Sider El Hadjar',
    lastMessage: 'The steel shipment will be ready by Friday. Let me know if you need any adjustments to the order.',
    lastMessageTime: '2m ago',
    unreadCount: 2,
    isOnline: true,
    isTyping: false,
    messages: [],
  },
  {
    id: '2',
    participantName: 'Amina Hadj',
    participantCompany: "Ciment d'Algérie",
    lastMessage: 'Thank you for your business! The invoice has been sent.',
    lastMessageTime: '1h ago',
    unreadCount: 0,
    isOnline: false,
    isTyping: false,
    messages: [],
  },
  {
    id: '3',
    participantName: 'Youssef Amrani',
    participantCompany: 'Pharmal Algeria',
    lastMessage: 'Can we schedule a call tomorrow to discuss the new product line?',
    lastMessageTime: '3h ago',
    unreadCount: 5,
    isOnline: true,
    isTyping: true,
    messages: [],
  },
  {
    id: '4',
    participantName: 'Fatima Zahra',
    participantCompany: 'Tolga Trading',
    lastMessage: '📦 Your order has been shipped!',
    lastMessageTime: 'Yesterday',
    unreadCount: 0,
    isOnline: false,
    isTyping: false,
    messages: [],
  },
  {
    id: '5',
    participantName: 'Omar Kaci',
    participantCompany: 'Condor Algeria',
    lastMessage: 'We have a special offer on AC units this month.',
    lastMessageTime: '2 days ago',
    unreadCount: 1,
    isOnline: false,
    isTyping: false,
    messages: [],
  },
];

const mockMessages: Message[] = [
  {
    id: '1',
    content: 'Hello! I saw your RFQ for steel pipes. We can definitely supply that quantity.',
    senderId: 'other',
    senderName: 'Karim Bouzid',
    timestamp: new Date(Date.now() - 3600000 * 2),
    isRead: true,
    type: 'text',
  },
  {
    id: '2',
    content: 'That\'s great news! What would be your best price for API 5L Grade B pipes?',
    senderId: 'me',
    senderName: 'Me',
    timestamp: new Date(Date.now() - 3600000 * 1.9),
    isRead: true,
    type: 'text',
  },
  {
    id: '3',
    content: 'For orders above 50 tons, we can offer DZD 85,000/ton including delivery to Algiers port.',
    senderId: 'other',
    senderName: 'Karim Bouzid',
    timestamp: new Date(Date.now() - 3600000 * 1.8),
    isRead: true,
    type: 'text',
  },
  {
    id: '4',
    content: 'That sounds reasonable. Can you send me a formal quotation with specifications?',
    senderId: 'me',
    senderName: 'Me',
    timestamp: new Date(Date.now() - 3600000 * 1.7),
    isRead: true,
    type: 'text',
  },
  {
    id: '5',
    content: 'The steel shipment will be ready by Friday. Let me know if you need any adjustments to the order.',
    senderId: 'other',
    senderName: 'Karim Bouzid',
    timestamp: new Date(Date.now() - 120000),
    isRead: false,
    type: 'text',
  },
];

// ============ Main Component ============
export default function MobileChatPage() {
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recordingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle recording timer
  useEffect(() => {
    if (isRecording) {
      recordingInterval.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
      setRecordingTime(0);
    }
    
    return () => {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    };
  }, [isRecording]);

  // Filter conversations based on search
  const filteredConversations = mockConversations.filter(conv =>
    conv.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.participantCompany?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle sending message
  const handleSendMessage = () => {
    if (!newMessage.trim() || !activeConversation) return;

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      senderId: 'me',
      senderName: 'Me',
      timestamp: new Date(),
      isRead: false,
      type: 'text',
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
    inputRef.current?.focus();
  };

  // Handle voice recording toggle
  const handleToggleRecording = () => {
    if (isRecording) {
      // Stop recording and send voice message
      setIsRecording(false);
      // In production, this would send the recorded audio
      console.log('Voice message duration:', recordingTime, 'seconds');
    } else {
      // Start recording
      setIsRecording(true);
      // In production, this would start actual audio recording
    }
  };

  // Format time for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Format recording time
  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // If in chat view
  if (activeConversation) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Offline Indicator */}
        <MobileOfflineIndicator position="top" />

        {/* Chat Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-30">
          <button
            onClick={() => setActiveConversation(null)}
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center min-w-[44px] min-h-[44px]"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>

          <Avatar className="w-11 h-11 shrink-0">
            <AvatarImage src={activeConversation.participantAvatar} />
            <AvatarFallback className="bg-emerald-100 text-emerald-600 font-semibold">
              {activeConversation.participantName.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-900 truncate">{activeConversation.participantName}</h2>
            <p className={cn(
              "text-xs",
              activeConversation.isTyping ? "text-emerald-600" : "text-gray-500"
            )}>
              {activeConversation.isTyping ? (
                <span className="flex items-center gap-1">
                  typing<span className="animate-pulse">...</span>
                </span>
              ) : activeConversation.isOnline ? (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                  Online
                </span>
              ) : (
                activeConversation.participantCompany
              )}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              className="w-11 h-11 rounded-full hover:bg-gray-100 flex items-center justify-center min-w-[44px] min-h-[44px]"
              aria-label="Voice call"
            >
              <Phone className="w-5 h-5 text-gray-600" />
            </button>
            <button
              className="w-11 h-11 rounded-full hover:bg-gray-100 flex items-center justify-center min-w-[44px] min-h-[44px]"
              aria-label="Video call"
            >
              <Video className="w-5 h-5 text-gray-600" />
            </button>
            <button
              className="w-11 h-11 rounded-full hover:bg-gray-100 flex items-center justify-center min-w-[44px] min-h-[44px]"
              aria-label="More options"
            >
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((message) => {
            const isMine = message.senderId === 'me';

            return (
              <div
                key={message.id}
                className={cn(
                  "flex gap-2 max-w-[85%]",
                  isMine ? "ml-auto flex-row-reverse" : ""
                )}
              >
                {!isMine && (
                  <Avatar className="w-8 h-8 shrink-0 mt-auto mb-auto">
                    <AvatarImage src={activeConversation.participantAvatar} />
                    <AvatarFallback className="bg-emerald-100 text-emerald-600 text-xs">
                      {activeConversation.participantName[0]}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div className={cn(
                  "rounded-2xl px-4 py-2.5 shadow-sm",
                  isMine
                    ? "bg-emerald-600 text-white rounded-br-md"
                    : "bg-white text-gray-900 rounded-bl-md"
                )}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {message.content}
                  </p>

                  <div className={cn(
                    "flex items-center justify-end gap-1 mt-1",
                    isMine ? "text-white/70" : "text-gray-400"
                  )}>
                    <span className="text-[10px]">
                      {formatTime(message.timestamp)}
                    </span>
                    {isMine && (
                      message.isRead
                        ? <CheckCheck className="w-3.5 h-3.5" />
                        : <Check className="w-3.5 h-3.5" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {activeConversation.isTyping && (
            <div className="flex gap-2 max-w-[85%]">
              <Avatar className="w-8 h-8 shrink-0">
                <AvatarImage src={activeConversation.participantAvatar} />
                <AvatarFallback className="bg-emerald-100 text-emerald-600 text-xs">
                  {activeConversation.participantName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 p-4 pb-safe">
          {/* Recording UI */}
          {isRecording ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center gap-3 py-3 px-4 bg-red-50 rounded-xl border border-red-200">
                <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center animate-pulse">
                  <Mic className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-700">Recording...</p>
                  <p className="text-xs text-red-500">{formatRecordingTime(recordingTime)}</p>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleToggleRecording}
                  className="rounded-full min-h-[40px]"
                >
                  <MicOff className="w-4 h-4 mr-1" />
                  Stop
                </Button>
              </div>
            </div>
          ) : (
            /* Normal Input */
            <div className="flex items-end gap-2">
              <button
                className="w-11 h-11 rounded-full hover:bg-gray-100 flex items-center justify-center shrink-0 min-w-[44px] min-h-[44px]"
                aria-label="Attach file"
              >
                <Paperclip className="w-5 h-5 text-gray-500" />
              </button>

              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder="Type a message..."
                  className="
                    w-full pl-4 pr-12 py-3 bg-gray-100 rounded-2xl
                    text-sm placeholder:text-gray-400
                    focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white
                    transition-all min-h-[48px]
                  "
                />
                <button
                  className="
                    absolute right-2 bottom-2
                    w-9 h-9 rounded-full
                    flex items-center justify-center
                    hover:bg-gray-200 transition-colors
                    min-w-[36px] min-h-[36px]
                  "
                  aria-label="Add emoji"
                >
                  <Smile className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <button
                className="w-11 h-11 rounded-full hover:bg-gray-100 flex items-center justify-center shrink-0 min-w-[44px] min-h-[44px]"
                aria-label="Attach image"
              >
                <Image className="w-5 h-5 text-gray-500" />
              </button>

              {newMessage.trim() ? (
                <button
                  onClick={handleSendMessage}
                  className="w-11 h-11 rounded-full bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center shrink-0 transition-colors min-w-[44px] min-h-[44px]"
                  aria-label="Send message"
                >
                  <Send className="w-5 h-5 text-white" />
                </button>
              ) : (
                <button
                  onClick={handleToggleRecording}
                  className="w-11 h-11 rounded-full bg-gray-900 hover:bg-gray-800 flex items-center justify-center shrink-0 transition-colors min-w-[44px] min-h-[44px]"
                  aria-label="Record voice message"
                >
                  <Mic className="w-5 h-5 text-white" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Conversation List View
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Offline Indicator */}
      <MobileOfflineIndicator position="top" />

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="px-4 pt-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">Messages</h1>
            <button
              className="w-11 h-11 rounded-full hover:bg-gray-100 flex items-center justify-center min-w-[44px] min-h-[44px]"
              aria-label="New message"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="
                w-full pl-10 pr-4 py-3 bg-gray-100 rounded-xl
                text-sm placeholder:text-gray-400
                focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white
                transition-all min-h-[48px]
              "
            />
          </div>
        </div>
      </header>

      {/* Conversations List */}
      <main className="divide-y divide-gray-100">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-12 px-4">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No conversations</h3>
            <p className="text-sm text-gray-500">
              {searchQuery ? `No results for "${searchQuery}"` : 'Start a conversation with a supplier'}
            </p>
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <SwipeableListItem
              key={conversation.id}
              id={conversation.id}
              leftActions={[
                {
                  id: 'archive',
                  label: 'Archive',
                  icon: Archive,
                  color: '#6b7280',
                  bgColor: '#6b7280',
                  action: () => console.log('Archive:', conversation.id),
                },
              ]}
              rightActions={[
                {
                  id: 'reply',
                  label: 'Reply',
                  icon: Reply,
                  color: '#059669',
                  bgColor: '#059669',
                  action: () => setActiveConversation(conversation),
                },
                {
                  id: 'delete',
                  label: 'Delete',
                  icon: Trash2,
                  color: '#dc2626',
                  bgColor: '#dc2626',
                  action: () => console.log('Delete:', conversation.id),
                  requireConfirmation: true,
                  confirmationText: 'Delete this conversation? Messages will be permanently removed.',
                },
              ]}
            >
              <button
                onClick={() => setActiveConversation(conversation)}
                className="w-full px-4 py-4 flex items-start gap-3 hover:bg-gray-50 transition-colors min-h-[80px]"
              >
                <div className="relative shrink-0">
                  <Avatar className="w-13 h-13">
                    <AvatarImage src={conversation.participantAvatar} />
                    <AvatarFallback className="bg-emerald-100 text-emerald-600 font-semibold text-base">
                      {conversation.participantName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Online indicator */}
                  {conversation.isOnline && (
                    <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
                  )}

                  {/* Unread indicator */}
                  {conversation.unreadCount > 0 && !conversation.isOnline && (
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-emerald-600 text-white text-xs font-bold rounded-full flex items-center justify-center px-1.5">
                      {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={cn(
                      "font-semibold truncate",
                      conversation.unreadCount > 0 ? "text-gray-900" : "text-gray-800"
                    )}>
                      {conversation.participantName}
                    </h3>
                    <span className={cn(
                      "text-xs shrink-0 ml-2",
                      conversation.unreadCount > 0 ? "text-emerald-600 font-medium" : "text-gray-400"
                    )}>
                      {conversation.lastMessageTime}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 mb-0.5">{conversation.participantCompany}</p>

                  <div className="flex items-center gap-1">
                    {conversation.isTyping ? (
                      <span className="text-sm text-emerald-600 italic">typing...</span>
                    ) : (
                      <p className={cn(
                        "text-sm truncate",
                        conversation.unreadCount > 0 ? "text-gray-800 font-medium" : "text-gray-500"
                      )}>
                        {conversation.lastMessage}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            </SwipeableListItem>
          ))
        )}
      </main>

      {/* Bottom Navigation */}
      <MobileBottomNav badges={{ messages: mockConversations.reduce((sum, c) => sum + c.unreadCount, 0) }} />
    </div>
  );
}
