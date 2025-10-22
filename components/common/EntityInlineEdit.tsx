"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import ContentEditable, { ContentEditableEvent } from "react-contenteditable";
import { Check, X, Edit2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface EntityInlineEditProps<T = any> {
  entity: T;
  field: keyof T;
  onUpdate: (id: string, data: Partial<T>) => Promise<void> | void;
  label: string;
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
  getId?: (entity: T) => string;
  size?: "sm" | "md" | "lg";
  variant?: "minimal" | "underline" | "card" | "default";
}

export function EntityInlineEdit<T = any>({
  entity,
  field,
  onUpdate,
  label,
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
  allowedAttributes = [],
  getId = (entity: any) => entity.id,
  size = "md",
  variant = "default"
}: EntityInlineEditProps<T>) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(entity[field] || ""));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update edit value when prop value changes
  useEffect(() => {
    setEditValue(String(entity[field] || ""));
  }, [entity, field]);

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
    setEditValue(newValue);
    setError(null);
  }, [sanitizeHtml, allowedTags]);

  const handleStartEdit = useCallback(() => {
    if (disabled || loading) return;
    setEditValue(String(entity[field] || ""));
    setError(null);
    setIsEditing(true);
  }, [disabled, loading, entity, field]);

  const validateAndSave = useCallback(async () => {
    const trimmedValue = editValue.trim();
    
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
    const currentValue = String(entity[field] || "");
    if (trimmedValue !== currentValue) {
      setIsSaving(true);
      try {
        await onUpdate(getId(entity), { [field]: trimmedValue } as Partial<T>);
        setIsEditing(false);
        setError(null);
      } catch (error) {
        console.error('Error saving:', error);
        toast.error('Failed to save changes');
        setError('Failed to save changes');
      } finally {
        setIsSaving(false);
      }
    } else {
      setIsEditing(false);
      setError(null);
    }
  }, [editValue, entity, field, validation, maxLength, onUpdate, getId]);

  const handleSave = useCallback(() => {
    validateAndSave();
  }, [validateAndSave]);

  const handleCancel = useCallback(() => {
    setEditValue(String(entity[field] || ""));
    setError(null);
    setIsEditing(false);
  }, [entity, field]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    } else if (e.key === "Enter" && multiline && e.shiftKey) {
      // Allow Shift+Enter for multiline
      return;
    } else if (e.key === "Enter" && multiline) {
      // Prevent default Enter behavior in multiline mode
      e.preventDefault();
    }
  }, [handleSave, handleCancel, multiline]);

  const handleBlur = useCallback(() => {
    // Add a small delay to allow save button clicks
    timeoutRef.current = setTimeout(() => {
      if (isEditing && !isSaving) {
        handleSave();
      }
    }, 150);
  }, [isEditing, isSaving, handleSave]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Size classes
  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm", 
    lg: "text-base"
  };

  // Variant classes
  const variantClasses = {
    minimal: "hover:bg-muted/30 border-0",
    underline: "border-b border-dashed border-muted-foreground/30 hover:border-muted-foreground/60",
    card: "border border-transparent hover:border-border hover:shadow-sm rounded-md",
    default: "hover:bg-muted/50 rounded-md border border-transparent hover:border-border"
  };

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
              "min-h-[20px] px-2 py-1 border border-input rounded-md bg-background",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
              "transition-all duration-200",
              error && "border-destructive focus:ring-destructive",
              sizeClasses[size],
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
        <div className="flex items-center gap-1 mt-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSave}
            disabled={isSaving}
            className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-700"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            disabled={isSaving}
            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  const displayValue = String(entity[field] || "") || emptyValue;
  const isEmpty = !entity[field];

  return (
    <div 
      className={cn(
        "group flex items-center gap-2 cursor-pointer transition-all duration-200 p-1 -m-1",
        variantClasses[variant],
        disabled && "cursor-not-allowed opacity-50",
        loading && "opacity-50",
        isEmpty && "text-muted-foreground italic",
        sizeClasses[size],
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

// Specialized components for nested fields
interface EntityNestedFieldEditProps<T = any> {
  entity: T;
  field: keyof T;
  nestedField: string;
  onUpdate: (id: string, data: Partial<T>) => Promise<void> | void;
  label: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxLength?: number;
  multiline?: boolean;
  validation?: (value: string) => string | null;
  loading?: boolean;
  emptyValue?: string;
  getId?: (entity: T) => string;
  size?: "sm" | "md" | "lg";
  variant?: "minimal" | "underline" | "card" | "default";
}

export function EntityNestedFieldEdit<T = any>({
  entity,
  field,
  nestedField,
  onUpdate,
  label,
  placeholder,
  className,
  disabled = false,
  maxLength,
  multiline = false,
  validation,
  loading = false,
  emptyValue,
  getId = (entity: any) => entity.id,
  size = "md",
  variant = "default"
}: EntityNestedFieldEditProps<T>) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String((entity[field] as any)?.[nestedField] || ""));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update edit value when prop value changes
  useEffect(() => {
    setEditValue(String((entity[field] as any)?.[nestedField] || ""));
  }, [entity, field, nestedField]);

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

  const handleChange = useCallback((evt: ContentEditableEvent) => {
    setEditValue(evt.target.value);
    setError(null);
  }, []);

  const handleStartEdit = useCallback(() => {
    if (disabled || loading) return;
    setEditValue(String((entity[field] as any)?.[nestedField] || ""));
    setError(null);
    setIsEditing(true);
  }, [disabled, loading, entity, field, nestedField]);

  const validateAndSave = useCallback(async () => {
    const trimmedValue = editValue.trim();
    
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
    const currentValue = String((entity[field] as any)?.[nestedField] || "");
    if (trimmedValue !== currentValue) {
      setIsSaving(true);
      try {
        const updatedNestedField = {
          ...(entity[field] as any),
          [nestedField]: trimmedValue
        };
        await onUpdate(getId(entity), { [field]: updatedNestedField } as Partial<T>);
        setIsEditing(false);
        setError(null);
      } catch (error) {
        console.error('Error saving:', error);
        toast.error('Failed to save changes');
        setError('Failed to save changes');
      } finally {
        setIsSaving(false);
      }
    } else {
      setIsEditing(false);
      setError(null);
    }
  }, [editValue, entity, field, nestedField, validation, maxLength, onUpdate, getId]);

  const handleSave = useCallback(() => {
    validateAndSave();
  }, [validateAndSave]);

  const handleCancel = useCallback(() => {
    setEditValue(String((entity[field] as any)?.[nestedField] || ""));
    setError(null);
    setIsEditing(false);
  }, [entity, field, nestedField]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    } else if (e.key === "Enter" && multiline && e.shiftKey) {
      // Allow Shift+Enter for multiline
      return;
    } else if (e.key === "Enter" && multiline) {
      // Prevent default Enter behavior in multiline mode
      e.preventDefault();
    }
  }, [handleSave, handleCancel, multiline]);

  const handleBlur = useCallback(() => {
    // Add a small delay to allow save button clicks
    timeoutRef.current = setTimeout(() => {
      if (isEditing && !isSaving) {
        handleSave();
      }
    }, 150);
  }, [isEditing, isSaving, handleSave]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Size classes
  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm", 
    lg: "text-base"
  };

  // Variant classes
  const variantClasses = {
    minimal: "hover:bg-muted/30 border-0",
    underline: "border-b border-dashed border-muted-foreground/30 hover:border-muted-foreground/60",
    card: "border border-transparent hover:border-border hover:shadow-sm rounded-md",
    default: "hover:bg-muted/50 rounded-md border border-transparent hover:border-border"
  };

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
              "min-h-[20px] px-2 py-1 border border-input rounded-md bg-background",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
              "transition-all duration-200",
              error && "border-destructive focus:ring-destructive",
              sizeClasses[size],
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
        <div className="flex items-center gap-1 mt-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSave}
            disabled={isSaving}
            className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-700"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            disabled={isSaving}
            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  const displayValue = String((entity[field] as any)?.[nestedField] || "") || emptyValue;
  const isEmpty = !(entity[field] as any)?.[nestedField];

  return (
    <div 
      className={cn(
        "group flex items-center gap-2 cursor-pointer transition-all duration-200 p-1 -m-1",
        variantClasses[variant],
        disabled && "cursor-not-allowed opacity-50",
        loading && "opacity-50",
        isEmpty && "text-muted-foreground italic",
        sizeClasses[size],
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

// Specialized component for boolean fields
interface EntityBooleanEditProps<T = any> {
  entity: T;
  field: keyof T;
  onUpdate: (id: string, data: Partial<T>) => Promise<void> | void;
  label: string;
  trueLabel?: string;
  falseLabel?: string;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  getId?: (entity: T) => string;
  size?: "sm" | "md" | "lg";
  variant?: "minimal" | "underline" | "card" | "default";
}

export function EntityBooleanEdit<T = any>({
  entity,
  field,
  onUpdate,
  label,
  trueLabel = "Yes",
  falseLabel = "No",
  className,
  disabled = false,
  loading = false,
  getId = (entity: any) => entity.id,
  size = "md",
  variant = "default"
}: EntityBooleanEditProps<T>) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(entity[field] || ""));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentValue = entity[field] as boolean;
  const displayValue = currentValue ? trueLabel : falseLabel;

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

  const handleChange = useCallback((evt: ContentEditableEvent) => {
    setEditValue(evt.target.value);
    setError(null);
  }, []);

  const handleStartEdit = useCallback(() => {
    if (disabled || loading) return;
    setEditValue(displayValue);
    setError(null);
    setIsEditing(true);
  }, [disabled, loading, displayValue]);

  const validateAndSave = useCallback(async () => {
    const trimmedValue = editValue.trim().toLowerCase();
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Validate boolean values
    const validTrueValues = ['true', 'yes', 'active', 'enabled', '1'];
    const validFalseValues = ['false', 'no', 'inactive', 'disabled', '0'];
    
    if (!validTrueValues.includes(trimmedValue) && !validFalseValues.includes(trimmedValue)) {
      setError(`Please enter ${trueLabel.toLowerCase()} or ${falseLabel.toLowerCase()}`);
      return;
    }

    const newValue = validTrueValues.includes(trimmedValue);
    
    // Only save if value changed
    if (newValue !== currentValue) {
      setIsSaving(true);
      try {
        await onUpdate(getId(entity), { [field]: newValue } as Partial<T>);
        setIsEditing(false);
        setError(null);
      } catch (error) {
        console.error('Error saving:', error);
        toast.error('Failed to save changes');
        setError('Failed to save changes');
      } finally {
        setIsSaving(false);
      }
    } else {
      setIsEditing(false);
      setError(null);
    }
  }, [editValue, currentValue, entity, field, onUpdate, getId, trueLabel, falseLabel]);

  const handleSave = useCallback(() => {
    validateAndSave();
  }, [validateAndSave]);

  const handleCancel = useCallback(() => {
    setEditValue(displayValue);
    setError(null);
    setIsEditing(false);
  }, [displayValue]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  }, [handleSave, handleCancel]);

  const handleBlur = useCallback(() => {
    // Add a small delay to allow save button clicks
    timeoutRef.current = setTimeout(() => {
      if (isEditing && !isSaving) {
        handleSave();
      }
    }, 150);
  }, [isEditing, isSaving, handleSave]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Size classes
  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm", 
    lg: "text-base"
  };

  // Variant classes
  const variantClasses = {
    minimal: "hover:bg-muted/30 border-0",
    underline: "border-b border-dashed border-muted-foreground/30 hover:border-muted-foreground/60",
    card: "border border-transparent hover:border-border hover:shadow-sm rounded-md",
    default: "hover:bg-muted/50 rounded-md border border-transparent hover:border-border"
  };

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
              "min-h-[20px] px-2 py-1 border border-input rounded-md bg-background",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
              "transition-all duration-200",
              error && "border-destructive focus:ring-destructive",
              sizeClasses[size],
              className
            )}
            disabled={disabled || loading}
            data-placeholder={`Enter ${trueLabel.toLowerCase()} or ${falseLabel.toLowerCase()}`}
          />
          {error && (
            <div className="text-xs text-destructive mt-1 px-2">{error}</div>
          )}
        </div>
        <div className="flex items-center gap-1 mt-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSave}
            disabled={isSaving}
            className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-700"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            disabled={isSaving}
            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "group flex items-center gap-2 cursor-pointer transition-all duration-200 p-1 -m-1",
        variantClasses[variant],
        disabled && "cursor-not-allowed opacity-50",
        loading && "opacity-50",
        sizeClasses[size],
        className
      )}
      onClick={handleStartEdit}
    >
      <div className="flex-1 min-h-[20px] flex items-center">
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
