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
  Shield,
  CreditCard,
  Scale,
  Info
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type CancellationPolicy = {
  notice_period?: {
    days: number;
    type: "calendar" | "business";
  };
  penalties?: {
    early_termination?: {
      percentage: number;
      minimum_amount?: number;
      currency: string;
    };
    no_show?: {
      percentage: number;
      minimum_amount?: number;
      currency: string;
    };
  };
  exceptions?: {
    force_majeure?: boolean;
    medical_emergency?: boolean;
    government_restrictions?: boolean;
  };
  refund_policy?: {
    partial_refunds?: boolean;
    refund_percentage?: number;
    processing_fee?: number;
  };
};

type PaymentPolicy = {
  payment_terms?: {
    type: "net" | "prepaid" | "deposit";
    days?: number;
    percentage?: number;
  };
  currency?: string;
  payment_methods?: string[];
  late_fees?: {
    enabled?: boolean;
    percentage?: number;
    grace_period_days?: number;
  };
  invoicing?: {
    frequency?: "per_booking" | "monthly" | "quarterly";
    due_date_days?: number;
    auto_invoice?: boolean;
  };
  discounts?: {
    early_payment?: {
      percentage?: number;
      days_before_due?: number;
    };
    volume?: {
      tiers?: Array<{
        min_bookings: number;
        discount_percentage: number;
      }>;
    };
  };
};

type TermsAndConditions = {
  liability?: {
    provider_liability?: {
      maximum_amount?: number;
      currency?: string;
      coverage_types?: string[];
    };
    customer_liability?: {
      damages?: boolean;
      loss_of_property?: boolean;
      personal_injury?: boolean;
    };
    insurance_requirements?: {
      provider_required?: boolean;
      customer_required?: boolean;
      minimum_coverage?: number;
    };
  };
  jurisdiction?: {
    governing_law?: string;
    dispute_resolution?: "mediation" | "arbitration" | "litigation";
    venue?: string;
  };
  force_majeure?: {
    included_events?: string[];
    notification_period?: number;
    remedies?: string[];
  };
  data_protection?: {
    gdpr_compliant?: boolean;
    data_retention_days?: number;
    third_party_sharing?: boolean;
  };
};

type PolicyViewerProps = {
  cancellation_policy: CancellationPolicy;
  payment_policy: PaymentPolicy;
  terms: TermsAndConditions;
  className?: string;
};

export function PolicyViewer({ cancellation_policy, payment_policy, terms, className }: PolicyViewerProps) {
  const hasPolicies = Object.keys(cancellation_policy).length > 0 || 
                     Object.keys(payment_policy).length > 0 || 
                     Object.keys(terms).length > 0;

  if (!hasPolicies) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No policies configured</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <div className={`space-y-4 ${className}`}>
        {/* Cancellation Policy */}
        {Object.keys(cancellation_policy).length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                Cancellation Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {cancellation_policy.notice_period && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Notice Period</span>
                  </div>
                  <Badge variant="outline">
                    {cancellation_policy.notice_period.days} {cancellation_policy.notice_period.type} days
                  </Badge>
                </div>
              )}

              {cancellation_policy.penalties && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Penalties</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 ml-6">
                    {cancellation_policy.penalties.early_termination && (
                      <div className="text-xs">
                        <span className="text-muted-foreground">Early Termination: </span>
                        <span>{cancellation_policy.penalties.early_termination.percentage}%</span>
                      </div>
                    )}
                    {cancellation_policy.penalties.no_show && (
                      <div className="text-xs">
                        <span className="text-muted-foreground">No Show: </span>
                        <span>{cancellation_policy.penalties.no_show.percentage}%</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {cancellation_policy.refund_policy && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Refund Policy</span>
                  </div>
                  <Badge variant="outline">
                    {cancellation_policy.refund_policy.refund_percentage}% refund
                  </Badge>
                </div>
              )}

              {cancellation_policy.exceptions && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Exceptions</span>
                  </div>
                  <div className="flex flex-wrap gap-1 ml-6">
                    {Object.entries(cancellation_policy.exceptions)
                      .filter(([_, enabled]) => enabled)
                      .map(([key, _]) => (
                        <Badge key={key} variant="secondary" className="text-xs">
                          {key.replace('_', ' ')}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Payment Policy */}
        {Object.keys(payment_policy).length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-green-600" />
                Payment Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {payment_policy.payment_terms && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Payment Terms</span>
                  </div>
                  <Badge variant="outline">
                    {payment_policy.payment_terms.type === "net" && `Net ${payment_policy.payment_terms.days}`}
                    {payment_policy.payment_terms.type === "prepaid" && "Prepaid"}
                    {payment_policy.payment_terms.type === "deposit" && `${payment_policy.payment_terms.percentage}% Deposit`}
                  </Badge>
                </div>
              )}

              {payment_policy.currency && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Currency</span>
                  </div>
                  <Badge variant="outline">{payment_policy.currency}</Badge>
                </div>
              )}

              {payment_policy.late_fees && payment_policy.late_fees.enabled && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Late Fees</span>
                  </div>
                  <Badge variant="outline">
                    {payment_policy.late_fees.percentage}% after {payment_policy.late_fees.grace_period_days} days
                  </Badge>
                </div>
              )}

              {payment_policy.discounts?.early_payment && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Early Payment Discount</span>
                  </div>
                  <Badge variant="outline">
                    {payment_policy.discounts.early_payment.percentage}% if paid {payment_policy.discounts.early_payment.days_before_due} days early
                  </Badge>
                </div>
              )}

              {payment_policy.discounts?.volume?.tiers && payment_policy.discounts.volume.tiers.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Volume Discounts</span>
                  </div>
                  <div className="space-y-1 ml-6">
                    {payment_policy.discounts.volume.tiers.map((tier, index) => (
                      <div key={index} className="text-xs flex items-center justify-between">
                        <span className="text-muted-foreground">{tier.min_bookings}+ bookings:</span>
                        <Badge variant="secondary" className="text-xs">
                          {tier.discount_percentage}% off
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Terms & Conditions */}
        {Object.keys(terms).length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Scale className="h-4 w-4 text-blue-600" />
                Terms & Conditions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {terms.liability?.provider_liability && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Provider Liability</span>
                  </div>
                  <Badge variant="outline">
                    Max {terms.liability.provider_liability.currency} {terms.liability.provider_liability.maximum_amount?.toLocaleString()}
                  </Badge>
                </div>
              )}

              {terms.jurisdiction && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scale className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Jurisdiction</span>
                  </div>
                  <Badge variant="outline">
                    {terms.jurisdiction.governing_law} - {terms.jurisdiction.dispute_resolution}
                  </Badge>
                </div>
              )}

              {terms.data_protection && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Data Protection</span>
                  </div>
                  <div className="flex gap-1">
                    {terms.data_protection.gdpr_compliant && (
                      <Badge variant="secondary" className="text-xs">GDPR</Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {terms.data_protection.data_retention_days} days retention
                    </Badge>
                  </div>
                </div>
              )}

              {terms.force_majeure && terms.force_majeure.included_events && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Force Majeure</span>
                  </div>
                  <div className="flex flex-wrap gap-1 ml-6">
                    {terms.force_majeure.included_events.map((event, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {event.replace('_', ' ')}
                      </Badge>
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
