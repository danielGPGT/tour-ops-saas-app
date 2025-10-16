"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertCircle, 
  Calendar, 
  DollarSign, 
  FileText, 
  Plus, 
  Trash2, 
  Info,
  Clock,
  Shield,
  CreditCard,
  Scale
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Policy Types
type CancellationPolicy = {
  notice_period: {
    days: number;
    type: "calendar" | "business";
  };
  penalties: {
    early_termination: {
      percentage: number;
      minimum_amount?: number;
      currency: string;
    };
    no_show: {
      percentage: number;
      minimum_amount?: number;
      currency: string;
    };
  };
  exceptions: {
    force_majeure: boolean;
    medical_emergency: boolean;
    government_restrictions: boolean;
  };
  refund_policy: {
    partial_refunds: boolean;
    refund_percentage: number;
    processing_fee: number;
  };
};

type PaymentPolicy = {
  payment_terms: {
    type: "net" | "prepaid" | "deposit";
    days?: number;
    percentage?: number;
  };
  currency: string;
  payment_methods: string[];
  late_fees: {
    enabled: boolean;
    percentage: number;
    grace_period_days: number;
  };
  invoicing: {
    frequency: "per_booking" | "monthly" | "quarterly";
    due_date_days: number;
    auto_invoice: boolean;
  };
  discounts: {
    early_payment: {
      percentage: number;
      days_before_due: number;
    };
    volume: {
      tiers: Array<{
        min_bookings: number;
        discount_percentage: number;
      }>;
    };
  };
};

type TermsAndConditions = {
  liability: {
    provider_liability: {
      maximum_amount?: number;
      currency: string;
      coverage_types: string[];
    };
    customer_liability: {
      damages: boolean;
      loss_of_property: boolean;
      personal_injury: boolean;
    };
    insurance_requirements: {
      provider_required: boolean;
      customer_required: boolean;
      minimum_coverage?: number;
    };
  };
  jurisdiction: {
    governing_law: string;
    dispute_resolution: "mediation" | "arbitration" | "litigation";
    venue: string;
  };
  force_majeure: {
    included_events: string[];
    notification_period: number;
    remedies: string[];
  };
  data_protection: {
    gdpr_compliant: boolean;
    data_retention_days: number;
    third_party_sharing: boolean;
  };
};

type PolicyFormData = {
  cancellation_policy: CancellationPolicy;
  payment_policy: PaymentPolicy;
  terms: TermsAndConditions;
};

type PolicyFormProps = {
  initialData?: Partial<PolicyFormData>;
  onSave: (data: PolicyFormData) => void;
  onCancel: () => void;
};

