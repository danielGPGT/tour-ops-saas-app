"use client";

import React from "react";
import { EntityInlineEdit, EntityNestedFieldEdit, EntityBooleanEdit } from "@/components/common/EntityInlineEdit";
import { useUpdateSupplier } from "@/lib/hooks/useSuppliers";
import { toast } from "sonner";
import type { Supplier } from "@/lib/types/supplier";

interface SupplierInlineEditProps {
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
  size?: "sm" | "md" | "lg";
  variant?: "minimal" | "underline" | "card" | "default";
}

export function SupplierInlineEdit({
  supplier,
  field,
  label,
  placeholder,
  className,
  maxLength,
  multiline = false,
  validation,
  loading = false,
  emptyValue,
  size = "md",
  variant = "default"
}: SupplierInlineEditProps) {
  const updateSupplier = useUpdateSupplier();

  const handleUpdate = async (id: string, data: Partial<Supplier>) => {
    try {
      await updateSupplier.mutateAsync({ id, data });
      toast.success(`${label} updated successfully`);
    } catch (error) {
      console.error(`Error updating ${label.toLowerCase()}:`, error);
      toast.error(`Failed to update ${label.toLowerCase()}`);
      throw error;
    }
  };

  return (
    <EntityInlineEdit
      entity={supplier}
      field={field}
      onUpdate={handleUpdate}
      label={label}
      placeholder={placeholder}
      className={className}
      maxLength={maxLength}
      multiline={multiline}
      validation={validation}
      loading={loading}
      emptyValue={emptyValue}
      size={size}
      variant={variant}
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
  loading?: boolean;
  emptyValue?: string;
  size?: "sm" | "md" | "lg";
  variant?: "minimal" | "underline" | "card" | "default";
}

export function SupplierContactEdit({
  supplier,
  field,
  label,
  placeholder,
  className,
  maxLength,
  multiline = false,
  validation,
  loading = false,
  emptyValue,
  size = "md",
  variant = "default"
}: SupplierContactEditProps) {
  const updateSupplier = useUpdateSupplier();

  const handleUpdate = async (id: string, data: Partial<Supplier>) => {
    try {
      await updateSupplier.mutateAsync({ id, data });
      toast.success(`${label} updated successfully`);
    } catch (error) {
      console.error(`Error updating ${label.toLowerCase()}:`, error);
      toast.error(`Failed to update ${label.toLowerCase()}`);
      throw error;
    }
  };

  return (
    <EntityNestedFieldEdit
      entity={supplier}
      field="contact_info"
      nestedField={field}
      onUpdate={handleUpdate}
      label={label}
      placeholder={placeholder}
      className={className}
      maxLength={maxLength}
      multiline={multiline}
      validation={validation}
      loading={loading}
      emptyValue={emptyValue}
      size={size}
      variant={variant}
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
  loading?: boolean;
  emptyValue?: string;
  size?: "sm" | "md" | "lg";
  variant?: "minimal" | "underline" | "card" | "default";
}

export function SupplierPaymentEdit({
  supplier,
  field,
  label,
  placeholder,
  className,
  maxLength,
  multiline = false,
  validation,
  loading = false,
  emptyValue,
  size = "md",
  variant = "default"
}: SupplierPaymentEditProps) {
  const updateSupplier = useUpdateSupplier();

  const handleUpdate = async (id: string, data: Partial<Supplier>) => {
    try {
      await updateSupplier.mutateAsync({ id, data });
      toast.success(`${label} updated successfully`);
    } catch (error) {
      console.error(`Error updating ${label.toLowerCase()}:`, error);
      toast.error(`Failed to update ${label.toLowerCase()}`);
      throw error;
    }
  };

  return (
    <EntityNestedFieldEdit
      entity={supplier}
      field="payment_terms"
      nestedField={field}
      onUpdate={handleUpdate}
      label={label}
      placeholder={placeholder}
      className={className}
      maxLength={maxLength}
      multiline={multiline}
      validation={validation}
      loading={loading}
      emptyValue={emptyValue}
      size={size}
      variant={variant}
    />
  );
}

interface SupplierStatusEditProps {
  supplier: Supplier;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "minimal" | "underline" | "card" | "default";
}

export function SupplierStatusEdit({
  supplier,
  className,
  size = "md",
  variant = "default"
}: SupplierStatusEditProps) {
  const updateSupplier = useUpdateSupplier();

  const handleUpdate = async (id: string, data: Partial<Supplier>) => {
    try {
      await updateSupplier.mutateAsync({ id, data });
      toast.success(`Status updated successfully`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
      throw error;
    }
  };

  return (
    <EntityBooleanEdit
      entity={supplier}
      field="is_active"
      onUpdate={handleUpdate}
      label="Status"
      trueLabel="Active"
      falseLabel="Inactive"
      className={className}
      size={size}
      variant={variant}
    />
  );
}
