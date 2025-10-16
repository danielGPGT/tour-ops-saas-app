"use client";

import React from "react";
import { format } from "date-fns";
import { Calendar, FileText, AlertCircle, Clock, CheckCircle2, Trash2, Edit, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { deleteContractVersion, duplicateContractVersion } from "@/app/contracts/versions/actions";
import { toast } from "sonner";

type ContractVersion = {
  id: bigint;
  contract_id: bigint;
  valid_from: Date;
  valid_to: Date;
  cancellation_policy: Record<string, any>;
  payment_policy: Record<string, any>;
  terms: Record<string, any>;
  supersedes_id?: bigint;
  created_at: Date;
  updated_at: Date;
  prev_version?: {
    id: bigint;
    valid_from: Date;
    valid_to: Date;
  };
  next_versions?: Array<{
    id: bigint;
    valid_from: Date;
    valid_to: Date;
  }>;
  rate_plans?: Array<{
    id: bigint;
    inventory_model: string;
    currency: string;
    valid_from: Date;
    valid_to: Date;
  }>;
};

type Props = {
  versions: ContractVersion[];
  onEdit?: (versionId: bigint) => void;
  onSuccess?: () => void;
};

export function ContractVersionsTable({ versions, onEdit, onSuccess }: Props) {
  const getVersionStatus = (version: ContractVersion) => {
    const now = new Date();
    const fromDate = new Date(version.valid_from);
    const toDate = new Date(version.valid_to);
    
    if (now < fromDate) {
      return { status: "Future", variant: "outline" as const, color: "text-blue-600" };
    }
    if (now > toDate) {
      return { status: "Expired", variant: "secondary" as const, color: "text-gray-600" };
    }
    return { status: "Active", variant: "default" as const, color: "text-green-600" };
  };

  const getDuration = (version: ContractVersion) => {
    const diffTime = Math.abs(version.valid_to.getTime() - version.valid_from.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "1 day";
    if (diffDays < 30) return `${diffDays} days`;
    if (diffDays < 365) return `${Math.round(diffDays / 30)} months`;
    return `${Math.round(diffDays / 365)} years`;
  };

  const handleEdit = (versionId: bigint) => {
    onEdit?.(versionId);
  };

  const handleDuplicate = async (versionId: bigint) => {
    try {
      await duplicateContractVersion(versionId, { redirect: false });
      toast.success("Contract version duplicated successfully");
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to duplicate contract version");
    }
  };

  const handleDelete = async (versionId: bigint) => {
    try {
      await deleteContractVersion(versionId, { redirect: false });
      toast.success("Contract version deleted successfully");
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete contract version");
    }
  };

  if (versions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No contract versions found</p>
        <p className="text-sm">Create the first version to get started</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Valid Period</TableHead>
              <TableHead className="w-[100px]">Duration</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[150px]">Rate Plans</TableHead>
              <TableHead className="w-[100px]">Version Chain</TableHead>
              <TableHead className="w-[200px]">Policies</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {versions.map((version) => {
              const versionStatus = getVersionStatus(version);
              const duration = getDuration(version);
              
              return (
                <TableRow key={version.id.toString()}>
                  {/* Valid Period */}
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">
                          {format(version.valid_from, "MMM dd, yyyy")}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span>to</span>
                        <span>{format(version.valid_to, "MMM dd, yyyy")}</span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Duration */}
                  <TableCell>
                    <span className="text-sm">{duration}</span>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    {versionStatus.status === "Active" ? (
                  <Badge variant="default" className="text-xs bg-green-100 text-green-800 hover:bg-green-100">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    {versionStatus.status}
                  </Badge>
                )}
                  </TableCell>

                  {/* Rate Plans */}
                  <TableCell>
                    <div className="space-y-1">
                      {version.rate_plans && version.rate_plans.length > 0 ? (
                        <>
                          <Badge variant="outline" className="text-xs">
                            {version.rate_plans.length} plan{version.rate_plans.length !== 1 ? 's' : ''}
                          </Badge>
                          <div className="space-y-1">
                            {version.rate_plans.slice(0, 2).map((plan) => (
                              <div key={plan.id.toString()} className="text-xs text-muted-foreground">
                                {plan.inventory_model} • {plan.currency}
                              </div>
                            ))}
                            {version.rate_plans.length > 2 && (
                              <div className="text-xs text-muted-foreground">
                                +{version.rate_plans.length - 2} more
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">No rate plans</span>
                      )}
                    </div>
                  </TableCell>

                  {/* Version Chain */}
                  <TableCell>
                    <div className="space-y-1">
                      {version.prev_version && (
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="outline" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              Supersedes
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Supersedes version from {format(version.prev_version.valid_from, "MMM dd, yyyy")}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {version.next_versions && version.next_versions.length > 0 && (
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="outline" className="text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Superseded by {version.next_versions.length}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div>
                              <p>Superseded by {version.next_versions.length} version(s):</p>
                              {version.next_versions.map((next) => (
                                <p key={next.id.toString()} className="text-xs">
                                  {format(next.valid_from, "MMM dd, yyyy")} - {format(next.valid_to, "MMM dd, yyyy")}
                                </p>
                              ))}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {!version.prev_version && !version.next_versions?.length && (
                        <span className="text-xs text-muted-foreground">No chain</span>
                      )}
                    </div>
                  </TableCell>

                  {/* Policies */}
                  <TableCell>
                    <div className="space-y-1">
                      {Object.keys(version.cancellation_policy).length > 0 && (
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="outline" className="text-xs">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Cancellation
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="max-w-xs">
                              <p className="font-medium mb-1">Cancellation Policy:</p>
                              <pre className="text-xs whitespace-pre-wrap">
                                {JSON.stringify(version.cancellation_policy, null, 2)}
                              </pre>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {Object.keys(version.payment_policy).length > 0 && (
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="outline" className="text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Payment
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="max-w-xs">
                              <p className="font-medium mb-1">Payment Policy:</p>
                              <pre className="text-xs whitespace-pre-wrap">
                                {JSON.stringify(version.payment_policy, null, 2)}
                              </pre>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {Object.keys(version.terms).length > 0 && (
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="outline" className="text-xs">
                              <FileText className="h-3 w-3 mr-1" />
                              Terms
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="max-w-xs">
                              <p className="font-medium mb-1">Terms & Conditions:</p>
                              <pre className="text-xs whitespace-pre-wrap">
                                {JSON.stringify(version.terms, null, 2)}
                              </pre>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {Object.keys(version.cancellation_policy).length === 0 &&
                       Object.keys(version.payment_policy).length === 0 &&
                       Object.keys(version.terms).length === 0 && (
                        <span className="text-xs text-muted-foreground">No policies</span>
                      )}
                    </div>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(version.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit version</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDuplicate(version.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Duplicate version</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(version.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete version</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}
