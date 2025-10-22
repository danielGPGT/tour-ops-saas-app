"use client";

import React from "react";
import { EnterpriseTextEdit, EnterpriseTextareaEdit } from "@/components/common/EnterpriseInlineEdit";
import { useUpdateSupplier } from "@/lib/hooks/useSuppliers";
import { toast } from "sonner";
import type { Supplier } from "@/lib/types/supplier";

interface EnterpriseSupplierEditProps {
  supplier: Supplier;
  field: keyof Supplier;
  label: string;
  placeholder?: string;
  className?: string;
  maxLength?: number;
  multiline?: boolean;
  validation?: (value: string) => string | null;
  loading?: boolean;
  emptyValue?: string;
}

export function EnterpriseSupplierEdit({
  supplier,
  field,
  label,
  placeholder,
  className,
  maxLength,
  multiline = false,
  validation,
  loading = false,
  emptyValue
}: EnterpriseSupplierEditProps) {
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
      throw error; // Re-throw to let the component handle the error state
    }
  };

  const currentValue = supplier[field] as string || "";

  if (multiline) {
    return (
      <EnterpriseTextareaEdit
        value={currentValue}
        onSave={handleSave}
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
        className={className}
        maxLength={maxLength}
        validation={validation}
        loading={loading}
        emptyValue={emptyValue}
      />
    );
  }

  return (
    <EnterpriseTextEdit
      value={currentValue}
      onSave={handleSave}
      placeholder={placeholder || `Enter ${label.toLowerCase()}`}
      className={className}
      maxLength={maxLength}
      validation={validation}
      loading={loading}
      emptyValue={emptyValue}
    />
  );
}

// Specialized components for nested fields
interface EnterpriseSupplierContactEditProps {
  supplier: Supplier;
  field: string;
  label: string;
  placeholder?: string;
  className?: string;
  maxLength?: number;
  multiline?: boolean;
  validation?: (value: string) => string | null;
  loading?: boolean;
  emptyValue?: string;
}

export function EnterpriseSupplierContactEdit({
  supplier,
  field,
  label,
  placeholder,
  className,
  maxLength,
  multiline = false,
  validation,
  loading = false,
  emptyValue
}: EnterpriseSupplierContactEditProps) {
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
      throw error;
    }
  };

  const currentValue = (supplier.contact_info as any)?.[field] || "";

  if (multiline) {
    return (
      <EnterpriseTextareaEdit
        value={currentValue}
        onSave={handleSave}
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
        className={className}
        maxLength={maxLength}
        validation={validation}
        loading={loading}
        emptyValue={emptyValue}
      />
    );
  }

  return (
    <EnterpriseTextEdit
      value={currentValue}
      onSave={handleSave}
      placeholder={placeholder || `Enter ${label.toLowerCase()}`}
      className={className}
      maxLength={maxLength}
      validation={validation}
      loading={loading}
      emptyValue={emptyValue}
    />
  );
}

interface EnterpriseSupplierPaymentEditProps {
  supplier: Supplier;
  field: string;
  label: string;
  placeholder?: string;
  className?: string;
  maxLength?: number;
  multiline?: boolean;
  validation?: (value: string) => string | null;
  loading?: boolean;
  emptyValue?: string;
}

export function EnterpriseSupplierPaymentEdit({
  supplier,
  field,
  label,
  placeholder,
  className,
  maxLength,
  multiline = false,
  validation,
  loading = false,
  emptyValue
}: EnterpriseSupplierPaymentEditProps) {
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
      throw error;
    }
  };

  const currentValue = (supplier.payment_terms as any)?.[field] || "";

  if (multiline) {
    return (
      <EnterpriseTextareaEdit
        value={currentValue}
        onSave={handleSave}
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
        className={className}
        maxLength={maxLength}
        validation={validation}
        loading={loading}
        emptyValue={emptyValue}
      />
    );
  }

  return (
    <EnterpriseTextEdit
      value={currentValue}
      onSave={handleSave}
      placeholder={placeholder || `Enter ${label.toLowerCase()}`}
      className={className}
      maxLength={maxLength}
      validation={validation}
      loading={loading}
      emptyValue={emptyValue}
    />
  );
}

// Specialized component for status toggle
interface EnterpriseSupplierStatusEditProps {
  supplier: Supplier;
  className?: string;
}

export function EnterpriseSupplierStatusEdit({
  supplier,
  className
}: EnterpriseSupplierStatusEditProps) {
  const updateSupplier = useUpdateSupplier();

  const handleSave = async (value: string) => {
    try {
      const isActive = value.toLowerCase() === 'active';
      await updateSupplier.mutateAsync({
        id: supplier.id,
        data: { is_active: isActive }
      });
      toast.success(`Status updated to ${value}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
      throw error;
    }
  };

  const currentValue = supplier.is_active ? 'Active' : 'Inactive';

  return (
    <EnterpriseTextEdit
      value={currentValue}
      onSave={handleSave}
      placeholder="Enter status (Active/Inactive)"
      className={className}
      validation={(value) => {
        const normalized = value.toLowerCase();
        if (normalized !== 'active' && normalized !== 'inactive') {
          return "Status must be 'Active' or 'Inactive'";
        }
        return null;
      }}
      emptyValue="Not specified"
    />
  );
}
