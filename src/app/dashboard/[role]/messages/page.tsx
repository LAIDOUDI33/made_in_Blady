'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, 
  Plus, 
  Search, 
  X, 
  Building2, 
  User,
  Loader2,
  Bell,
  ChevronLeft
} from 'lucide-react';
import { ConversationList, ChatWindow } from '@/components/messages';
import { useSocket } from '@/hooks/useSocket';
import type { 
  ConversationWithDetails, 
  Message, 
  SocketMessage, 
  TypingIndicator,
  ConversationsResponse,
  MessagesResponse 
} from '@/types/message';

// Mock user search - in production this would call an API
const MOCK_USERS = [
  { id: 'user1', name: 'AlgeriaTech SARL', type: 'company', avatar: null },
  { id: 'user2', name: 'Mediterranean Export', type: 'company', avatar: null },
  { id: 'user3', name: 'Ahmed Benali', type: 'buyer', avatar: null },
  { id: 'user4', name: 'Sahara Trading', type: 'company', avatar: null },
  { id: 'user5', name: 'Fatima Zahra', type: 'supplier', avatar: null },
];

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // State
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(MOCK_USERS);
  const [isMobileListVisible, setIsMobileListVisible] = useState(true);
  
  const messagesPageRef = useRef(1);

  // Get current user ID
  const currentUserId = session?.user?.id || '';

  // Initialize socket connection
  const {
    isConnected,
    joinConversation,
    leaveConversation,
    sendMessage: socketSendMessage,
    startTyping: socketStartTyping,
    stopTyping: socketStopTyping,
    markAsRead: socketMarkAsRead,
  } = useSocket({
    autoConnect: status === 'authenticated',
    onNewMessage: handleNewMessage,
    onUserTyping: handleUserTyping,
    onUserStopTyping: handleUserStopTyping,
    onError: (error) => {
      console.error('[Messages] Socket error:', error);
    },
  });

  // Handle new message from socket
  function handleNewMessage(socketMessage: SocketMessage) {
    // Add message to current conversation if it's active
    if (socketMessage.conversationId === activeConversationId) {
      setMessages(prev => [...prev, {
        ...socketMessage,
        createdAt: new Date(socketMessage.createdAt),
        fromUser: {
          ...socketMessage.fromUser,
          firstName: '',
          lastName: '',
        },
        toUser: {
          id: socketMessage.toUserId,
          name: '',
          avatar: undefined,
        },
      }]);
    }

    // Update conversations list with new last message
    setConversations(prev => prev.map(conv => {
      if (conv.id === socketMessage.conversationId) {
        return {
          ...conv,
          lastMessage: {
            id: socketMessage.id,
            content: socketMessage.content,
            fileType: socketMessage.fileType,
            fileUrl: socketMessage.fileUrl,
            fileName: socketMessage.fileName,
            createdAt: new Date(socketMessage.createdAt),
            fromUser: socketMessage.fromUser,
          },
          lastMessageAt: new Date(socketMessage.createdAt),
          unreadCount: socketMessage.fromUserId !== currentUserId ? conv.unreadCount + 1 : conv.unreadCount,
        };
      }
      return conv;
    }));

    // Show browser notification if not focused on this conversation
    if (socketMessage.fromUserId !== currentUserId && document.hidden) {
      showBrowserNotification(socketMessage);
    }
  }

  // Handle typing indicator
  function handleUserTyping(data: TypingIndicator) {
    setTypingsUsers(prev => {
      const filtered = prev.filter(t => t.userId !== data.userId);
      return [...filtered, data];
    });
  }

  // Handle stop typing indicator
  function handleUserStopTyping(data: TypingIndicator) {
    setTypingUsers(prev => prev.filter(t => t.userId !== data.userId));
  }

  // Show browser notification
  function showBrowserNotification(message: SocketMessage) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Nouveau message', {
        body: message.content || 'Fichier joint',
        icon: message.fromUser.avatar || '/logo.svg',
      });
    }
  }

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      setIsLoadingConversations(true);
      const response = await fetch('/api/messages');
      
      if (!response.ok) throw new Error('Failed to load conversations');
      
      const data: ConversationsResponse = await response.json();
      setConversations(data.conversations);
    } catch (error) {
      console.error('[Messages] Error loading conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId: string, page = 1) => {
    try {
      setIsLoadingMessages(true);
      const response = await fetch(`/api/messages/${conversationId}?page=${page}&pageSize=50`);
      
      if (!response.ok) throw new Error('Failed to load messages');
      
      const data: MessagesResponse = await response.json();
      
      if (page === 1) {
        setMessages(data.messages);
      } else {
        // Prepend older messages for pagination
        setMessages(prev => [...data.messages, ...prev]);
      }
      
      setHasMoreMessages(data.hasMore);
      messagesPageRef.current = page;
    } catch (error) {
      console.error('[Messages] Error loading messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  // Handle conversation selection
  const handleSelectConversation = useCallback((conversationId: string) => {
    setActiveConversationId(conversationId);
    setCurrentPage(1);
    messagesPageRef.current = 1;
    
    // Join socket room
    joinConversation(conversationId);
    
    // Load messages
    loadMessages(conversationId, 1);

    // On mobile, switch to chat view
    if (window.innerWidth < 1024) {
      setIsMobileListVisible(false);
    }
  }, [joinConversation, loadMessages]);

  // Load more messages (pagination)
  const handleLoadMore = useCallback(() => {
    if (activeConversationId && hasMoreMessages && !isLoadingMessages) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      loadMessages(activeConversationId, nextPage);
    }
  }, [activeConversationId, hasMoreMessages, isLoadingMessages, currentPage, loadMessages]);

  // Send message handler
  const handleSendMessage = useCallback(async (data: {
    content?: string;
    fileType?: string;
    fileUrl?: string;
    fileName?: string;
  }) => {
    if (!activeConversationId) return;

    // Send via socket first (optimistic)
    const sentViaSocket = socketSendMessage({
      conversationId: activeConversationId,
      ...data,
    });

    // Also send via API as fallback
    try {
      await fetch(`/api/messages/${activeConversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('[Messages] Error sending message via API:', error);
    }
  }, [activeConversationId, socketSendMessage]);

  // Typing handlers
  const handleTypingStart = useCallback((conversationId: string) => {
    socketStartTyping(conversationId);
  }, [socketStartTyping]);

  const handleTypingStop = useCallback((conversationId: string) => {
    socketStopTyping(conversationId);
  }, [socketStopTyping]);

  // Mark as read handler
  const handleMarkAsRead = useCallback((conversationId: string) => {
    // Update local state
    setConversations(prev => prev.map(conv => 
      conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
    ));

    // Send via socket and API
    socketMarkAsRead(conversationId);
    
    fetch(`/api/messages/${conversationId}/read`, { method: 'POST' })
      .catch(error => console.error('[Messages] Error marking as read:', error));
  }, [socketMarkAsRead]);

  // Start new conversation
  const handleStartConversation = async (userId: string) => {
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantIds: [userId] }),
      });

      if (!response.ok) throw new Error('Failed to create conversation');

      const conversation = await response.json();
      
      // Refresh conversations list
      await loadConversations();
      
      // Select the new conversation
      setActiveConversationId(conversation.id);
      joinConversation(conversation.id);
      loadMessages(conversation.id, 1);
      
      setShowNewMessageModal(false);
      setSearchQuery('');
      
      // On mobile, switch to chat view
      if (window.innerWidth < 1024) {
        setIsMobileListVisible(false);
      }
    } catch (error) {
      console.error('[Messages] Error creating conversation:', error);
    }
  };

  // Search users
  const handleSearchUsers = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults(MOCK_USERS);
      return;
    }

    const filtered = MOCK_USERS.filter(user =>
      user.name.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(filtered);
  };

  // Initial load
  useEffect(() => {
    if (status === 'authenticated') {
      loadConversations();
    }
  }, [status, loadConversations]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Get active conversation object
  const activeConversation = conversations.find(c => c.id === activeConversationId) || null;

  // Loading state
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#006233]" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-65px)] flex bg-white dark:bg-gray-900">
      {/* Connection status indicator */}
      {!isConnected && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-full text-xs font-medium flex items-center gap-2">
          <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
          Reconnexion en cours...
        </div>
      )}

      {/* Mobile header */}
      <div className="lg:hidden fixed top-[57px] left-0 right-0 z-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3">
        {!isMobileListVisible && (
          <Button variant="ghost" size="icon" onClick={() => setIsMobileListVisible(true)}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
        )}
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
          {isMobileListVisible ? 'Messages' : activeConversation?.otherParticipant?.user.company?.name || activeConversation?.otherParticipant?.user.name || 'Discussion'}
        </h1>
        
        {/* Unread badge in header */}
        {conversations.reduce((sum, c) => sum + c.unreadCount, 0) > 0 && isMobileListVisible && (
          <span className="ml-auto relative">
            <Bell className="w-5 h-5 text-[#006233]" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
              {conversations.reduce((sum, c) => sum + c.unreadCount, 0)}
            </span>
          </span>
        )}
      </div>

      {/* Main layout */}
      <div className="flex w-full pt-[52px] lg:pt-0">
        {/* Left sidebar - Conversation List */}
        <div className={`
          w-full lg:w-[380px] xl:w-[420px] flex-shrink-0 border-r border-gray-200 dark:border-gray-700
          ${isMobileListVisible ? 'block' : 'hidden lg:block'}
        `}>
          <ConversationList
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={handleSelectConversation}
            isLoading={isLoadingConversations}
          />

          {/* New message button */}
          <div className="absolute bottom-6 left-4 lg:left-[340px] xl:left-[380px] z-10">
            <Dialog open={showNewMessageModal} onOpenChange={setShowNewMessageModal}>
              <DialogTrigger asChild>
                <Button
                  size="icon"
                  className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-shadow"
                  style={{ backgroundColor: '#006233' }}
                >
                  <Plus className="w-6 h-6" />
                </Button>
              </DialogTrigger>
              
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Nouvelle conversation</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 mt-4">
                  {/* Search input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Rechercher un utilisateur ou une entreprise..."
                        value={searchQuery}
                        onChange={(e) => handleSearchUsers(e.target.value)}
                        className="pl-9"
                        autoFocus
                      />
                    </div>

                  {/* Search results */}
                  <ScrollArea className="max-h-[300px]">
                    <div className="space-y-1">
                      {searchResults.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => handleStartConversation(user.id)}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                            {user.type === 'company' ? (
                              <Building2 className="w-5 h-5 text-[#006233]" />
                            ) : (
                              <User className="w-5 h-5 text-[#006233]" />
                            )}
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-sm text-gray-900 dark:text-white">
                              {user.name}
                            </p>
                            <p className="text-xs text-gray-500 capitalize">
                              {user.type === 'company' ? 'Entreprise' : user.type === 'buyer' ? 'Acheteur' : 'Fournisseur'}
                            </p>
                          </div>
                        </button>
                      ))}
                      
                      {searchResults.length === 0 && searchQuery && (
                        <p className="text-center py-8 text-sm text-gray-500">
                          Aucun résultat pour &quot;{searchQuery}&quot;
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Right side - Chat Window */}
        <div className={`flex-1 ${isMobileListVisible ? 'hidden lg:flex' : 'flex'}`}>
          <ChatWindow
            conversation={activeConversation}
            messages={messages}
            isLoadingMessages={isLoadingMessages}
            hasMoreMessages={hasMoreMessages}
            onSendMessage={handleSendMessage}
            onLoadMore={handleLoadMore}
            onTypingStart={handleTypingStart}
            onTypingStop={handleTypingStop}
            onMarkAsRead={handleMarkAsRead}
            currentUserId={currentUserId}
            typingUsers={typingUsers}
            isMobile={true}
            onBack={() => setIsMobileListVisible(true)}
          />
        </div>
      </div>
    </div>
  );
}
