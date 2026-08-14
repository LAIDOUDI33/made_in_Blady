'use client';

import React from 'react';
import { Bot, User, ThumbsUp, ThumbsDown, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatMessageProps {
  message: {
    id: string;
    role: 'user' | 'bot' | 'system';
    content: string;
    intent?: string;
    feedback?: 'positive' | 'negative' | null;
    createdAt: Date;
  };
  onFeedback?: (rating: 'positive' | 'negative') => void;
}

export default function ChatbotMessage({ message, onFeedback }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isBot = message.role === 'bot';

  // Simple markdown-like rendering
  const renderContent = (text: string) => {
    // Bold text
    let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Line breaks
    html = html.replace(/\n/g, '<br/>');
    
    // Lists
    html = html.replace(/• (.*)/g, '<li class="ml-2">$1</li>');
    
    // Emoji preservation
    return html;
  };

  // Format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (isUser) {
    return (
      <div className="flex justify-end gap-2">
        <div className="max-w-[80%]">
          <div className="bg-[#006233] text-white rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-sm">
            <p 
              className="text-sm whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: renderContent(message.content) }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1 text-right flex items-center justify-end gap-1">
            <Clock className="h-3 w-3" />
            {formatTime(message.createdAt)}
          </p>
        </div>
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
          <User className="h-4 w-4 text-gray-600" />
        </div>
      </div>
    );
  }

  if (isBot) {
    return (
      <div className="flex gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#006233] to-[#004d28] flex items-center justify-center flex-shrink-0">
          <Bot className="h-4 w-4 text-white" />
        </div>
        <div className="max-w-[85%]">
          <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm border border-gray-100">
            <p 
              className="text-sm text-gray-800 whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: renderContent(message.content) }}
            />
          </div>
          
          {/* Feedback buttons */}
          {onFeedback && !message.feedback && (
            <div className="flex gap-1 mt-1.5 ml-2 opacity-0 hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFeedback('positive')}
                className="h-7 px-2 text-xs text-green-600 hover:bg-green-50 hover:text-green-700"
              >
                <ThumbsUp className="h-3.5 w-3.5 mr-1" />
                Utile
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFeedback('negative')}
                className="h-7 px-2 text-xs text-red-500 hover:bg-red-50 hover:text-red-600"
              >
                <ThumbsDown className="h-3.5 w-3.5 mr-1" />
                Pas utile
              </Button>
            </div>
          )}

          {/* Show selected feedback */}
          {message.feedback && (
            <p className={`text-xs mt-1 ml-2 ${
              message.feedback === 'positive' ? 'text-green-500' : 'text-red-500'
            }`}>
              {message.feedback === 'positive' ? '✓ Merci pour votre retour !' : 'Merci, nous allons améliorer.'}
            </p>
          )}

          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTime(message.createdAt)}
            {message.intent && (
              <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">
                {message.intent}
              </span>
            )}
          </p>
        </div>
      </div>
    );
  }

  // System messages
  return (
    <div className="flex justify-center">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 max-w-[90%]">
        <p className="text-xs text-yellow-800 text-center">{message.content}</p>
      </div>
    </div>
  );
}
