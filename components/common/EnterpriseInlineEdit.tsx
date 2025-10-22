"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import ContentEditable, { ContentEditableEvent } from "react-contenteditable";
import { Edit2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface EnterpriseInlineEditProps {
  value: string;
  onSave: (value: string) => Promise<void> | void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxLength?: number;
  multiline?: boolean;
  validation?: (value: string) => string | null;
  loading?: boolean;
  emptyValue?: string;
  sanitizeHtml?: boolean;
  allowedTags?: string[];
  allowedAttributes?: string[];
}

export function EnterpriseInlineEdit({
  value,
  onSave,
  placeholder = "Click to edit",
  className,
  disabled = false,
  maxLength,
  multiline = false,
  validation,
  loading = false,
  emptyValue = "Not specified",
  sanitizeHtml = true,
  allowedTags = ["br", "strong", "em", "u"],
  allowedAttributes = []
}: EnterpriseInlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const latestValueRef = useRef<string>(value);

  // Update edit value when prop value changes
  useEffect(() => {
    setEditValue(value);
  }, [value]);

  // Focus and select text when editing starts
  useEffect(() => {
    if (isEditing && contentEditableRef.current) {
      const element = contentEditableRef.current;
      element.focus();
      
      // Select all text
      const range = document.createRange();
      range.selectNodeContents(element);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, [isEditing]);

  const sanitizeValue = useCallback((html: string): string => {
    if (!sanitizeHtml) return html;
    
    // Simple HTML sanitization - remove all tags except allowed ones
    let sanitized = html;
    
    // Remove all tags first
    sanitized = sanitized.replace(/<[^>]*>/g, '');
    
    // Add back allowed tags if they were present
    if (allowedTags.includes('br')) {
      sanitized = sanitized.replace(/\n/g, '<br>');
    }
    
    return sanitized;
  }, [sanitizeHtml, allowedTags]);

  const handleChange = useCallback((evt: ContentEditableEvent) => {
    const newValue = sanitizeValue(evt.target.value);
    console.log('📝 handleChange called:', { 
      originalValue: evt.target.value, 
      sanitizedValue: newValue,
      currentEditValue: editValue 
    });
    setEditValue(newValue);
    setError(null);
    
    // Store the latest value for immediate use
    latestValueRef.current = newValue;
  }, [sanitizeValue, editValue]);

  const handleStartEdit = useCallback(() => {
    console.log('🖱️ handleStartEdit called:', { value, disabled, loading });
    if (disabled || loading) return;
    setEditValue(value);
    latestValueRef.current = value;
    setError(null);
    setIsEditing(true);
    console.log('✅ Edit mode started, editValue set to:', value);
  }, [disabled, loading, value]);

  const validateAndSave = useCallback(async (currentValue?: string) => {
    // Use the passed value or fall back to editValue
    const valueToCheck = currentValue || editValue;
    const trimmedValue = valueToCheck.trim();
    console.log('🔄 EnterpriseInlineEdit validateAndSave called:', { 
      trimmedValue, 
      originalValue: value, 
      isChanged: trimmedValue !== value,
      currentValue,
      editValue
    });
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

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
      console.log('💾 Value changed, calling onSave with:', trimmedValue);
      setIsSaving(true);
      try {
        await onSave(trimmedValue);
        console.log('✅ onSave completed successfully');
        setIsEditing(false);
        setError(null);
      } catch (error) {
        console.error('❌ Error saving:', error);
        toast.error('Failed to save changes');
        setError('Failed to save changes');
      } finally {
        setIsSaving(false);
      }
    } else {
      console.log('📝 No changes detected, canceling edit');
      setIsEditing(false);
      setError(null);
    }
  }, [editValue, value, validation, maxLength, onSave]);

  const handleSave = useCallback(() => {
    validateAndSave();
  }, [validateAndSave]);

  const handleCancel = useCallback(() => {
    setEditValue(value);
    setError(null);
    setIsEditing(false);
  }, [value]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    console.log('⌨️ Key pressed:', e.key, 'multiline:', multiline, 'shiftKey:', e.shiftKey);
    
    if (e.key === "Enter" && !multiline) {
      console.log('💾 Enter pressed (single-line), saving...');
      e.preventDefault();
      validateAndSave(latestValueRef.current);
    } else if (e.key === "Escape") {
      console.log('❌ Escape pressed, canceling...');
      e.preventDefault();
      handleCancel();
    } else if (e.key === "Enter" && multiline && e.shiftKey) {
      console.log('📝 Shift+Enter pressed (multiline), allowing line break');
      // Allow Shift+Enter for multiline
      return;
    } else if (e.key === "Enter" && multiline) {
      console.log('💾 Enter pressed (multiline), saving...');
      // Save on Enter for multiline too
      e.preventDefault();
      validateAndSave(latestValueRef.current);
    }
  }, [validateAndSave, handleCancel, multiline]);

  const handleBlur = useCallback(() => {
    // Cancel editing when clicking away
    if (isEditing && !isSaving) {
      handleCancel();
    }
  }, [isEditing, isSaving, handleCancel]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (isEditing) {
    return (
      <div className="flex items-start gap-2 w-full">
        <div className="flex-1">
          <ContentEditable
            innerRef={contentEditableRef}
            html={editValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className={cn(
              "min-h-[20px] px-2 py-1 border border-input rounded-md bg-background text-sm",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
              "transition-all duration-200",
              error && "border-destructive focus:ring-destructive",
              className
            )}
            disabled={disabled || loading}
            data-placeholder={placeholder}
            style={{
              minHeight: multiline ? '60px' : '32px',
              whiteSpace: multiline ? 'pre-wrap' : 'nowrap',
              overflow: multiline ? 'auto' : 'hidden'
            }}
          />
          {error && (
            <div className="text-xs text-destructive mt-1 px-2">{error}</div>
          )}
        </div>
      </div>
    );
  }

  const displayValue = value || emptyValue;
  const isEmpty = !value;

  return (
    <div 
      className={cn(
        "group flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded-md p-1 -m-1 transition-all duration-200",
        "hover:shadow-sm border border-transparent hover:border-primary",
        disabled && "cursor-not-allowed opacity-50",
        loading && "opacity-50",
        isEmpty && "text-muted-foreground italic",
        className
      )}
      onClick={handleStartEdit}
    >
      <div className={cn(
        "flex-1 min-h-[20px] flex items-center",
        multiline && "whitespace-pre-wrap"
      )}>
        {displayValue}
      </div>
      {!disabled && !loading && (
        <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0" />
      )}
      {loading && (
        <Loader2 className="h-3 w-3 animate-spin flex-shrink-0" />
      )}
    </div>
  );
}

// Specialized components for common use cases
export function EnterpriseTextEdit({
  value,
  onSave,
  placeholder = "Click to edit",
  className,
  disabled = false,
  maxLength,
  validation,
  loading = false,
  emptyValue = "Not specified"
}: Omit<EnterpriseInlineEditProps, 'multiline'>) {
  return (
    <EnterpriseInlineEdit
      value={value}
      onSave={onSave}
      placeholder={placeholder}
      multiline={false}
      className={className}
      disabled={disabled}
      maxLength={maxLength}
      validation={validation}
      loading={loading}
      emptyValue={emptyValue}
    />
  );
}

export function EnterpriseTextareaEdit({
  value,
  onSave,
  placeholder = "Click to edit",
  className,
  disabled = false,
  maxLength,
  validation,
  loading = false,
  emptyValue = "Not specified"
}: Omit<EnterpriseInlineEditProps, 'multiline'>) {
  return (
    <EnterpriseInlineEdit
      value={value}
      onSave={onSave}
      placeholder={placeholder}
      multiline={true}
      className={className}
      disabled={disabled}
      maxLength={maxLength}
      validation={validation}
      loading={loading}
      emptyValue={emptyValue}
    />
  );
}
