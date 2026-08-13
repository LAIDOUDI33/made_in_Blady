'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Paperclip, Send, Smile, X, Image as ImageIcon } from 'lucide-react';

interface MessageInputProps {
  onSend: (data: {
    content?: string;
    fileType?: string;
    fileUrl?: string;
    fileName?: string;
  }) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  disabled?: boolean;
}

// Basic emoji list for quick access
const EMOJI_LIST = ['😀', '😂', '🥰', '👍', '👏', '🎉', '❤️', '🔥', '✅', '💯', '🙏', '🤝', '📦', '💰', '⚡', '🚚'];

const MAX_MESSAGE_LENGTH = 2000;

export function MessageInput({
  onSend,
  onTypingStart,
  onTypingStop,
  disabled = false,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachment, setAttachment] = useState<{
    file: File;
    preview: string;
    type: string;
    name: string;
  } | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle text input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    
    if (value.length <= MAX_MESSAGE_LENGTH) {
      setMessage(value);
      
      // Auto-resize textarea
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
      }

      // Typing indicator
      if (value.trim()) {
        onTypingStart();
        
        // Reset typing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          onTypingStop();
        }, 3000);
      } else {
        onTypingStop();
      }
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter to send, Shift+Enter for new line
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    
    // Escape to close emoji picker
    if (e.key === 'Escape') {
      setShowEmojiPicker(false);
    }
  };

  // Handle send message
  const handleSend = useCallback(() => {
    const hasContent = message.trim() || attachment;
    
    if (!hasContent || disabled) return;

    // Prepare file data if attachment exists
    let fileData: { fileType?: string; fileUrl?: string; fileName?: string } = {};
    
    if (attachment) {
      // In a real implementation, you would upload the file first
      // For now, we'll create an object URL and include base info
      fileData = {
        fileType: attachment.type,
        fileUrl: attachment.preview,
        fileName: attachment.name,
      };
    }

    onSend({
      content: message.trim() || undefined,
      ...fileData,
    });

    // Reset state
    setMessage('');
    setAttachment(null);
    setShowEmojiPicker(false);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    onTypingStop();
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [message, attachment, disabled, onSend, onTypingStop]);

  // Handle emoji selection
  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Le fichier est trop volumineux (max 10 Mo)');
      return;
    }

    // Create preview URL
    const preview = URL.createObjectURL(file);

    setAttachment({
      file,
      preview,
      type: file.type,
      name: file.name,
    });

    // Reset input value
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove attachment
  const removeAttachment = () => {
    if (attachment) {
      URL.revokeObjectURL(attachment.preview);
    }
    setAttachment(null);
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
      {/* Attachment Preview */}
      {attachment && (
        <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center gap-3">
          {attachment.type.startsWith('image/') ? (
            <div className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0">
              <img
                src={attachment.preview}
                alt="Aperçu"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded bg-[#006233]/10 flex items-center justify-center flex-shrink-0">
              {attachment.type.includes('pdf') ? (
                <ImageIcon className="w-6 h-6 text-red-500" />
              ) : (
                <Paperclip className="w-6 h-6 text-gray-500" />
              )}
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {attachment.name}
            </p>
            <p className="text-xs text-gray-500">
              {(attachment.file.size / 1024).toFixed(1)} Ko
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={removeAttachment}
            className="flex-shrink-0 h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="mb-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <div className="grid grid-cols-8 gap-2">
            {EMOJI_LIST.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleEmojiSelect(emoji)}
                className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-xl transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2">
        {/* Attachment button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="flex-shrink-0 h-10 w-10 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <Paperclip className="w-5 h-5" />
        </Button>

        {/* Textarea */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Écrivez votre message..."
            disabled={disabled}
            rows={1}
            className="w-full resize-none rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 pr-16 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#006233] focus:border-transparent disabled:opacity-50 max-h-[120px]"
          />

          {/* Character count */}
          {message.length > MAX_MESSAGE_LENGTH * 0.8 && (
            <span className={`absolute right-3 bottom-2 text-xs ${
              message.length >= MAX_MESSAGE_LENGTH 
                ? 'text-red-500' 
                : 'text-gray-400'
            }`}>
              {message.length}/{MAX_MESSAGE_LENGTH}
            </span>
          )}
        </div>

        {/* Emoji button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          disabled={disabled}
          className={`flex-shrink-0 h-10 w-10 ${
            showEmojiPicker 
              ? 'text-[#006233] bg-emerald-50' 
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Smile className="w-5 h-5" />
        </Button>

        {/* Send button */}
        <Button
          onClick={handleSend}
          disabled={disabled || (!message.trim() && !attachment)}
          className="flex-shrink-0 h-10 px-4 rounded-xl"
          style={{ backgroundColor: '#006233' }}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default MessageInput;
