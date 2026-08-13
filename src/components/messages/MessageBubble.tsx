'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, CheckCheck } from 'lucide-react';
import { formatDistanceToNow, isToday, isYesterday, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Message } from '@/types/message';
import Image from 'next/image';

interface MessageBubbleProps {
  message: Message;
  currentUserId: string;
  isGrouped?: boolean;
}

export function MessageBubble({ message, currentUserId, isGrouped = false }: MessageBubbleProps) {
  const isOwn = message.fromUserId === currentUserId;

  // Format time for display
  const formatTime = (date: Date): string => {
    const d = new Date(date);
    
    if (isToday(d)) {
      return format(d, 'HH:mm');
    }
    
    if (isYesterday(d)) {
      return `Hier ${format(d, 'HH:mm')}`;
    }

    // Within last 7 days, show day name
    const daysAgo = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (daysAgo < 7) {
      return format(d, 'EEEE HH:mm', { locale: fr });
    }

    // Otherwise show date
    return format(d, 'dd/MM/yyyy HH:mm');
  };

  // Format relative time for tooltip
  const formatRelativeTime = (date: Date): string => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / (1000 * 60));

    if (diffMin < 1) return "à l'instant";
    if (diffMin < 60) return `il y a ${diffMin}min`;
    
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `il y a ${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "hier";
    
    return formatDistanceToNow(d, { addSuffix: true, locale: fr });
  };

  // Render read status indicator
  const renderReadStatus = () => {
    if (!isOwn) return null;
    
    if (message.isRead) {
      return <CheckCheck className="w-4 h-4 text-blue-400 ml-1" />;
    }
    return <Check className="w-4 h-4 text-gray-400 ml-1" />;
  };

  // Render file attachment
  const renderAttachment = () => {
    if (!message.fileUrl || !message.fileType) return null;

    // Image file
    if (message.fileType.startsWith('image/')) {
      return (
        <div className="mt-2 max-w-[280px] rounded-lg overflow-hidden">
          <Image
            src={message.fileUrl}
            alt={message.fileName || 'Image jointe'}
            width={280}
            height={200}
            className="object-cover w-full cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(message.fileUrl, '_blank')}
          />
        </div>
      );
    }

    // File attachment
    return (
      <div className="mt-2 p-3 bg-black/10 rounded-lg max-w-[280px]">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-current"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{message.fileName || 'Fichier'}</p>
            <p className="text-xs opacity-70 uppercase">{message.fileType.split('/')[1] || 'Fichier'}</p>
          </div>
          <a
            href={message.fileUrl}
            download={message.fileName || undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 p-1.5 hover:bg-white/10 rounded transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </a>
        </div>
      </div>
    );
  };

  // Own message - right aligned with green background
  if (isOwn) {
    return (
      <div className={`flex justify-end ${isGrouped ? 'mb-1' : 'mb-3'}`}>
        <div className="max-w-[75%] lg:max-w-[65%]">
          <div className="flex items-end justify-end gap-1.5">
            <div 
              className="relative px-4 py-2.5 rounded-2xl rounded-br-md shadow-sm"
              style={{ backgroundColor: '#006233', color: '#ffffff' }}
              title={formatRelativeTime(message.createdAt)}
            >
              {/* Content */}
              {message.content && (
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {message.content}
                </p>
              )}
              
              {/* Attachment */}
              {renderAttachment()}

              {/* Time and read status */}
              <div className="flex items-center justify-end gap-1 mt-1 -mb-0.5">
                <span className="text-xs opacity-70">
                  {formatTime(message.createdAt)}
                </span>
                {renderReadStatus()}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Received message - left aligned with gray background
  return (
    <div className={`flex justify-start ${isGrouped ? 'mb-1' : 'mb-3'}`}>
      <div className="flex items-end gap-2 max-w-[75%] lg:max-w-[65%]">
        {/* Avatar (hidden for grouped messages) */}
        {!isGrouped && (
          <Avatar className="w-8 h-8 flex-shrink-0 mb-auto">
            <AvatarImage src={message.fromUser.avatar || undefined} alt={message.fromUser.name} />
            <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-medium">
              {message.fromUser.name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        )}
        
        {/* Placeholder for grouped messages */}
        {isGrouped && <div className="w-8 flex-shrink-0" />}
        
        <div className="flex items-start gap-1.5">
          {/* Sender name (only for non-grouped messages) */}
          {!isGrouped && (
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 ml-2">
              {message.fromUser.name}
            </span>
          )}
          
          <div 
            className="px-4 py-2.5 rounded-2xl rounded-bl-md shadow-sm"
            style={{ backgroundColor: '#f3f4f6' }}
            title={formatRelativeTime(message.createdAt)}
          >
            {/* Content */}
            {message.content && (
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words text-gray-900">
                {message.content}
              </p>
            )}
            
            {/* Attachment */}
            {renderAttachment()}

            {/* Time */}
            <div className="flex items-center justify-end mt-1 -mb-0.5">
              <span className="text-xs text-gray-500">
                {formatTime(message.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MessageBubble;
