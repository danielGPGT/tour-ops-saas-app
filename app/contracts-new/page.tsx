import { createClient } from "@/utils/supabase/server";
import { ContractsNewPageClient } from "@/components/contracts-new/ContractsNewPageClient";
import { DatabaseStatus } from "@/components/common/DatabaseStatus";
import { getCurrentOrgId } from "@/lib/hooks/use-current-org";

export default async function ContractsNewPage({ 
  searchParams 
}: { 
  searchParams?: Promise<{ q?: string; page?: string; status?: string }> 
}) {
  const resolvedSearchParams = await searchParams;
  const orgId = await getCurrentOrgId();
  const q = (resolvedSearchParams?.q ?? "").trim();
  const page = Math.max(1, parseInt(resolvedSearchParams?.page ?? "1"));
  const status = resolvedSearchParams?.status ?? "";
  const limit = 20;
  const offset = (page - 1) * limit;

  // Initialize Supabase client
  const supabase = await createClient();

  // Execute queries with Supabase
  let contracts: any[] = [], totalCount = 0, suppliers: any[] = [], stats: any, hasDatabaseError = false;
  
  try {
    // Get suppliers for the form
    const { data: suppliersData, error: suppliersError } = await supabase
      .from('suppliers')
      .select('*')
      .eq('org_id', orgId)
      .eq('status', 'active')
      .order('name', { ascending: true });

    if (suppliersError) throw suppliersError;
    suppliers = suppliersData || [];

    // Build contracts query with supplier info
    let contractsQuery = supabase
      .from('contracts')
      .select(`
        *,
        suppliers(
          id,
          name,
          status
        ),
        contract_versions(
          id,
          valid_from,
          valid_to,
          cancellation_policy,
          payment_policy,
          terms
        )
      `, { count: 'exact' })
      .eq('org_id', orgId);

    // Add search conditions
    if (q) {
      contractsQuery = contractsQuery.or(`reference.ilike.%${q}%,status.ilike.%${q}%`);
    }

    // Add status filter
    if (status) {
      contractsQuery = contractsQuery.eq('status', status);
    }

    // Get total count
    const { count, error: countError } = await contractsQuery;
    if (countError) throw countError;
    totalCount = count || 0;

    // Get contracts with pagination
    const { data: contractsData, error: contractsError } = await contractsQuery
      .order('status', { ascending: true })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (contractsError) throw contractsError;
    contracts = contractsData || [];

    // Get basic stats
    const { count: totalContracts } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId);

    const { count: activeContracts } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('status', 'active');

    const { count: draftContracts } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('status', 'draft');

    const { count: expiredContracts } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('status', 'expired');

    stats = {
      totalCount: totalContracts || 0,
      activeCount: activeContracts || 0,
      draftCount: draftContracts || 0,
      expiredCount: expiredContracts || 0
    };

  } catch (error) {
    console.error("Database connection error:", error);
    hasDatabaseError = true;
    contracts = [];
    totalCount = 0;
    suppliers = [];
    stats = {
      totalCount: 0,
      activeCount: 0,
      draftCount: 0,
      expiredCount: 0
    };
  }
  
  const totalPages = Math.ceil(totalCount / limit);
  
  // Calculate new contracts this month
  const newThisMonth = contracts.filter(c => {
    const createdDate = new Date(c.created_at);
    const now = new Date();
    return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
  }).length;

  // Calculate unique suppliers with contracts
  const uniqueSuppliersWithContracts = [...new Set(contracts.map(c => c.suppliers?.name).filter(Boolean))].length;

  return (
    <div className="space-y-4">
      {hasDatabaseError && (
        <DatabaseStatus 
          hasDatabaseError={hasDatabaseError}
        />
      )}
      
      <ContractsNewPageClient
        contracts={contracts}
        suppliers={suppliers}
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalCount}
        itemsPerPage={limit}
        searchParams={resolvedSearchParams || {}}
        searchQuery={q}
        hasDatabaseError={hasDatabaseError}
        stats={{
          totalCount,
          activeCount: stats?.activeCount || 0,
          draftCount: stats?.draftCount || 0,
          expiredCount: stats?.expiredCount || 0,
          newThisMonth,
          uniqueSuppliersWithContracts
        }}
      />
    </div>
  );
}
