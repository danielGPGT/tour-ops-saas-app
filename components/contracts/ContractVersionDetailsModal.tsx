"use client";

import React from "react";
import { format } from "date-fns";
import { 
  FileText, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Building2,
  ExternalLink,
  Settings,
  X
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { UniversalPolicyViewer } from "./UniversalPolicyViewer";

type ContractVersion = {
  id: number;
  valid_from: string;
  valid_to: string;
  cancellation_policy: any;
  attrition_policy: any;
  payment_terms: any;
  operational_terms: any;
  rate_modifiers?: any;
  additional_terms: any;
};

type Contract = {
  id: number;
  reference: string;
  status: string;
  suppliers: {
    id: number;
    name: string;
    channels?: string[];
    status?: string;
  };
  contract_versions?: ContractVersion[];
};

type Props = {
  contract: Contract | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onManageVersions?: (contractId: bigint) => void;
};

export function ContractVersionDetailsModal({ 
  contract, 
  open, 
  onOpenChange, 
  onManageVersions 
}: Props) {
  if (!contract) return null;

  const currentVersion = contract.contract_versions?.[0];
  if (!currentVersion) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {contract.reference} - Version Details
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No active version found for this contract</p>
            <p className="text-sm">Create a version to get started</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const now = new Date();
  const validFrom = new Date(currentVersion.valid_from);
  const validTo = new Date(currentVersion.valid_to);
  const isExpiringSoon = validTo.getTime() - now.getTime() < 30 * 24 * 60 * 60 * 1000;
  const isActive = validFrom <= now && validTo > now;
  const isFuture = validFrom > now;

  const getVersionStatus = () => {
    if (isFuture) return { label: "Future", variant: "outline" as const, color: "text-secondary-600" };
    if (isActive) return { label: "Active", variant: "default" as const, color: "text-primary-600" };
    return { label: "Expired", variant: "secondary" as const, color: "text-muted-foreground" };
  };

  const versionStatus = getVersionStatus();

  const policyCount = [
    currentVersion.cancellation_policy,
    currentVersion.payment_policy,
    currentVersion.terms
  ].filter(policy => Object.keys(policy).length > 0).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {contract.reference} - Version Details
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contract & Supplier Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Supplier</span>
              </div>
              <div className="pl-6">
                <p className="font-medium">{contract.suppliers.name}</p>
                <p className="text-sm text-muted-foreground">
                  Channels: {(contract.suppliers.channels || []).join(", ") || "None"}
                </p>
                <Badge variant="outline" className="mt-1">
                  {contract.suppliers.status || "Unknown"}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Version Period</span>
              </div>
              <div className="pl-6 space-y-1">
                <p className="text-sm">
                  <span className="font-medium">From:</span> {format(validFrom, "MMM dd, yyyy")}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Until:</span> {format(validTo, "MMM dd, yyyy")}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={versionStatus.variant} className={versionStatus.color}>
                    {versionStatus.label}
                  </Badge>
                  {isExpiringSoon && (
                    <Badge variant="outline" className="text-secondary-600 border-secondary-600">
                      <Clock className="h-3 w-3 mr-1" />
                      Expires Soon
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Version Statistics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-primary">{policyCount}</div>
              <div className="text-sm text-muted-foreground">Configured Policies</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-primary">0</div>
              <div className="text-sm text-muted-foreground">Rate Plans</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {Math.ceil((validTo.getTime() - validFrom.getTime()) / (1000 * 60 * 60 * 24))}
              </div>
              <div className="text-sm text-muted-foreground">Days Duration</div>
            </div>
          </div>

          {/* Policies Accordion */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Version Policies
            </h3>
            
            <UniversalPolicyViewer
              policy={{
                cancellation_policy: currentVersion.cancellation_policy,
                attrition_policy: currentVersion.attrition_policy,
                payment_terms: currentVersion.payment_terms,
                operational_terms: currentVersion.operational_terms,
                rate_modifiers: currentVersion.rate_modifiers,
                additional_terms: currentVersion.additional_terms
              }}
            />

            <Accordion type="single" collapsible className="w-full">
              {/* Rate Plans */}
              <AccordionItem value="rate_plans">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-purple-600" />
                    <span>Rate Plans ({currentVersion.rate_plans?.length || 0})</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {currentVersion.rate_plans && currentVersion.rate_plans.length > 0 ? (
                    <div className="space-y-3">
                      {currentVersion.rate_plans.map((ratePlan: any, index: number) => (
                        <div key={ratePlan.id || index} className="bg-muted/30 p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {ratePlan.inventory_model}
                              </Badge>
                              {ratePlan.preferred && (
                                <Badge variant="default" className="text-xs" style={{ backgroundColor: 'var(--color-primary-600)', color: 'var(--color-primary-foreground)' }}>
                                  Preferred
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm font-medium">
                              {ratePlan.currency}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            <div>
                              <span className="font-medium">Markets:</span> {ratePlan.markets?.join(', ') || 'None'}
                            </div>
                            <div>
                              <span className="font-medium">Channels:</span> {ratePlan.channels?.join(', ') || 'None'}
                            </div>
                            <div>
                              <span className="font-medium">Valid From:</span> {new Date(ratePlan.valid_from).toLocaleDateString()}
                            </div>
                            <div>
                              <span className="font-medium">Valid To:</span> {new Date(ratePlan.valid_to).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        No rate plans configured for this version.
                      </p>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Version ID: {currentVersion.id.toString()}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => onManageVersions?.(contract.id)}
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                Manage All Versions
              </Button>
              <Button onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
