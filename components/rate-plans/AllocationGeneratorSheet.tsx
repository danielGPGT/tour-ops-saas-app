"use client";

import { useState } from "react";
import { SheetForm } from "@/components/ui/SheetForm";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { generateAllocationBucketsByPlan } from "@/app/rate-plans/actions";

export function AllocationGeneratorSheet({
  trigger,
  plan,
  onGenerated,
}: {
  trigger: React.ReactNode;
  plan: { id: number | string; product_variant_id: number | string; supplier_id: number | string; inventory_model: string; valid_from: string | Date; valid_to: string | Date };
  onGenerated?: () => void;
}) {
  const [defaultQty, setDefaultQty] = useState<number>(8);
  const [weekendMultiplier, setWeekendMultiplier] = useState<number>(1);

  const from = new Date(plan.valid_from);
  const to = new Date(plan.valid_to);
  const days = Math.max(0, Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  const estimatedTotal = Math.round(defaultQty * days);

  return (
    <SheetForm
      trigger={trigger}
      title="Generate Inventory"
      description="Create allocation buckets for the plan date range"
      initial={{}}
      onSubmit={async () => {
        await generateAllocationBucketsByPlan({
          rate_plan_id: Number(plan.id),
          product_variant_id: Number(plan.product_variant_id),
          supplier_id: Number(plan.supplier_id),
          valid_from: new Date(plan.valid_from),
          valid_to: new Date(plan.valid_to),
          allocation_type: plan.inventory_model as any,
          default_quantity: defaultQty,
          weekend_multiplier: weekendMultiplier,
        });
        onGenerated?.();
      }}
      submitLabel="Generate"
      side="right"
    >
      {() => (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Parameters</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Default Daily Quantity</Label>
                <Input type="number" min={0} value={defaultQty} onChange={(e) => setDefaultQty(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Weekend Multiplier</Label>
                <Input type="number" step="0.1" min={0} value={weekendMultiplier} onChange={(e) => setWeekendMultiplier(Number(e.target.value))} />
              </div>
            </CardContent>
          </Card>

          <Separator />

          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Date Range: {from.toDateString()} → {to.toDateString()} ({days} days)</p>
              <p className="text-sm text-muted-foreground">Estimated total units: <span className="font-medium">{estimatedTotal}</span></p>
            </CardContent>
          </Card>
        </div>
      )}
    </SheetForm>
  );
}


