import { createClient } from "@/utils/supabase/server";

export default async function Home() {
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
