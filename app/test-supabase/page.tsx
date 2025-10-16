import { createClient } from '@/utils/supabase/server'

export default async function TestSupabasePage() {
  const supabase = await createClient()
  
  // Test basic connection
  let connectionStatus = 'Unknown'
  let user = null
  let tables = []
  
  try {
    // Test auth
    const { data: { user: authUser } } = await supabase.auth.getUser()
    user = authUser
    
    // Test database connection by querying a simple table
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('Database query error:', error)
      connectionStatus = `Database Error: ${error.message}`
    } else {
      connectionStatus = 'Connected Successfully'
      tables = data || []
    }
  } catch (error) {
    console.error('Connection error:', error)
    connectionStatus = `Connection Error: ${error instanceof Error ? error.message : 'Unknown error'}`
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-4">Supabase Connection Test</h1>
      
      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-medium mb-2">Connection Status</h2>
          <p className={`font-medium ${
            connectionStatus === 'Connected Successfully' 
              ? 'text-green-600' 
              : 'text-red-600'
          }`}>
            {connectionStatus}
          </p>
        </div>

        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-medium mb-2">Authentication</h2>
          <p>
            {user ? (
              <span className="text-green-600">
                User: {user.email || user.id}
              </span>
            ) : (
              <span className="text-gray-600">Not authenticated</span>
            )}
          </p>
        </div>

        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-medium mb-2">Database Query Test</h2>
          <p className="text-sm text-gray-600 mb-2">
            Querying organizations table (limit 1):
          </p>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
            {JSON.stringify(tables, null, 2)}
          </pre>
        </div>

        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-medium mb-2">Environment Variables</h2>
          <div className="space-y-1 text-sm">
            <p>
              <span className="font-medium">SUPABASE_URL:</span> {
                process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'
              }
            </p>
            <p>
              <span className="font-medium">SUPABASE_ANON_KEY:</span> {
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
