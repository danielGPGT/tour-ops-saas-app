"use client";

import { useMemo, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SheetForm } from "@/components/ui/SheetForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { addRateOccupancies, addRateSeasons, createRatePlan } from "@/app/rate-plans/actions";

const BasicsSchema = z.object({
  product_variant_id: z.string().min(1),
  supplier_id: z.string().min(1),
  contract_version_id: z.string().min(1),
  inventory_model: z.enum(["committed", "on_request", "freesale"]),
  currency: z.string().length(3),
  preferred: z.boolean().optional().default(false),
  priority: z.coerce.number().int().min(0).max(1000).default(100),
  valid_from: z.string().min(1),
  valid_to: z.string().min(1),
});

type BasicsForm = z.infer<typeof BasicsSchema>;

type SeasonRow = { season_from: string; season_to: string; dow_mask?: number; min_stay?: number | null };
type OccupancyRow = { min_occupancy: number; max_occupancy: number; pricing_model: "fixed" | "base_plus_pax"; base_amount?: number | null; per_person_amount?: number | null };

export function RatePlanSheetForm({
  trigger,
  suppliers,
  variants,
  contractVersions,
  onCreated,
}: {
  trigger: React.ReactNode;
  suppliers: Array<{ id: number | string; name: string }>;
  variants: Array<{ id: number | string; name: string }>;
  contractVersions: Array<{ id: number | string; label: string; supplier_id: number | string }>;
  onCreated?: (ratePlanId: number | string) => void;
}) {
  const form = useForm<BasicsForm>({
    resolver: zodResolver(BasicsSchema),
    defaultValues: {
      inventory_model: "committed",
      currency: "USD",
      preferred: false,
      priority: 100,
    },
  });

  const [seasons, setSeasons] = useState<SeasonRow[]>([]);
  const [occupancies, setOccupancies] = useState<OccupancyRow[]>([]);

  const filteredVersions = useMemo(() => {
    const sid = form.watch("supplier_id");
    if (!sid) return contractVersions;
    return contractVersions.filter((v) => String(v.supplier_id) === String(sid));
  }, [contractVersions, form]);

  return (
    <SheetForm
      trigger={trigger}
      title="Create Rate Plan"
      description="Basics, seasons, and occupancies"
      initial={{}}
      onSubmit={async () => {
        const basics = BasicsSchema.parse(form.getValues());
        const created = await createRatePlan({
          product_variant_id: Number(basics.product_variant_id),
          supplier_id: Number(basics.supplier_id),
          contract_version_id: Number(basics.contract_version_id),
          inventory_model: basics.inventory_model,
          currency: basics.currency,
          preferred: basics.preferred || false,
          priority: basics.priority,
          valid_from: new Date(basics.valid_from),
          valid_to: new Date(basics.valid_to),
        });

        if (seasons.length > 0) {
          await addRateSeasons(created.id, seasons.map((s) => ({
            season_from: new Date(s.season_from),
            season_to: new Date(s.season_to),
            dow_mask: s.dow_mask ?? 127,
            min_stay: s.min_stay ?? null,
          })));
        }

        if (occupancies.length > 0) {
          await addRateOccupancies(created.id, occupancies.map((o) => ({
            min_occupancy: o.min_occupancy,
            max_occupancy: o.max_occupancy,
            pricing_model: o.pricing_model,
            base_amount: o.base_amount ?? null,
            per_person_amount: o.per_person_amount ?? null,
          })));
        }

        onCreated?.(created.id);
      }}
      submitLabel="Create"
      side="right"
    >
      {() => (
        <Tabs defaultValue="basics" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basics">Basics</TabsTrigger>
            <TabsTrigger value="seasons">Seasons</TabsTrigger>
            <TabsTrigger value="occupancies">Occupancies</TabsTrigger>
          </TabsList>

          <TabsContent value="basics" className="space-y-4 mt-4">
            <Form {...form}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="product_variant_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Variant *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select variant" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {variants.map((v) => (
                            <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="supplier_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {suppliers.map((s) => (
                            <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contract_version_id"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Contract Version *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select contract version" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filteredVersions.map((cv) => (
                            <SelectItem key={cv.id} value={String(cv.id)}>{cv.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="my-2" />

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="inventory_model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Inventory Model *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="committed">Committed</SelectItem>
                          <SelectItem value="on_request">On Request</SelectItem>
                          <SelectItem value="freesale">Free sale</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency *</FormLabel>
                      <Input placeholder="USD" maxLength={3} {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Input type="number" min={0} max={1000} {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-2">
                  <FormField
                    control={form.control}
                    name="valid_from"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valid From *</FormLabel>
                        <Input type="date" {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="valid_to"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valid To *</FormLabel>
                        <Input type="date" {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </Form>
          </TabsContent>

          <TabsContent value="seasons" className="mt-4">
            <Card>
              <CardHeader><CardTitle>Season Rows</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-sm font-medium text-muted-foreground">
                  <div>From</div>
                  <div>To</div>
                  <div>DoW Mask</div>
                  <div>Min Stay</div>
                  <div></div>
                </div>
                {seasons.map((s, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-2">
                    <Input type="date" value={s.season_from} onChange={(e) => {
                      const copy = [...seasons]; copy[idx].season_from = e.target.value; setSeasons(copy);
                    }} />
                    <Input type="date" value={s.season_to} onChange={(e) => {
                      const copy = [...seasons]; copy[idx].season_to = e.target.value; setSeasons(copy);
                    }} />
                    <Input type="number" placeholder="127" value={s.dow_mask ?? 127} onChange={(e) => {
                      const copy = [...seasons]; copy[idx].dow_mask = Number(e.target.value); setSeasons(copy);
                    }} />
                    <Input type="number" placeholder="4" value={s.min_stay ?? ""} onChange={(e) => {
                      const copy = [...seasons]; copy[idx].min_stay = e.target.value ? Number(e.target.value) : undefined; setSeasons(copy);
                    }} />
                    <button className="text-sm text-red-600" onClick={() => setSeasons(seasons.filter((_, i) => i !== idx))}>Remove</button>
                  </div>
                ))}
                <button className="text-sm text-primary" onClick={() => setSeasons([...seasons, { season_from: "", season_to: "" }])}>+ Add season</button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="occupancies" className="mt-4">
            <Card>
              <CardHeader><CardTitle>Occupancy Rows</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-2 text-sm font-medium text-muted-foreground">
                  <div>Min</div>
                  <div>Max</div>
                  <div>Model</div>
                  <div>Base Amt</div>
                  <div>Per Person</div>
                  <div></div>
                </div>
                {occupancies.map((o, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-2">
                    <Input type="number" value={o.min_occupancy} onChange={(e) => {
                      const copy = [...occupancies]; copy[idx].min_occupancy = Number(e.target.value); setOccupancies(copy);
                    }} />
                    <Input type="number" value={o.max_occupancy} onChange={(e) => {
                      const copy = [...occupancies]; copy[idx].max_occupancy = Number(e.target.value); setOccupancies(copy);
                    }} />
                    <Select value={o.pricing_model} onValueChange={(v) => {
                      const copy = [...occupancies]; copy[idx].pricing_model = v as any; setOccupancies(copy);
                    }}>
                      <SelectTrigger><SelectValue placeholder="Model" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed</SelectItem>
                        <SelectItem value="base_plus_pax">Base + Pax</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input type="number" value={o.base_amount ?? ""} onChange={(e) => {
                      const copy = [...occupancies]; copy[idx].base_amount = e.target.value ? Number(e.target.value) : null; setOccupancies(copy);
                    }} />
                    <Input type="number" value={o.per_person_amount ?? ""} onChange={(e) => {
                      const copy = [...occupancies]; copy[idx].per_person_amount = e.target.value ? Number(e.target.value) : null; setOccupancies(copy);
                    }} />
                    <button className="text-sm text-red-600" onClick={() => setOccupancies(occupancies.filter((_, i) => i !== idx))}>Remove</button>
                  </div>
                ))}
                <button className="text-sm text-primary" onClick={() => setOccupancies([...occupancies, { min_occupancy: 1, max_occupancy: 2, pricing_model: "fixed" }])}>+ Add occupancy</button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </SheetForm>
  );
}


