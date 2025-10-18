import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home({ searchParams }: { searchParams?: Promise<{ org?: string }> }) {
  const resolvedSearchParams = await searchParams;
  
  // Handle organization switching
  if (resolvedSearchParams?.org) {
    const orgId = parseInt(resolvedSearchParams.org);
    const cookieStore = await cookies();
    cookieStore.set('currentOrgId', orgId.toString(), { 
      path: '/', 
      maxAge: 31536000 
    });
    
    // Redirect to suppliers page to see the organization data
    redirect('/suppliers');
  }
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  // Test Supabase database connection
  let orgCount: number | null = null;
  let dbError = null;
  try {
    const { count, error } = await supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      throw error;
    }
    orgCount = count;
  } catch (e) {
    dbError = e;
    console.error('Database connection error:', e);
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-4">Tour Ops SaaS</h1>
      <div className="space-y-2 text-sm">
        <div>
          <span className="font-medium">Supabase user:</span>{" "}
          {user ? user.email ?? user.id : "not signed in"}
        </div>
        <div>
          <span className="font-medium">DB connectivity:</span>{" "}
          {orgCount === null ? (
            dbError ? `Error: ${dbError instanceof Error ? dbError.message : 'Unknown error'}` : "not initialized"
          ) : (
            `organizations=${orgCount}`
          )}
        </div>
        <div className="mt-4">
          <a 
            href="/test-supabase" 
            className="text-blue-600 hover:text-blue-800 underline"
          >
            → Test Supabase Connection
          </a>
        </div>
      </div>
    </div>
  );
}
