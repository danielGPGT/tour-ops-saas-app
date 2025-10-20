import { createClient } from "@/utils/supabase/server";
import { getCurrentOrgId } from "@/lib/hooks/use-current-org";

export default async function DebugContractsPage() {
  const orgId = await getCurrentOrgId();
  const supabase = await createClient();

  try {
    // Get all contracts
    const { data: contracts, error: contractsError } = await supabase
      .from('contracts')
      .select('*')
      .eq('org_id', orgId);

    // Get all suppliers
    const { data: suppliers, error: suppliersError } = await supabase
      .from('suppliers')
      .select('*')
      .eq('org_id', orgId);

    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Debug Contracts</h1>
        
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Organization ID: {orgId}</h2>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Contracts ({contracts?.length || 0})</h2>
          {contractsError && (
            <div className="text-red-600 mb-2">
              Error: {contractsError.message}
            </div>
          )}
          <div className="bg-gray-100 p-4 rounded">
            <pre>{JSON.stringify(contracts, null, 2)}</pre>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Suppliers ({suppliers?.length || 0})</h2>
          {suppliersError && (
            <div className="text-red-600 mb-2">
              Error: {suppliersError.message}
            </div>
          )}
          <div className="bg-gray-100 p-4 rounded">
            <pre>{JSON.stringify(suppliers, null, 2)}</pre>
          </div>
        </div>

        {contracts && contracts.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Contract Links</h2>
            <div className="space-y-2">
              {contracts.map((contract: any) => (
                <div key={contract.id} className="flex items-center gap-2">
                  <a 
                    href={`/contracts/${contract.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {contract.reference} (ID: {contract.id})
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {(!contracts || contracts.length === 0) && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">No Contracts Found</h2>
            <p className="text-gray-600 mb-4">
              You need to run the seed data to create some test contracts.
            </p>
            <div className="bg-yellow-100 p-4 rounded">
              <p className="font-medium">To fix this:</p>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Run the migration: <code>psql -d your_database -f db/migrations/contract_mvp_enhancements.sql</code></li>
                <li>Run the seed data: <code>psql -d your_database -f db/seed_contracts.sql</code></li>
                <li>Refresh this page</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Debug Contracts - Error</h1>
        <div className="text-red-600">
          <pre>{JSON.stringify(error, null, 2)}</pre>
        </div>
      </div>
    );
  }
}
