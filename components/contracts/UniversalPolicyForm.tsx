"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  AlertCircle, 
  Calendar, 
  DollarSign, 
  FileText, 
  Plus, 
  Trash2, 
  Clock,
  Users,
  Settings,
  Percent
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Universal Contract Terms Structure
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
  [key: string]: any; // Allow custom fields
};

type RateModifier = {
  name?: string;
  dates?: string[];
  threshold?: number;
  threshold_type?: string;
  days_advance?: number;
  adjustment_percent: number;
};

type RateModifiers = {
  seasonal?: RateModifier[];
  length_based?: RateModifier[];
  advance_purchase?: RateModifier[];
  day_of_week?: {
    enabled: boolean;
    adjustments: Record<string, number>;
  };
  volume_based?: RateModifier[];
};

type AdditionalTerms = {
  notes?: string | null;
  restrictions: string[];
  inclusions: string[];
  exclusions: string[];
  required_documentation: string[];
  special_conditions: Record<string, any>;
};

type UniversalContractTerms = {
  cancellation_policy: CancellationPolicy;
  attrition_policy: AttritionPolicy;
  payment_terms: PaymentTerms;
  operational_terms: OperationalTerms;
  rate_modifiers?: RateModifiers;
  additional_terms: AdditionalTerms;
};

type UniversalPolicyFormProps = {
  initialData?: Partial<UniversalContractTerms>;
  onSave: (data: UniversalContractTerms) => void;
  onCancel: () => void;
};

