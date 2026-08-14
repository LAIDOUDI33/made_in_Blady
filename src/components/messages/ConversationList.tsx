'use client';

import { useState, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { ConversationWithDetails } from '@/types/message';

interface ConversationListProps {
  conversations: ConversationWithDetails[];
  activeConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  isLoading?: boolean;
}

export function ConversationList({
  conversations,
  activeConversationId,
  onSelectConversation,
  isLoading = false,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter conversations based on search
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;

    const query = searchQuery.toLowerCase();
    return conversations.filter((conv) => {
      const otherUser = conv.otherParticipant?.user;
      if (!otherUser) return false;

      const nameMatch = otherUser.name?.toLowerCase().includes(query);
      const companyMatch = otherUser.company?.name?.toLowerCase().includes(query);
      const messageMatch = conv.lastMessage?.content?.toLowerCase().includes(query);

      return nameMatch || companyMatch || messageMatch;
    });
  }, [conversations, searchQuery]);

  // Format last message time
  const formatLastMessageTime = (date: Date | null | undefined): string => {
    if (!date) return '';
    
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / (1000 * 60));

    if (diffMin < 1) return "à l'instant";
    if (diffMin < 60) return `${diffMin}min`;
    if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h`;
    
    return formatDistanceToNow(d, { addSuffix: false, locale: fr });
  };

  // Get conversation display name
  const getDisplayName = (conversation: ConversationWithDetails): string => {
    const user = conversation.otherParticipant?.user;
    if (!user) return 'Conversation';

    if (user.company?.name) {
      return user.company.name;
    }
    return user.name || 'Utilisateur inconnu';
  };

  // Get avatar for conversation
  const getAvatar = (conversation: ConversationWithDetails): string | null | undefined => {
    const user = conversation.otherParticipant?.user;
    if (user?.company?.logo) return user.company.logo;
    return user?.avatar;
  };

  // Get avatar fallback
  const getAvatarFallback = (conversation: ConversationWithDetails): string => {
    const name = getDisplayName(conversation);
    return name.charAt(0).toUpperCase();
  };

  // Truncate message preview
  const truncateMessage = (content: string | null | undefined, maxLength = 50): string => {
    if (!content) return '';
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  // Empty state
  if (!isLoading && conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <MessageCircle className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Aucune conversation
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[240px]">
          Commencez une nouvelle conversation avec un fournisseur ou un acheteur
        </p>
      </div>
    );
  }

  // No search results
  if (filteredConversations.length === 0 && searchQuery) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <Search className="w-12 h-12 text-gray-300 mb-3" />
        <p className="text-sm text-gray-500">
          Aucun résultat pour &quot;{searchQuery}&quot;
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Messages
        </h2>
        
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600"
          />
        </div>
      </div>

      {/* Conversations list */}
      <ScrollArea className="flex-1">
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 flex items-center gap-3 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-3 w-32 rounded bg-gray-200 dark:bg-gray-700" />
                </div>
                <div className="h-4 w-12 rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            ))
          ) : (
            filteredConversations.map((conversation) => {
              const isActive = conversation.id === activeConversationId;
              const displayName = getDisplayName(conversation);
              const hasUnread = conversation.unreadCount > 0;

              return (
                <button
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation.id)}
                  className={`w-full p-4 flex items-center gap-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    isActive ? 'bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-[#006233]' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={getAvatar(conversation) || undefined} alt={displayName} />
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 font-medium">
                        {getAvatarFallback(conversation)}
                      </AvatarFallback>
                    </Avatar>
                    {/* Online indicator - could be enhanced with real status */}
                    {/* <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" /> */}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-medium truncate ${
                        hasUnread ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {displayName}
                      </span>
                      <span className={`text-xs flex-shrink-0 ml-2 ${
                        hasUnread ? 'text-[#006233] font-medium' : 'text-gray-400'
                      }`}>
                        {formatLastMessageTime(conversation.lastMessageAt || conversation.updatedAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className={`text-sm truncate ${
                        hasUnread ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {conversation.lastMessage?.fileType 
                          ? `📎 ${conversation.lastMessage.fileName || 'Fichier joint'}`
                          : truncateMessage(conversation.lastMessage?.content)
                        }
                      </p>

                      {/* Unread badge */}
                      {hasUnread && (
                        <Badge 
                          variant="destructive" 
                          className="ml-2 flex-shrink-0 min-w-[20px] h-5 px-1.5 text-xs justify-center"
                          style={{ backgroundColor: '#006233' }}
                        >
                          {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export default ConversationList;
