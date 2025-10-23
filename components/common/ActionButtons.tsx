"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Edit, 
  Trash2, 
  Copy, 
  Download, 
  Share2, 
  MoreHorizontal,
  Eye,
  Archive,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionButtonsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  onDuplicate?: () => void;
  onExport?: () => void;
  onShare?: () => void;
  onArchive?: () => void;
  onRefresh?: () => void;
  showEdit?: boolean;
  showDelete?: boolean;
  showView?: boolean;
  showDuplicate?: boolean;
  showExport?: boolean;
  showShare?: boolean;
  showArchive?: boolean;
  showRefresh?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "compact" | "minimal";
}

export function ActionButtons({
  onEdit,
  onDelete,
  onView,
  onDuplicate,
  onExport,
  onShare,
  onArchive,
  onRefresh,
  showEdit = true,
  showDelete = true,
  showView = false,
  showDuplicate = false,
  showExport = false,
  showShare = false,
  showArchive = false,
  showRefresh = false,
  className,
  size = "sm",
  variant = "default"
}: ActionButtonsProps) {
  const sizeClasses = {
    sm: "h-8 px-3 text-sm",
    md: "h-9 px-4 text-sm",
    lg: "h-10 px-6 text-base"
  };

  const iconSizeClasses = {
    sm: "h-4 w-4",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };

  const primaryActions = [];
  const secondaryActions = [];

  if (showEdit && onEdit) {
    primaryActions.push(
      <Button
        key="edit"
        variant="outline"
        size={size}
        onClick={onEdit}
        className={cn("gap-2", sizeClasses[size])}
      >
        <Edit className={iconSizeClasses[size]} />
        Edit
      </Button>
    );
  }

  if (showView && onView) {
    primaryActions.push(
      <Button
        key="view"
        variant="outline"
        size={size}
        onClick={onView}
        className={cn("gap-2", sizeClasses[size])}
      >
        <Eye className={iconSizeClasses[size]} />
        View
      </Button>
    );
  }

  if (showRefresh && onRefresh) {
    primaryActions.push(
      <Button
        key="refresh"
        variant="outline"
        size={size}
        onClick={onRefresh}
        className={cn("gap-2", sizeClasses[size])}
      >
        <RefreshCw className={iconSizeClasses[size]} />
        Refresh
      </Button>
    );
  }

  // Secondary actions for dropdown
  if (showDuplicate && onDuplicate) {
    secondaryActions.push(
      <DropdownMenuItem key="duplicate" onClick={onDuplicate}>
        <Copy className="mr-2 h-4 w-4" />
        Duplicate
      </DropdownMenuItem>
    );
  }

  if (showExport && onExport) {
    secondaryActions.push(
      <DropdownMenuItem key="export" onClick={onExport}>
        <Download className="mr-2 h-4 w-4" />
        Export
      </DropdownMenuItem>
    );
  }

  if (showShare && onShare) {
    secondaryActions.push(
      <DropdownMenuItem key="share" onClick={onShare}>
        <Share2 className="mr-2 h-4 w-4" />
        Share
      </DropdownMenuItem>
    );
  }

  if (showArchive && onArchive) {
    secondaryActions.push(
      <DropdownMenuItem key="archive" onClick={onArchive}>
        <Archive className="mr-2 h-4 w-4" />
        Archive
      </DropdownMenuItem>
    );
  }

  if (showDelete && onDelete) {
    secondaryActions.push(
      <DropdownMenuSeparator key="separator" />
    );
    secondaryActions.push(
      <DropdownMenuItem 
        key="delete" 
        onClick={onDelete}
        className="text-destructive focus:text-destructive"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </DropdownMenuItem>
    );
  }

  if (variant === "minimal") {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {primaryActions}
        {secondaryActions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size={size} className={cn("gap-2", sizeClasses[size])}>
                <MoreHorizontal className={iconSizeClasses[size]} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {secondaryActions}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {primaryActions.slice(0, 2)}
        {secondaryActions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size={size} className={cn("gap-2", sizeClasses[size])}>
                <MoreHorizontal className={iconSizeClasses[size]} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {secondaryActions}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  }

  // Default variant - show all primary actions and dropdown for secondary
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {primaryActions}
      {secondaryActions.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size={size} className={cn("gap-2", sizeClasses[size])}>
              <MoreHorizontal className={iconSizeClasses[size]} />
              More
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {secondaryActions}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
