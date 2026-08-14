'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

interface ChatbotSuggestionsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}

export default function ChatbotSuggestions({ suggestions, onSelect }: ChatbotSuggestionsProps) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-3 ml-10">
      {suggestions.map((suggestion, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          onClick={() => onSelect(suggestion)}
          className="
            text-xs rounded-full 
            border-[#006233]/30 text-[#006233] 
            hover:bg-[#006233] hover:text-white
            transition-all duration-200
            px-3 py-1.5 h-auto
          "
        >
          {suggestion}
        </Button>
      ))}
    </div>
  );
}
