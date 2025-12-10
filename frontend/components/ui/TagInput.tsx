'use client';

import React, { useState, useRef, useCallback, KeyboardEvent } from 'react';
import { X } from 'lucide-react';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const TagInput: React.FC<TagInputProps> = ({
  value,
  onChange,
  placeholder = 'Wpisz i naciśnij spację lub przecinek...',
  disabled = false,
  className = '',
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = useCallback((tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !value.includes(trimmedTag)) {
      onChange([...value, trimmedTag]);
    }
    setInputValue('');
  }, [value, onChange]);

  const removeTag = useCallback((index: number) => {
    const newTags = value.filter((_, i) => i !== index);
    onChange(newTags);
  }, [value, onChange]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value.length - 1);
    }
  }, [inputValue, value, addTag, removeTag]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Check if user typed a comma or space - add the tag
    if (newValue.includes(',') || newValue.includes(' ')) {
      const parts = newValue.split(/[,\s]+/);
      parts.forEach((part, index) => {
        if (part.trim() && index < parts.length - 1) {
          addTag(part);
        } else if (index === parts.length - 1) {
          setInputValue(part);
        }
      });
    } else {
      setInputValue(newValue);
    }
  }, [addTag]);

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  return (
    <div
      onClick={handleContainerClick}
      className={`w-full min-h-[54px] px-3 py-2 bg-[#191B1F] border rounded-[1rem] text-sm font-medium text-white transition-all duration-200 flex flex-wrap items-center gap-1.5 cursor-text
        ${isFocused 
          ? 'border-[#F1E388] ring-2 ring-[#F1E388]/20' 
          : 'border-white/20 hover:border-[#F1E388]/40'
        }
        ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
        ${className}`}
    >
      {/* Tags */}
      {value.map((tag, index) => (
        <span
          key={`${tag}-${index}`}
          className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#F1E388]/15 text-[#F1E388] rounded-full text-xs font-medium border border-[#F1E388]/30 animate-scaleIn"
        >
          <span>{tag}</span>
          {!disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(index);
              }}
              className="flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-[#F1E388]/30 transition-colors focus:outline-none"
              aria-label={`Usuń ${tag}`}
            >
              <X className="w-2.5 h-2.5" />
            </button>
          )}
        </span>
      ))}
      
      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          if (inputValue.trim()) {
            addTag(inputValue);
          }
        }}
        placeholder={value.length === 0 ? placeholder : ''}
        disabled={disabled}
        className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-white placeholder:text-white/40 py-1"
      />
    </div>
  );
};

// Helper functions to convert between string and array format
export const tagsToString = (tags: string[]): string => tags.join(', ');

export const stringToTags = (str: string): string[] => {
  if (!str || !str.trim()) return [];
  return str
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);
};

