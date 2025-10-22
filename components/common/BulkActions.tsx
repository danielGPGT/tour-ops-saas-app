"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Trash2, Copy, Pencil, MoreHorizontal } from "lucide-react";

export interface BulkAction<T> {
  id: string;
  label: string;
  icon: React.ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  onClick: (items: T[]) => void;
  requiresConfirmation?: boolean;
  confirmationTitle?: string;
  confirmationDescription?: (items: T[]) => string;
}

export interface BulkActionsProps<T> {
  selectedItems: T[];
  actions: BulkAction<T>[];
  getItemName: (item: T) => string;
  getItemId: (item: T) => string | number;
  entityName: string; // e.g., "supplier", "contract"
  onSelectionClear: () => void;
  isLoading?: boolean;
}

export function BulkActions<T>({ 
  selectedItems, 
  actions, 
  getItemName, 
  getItemId,
  entityName,
  onSelectionClear,
  isLoading = false
}: BulkActionsProps<T>) {
  const [confirmationOpen, setConfirmationOpen] = React.useState(false);
  const [pendingAction, setPendingAction] = React.useState<BulkAction<T> | null>(null);
  const selectedCount = selectedItems.length;

  if (selectedCount === 0) return null;

  const handleActionClick = (action: BulkAction<T>) => {
    if (action.requiresConfirmation) {
      setPendingAction(action);
      setConfirmationOpen(true);
    } else {
      action.onClick(selectedItems);
    }
  };

  const handleConfirmAction = () => {
    if (pendingAction) {
      pendingAction.onClick(selectedItems);
      setConfirmationOpen(false);
      setPendingAction(null);
    }
  };

  const primaryActions = actions.filter(action => !action.requiresConfirmation);
  const destructiveActions = actions.filter(action => action.requiresConfirmation);

  return (
    <div className="flex items-center gap-2 p-3 bg-muted/50 border rounded-lg">
      <span className="text-sm font-medium">
        {selectedCount} {entityName}{selectedCount !== 1 ? 's' : ''} selected
      </span>
      
      <div className="flex items-center gap-2">
        {primaryActions.map((action) => (
          <Button
            key={action.id}
            size="sm"
            variant={action.variant || "outline"}
            onClick={() => handleActionClick(action)}
            disabled={isLoading}
            className="h-8 gap-1"
          >
            {action.icon}
            {action.label}
          </Button>
        ))}
        
        {destructiveActions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="h-8 w-8 p-0" disabled={isLoading}>
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {destructiveActions.map((action) => (
                <DropdownMenuItem 
                  key={action.id}
                  className={action.variant === "destructive" ? "text-destructive focus:text-destructive" : ""}
                  onClick={() => handleActionClick(action)}
                  disabled={isLoading}
                >
                  {action.icon}
                  {action.label} {selectedCount} {entityName}{selectedCount !== 1 ? 's' : ''}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.confirmationTitle || `Confirm Action`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.confirmationDescription 
                ? pendingAction.confirmationDescription(selectedItems)
                : `Are you sure you want to perform this action on ${selectedCount} ${entityName}${selectedCount !== 1 ? 's' : ''}? This action cannot be undone.`
              }
              {selectedCount <= 5 && (
                <div className="mt-2">
                  <p className="text-sm font-medium">Items to be affected:</p>
                  <ul className="text-sm text-muted-foreground mt-1">
                    {selectedItems.slice(0, 5).map(item => (
                      <li key={getItemId(item).toString()}>• {getItemName(item)}</li>
                    ))}
                    {selectedCount > 5 && (
                      <li className="text-muted-foreground">... and {selectedCount - 5} more</li>
                    )}
                  </ul>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmAction} 
              disabled={isLoading}
              className={pendingAction?.variant === "destructive" ? "bg-destructive hover:bg-destructive/90" : ""}
            >
              {isLoading ? "Processing..." : pendingAction?.label || "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}