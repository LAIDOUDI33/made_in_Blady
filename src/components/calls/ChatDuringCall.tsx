'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, X, Smile, Paperclip } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { ChatMessage } from '@/hooks/useWebRTC'

interface ChatDuringCallProps {
  messages: ChatMessage[]
  onSendMessage: (message: string) => void
  onClose: () => void
  currentUserId?: string
  userName?: string
  userAvatar?: string
}

export default function ChatDuringCall({
  messages,
  onSendMessage,
  onClose,
  currentUserId = '',
  userName = 'You',
  userAvatar,
}: ChatDuringCallProps) {
  const [inputValue, setInputValue] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = () => {
    if (!inputValue.trim()) return
    
    onSendMessage(inputValue.trim())
    setInputValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Format time as HH:MM
  const formatTime = (date: Date): string => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <div className="absolute right-0 top-0 bottom-20 w-80 bg-gray-900/95 backdrop-blur-sm border-l border-gray-700 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full" />
          In-call Chat
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-gray-400 hover:text-white hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages area */}
      <ScrollArea className="flex-1 p-4">
        <div ref={scrollRef} className="space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No messages yet</p>
              <p className="text-xs mt-1">Start a conversation during your call</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.senderId === currentUserId
              
              return (
                <div
                  key={message.id}
                  className={`flex gap-2 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                >
                  {!isOwnMessage && (
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={userAvatar} />
                      <AvatarFallback className="text-xs">
                        {message.senderId[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={`max-w-[70%] ${isOwnMessage ? 'items-end' : ''}`}>
                    <div
                      className={`rounded-lg px-3 py-2 ${
                        isOwnMessage
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-800 text-gray-100'
                      }`}
                    >
                      <p className="text-sm break-words">{message.content}</p>
                    </div>
                    <p className={`text-xs text-gray-500 mt-1 ${isOwnMessage ? 'text-right' : ''}`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>

                  {isOwnMessage && (
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={userAvatar} />
                      <AvatarFallback className="text-xs">{userName[0]}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              )
            })
          )}
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center gap-2">
          {/* Attachment button */}
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white hover:bg-white/10 flex-shrink-0"
          >
            <Paperclip className="w-4 h-4" />
          </Button>

          {/* Message input */}
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-indigo-500"
          />

          {/* Emoji button */}
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white hover:bg-white/10 flex-shrink-0"
          >
            <Smile className="w-4 h-4" />
          </Button>

          {/* Send button */}
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        <p className="text-xs text-gray-600 mt-2 text-center">
          Messages are not saved after the call ends
        </p>
      </div>
    </div>
  )
}

// Minimal chat input for audio calls (inline style)
export function InlineChatInput({
  onSendMessage,
  isOpen,
  onToggle,
}: {
  onSendMessage: (message: string) => void
  isOpen: boolean
  onToggle: () => void
}) {
  const [inputValue, setInputValue] = useState('')

  if (!isOpen) return null

  const handleSend = () => {
    if (!inputValue.trim()) return
    onSendMessage(inputValue.trim())
    setInputValue('')
  }

  return (
    <div className="fixed bottom-24 left-4 right-4 z-40 max-w-md mx-auto">
      <div className="bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-xl p-3 border border-gray-700">
        <div className="flex items-center gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 text-sm"
            autoFocus
          />
          <Button
            size="sm"
            onClick={onToggle}
            variant="ghost"
            className="text-gray-400"
          >
            X
          </Button>
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
