"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { EntityPageLayout } from "@/components/common/EntityPageLayout";
import { DataTableColumn } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Copy, Edit, Layers, Plus, Factory } from "lucide-react";
import { AllocationGeneratorSheet } from "@/components/rate-plans/AllocationGeneratorSheet";
import { RatePlanSheetForm } from "@/components/rate-plans/RatePlanSheetForm";
import { format } from "date-fns";

type RatePlanRow = any;

export function RatePlansPageClient({
  ratePlans,
  suppliers,
  variants,
  contractVersions,
  hasDatabaseError,
  searchQuery,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
}: {
  ratePlans: any[];
  suppliers: any[];
  variants: any[];
  contractVersions: any[];
  hasDatabaseError: boolean;
  searchQuery: string;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<RatePlanRow[]>([]);

  const columns: DataTableColumn<RatePlanRow>[] = useMemo(() => [
    {
      key: "product_variants",
      header: "Variant",
      render: (rp: any) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{rp.product_variants?.name || "—"}</span>
          <span className="text-xs text-muted-foreground">{rp.suppliers?.name || "—"}</span>
        </div>
      ),
    },
    {
      key: "inventory_model",
      header: "Model",
      render: (rp: any) => (
        <Badge variant="secondary" className="text-xs capitalize">{rp.inventory_model}</Badge>
      )
    },
    {
      key: "currency",
      header: "Currency",
    },
    {
      key: "valid_from",
      header: "Dates",
      render: (rp: any) => (
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {format(new Date(rp.valid_from), "MMM d, yyyy")} – {format(new Date(rp.valid_to), "MMM d, yyyy")}
        </div>
      )
    },
    {
      key: "rate_seasons",
      header: "Seasons",
      render: (rp: any) => <span className="text-sm">{(rp.rate_seasons?.length ?? 0)}</span>
    },
    {
      key: "rate_occupancies",
      header: "Occupancies",
      render: (rp: any) => <span className="text-sm">{(rp.rate_occupancies?.length ?? 0)}</span>
    },
    {
      key: "actions",
      header: "Actions",
      render: (rp: any) => (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push(`/rate-plans/${rp.id}`)}>
            <Edit className="h-3 w-3 mr-1" /> Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push(`/inventory?variant=${rp.product_variant_id}`)}>
            <Layers className="h-3 w-3 mr-1" /> Inventory
          </Button>
          <AllocationGeneratorSheet
            trigger={<Button variant="outline" size="sm"><Factory className="h-3 w-3 mr-1" /> Generate</Button>}
            plan={{
              id: rp.id,
              product_variant_id: rp.product_variant_id,
              supplier_id: rp.supplier_id,
              inventory_model: rp.inventory_model,
              valid_from: rp.valid_from,
              valid_to: rp.valid_to,
            }}
            onGenerated={() => router.refresh()}
          />
          <Button variant="outline" size="sm">
            <Copy className="h-3 w-3 mr-1" /> Duplicate
          </Button>
        </div>
      )
    }
  ], [router]);

  const bulkActions = [
    { label: "Duplicate", onClick: () => {} },
    { label: "Generate Inventory", onClick: () => {} },
  ];

  return (
    <EntityPageLayout
      title="Rate Plans"
      subtitle="Pricing, seasons, occupancies, and inventory models"
      data={ratePlans}
      columns={columns}
      selectedItems={selected}
      onSelectionChange={setSelected}
      getId={(rp) => rp.id}
      emptyState={{
        icon: <Plus className="h-5 w-5" />,
        title: "No rate plans",
        description: "Create your first rate plan to start pricing your variants.",
      }}
      bulkActions={bulkActions}
      getItemName={(rp) => rp.product_variants?.name || `Rate Plan ${rp.id}`}
      getItemId={(rp) => rp.id}
      entityName="rate plan"
      onSelectionClear={() => setSelected([])}
      currentPage={currentPage}
      totalPages={totalPages}
      totalItems={totalItems}
      itemsPerPage={itemsPerPage}
      onPageChange={(page) => {
        const params = new URLSearchParams(window.location.search);
        params.set("page", page.toString());
        router.push(`/rate-plans?${params.toString()}`);
      }}
      primaryAction={undefined}
      // Filters (simple client-side examples)
      children={(
        <div className="flex flex-col gap-3">
          {/* Create wizard trigger */}
          <div>
            <RatePlanCreateInline suppliers={suppliers} variants={variants} contractVersions={contractVersions} onCreated={() => router.refresh()} />
          </div>
          <Select onValueChange={(v) => router.push(v ? `/rate-plans?supplier=${v}` : "/rate-plans") }>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="Filter by supplier" /></SelectTrigger>
            <SelectContent>
              {suppliers.map((s: any) => (
                <SelectItem key={s.id} value={`/rate-plans?supplier=${s.id}`}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select onValueChange={(v) => router.push(v ? `/rate-plans?variant=${v}` : "/rate-plans") }>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="Filter by variant" /></SelectTrigger>
            <SelectContent>
              {variants.map((v: any) => (
                <SelectItem key={v.id} value={`/rate-plans?variant=${v.id}`}>{v.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select onValueChange={(v) => router.push(v ? `/rate-plans?model=${v}` : "/rate-plans") }>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="Inventory model" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="committed">Committed</SelectItem>
              <SelectItem value="freesale">Free sale</SelectItem>
              <SelectItem value="on_request">On request</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    />
  );
}

function RatePlanCreateInline({ suppliers, variants, contractVersions, onCreated }: any) {
  const trigger = (
    <Button size="sm" className="h-8 gap-1">
      <Plus className="h-3 w-3" /> New Rate Plan
    </Button>
  );
  const mappedCV = (contractVersions || []).map((cv: any) => ({ id: cv.id, supplier_id: cv.supplier_id, label: cv.label }));
  const mappedSup = (suppliers || []).map((s: any) => ({ id: s.id, name: s.name }));
  const mappedVar = (variants || []).map((v: any) => ({ id: v.id, name: v.name }));
  return (
    <RatePlanSheetForm trigger={trigger} suppliers={mappedSup} variants={mappedVar} contractVersions={mappedCV} onCreated={onCreated} />
  );
}