export function UniversalPolicyForm({ initialData, onSave, onCancel }: UniversalPolicyFormProps) {
  const [data, setData] = useState<UniversalContractTerms>(() => {
    const defaultData: UniversalContractTerms = {
      cancellation_policy: {
        rules: [
          { days_before: 30, penalty_percent: 0, penalty_amount: null, description: "Free cancellation" },
          { days_before: 7, penalty_percent: 50, penalty_amount: null, description: "50% penalty" },
          { days_before: 0, penalty_percent: 100, penalty_amount: null, description: "Non-refundable" }
        ],
        type: "standard",
        exceptions: ["force_majeure"],
        notes: null
      },
      attrition_policy: {
        enabled: false,
        rules: [
          { days_before: 60, allowed_reduction_percent: 20, penalty_per_unit: null, description: "20% reduction allowed" },
          { days_before: 30, allowed_reduction_percent: 10, penalty_per_unit: null, description: "10% reduction allowed" },
          { days_before: 0, allowed_reduction_percent: 0, penalty_per_unit: 50, description: "No reduction allowed" }
        ],
        minimum_quantity: 10,
        calculation_basis: "original_quantity",
        cumulative: false,
        notes: null
      },
      payment_terms: {
        customer: {
          deposit_percent: 30,
          deposit_due: "at_booking",
          balance_due: "30_days_before",
          accepted_methods: ["credit_card", "bank_transfer"]
        },
        supplier: {
          payment_type: "net_30",
          payment_day: 10,
          method: "bank_transfer",
          currency: "USD"
        },
        commission: {
          rate: 15,
          type: "percentage",
          applies_to: "net",
          notes: null
        }
      },
      operational_terms: {
        minimum_lead_time: "24h",
        maximum_advance_booking: "365d",
        confirmation_time: "instant",
        amendment_allowed: true,
        amendment_deadline: "24h",
        minimum_service_length: 1,
        maximum_service_length: 30
      },
      rate_modifiers: {
        seasonal: [],
        length_based: [],
        advance_purchase: [],
        day_of_week: { enabled: false, adjustments: {} },
        volume_based: []
      },
      additional_terms: {
        notes: null,
        restrictions: [],
        inclusions: [],
        exclusions: [],
        required_documentation: [],
        special_conditions: {}
      }
    };

    // Merge with initial data
    if (initialData) {
      return {
        cancellation_policy: { ...defaultData.cancellation_policy, ...initialData.cancellation_policy },
        attrition_policy: { ...defaultData.attrition_policy, ...initialData.attrition_policy },
        payment_terms: { ...defaultData.payment_terms, ...initialData.payment_terms },
        operational_terms: { ...defaultData.operational_terms, ...initialData.operational_terms },
        rate_modifiers: { ...defaultData.rate_modifiers, ...initialData.rate_modifiers },
        additional_terms: { ...defaultData.additional_terms, ...initialData.additional_terms }
      };
    }

    return defaultData;
  });

  const addCancellationRule = () => {
    setData(prev => ({
      ...prev,
      cancellation_policy: {
        ...prev.cancellation_policy,
        rules: [
          ...prev.cancellation_policy.rules,
          { days_before: 0, penalty_percent: 0, penalty_amount: null, description: "New rule" }
        ]
      }
    }));
  };

  const removeCancellationRule = (index: number) => {
    setData(prev => ({
      ...prev,
      cancellation_policy: {
        ...prev.cancellation_policy,
        rules: prev.cancellation_policy.rules.filter((_, i) => i !== index)
      }
    }));
  };

  const addAttritionRule = () => {
    setData(prev => ({
      ...prev,
      attrition_policy: {
        ...prev.attrition_policy,
        rules: [
          ...prev.attrition_policy.rules,
          { days_before: 0, allowed_reduction_percent: 0, penalty_per_unit: null, description: "New rule" }
        ]
      }
    }));
  };

  const removeAttritionRule = (index: number) => {
    setData(prev => ({
      ...prev,
      attrition_policy: {
        ...prev.attrition_policy,
        rules: prev.attrition_policy.rules.filter((_, i) => i !== index)
      }
    }));
  };

  const addRestriction = () => {
    setData(prev => ({
      ...prev,
      additional_terms: {
        ...prev.additional_terms,
        restrictions: [...prev.additional_terms.restrictions, ""]
      }
    }));
  };

  const removeRestriction = (index: number) => {
    setData(prev => ({
      ...prev,
      additional_terms: {
        ...prev.additional_terms,
        restrictions: prev.additional_terms.restrictions.filter((_, i) => i !== index)
      }
    }));
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Tabs defaultValue="cancellation" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="cancellation" className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              <span className="hidden sm:inline">Cancellation</span>
            </TabsTrigger>
            <TabsTrigger value="attrition" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span className="hidden sm:inline">Attrition</span>
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              <span className="hidden sm:inline">Payment</span>
            </TabsTrigger>
            <TabsTrigger value="operational" className="flex items-center gap-1">
              <Settings className="h-3 w-3" />
              <span className="hidden sm:inline">Operational</span>
            </TabsTrigger>
            <TabsTrigger value="additional" className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              <span className="hidden sm:inline">Additional</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cancellation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  Cancellation Policy
                </CardTitle>
                <CardDescription>
                  Define cancellation deadlines and penalties
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Policy Type</Label>
                  <Select
                    value={data.cancellation_policy.type}
                    onValueChange={(value) => setData(prev => ({
                      ...prev,
                      cancellation_policy: { ...prev.cancellation_policy, type: value as any }
                    }))}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="non_refundable">Non-Refundable</SelectItem>
                      <SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Cancellation Rules</Label>
                    <Button onClick={addCancellationRule} size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Rule
                    </Button>
                  </div>
                  
                  {data.cancellation_policy.rules.map((rule, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Days Before</Label>
                            <Input
                              type="number"
                              value={rule.days_before}
                              onChange={(e) => {
                                const newRules = [...data.cancellation_policy.rules];
                                newRules[index] = { ...rule, days_before: parseInt(e.target.value) };
                                setData(prev => ({
                                  ...prev,
                                  cancellation_policy: { ...prev.cancellation_policy, rules: newRules }
                                }));
                              }}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Penalty %</Label>
                            <Input
                              type="number"
                              value={rule.penalty_percent}
                              onChange={(e) => {
                                const newRules = [...data.cancellation_policy.rules];
                                newRules[index] = { ...rule, penalty_percent: parseInt(e.target.value) };
                                setData(prev => ({
                                  ...prev,
                                  cancellation_policy: { ...prev.cancellation_policy, rules: newRules }
                                }));
                              }}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Description</Label>
                            <Input
                              value={rule.description}
                              onChange={(e) => {
                                const newRules = [...data.cancellation_policy.rules];
                                newRules[index] = { ...rule, description: e.target.value };
                                setData(prev => ({
                                  ...prev,
                                  cancellation_policy: { ...prev.cancellation_policy, rules: newRules }
                                }));
                              }}
                            />
                          </div>
                          <div className="flex items-end">
                            <Button
                              onClick={() => removeCancellationRule(index)}
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label>Exceptions</Label>
                  <div className="flex flex-wrap gap-2">
                    {["force_majeure", "medical_emergency", "government_restrictions"].map((exception) => (
                      <div key={exception} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={data.cancellation_policy.exceptions.includes(exception)}
                          onChange={(e) => {
                            const exceptions = e.target.checked
                              ? [...data.cancellation_policy.exceptions, exception]
                              : data.cancellation_policy.exceptions.filter(ex => ex !== exception);
                            setData(prev => ({
                              ...prev,
                              cancellation_policy: { ...prev.cancellation_policy, exceptions }
                            }));
                          }}
                          className="rounded"
                        />
                        <Label className="text-sm capitalize">{exception.replace('_', ' ')}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attrition" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Attrition Policy
                </CardTitle>
                <CardDescription>
                  Define group reduction allowances and penalties
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Attrition Policy</Label>
                    <p className="text-sm text-muted-foreground">Apply to group bookings only</p>
                  </div>
                  <Switch
                    checked={data.attrition_policy.enabled}
                    onCheckedChange={(checked) => setData(prev => ({
                      ...prev,
                      attrition_policy: { ...prev.attrition_policy, enabled: checked }
                    }))}
                  />
                </div>

                {data.attrition_policy.enabled && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Minimum Quantity</Label>
                        <Input
                          type="number"
                          value={data.attrition_policy.minimum_quantity}
                          onChange={(e) => setData(prev => ({
                            ...prev,
                            attrition_policy: { ...prev.attrition_policy, minimum_quantity: parseInt(e.target.value) }
                          }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Calculation Basis</Label>
                        <Select
                          value={data.attrition_policy.calculation_basis}
                          onValueChange={(value) => setData(prev => ({
                            ...prev,
                            attrition_policy: { ...prev.attrition_policy, calculation_basis: value as any }
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="original_quantity">Original Quantity</SelectItem>
                            <SelectItem value="current_quantity">Current Quantity</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Attrition Rules</Label>
                        <Button onClick={addAttritionRule} size="sm" variant="outline">
                          <Plus className="h-4 w-4 mr-1" />
                          Add Rule
                        </Button>
                      </div>
                      
                      {data.attrition_policy.rules.map((rule, index) => (
                        <Card key={index}>
                          <CardContent className="pt-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs">Days Before</Label>
                                <Input
                                  type="number"
                                  value={rule.days_before}
                                  onChange={(e) => {
                                    const newRules = [...data.attrition_policy.rules];
                                    newRules[index] = { ...rule, days_before: parseInt(e.target.value) };
                                    setData(prev => ({
                                      ...prev,
                                      attrition_policy: { ...prev.attrition_policy, rules: newRules }
                                    }));
                                  }}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Allowed Reduction %</Label>
                                <Input
                                  type="number"
                                  value={rule.allowed_reduction_percent}
                                  onChange={(e) => {
                                    const newRules = [...data.attrition_policy.rules];
                                    newRules[index] = { ...rule, allowed_reduction_percent: parseInt(e.target.value) };
                                    setData(prev => ({
                                      ...prev,
                                      attrition_policy: { ...prev.attrition_policy, rules: newRules }
                                    }));
                                  }}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Penalty per Unit</Label>
                                <Input
                                  type="number"
                                  value={rule.penalty_per_unit || ""}
                                  onChange={(e) => {
                                    const newRules = [...data.attrition_policy.rules];
                                    newRules[index] = { ...rule, penalty_per_unit: e.target.value ? parseFloat(e.target.value) : null };
                                    setData(prev => ({
                                      ...prev,
                                      attrition_policy: { ...prev.attrition_policy, rules: newRules }
                                    }));
                                  }}
                                />
                              </div>
                              <div className="flex items-end">
                                <Button
                                  onClick={() => removeAttritionRule(index)}
                                  size="sm"
                                  variant="ghost"
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="mt-3">
                              <Input
                                placeholder="Description"
                                value={rule.description}
                                onChange={(e) => {
                                  const newRules = [...data.attrition_policy.rules];
                                  newRules[index] = { ...rule, description: e.target.value };
                                  setData(prev => ({
                                    ...prev,
                                    attrition_policy: { ...prev.attrition_policy, rules: newRules }
                                  }));
                                }}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Payment Terms
                </CardTitle>
                <CardDescription>
                  Define customer and supplier payment terms
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Customer Payment</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Deposit %</Label>
                      <Input
                        type="number"
                        value={data.payment_terms.customer.deposit_percent}
                        onChange={(e) => setData(prev => ({
                          ...prev,
                          payment_terms: {
                            ...prev.payment_terms,
                            customer: { ...prev.payment_terms.customer, deposit_percent: parseInt(e.target.value) }
                          }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Deposit Due</Label>
                      <Select
                        value={data.payment_terms.customer.deposit_due}
                        onValueChange={(value) => setData(prev => ({
                          ...prev,
                          payment_terms: {
                            ...prev.payment_terms,
                            customer: { ...prev.payment_terms.customer, deposit_due: value }
                          }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="at_booking">At Booking</SelectItem>
                          <SelectItem value="7_days">7 Days</SelectItem>
                          <SelectItem value="14_days">14 Days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Balance Due</Label>
                      <Select
                        value={data.payment_terms.customer.balance_due}
                        onValueChange={(value) => setData(prev => ({
                          ...prev,
                          payment_terms: {
                            ...prev.payment_terms,
                            customer: { ...prev.payment_terms.customer, balance_due: value }
                          }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="at_service">At Service</SelectItem>
                          <SelectItem value="30_days_before">30 Days Before</SelectItem>
                          <SelectItem value="60_days_before">60 Days Before</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Supplier Payment</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Payment Type</Label>
                      <Select
                        value={data.payment_terms.supplier.payment_type}
                        onValueChange={(value) => setData(prev => ({
                          ...prev,
                          payment_terms: {
                            ...prev.payment_terms,
                            supplier: { ...prev.payment_terms.supplier, payment_type: value }
                          }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="prepay">Prepay</SelectItem>
                          <SelectItem value="net_30">Net 30</SelectItem>
                          <SelectItem value="net_60">Net 60</SelectItem>
                          <SelectItem value="post_service">Post Service</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Select
                        value={data.payment_terms.supplier.currency}
                        onValueChange={(value) => setData(prev => ({
                          ...prev,
                          payment_terms: {
                            ...prev.payment_terms,
                            supplier: { ...prev.payment_terms.supplier, currency: value }
                          }
                        }))}
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

                <div className="space-y-4">
                  <h4 className="font-medium">Commission</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Commission Rate %</Label>
                      <Input
                        type="number"
                        value={data.payment_terms.commission.rate}
                        onChange={(e) => setData(prev => ({
                          ...prev,
                          payment_terms: {
                            ...prev.payment_terms,
                            commission: { ...prev.payment_terms.commission, rate: parseInt(e.target.value) }
                          }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Applies To</Label>
                      <Select
                        value={data.payment_terms.commission.applies_to}
                        onValueChange={(value) => setData(prev => ({
                          ...prev,
                          payment_terms: {
                            ...prev.payment_terms,
                            commission: { ...prev.payment_terms.commission, applies_to: value as any }
                          }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="net">Net</SelectItem>
                          <SelectItem value="gross">Gross</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="operational" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-purple-600" />
                  Operational Terms
                </CardTitle>
                <CardDescription>
                  Define operational requirements and constraints
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Minimum Lead Time</Label>
                    <Input
                      value={data.operational_terms.minimum_lead_time}
                      onChange={(e) => setData(prev => ({
                        ...prev,
                        operational_terms: { ...prev.operational_terms, minimum_lead_time: e.target.value }
                      }))}
                      placeholder="24h, 7d, etc."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Maximum Advance Booking</Label>
                    <Input
                      value={data.operational_terms.maximum_advance_booking}
                      onChange={(e) => setData(prev => ({
                        ...prev,
                        operational_terms: { ...prev.operational_terms, maximum_advance_booking: e.target.value }
                      }))}
                      placeholder="365d, 2y, etc."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Confirmation Time</Label>
                    <Select
                      value={data.operational_terms.confirmation_time}
                      onValueChange={(value) => setData(prev => ({
                        ...prev,
                        operational_terms: { ...prev.operational_terms, confirmation_time: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="instant">Instant</SelectItem>
                        <SelectItem value="24h">24 Hours</SelectItem>
                        <SelectItem value="48h">48 Hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Minimum Service Length</Label>
                    <Input
                      type="number"
                      value={data.operational_terms.minimum_service_length}
                      onChange={(e) => setData(prev => ({
                        ...prev,
                        operational_terms: { ...prev.operational_terms, minimum_service_length: parseInt(e.target.value) }
                      }))}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Amendment Allowed</Label>
                    <p className="text-sm text-muted-foreground">Allow changes to bookings</p>
                  </div>
                  <Switch
                    checked={data.operational_terms.amendment_allowed}
                    onCheckedChange={(checked) => setData(prev => ({
                      ...prev,
                      operational_terms: { ...prev.operational_terms, amendment_allowed: checked }
                    }))}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="additional" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gray-600" />
                  Additional Terms
                </CardTitle>
                <CardDescription>
                  Additional conditions and requirements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={data.additional_terms.notes || ""}
                    onChange={(e) => setData(prev => ({
                      ...prev,
                      additional_terms: { ...prev.additional_terms, notes: e.target.value }
                    }))}
                    placeholder="Any special conditions or requirements..."
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Restrictions</Label>
                    <Button onClick={addRestriction} size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Restriction
                    </Button>
                  </div>
                  
                  {data.additional_terms.restrictions.map((restriction, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={restriction}
                        onChange={(e) => {
                          const newRestrictions = [...data.additional_terms.restrictions];
                          newRestrictions[index] = e.target.value;
                          setData(prev => ({
                            ...prev,
                            additional_terms: { ...prev.additional_terms, restrictions: newRestrictions }
                          }));
                        }}
                        placeholder="Enter restriction..."
                      />
                      <Button
                        onClick={() => removeRestriction(index)}
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
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
            Save Policy
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}
