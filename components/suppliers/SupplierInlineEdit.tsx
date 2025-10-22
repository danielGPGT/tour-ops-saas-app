"use client";

import React from "react";
import { InlineTextEdit, InlineTextareaEdit } from "@/components/common/InlineEdit";
import { useUpdateSupplier } from "@/lib/hooks/useSuppliers";
import { toast } from "sonner";
import type { Supplier } from "@/lib/types/supplier";

interface SupplierInlineEditProps {
  supplier: Supplier;
  field: keyof Supplier;
  label: string;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
  maxLength?: number;
  validation?: (value: string) => string | null;
}

export function SupplierInlineEdit({
  supplier,
  field,
  label,
  placeholder,
  multiline = false,
  className,
  maxLength,
  validation
}: SupplierInlineEditProps) {
  const updateSupplier = useUpdateSupplier();

  const handleSave = async (value: string) => {
    try {
      await updateSupplier.mutateAsync({
        id: supplier.id,
        data: { [field]: value }
      });
      toast.success(`${label} updated successfully`);
    } catch (error) {
      console.error(`Error updating ${label.toLowerCase()}:`, error);
      toast.error(`Failed to update ${label.toLowerCase()}`);
    }
  };

  const currentValue = supplier[field] as string || "";

  if (multiline) {
    return (
      <InlineTextareaEdit
        value={currentValue}
        onSave={handleSave}
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
        className={className}
        maxLength={maxLength}
        validation={validation}
      />
    );
  }

  return (
    <InlineTextEdit
      value={currentValue}
      onSave={handleSave}
      placeholder={placeholder || `Enter ${label.toLowerCase()}`}
      className={className}
      maxLength={maxLength}
      validation={validation}
    />
  );
}

// Specialized components for nested fields
interface SupplierContactEditProps {
  supplier: Supplier;
  field: string;
  label: string;
  placeholder?: string;
  className?: string;
  maxLength?: number;
  multiline?: boolean;
  validation?: (value: string) => string | null;
}

export function SupplierContactEdit({
  supplier,
  field,
  label,
  placeholder,
  className,
  maxLength,
  multiline = false,
  validation
}: SupplierContactEditProps) {
  const updateSupplier = useUpdateSupplier();

  const handleSave = async (value: string) => {
    try {
      const updatedContactInfo = {
        ...supplier.contact_info,
        [field]: value
      };
      
      await updateSupplier.mutateAsync({
        id: supplier.id,
        data: { contact_info: updatedContactInfo }
      });
      toast.success(`${label} updated successfully`);
    } catch (error) {
      console.error(`Error updating ${label.toLowerCase()}:`, error);
      toast.error(`Failed to update ${label.toLowerCase()}`);
    }
  };

  const currentValue = (supplier.contact_info as any)?.[field] || "";

  if (multiline) {
    return (
      <InlineTextareaEdit
        value={currentValue}
        onSave={handleSave}
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
        className={className}
        maxLength={maxLength}
        validation={validation}
      />
    );
  }

  return (
    <InlineTextEdit
      value={currentValue}
      onSave={handleSave}
      placeholder={placeholder || `Enter ${label.toLowerCase()}`}
      className={className}
      maxLength={maxLength}
      validation={validation}
    />
  );
}

interface SupplierPaymentEditProps {
  supplier: Supplier;
  field: string;
  label: string;
  placeholder?: string;
  className?: string;
  maxLength?: number;
  multiline?: boolean;
  validation?: (value: string) => string | null;
}

export function SupplierPaymentEdit({
  supplier,
  field,
  label,
  placeholder,
  className,
  maxLength,
  multiline = false,
  validation
}: SupplierPaymentEditProps) {
  const updateSupplier = useUpdateSupplier();

  const handleSave = async (value: string) => {
    try {
      const updatedPaymentTerms = {
        ...supplier.payment_terms,
        [field]: value
      };
      
      await updateSupplier.mutateAsync({
        id: supplier.id,
        data: { payment_terms: updatedPaymentTerms }
      });
      toast.success(`${label} updated successfully`);
    } catch (error) {
      console.error(`Error updating ${label.toLowerCase()}:`, error);
      toast.error(`Failed to update ${label.toLowerCase()}`);
    }
  };

  const currentValue = (supplier.payment_terms as any)?.[field] || "";

  if (multiline) {
    return (
      <InlineTextareaEdit
        value={currentValue}
        onSave={handleSave}
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
        className={className}
        maxLength={maxLength}
        validation={validation}
      />
    );
  }

  return (
    <InlineTextEdit
      value={currentValue}
      onSave={handleSave}
      placeholder={placeholder || `Enter ${label.toLowerCase()}`}
      className={className}
      maxLength={maxLength}
      validation={validation}
    />
  );
}
