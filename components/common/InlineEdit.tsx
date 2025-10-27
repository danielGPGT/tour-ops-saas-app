"use client";

import React, { useState, useRef, useEffect } from "react";
import { Check, X, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface InlineEditProps {
  value: string;
  onSave: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
  disabled?: boolean;
  maxLength?: number;
  validation?: (value: string) => string | null;
}

export function InlineEdit({
  value,
  onSave,
  placeholder = "Click to edit",
  multiline = false,
  className,
  disabled = false,
  maxLength,
  validation
}: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    if (disabled) return;
    setEditValue(value);
    setError(null);
    setIsEditing(true);
  };

  const handleSave = () => {
    const trimmedValue = editValue.trim();
    
    // Validate if validation function provided
    if (validation) {
      const validationError = validation(trimmedValue);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    // Check max length
    if (maxLength && trimmedValue.length > maxLength) {
      setError(`Maximum ${maxLength} characters allowed`);
      return;
    }

    // Only save if value changed
    if (trimmedValue !== value) {
      onSave(trimmedValue);
    }
    
    setIsEditing(false);
    setError(null);
  };

  const handleCancel = () => {
    setEditValue(value);
    setError(null);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 w-full">
        {multiline ? (
          <Textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn("min-h-[60px] resize-none", className)}
            maxLength={maxLength}
          />
        ) : (
          <Input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn("flex-1", className)}
            maxLength={maxLength}
          />
        )}
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSave}
            className="h-8 w-8 p-0"
          >
            <Check className="h-4 w-4 text-green-600" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4 text-red-600" />
          </Button>
        </div>
        {error && (
          <div className="text-xs text-red-600 mt-1">{error}</div>
        )}
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "group flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded-md p-1 -m-1 transition-colors border border-border",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
      onClick={handleStartEdit}
    >
      <span className={cn(
        "flex-1",
        !value && "text-muted-foreground italic"
      )}>
        {value || placeholder}
      </span>
      {!disabled && (
        <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </div>
  );
}

// Specialized components for common use cases
export function InlineTextEdit({
  value,
  onSave,
  placeholder = "Click to edit",
  className,
  disabled = false,
  maxLength,
  validation
}: Omit<InlineEditProps, 'multiline'>) {
  return (
    <InlineEdit
      value={value}
      onSave={onSave}
      placeholder={placeholder}
      multiline={false}
      className={className}
      disabled={disabled}
      maxLength={maxLength}
      validation={validation}
    />
  );
}

export function InlineTextareaEdit({
  value,
  onSave,
  placeholder = "Click to edit",
  className,
  disabled = false,
  maxLength,
  validation
}: Omit<InlineEditProps, 'multiline'>) {
  return (
    <InlineEdit
      value={value}
      onSave={onSave}
      placeholder={placeholder}
      multiline={true}
      className={className}
      disabled={disabled}
      maxLength={maxLength}
      validation={validation}
    />
  );
}
