import { createClient } from "@/utils/supabase/server";
import { ContractDetailPage } from "@/components/contracts/ContractDetailPage";
import { getCurrentOrgId } from "@/lib/hooks/use-current-org";
import { notFound } from "next/navigation";

export default async function ContractDetailRoute({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const resolvedParams = await params;
  const contractId = resolvedParams.id;
  const orgId = await getCurrentOrgId();

  // Initialize Supabase client
  const supabase = await createClient();

  try {
    console.log('Loading contract:', { contractId, orgId });
    
    // Get contract with all related data
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select(`
        *,
        suppliers(*)
      `)
      .eq('id', contractId)
      .eq('org_id', orgId)
      .single();

    // Get contract deadlines - they can reference contracts directly via ref_type='contract' and ref_id
    let contractDeadlines: any[] = [];
    if (contract) {
      const { data: deadlines, error: deadlinesError } = await supabase
        .from('contract_deadlines')
        .select('*')
        .eq('ref_type', 'contract')
        .eq('ref_id', contractId);
      
      if (!deadlinesError) {
        contractDeadlines = deadlines || [];
      } else {
        console.error('Error fetching deadlines:', deadlinesError);
      }
    }

    console.log('Contract query result:', { contract, contractError });

    if (contractError) {
      console.error('Contract query error:', contractError);
      notFound();
    }

    if (!contract) {
      console.log('No contract found for ID:', contractId);
      notFound();
    }

    // Add deadlines to the contract object
    contract.contract_deadlines = contractDeadlines;

    // Get suppliers for the form
    const { data: suppliers, error: suppliersError } = await supabase
      .from('suppliers')
      .select('*')
      .eq('org_id', orgId)
      .eq('status', 'active')
      .order('name', { ascending: true });

    if (suppliersError) {
      console.error('Error fetching suppliers:', suppliersError);
    }

    return (
      <ContractDetailPage
        contract={contract}
        suppliers={suppliers || []}
      />
    );
  } catch (error) {
    console.error('Error loading contract:', error);
    
    // Return a helpful error page instead of just 404
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Contract Not Found</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error Details:</h2>
          <p className="text-red-700 mb-2">Contract ID: {contractId}</p>
          <p className="text-red-700 mb-2">Organization ID: {orgId}</p>
          <pre className="text-sm text-red-600 bg-red-100 p-2 rounded">
            {JSON.stringify(error, null, 2)}
          </pre>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Possible Solutions:</h3>
          <ul className="list-disc list-inside text-blue-700 space-y-1">
            <li>Check if the contract ID is correct</li>
            <li>Make sure you have run the seed data: <code>psql -d your_database -f db/seed_contracts.sql</code></li>
            <li>Verify the contract exists in your organization</li>
            <li>Check the <a href="/debug-contracts" className="underline">debug page</a> to see available contracts</li>
          </ul>
        </div>
        
        <div className="mt-4">
          <a 
            href="/contracts" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            ← Back to Contracts
          </a>
        </div>
      </div>
    );
  }
}
