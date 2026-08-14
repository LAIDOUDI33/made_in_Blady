'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  X, 
  Minimize2,
  Send,
  Bot,
  User,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
} from 'lucide-react';
import ChatbotMessage from './ChatbotMessage';
import ChatbotSuggestions from './ChatbotSuggestions';
import ProductCardMessage from './ProductCardMessage';

interface ChatMessage {
  id: string;
  role: 'user' | 'bot' | 'system';
  content: string;
  intent?: string;
  suggestions?: string[];
  cards?: Array<{
    id: string;
    name: string;
    image?: string;
    price?: string;
    supplier: string;
    link: string;
  }>;
  feedback?: 'positive' | 'negative' | null;
  createdAt: Date;
}

interface ChatbotWindowProps {
  userId?: string;
  onClose: () => void;
  position?: 'bottom-right' | 'bottom-left';
}

export default function ChatbotWindow({ 
  userId, 
  onClose,
  position = 'bottom-right'
}: ChatbotWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize session
  useEffect(() => {
    const storedSession = sessionStorage.getItem('chatbot_session_id');
    if (storedSession) {
      setSessionId(storedSession);
      loadHistory(storedSession);
    } else {
      const newSession = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSession);
      sessionStorage.setItem('chatbot_session_id', newSession);
      
      // Send initial greeting
      addBotMessage({
        content: getGreetingMessage(),
        suggestions: ['Rechercher un produit', 'Poster un appel d\'offres', 'Contacter le support'],
      });
    }
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Focus input on open
  useEffect(() => {
    if (!isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isMinimized]);

  const loadHistory = async (sid: string) => {
    try {
      const response = await fetch(`/api/ai/chatbot/history?sessionId=${sid}`);
      const data = await response.json();
      
      if (data.success && data.data.messages.length > 0) {
        setMessages(data.data.messages.map((msg: any) => ({
          ...msg,
          createdAt: new Date(msg.createdAt),
        })));
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addBotMessage = useCallback((msg: {
    content: string;
    suggestions?: string[];
    cards?: ChatMessage['cards'];
    intent?: string;
  }) => {
    setMessages(prev => [...prev, {
      id: `bot_${Date.now()}`,
      role: 'bot',
      content: msg.content,
      intent: msg.intent,
      suggestions: msg.suggestions,
      cards: msg.cards,
      feedback: null,
      createdAt: new Date(),
    }]);
  }, []);

  const handleSendMessage = async () => {
    const message = inputValue.trim();
    if (!message || isLoading) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: message,
      createdAt: new Date(),
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await fetch('/api/ai/chatbot/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          sessionId,
          userId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Simulate typing delay
        await new Promise(resolve => setTimeout(resolve, data.data.typingDelay || 1000));
        
        setIsTyping(false);

        addBotMessage({
          content: data.data.reply,
          suggestions: data.data.suggestions,
          cards: data.data.cards,
          intent: data.data.intent,
        });
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
      
      addBotMessage({
        content: "Désolé, une erreur s'est produite. Veuillez réessayer.",
        suggestions: ['Réessayer', 'Contacter le support'],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    // Auto-send after a short delay
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  const handleFeedback = async (messageId: string, rating: 'positive' | 'negative') => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, feedback: rating } : msg
    ));

    try {
      await fetch('/api/ai/chatbot/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          sessionId,
          rating,
        }),
      });
    } catch (error) {
      console.error('Error sending feedback:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const positionClasses = {
    'bottom-right': 'right-6 bottom-6',
    'bottom-left': 'left-6 bottom-6',
  };

  if (isMinimized) {
    return (
      <div className={`fixed ${positionClasses[position]} z-50`}>
        <Button
          onClick={() => setIsMinimized(false)}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-[#006233] to-[#004d28] text-white shadow-xl"
        >
          <Sparkles className="h-7 w-7" />
        </Button>
      </div>
    );
  }

  return (
    <div 
      className={`
        fixed ${positionClasses[position]} z-50 
        w-[380px] max-w-[calc(100vw-3rem)] 
        bg-white rounded-2xl shadow-2xl border border-gray-200
        flex flex-col overflow-hidden
        animate-in slide-in-from-bottom-4 fade-in duration-300
      `}
      style={{ height: '560px', maxHeight: 'calc(100vh - 6rem)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#006233] to-[#004d28] text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Assistant AlgeriaTrade</h3>
            <p className="text-xs text-green-100 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              En ligne • Propulsé par IA
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Minimiser"
          >
            <Minimize2 className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div key={message.id}>
            <ChatbotMessage
              message={message}
              onFeedback={(rating) => handleFeedback(message.id, rating)}
            />
            
            {/* Show product cards after bot messages */}
            {message.role === 'bot' && message.cards && message.cards.length > 0 && (
              <div className="mt-2 space-y-2">
                {message.cards.map(card => (
                  <ProductCardMessage key={card.id} card={card} />
                ))}
              </div>
            )}
            
            {/* Show suggestions after last bot message */}
            {message.role === 'bot' && message.suggestions && message.suggestions.length > 0 && (
              <ChatbotSuggestions
                suggestions={message.suggestions}
                onSelect={handleSuggestionClick}
              />
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 rounded-full bg-[#006233] flex items-center justify-center flex-shrink-0">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-4 py-3 bg-white border-t border-gray-200">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Écrivez votre message..."
            disabled={isLoading}
            className="flex-1 rounded-full border-gray-300 focus:border-[#006233] focus:ring-[#006233]/20"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            size="icon"
            className="rounded-full bg-[#006233] hover:bg-[#007a3f] text-white"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        <p className="text-xs text-gray-400 mt-2 text-center">
          Assistant IA • Vos données sont sécurisées 🔒
        </p>
      </div>
    </div>
  );
}

function getGreetingMessage(): string {
  const hour = new Date().getHours();
  
  let greeting = 'Bonjour';
  if (hour >= 18) greeting = 'Bonsoir';
  else if (hour < 12) greeting = 'Bonjour';

  return `${greeting} ! 👋 Je suis l'assistant virtuel d'**AlgeriaTrade.dz**, votre marketplace B2B en Algérie 🇩🇿

Comment puis-je vous aider aujourd'hui ?`;
}
