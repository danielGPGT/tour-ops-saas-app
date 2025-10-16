import { createClient } from "@/utils/supabase/server";
import { ContractVersionsPageClient } from "@/components/contracts/ContractVersionsPageClient";
import { DatabaseStatus } from "@/components/common/DatabaseStatus";
import { notFound } from "next/navigation";

export default async function ContractVersionsPage({
  params
}: {
  params: { id: string }
}) {
  const orgId = 1; // TODO: from session
  const contractId = parseInt(params.id);

  // Initialize Supabase client
  const supabase = await createClient();

  let contract: any = null, versions: any[] = [], hasDatabaseError = false;

  try {
    // Verify contract exists and belongs to organization
    const { data: contractData, error: contractError } = await supabase
      .from('contracts')
      .select(`
        *,
        suppliers(*)
      `)
      .eq('id', contractId)
      .eq('org_id', orgId)
      .single();

    if (contractError || !contractData) {
      notFound();
    }

    contract = contractData;

    // Get contract versions with rate plans
    const { data: versionsData, error: versionsError } = await supabase
      .from('contract_versions')
      .select(`
        *,
        rate_plans(
          id,
          inventory_model,
          currency,
          markets,
          channels,
          preferred,
          valid_from,
          valid_to,
          created_at
        )
      `)
      .eq('contract_id', contractId)
      .order('valid_from', { ascending: false });

    if (versionsError) throw versionsError;
    versions = versionsData || [];
  } catch (error) {
    console.error("Database connection error:", error);
    hasDatabaseError = true;
    
    // Create a fallback contract object
    contract = {
      id: contractId,
      reference: `Contract-${contractId}`,
      status: "unknown",
      suppliers: {
        id: 1,
        name: "Unknown Supplier",
        channels: [],
        status: "unknown"
      }
    };
    versions = [];
  }

  return (
    <div className="space-y-4">
      {hasDatabaseError && (
        <DatabaseStatus 
          hasError={hasDatabaseError}
        />
      )}
      
      <ContractVersionsPageClient
        contract={contract}
        versions={versions}
      />
    </div>
  );
}
