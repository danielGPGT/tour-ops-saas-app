"use client";

import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Globe, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

type Supplier = {
  id: bigint;
  name: string;
  channels?: string[];
  status?: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedSuppliers: Supplier[];
  onBulkUpdate: (updates: { channels?: string[]; status?: string }) => Promise<void>;
};

export function BulkEditModal({ open, onOpenChange, selectedSuppliers, onBulkUpdate }: Props) {
  const [channels, setChannels] = React.useState<{ b2c: boolean; b2b: boolean }>({ b2c: false, b2b: false });
  const [status, setStatus] = React.useState<boolean>(true);
  const [isLoading, setIsLoading] = React.useState(false);
  const selectedCount = selectedSuppliers.length;

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const updates: { channels?: string[]; status?: string } = {};
      
      // Build channels array
      const selectedChannels = [];
      if (channels.b2c) selectedChannels.push('b2c');
      if (channels.b2b) selectedChannels.push('b2b');
      
      if (selectedChannels.length > 0) {
        updates.channels = selectedChannels;
      }
      
      // Set status
      updates.status = status ? 'active' : 'inactive';
      
      await onBulkUpdate(updates);
      onOpenChange(false);
      toast.success(`Updated ${selectedCount} supplier${selectedCount !== 1 ? 's' : ''} successfully`);
    } catch (error) {
      toast.error("Failed to update suppliers");
      console.error("Bulk update error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChannelChange = (channel: 'b2c' | 'b2b', checked: boolean) => {
    setChannels(prev => ({ ...prev, [channel]: checked }));
  };

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Bulk Edit {selectedCount} Supplier{selectedCount !== 1 ? 's' : ''}</DialogTitle>
            <DialogDescription>
              Update channels and status for {selectedCount} selected supplier{selectedCount !== 1 ? 's' : ''}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Distribution Channels */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Distribution Channels
                <Tooltip>
                  <TooltipTrigger>
                    <AlertCircle className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Select the distribution channels for all suppliers</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              
              <div className="space-y-3 pl-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="bulk-b2c"
                    checked={channels.b2c}
                    onCheckedChange={(checked) => handleChannelChange('b2c', Boolean(checked))}
                  />
                  <Label htmlFor="bulk-b2c" className="text-sm font-medium">
                    B2C (Business to Consumer)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="bulk-b2b"
                    checked={channels.b2b}
                    onCheckedChange={(checked) => handleChannelChange('b2b', Boolean(checked))}
                  />
                  <Label htmlFor="bulk-b2b" className="text-sm font-medium">
                    B2B (Business to Business)
                  </Label>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">
                All selected suppliers will be updated with these channel settings.
              </p>
            </div>

            {/* Status */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Status
                <Tooltip>
                  <TooltipTrigger>
                    <AlertCircle className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Set the status for all selected suppliers</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Switch
                  checked={status}
                  onCheckedChange={setStatus}
                />
                <div className="flex items-center gap-2">
                  {status ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">Active</span>
                      <span className="text-xs text-muted-foreground">Suppliers will be active and available</span>
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Inactive</span>
                      <span className="text-xs text-muted-foreground">Suppliers will be temporarily disabled</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Selected Suppliers Preview */}
            {selectedCount <= 5 && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium mb-2">Suppliers to be updated:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {selectedSuppliers.map(supplier => (
                    <li key={supplier.id.toString()}>• {supplier.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? "Updating..." : `Update ${selectedCount} supplier${selectedCount !== 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
