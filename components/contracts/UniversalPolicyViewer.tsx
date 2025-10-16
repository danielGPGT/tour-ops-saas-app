"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  AlertCircle, 
  Calendar, 
  DollarSign, 
  FileText, 
  Clock,
  Users,
  Settings,
  Percent
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Types (same as UniversalPolicyForm)
type CancellationRule = {
  days_before: number;
  penalty_percent: number;
  penalty_amount?: number | null;
  description: string;
};

type CancellationPolicy = {
  rules: CancellationRule[];
  type: "standard" | "non_refundable" | "flexible";
  exceptions: string[];
  notes?: string | null;
};

type AttritionRule = {
  days_before: number;
  allowed_reduction_percent: number;
  penalty_per_unit?: number | null;
  penalty_percent?: number | null;
  description: string;
};

type AttritionPolicy = {
  enabled: boolean;
  rules: AttritionRule[];
  minimum_quantity: number;
  calculation_basis: "original_quantity" | "current_quantity";
  cumulative: boolean;
  notes?: string | null;
};

type PaymentTerms = {
  customer: {
    deposit_percent: number;
    deposit_due: string;
    balance_due: string;
    accepted_methods: string[];
  };
  supplier: {
    payment_type: string;
    payment_day?: number;
    method: string;
    currency: string;
  };
  commission: {
    rate: number;
    type: "percentage" | "fixed_amount";
    applies_to: "net" | "gross";
    notes?: string | null;
  };
};

type OperationalTerms = {
  minimum_lead_time: string;
  maximum_advance_booking: string;
  confirmation_time: string;
  amendment_allowed: boolean;
  amendment_deadline?: string;
  minimum_service_length: number;
  maximum_service_length?: number;
  [key: string]: any;
};

type UniversalContractTerms = {
  cancellation_policy: CancellationPolicy;
  attrition_policy: AttritionPolicy;
  payment_terms: PaymentTerms;
  operational_terms: OperationalTerms;
  rate_modifiers?: any;
  additional_terms: {
    notes?: string | null;
    restrictions: string[];
    inclusions: string[];
    exclusions: string[];
    required_documentation: string[];
    special_conditions: Record<string, any>;
  };
};

type UniversalPolicyViewerProps = {
  policy: UniversalContractTerms;
  className?: string;
};

export function UniversalPolicyViewer({ policy, className }: UniversalPolicyViewerProps) {
  const hasPolicy = policy && (
    policy.cancellation_policy?.rules?.length > 0 ||
    policy.attrition_policy?.enabled ||
    policy.payment_terms?.customer?.deposit_percent > 0 ||
    policy.operational_terms?.minimum_lead_time ||
    policy.additional_terms?.restrictions?.length > 0
  );

  if (!hasPolicy) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No policy configured</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <div className={`space-y-4 ${className}`}>
        {/* Cancellation Policy */}
        {policy.cancellation_policy?.rules?.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                Cancellation Policy
                <Badge variant="outline" className="text-xs">
                  {policy.cancellation_policy.type}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                {policy.cancellation_policy.rules
                  .sort((a, b) => a.days_before - b.days_before)
                  .map((rule, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span>{rule.days_before} days before</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={rule.penalty_percent === 0 ? "secondary" : "destructive"} className="text-xs">
                          {rule.penalty_percent}% penalty
                        </Badge>
                        {rule.penalty_amount && (
                          <span className="text-xs text-muted-foreground">
                            or ${rule.penalty_amount}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>

              {policy.cancellation_policy.exceptions?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {policy.cancellation_policy.exceptions.map((exception, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {exception.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              )}

              {policy.cancellation_policy.notes && (
                <p className="text-xs text-muted-foreground italic">
                  {policy.cancellation_policy.notes}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Attrition Policy */}
        {policy.attrition_policy?.enabled && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                Attrition Policy
                <Badge variant="outline" className="text-xs">
                  Min {policy.attrition_policy.minimum_quantity} units
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                {policy.attrition_policy.rules
                  .sort((a, b) => a.days_before - b.days_before)
                  .map((rule, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span>{rule.days_before} days before</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={rule.allowed_reduction_percent > 0 ? "secondary" : "destructive"} className="text-xs">
                          {rule.allowed_reduction_percent}% allowed
                        </Badge>
                        {rule.penalty_per_unit && (
                          <span className="text-xs text-muted-foreground">
                            ${rule.penalty_per_unit}/unit
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Calculation: {policy.attrition_policy.calculation_basis.replace('_', ' ')}</span>
                {policy.attrition_policy.cumulative && (
                  <Badge variant="outline" className="text-xs">Cumulative</Badge>
                )}
              </div>

              {policy.attrition_policy.notes && (
                <p className="text-xs text-muted-foreground italic">
                  {policy.attrition_policy.notes}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Payment Terms */}
        {(policy.payment_terms?.customer?.deposit_percent > 0 || policy.payment_terms?.supplier?.payment_type) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                Payment Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {policy.payment_terms.customer && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      Customer
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Deposit: </span>
                      <span>{policy.payment_terms.customer.deposit_percent}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Due: </span>
                      <span>{policy.payment_terms.customer.deposit_due.replace('_', ' ')}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Balance: </span>
                      <span>{policy.payment_terms.customer.balance_due.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
              )}

              {policy.payment_terms.supplier && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      Supplier
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Payment: </span>
                      <span>{policy.payment_terms.supplier.payment_type.replace('_', ' ')}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Currency: </span>
                      <span>{policy.payment_terms.supplier.currency}</span>
                    </div>
                  </div>
                </div>
              )}

              {policy.payment_terms.commission && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Percent className="h-3 w-3 text-muted-foreground" />
                    <span>Commission: {policy.payment_terms.commission.rate}%</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {policy.payment_terms.commission.applies_to}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Operational Terms */}
        {policy.operational_terms && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Settings className="h-4 w-4 text-purple-600" />
                Operational Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                {policy.operational_terms.minimum_lead_time && (
                  <div>
                    <span className="text-muted-foreground">Lead Time: </span>
                    <span>{policy.operational_terms.minimum_lead_time}</span>
                  </div>
                )}
                {policy.operational_terms.confirmation_time && (
                  <div>
                    <span className="text-muted-foreground">Confirmation: </span>
                    <span>{policy.operational_terms.confirmation_time}</span>
                  </div>
                )}
                {policy.operational_terms.minimum_service_length && (
                  <div>
                    <span className="text-muted-foreground">Min Length: </span>
                    <span>{policy.operational_terms.minimum_service_length}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Amendments: </span>
                  <Badge variant={policy.operational_terms.amendment_allowed ? "secondary" : "destructive"} className="text-xs">
                    {policy.operational_terms.amendment_allowed ? "Allowed" : "Not Allowed"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Additional Terms */}
        {(policy.additional_terms?.restrictions?.length > 0 || policy.additional_terms?.notes) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-600" />
                Additional Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {policy.additional_terms.notes && (
                <p className="text-sm text-muted-foreground italic">
                  {policy.additional_terms.notes}
                </p>
              )}

              {policy.additional_terms.restrictions?.length > 0 && (
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Restrictions:</span>
                  <div className="space-y-1">
                    {policy.additional_terms.restrictions.map((restriction, index) => (
                      <div key={index} className="text-sm flex items-center gap-2">
                        <span className="text-muted-foreground">•</span>
                        <span>{restriction}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}