export function PolicyForm({ initialData, onSave, onCancel }: PolicyFormProps) {
  const [data, setData] = useState<PolicyFormData>(() => {
    const defaultData: PolicyFormData = {
      cancellation_policy: {
        notice_period: { days: 30, type: "calendar" },
        penalties: {
          early_termination: { percentage: 10, currency: "USD" },
          no_show: { percentage: 100, currency: "USD" }
        },
        exceptions: {
          force_majeure: true,
          medical_emergency: true,
          government_restrictions: true
        },
        refund_policy: {
          partial_refunds: true,
          refund_percentage: 80,
          processing_fee: 5
        }
      },
      payment_policy: {
        payment_terms: { type: "net", days: 30 },
        currency: "USD",
        payment_methods: ["bank_transfer", "credit_card"],
        late_fees: {
          enabled: true,
          percentage: 2,
          grace_period_days: 5
        },
        invoicing: {
          frequency: "per_booking",
          due_date_days: 30,
          auto_invoice: true
        },
        discounts: {
          early_payment: { percentage: 2, days_before_due: 10 },
          volume: {
            tiers: [
              { min_bookings: 10, discount_percentage: 5 },
              { min_bookings: 25, discount_percentage: 10 }
            ]
          }
        }
      },
      terms: {
        liability: {
          provider_liability: {
            maximum_amount: 100000,
            currency: "USD",
            coverage_types: ["property_damage", "personal_injury"]
          },
          customer_liability: {
            damages: true,
            loss_of_property: true,
            personal_injury: false
          },
          insurance_requirements: {
            provider_required: true,
            customer_required: false,
            minimum_coverage: 500000
          }
        },
        jurisdiction: {
          governing_law: "United States",
          dispute_resolution: "arbitration",
          venue: "New York, NY"
        },
        force_majeure: {
          included_events: ["natural_disasters", "pandemics", "government_restrictions"],
          notification_period: 48,
          remedies: ["reschedule", "partial_refund", "full_refund"]
        },
        data_protection: {
          gdpr_compliant: true,
          data_retention_days: 365,
          third_party_sharing: false
        }
      }
    };

    // Deep merge with initialData
    if (initialData) {
      return {
        cancellation_policy: { ...defaultData.cancellation_policy, ...initialData.cancellation_policy },
        payment_policy: { ...defaultData.payment_policy, ...initialData.payment_policy },
        terms: { ...defaultData.terms, ...initialData.terms }
      };
    }

    return defaultData;
  });

  const updateCancellationPolicy = (path: string, value: any) => {
    setData(prev => ({
      ...prev,
      cancellation_policy: {
        ...prev.cancellation_policy,
        ...(path.includes('.') ? 
          setNestedValue(prev.cancellation_policy, path, value) : 
          { [path]: value }
        )
      }
    }));
  };

  const updatePaymentPolicy = (path: string, value: any) => {
    setData(prev => ({
      ...prev,
      payment_policy: {
        ...prev.payment_policy,
        ...(path.includes('.') ? 
          setNestedValue(prev.payment_policy, path, value) : 
          { [path]: value }
        )
      }
    }));
  };

  const updateTerms = (path: string, value: any) => {
    setData(prev => ({
      ...prev,
      terms: {
        ...prev.terms,
        ...(path.includes('.') ? 
          setNestedValue(prev.terms, path, value) : 
          { [path]: value }
        )
      }
    }));
  };

  const addVolumeTier = () => {
    setData(prev => ({
      ...prev,
      payment_policy: {
        ...prev.payment_policy,
        discounts: {
          ...prev.payment_policy.discounts,
          volume: {
            ...prev.payment_policy.discounts.volume,
            tiers: [
              ...(prev.payment_policy.discounts?.volume?.tiers || []),
              { min_bookings: 0, discount_percentage: 0 }
            ]
          }
        }
      }
    }));
  };

  const removeVolumeTier = (index: number) => {
    setData(prev => ({
      ...prev,
      payment_policy: {
        ...prev.payment_policy,
        discounts: {
          ...prev.payment_policy.discounts,
          volume: {
            ...prev.payment_policy.discounts.volume,
            tiers: (prev.payment_policy.discounts?.volume?.tiers || []).filter((_, i) => i !== index)
          }
        }
      }
    }));
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Tabs defaultValue="cancellation" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="cancellation" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Cancellation
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment
            </TabsTrigger>
            <TabsTrigger value="terms" className="flex items-center gap-2">
              <Scale className="h-4 w-4" />
              Terms
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cancellation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  Cancellation Policy
                </CardTitle>
                <CardDescription>
                  Define cancellation terms, penalties, and exceptions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Notice Period */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <Label className="text-base font-medium">Notice Period</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Days Required</Label>
                      <Input
                        type="number"
                        value={data.cancellation_policy.notice_period?.days || 0}
                        onChange={(e) => updateCancellationPolicy('notice_period.days', parseInt(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={data.cancellation_policy.notice_period?.type || "calendar"}
                        onValueChange={(value) => updateCancellationPolicy('notice_period.type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="calendar">Calendar Days</SelectItem>
                          <SelectItem value="business">Business Days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Penalties */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <Label className="text-base font-medium">Penalties</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Early Termination</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          <Label>Percentage</Label>
                          <Input
                            type="number"
                            value={data.cancellation_policy.penalties?.early_termination?.percentage || 0}
                            onChange={(e) => updateCancellationPolicy('penalties.early_termination.percentage', parseFloat(e.target.value))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Currency</Label>
                          <Select
                            value={data.cancellation_policy.penalties?.early_termination?.currency || "USD"}
                            onValueChange={(value) => updateCancellationPolicy('penalties.early_termination.currency', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="EUR">EUR</SelectItem>
                              <SelectItem value="GBP">GBP</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">No Show</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          <Label>Percentage</Label>
                          <Input
                            type="number"
                            value={data.cancellation_policy.penalties?.no_show?.percentage || 0}
                            onChange={(e) => updateCancellationPolicy('penalties.no_show.percentage', parseFloat(e.target.value))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Currency</Label>
                          <Select
                            value={data.cancellation_policy.penalties?.no_show?.currency || "USD"}
                            onValueChange={(value) => updateCancellationPolicy('penalties.no_show.currency', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="EUR">EUR</SelectItem>
                              <SelectItem value="GBP">GBP</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Exceptions */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <Label className="text-base font-medium">Exceptions</Label>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(data.cancellation_policy.exceptions || {}).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <Label className="capitalize">{key.replace('_', ' ')}</Label>
                        <input
                          type="checkbox"
                          checked={value || false}
                          onChange={(e) => updateCancellationPolicy(`exceptions.${key}`, e.target.checked)}
                          className="rounded"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Refund Policy */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <Label className="text-base font-medium">Refund Policy</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Refund Percentage</Label>
                      <Input
                        type="number"
                        value={data.cancellation_policy.refund_policy?.refund_percentage || 0}
                        onChange={(e) => updateCancellationPolicy('refund_policy.refund_percentage', parseFloat(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Processing Fee (%)</Label>
                      <Input
                        type="number"
                        value={data.cancellation_policy.refund_policy?.processing_fee || 0}
                        onChange={(e) => updateCancellationPolicy('refund_policy.processing_fee', parseFloat(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-green-600" />
                  Payment Policy
                </CardTitle>
                <CardDescription>
                  Configure payment terms, methods, and discounts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Payment Terms */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <Label className="text-base font-medium">Payment Terms</Label>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={data.payment_policy.payment_terms?.type || "net"}
                        onValueChange={(value) => updatePaymentPolicy('payment_terms.type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="net">Net Payment</SelectItem>
                          <SelectItem value="prepaid">Prepaid</SelectItem>
                          <SelectItem value="deposit">Deposit Required</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {data.payment_policy.payment_terms.type === "net" && (
                      <div className="space-y-2">
                        <Label>Days</Label>
                        <Input
                          type="number"
                          value={data.payment_policy.payment_terms?.days || 0}
                          onChange={(e) => updatePaymentPolicy('payment_terms.days', parseInt(e.target.value))}
                        />
                      </div>
                    )}
                    {data.payment_policy.payment_terms.type === "deposit" && (
                      <div className="space-y-2">
                        <Label>Percentage</Label>
                        <Input
                          type="number"
                          value={data.payment_policy.payment_terms?.percentage || 0}
                          onChange={(e) => updatePaymentPolicy('payment_terms.percentage', parseFloat(e.target.value))}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Currency & Methods */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select
                      value={data.payment_policy.currency || "USD"}
                      onValueChange={(value) => updatePaymentPolicy('currency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Methods</Label>
                    <Select
                      value={data.payment_policy.payment_methods?.[0] || ""}
                      onValueChange={(value) => updatePaymentPolicy('payment_methods', [value])}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="credit_card">Credit Card</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Late Fees */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <Label className="text-base font-medium">Late Fees</Label>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={data.payment_policy.late_fees?.enabled || false}
                        onChange={(e) => updatePaymentPolicy('late_fees.enabled', e.target.checked)}
                        className="rounded"
                      />
                      <Label>Enabled</Label>
                    </div>
                    <div className="space-y-2">
                      <Label>Percentage</Label>
                      <Input
                        type="number"
                        value={data.payment_policy.late_fees?.percentage || 0}
                        onChange={(e) => updatePaymentPolicy('late_fees.percentage', parseFloat(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Grace Period (days)</Label>
                      <Input
                        type="number"
                        value={data.payment_policy.late_fees?.grace_period_days || 0}
                        onChange={(e) => updatePaymentPolicy('late_fees.grace_period_days', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                {/* Volume Discounts */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      <Label className="text-base font-medium">Volume Discounts</Label>
                    </div>
                    <Button onClick={addVolumeTier} size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Tier
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {(data.payment_policy.discounts?.volume?.tiers || []).map((tier, index) => (
                      <Card key={index}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div className="grid grid-cols-2 gap-4 flex-1">
                              <div className="space-y-2">
                                <Label>Min Bookings</Label>
                                <Input
                                  type="number"
                                  value={tier.min_bookings}
                                  onChange={(e) => {
                                    const currentTiers = data.payment_policy.discounts?.volume?.tiers || [];
                                    const newTiers = [...currentTiers];
                                    newTiers[index] = { ...tier, min_bookings: parseInt(e.target.value) };
                                    updatePaymentPolicy('discounts.volume.tiers', newTiers);
                                  }}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Discount %</Label>
                                <Input
                                  type="number"
                                  value={tier.discount_percentage}
                                  onChange={(e) => {
                                    const currentTiers = data.payment_policy.discounts?.volume?.tiers || [];
                                    const newTiers = [...currentTiers];
                                    newTiers[index] = { ...tier, discount_percentage: parseFloat(e.target.value) };
                                    updatePaymentPolicy('discounts.volume.tiers', newTiers);
                                  }}
                                />
                              </div>
                            </div>
                            <Button
                              onClick={() => removeVolumeTier(index)}
                              size="sm"
                              variant="ghost"
                              className="ml-2 text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="terms" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-blue-600" />
                  Terms & Conditions
                </CardTitle>
                <CardDescription>
                  Define legal terms, liability, and jurisdiction
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Liability */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <Label className="text-base font-medium">Liability</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Provider Max Liability</Label>
                      <Input
                        type="number"
                        value={data.terms.liability?.provider_liability?.maximum_amount || 0}
                        onChange={(e) => updateTerms('liability.provider_liability.maximum_amount', parseFloat(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Select
                        value={data.terms.liability?.provider_liability?.currency || "USD"}
                        onValueChange={(value) => updateTerms('liability.provider_liability.currency', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Jurisdiction */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Scale className="h-4 w-4" />
                    <Label className="text-base font-medium">Jurisdiction</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Governing Law</Label>
                      <Input
                        value={data.terms.jurisdiction?.governing_law || ""}
                        onChange={(e) => updateTerms('jurisdiction.governing_law', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Dispute Resolution</Label>
                      <Select
                        value={data.terms.jurisdiction?.dispute_resolution || "arbitration"}
                        onValueChange={(value) => updateTerms('jurisdiction.dispute_resolution', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mediation">Mediation</SelectItem>
                          <SelectItem value="arbitration">Arbitration</SelectItem>
                          <SelectItem value="litigation">Litigation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Data Protection */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <Label className="text-base font-medium">Data Protection</Label>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>GDPR Compliant</Label>
                      <input
                        type="checkbox"
                        checked={data.terms.data_protection?.gdpr_compliant || false}
                        onChange={(e) => updateTerms('data_protection.gdpr_compliant', e.target.checked)}
                        className="rounded"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Data Retention (days)</Label>
                      <Input
                        type="number"
                        value={data.terms.data_protection?.data_retention_days || 0}
                        onChange={(e) => updateTerms('data_protection.data_retention_days', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={() => onSave(data)}>
            Save Policies
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}

// Helper function to set nested values
function setNestedValue(obj: any, path: string, value: any): any {
  const keys = path.split('.');
  const result = { ...obj };
  let current = result;
  
  for (let i = 0; i < keys.length - 1; i++) {
    current[keys[i]] = { ...current[keys[i]] };
    current = current[keys[i]];
  }
  
  current[keys[keys.length - 1]] = value;
  return result;
}
