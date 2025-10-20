import { createClient } from "@/utils/supabase/server";
import { getCurrentOrgId } from "@/lib/hooks/use-current-org";
import { RatePlansPageClient } from "@/components/rate-plans/RatePlansPageClient";

export default async function RatePlansPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; page?: string; supplier?: string; variant?: string; model?: string }>;
}) {
  const resolved = await searchParams;
  const orgId = await getCurrentOrgId();
  const q = (resolved?.q ?? "").trim();
  const page = Math.max(1, parseInt(resolved?.page ?? "1"));
  const limit = 20;
  const offset = (page - 1) * limit;

  const supplierFilter = (resolved?.supplier ?? "").trim();
  const variantFilter = (resolved?.variant ?? "").trim();
  const modelFilter = (resolved?.model ?? "").trim();

  const supabase = await createClient();

  let hasDatabaseError = false;
  let totalCount = 0;
  let suppliers: any[] = [];
  let variants: any[] = [];
  let contractVersions: any[] = [];
  let ratePlans: any[] = [];

  try {
    // Filters data
    const { data: suppliersData } = await supabase
      .from("suppliers")
      .select("id,name,status")
      .eq("org_id", orgId)
      .order("name", { ascending: true });
    suppliers = suppliersData || [];

    const { data: variantsData } = await supabase
      .from("product_variants")
      .select("id,name,product_id")
      .eq("org_id", orgId)
      .order("name", { ascending: true });
    variants = variantsData || [];

    // Contract versions with supplier mapping via contracts
    const { data: versionsData } = await supabase
      .from("contract_versions")
      .select("id,contract_id,valid_from,valid_to")
      .eq("org_id", orgId)
      .order("valid_from", { ascending: true });

    const { data: contractsData } = await supabase
      .from("contracts")
      .select("id,supplier_id,reference")
      .eq("org_id", orgId);

    const contractIdToSupplier: Record<string, any> = {};
    (contractsData || []).forEach((c) => { contractIdToSupplier[String(c.id)] = c; });
    contractVersions = (versionsData || []).map((v: any) => {
      const c = contractIdToSupplier[String(v.contract_id)];
      const label = `${c?.reference ?? 'Contract'} • ${new Date(v.valid_from).toISOString().slice(0,10)} → ${new Date(v.valid_to).toISOString().slice(0,10)}`;
      return { id: v.id, supplier_id: c?.supplier_id, label };
    });

    // Base rate plans query with relations for seasons/occupancies
    let baseQuery = supabase
      .from("rate_plans")
      .select(
        `*,
         suppliers(id,name),
         product_variants(id,name,product_id),
         rate_seasons(id,season_from,season_to),
         rate_occupancies(id,min_occupancy,max_occupancy,pricing_model)`,
        { count: "exact" }
      )
      .eq("org_id", orgId);

    if (q) {
      baseQuery = baseQuery.or(
        `currency.ilike.%${q}%,inventory_model.ilike.%${q}%`
      );
    }
    if (supplierFilter) {
      baseQuery = baseQuery.eq("supplier_id", supplierFilter);
    }
    if (variantFilter) {
      baseQuery = baseQuery.eq("product_variant_id", variantFilter);
    }
    if (modelFilter) {
      baseQuery = baseQuery.eq("inventory_model", modelFilter);
    }

    const { count } = await baseQuery;
    totalCount = count || 0;

    const { data: ratePlansData, error: ratePlansError } = await baseQuery
      .order("preferred", { ascending: false })
      .order("valid_from", { ascending: true })
      .range(offset, offset + limit - 1);
    if (ratePlansError) throw ratePlansError;
    ratePlans = ratePlansData || [];
  } catch (e) {
    console.error("Failed to load rate plans:", e);
    hasDatabaseError = true;
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return (
    <RatePlansPageClient
      ratePlans={ratePlans}
      suppliers={suppliers}
      variants={variants}
      contractVersions={contractVersions}
      hasDatabaseError={hasDatabaseError}
      searchQuery={q}
      currentPage={page}
      totalPages={totalPages}
      totalItems={totalCount}
      itemsPerPage={limit}
    />
  );
}


