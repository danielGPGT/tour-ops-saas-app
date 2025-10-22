'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function DebugSupabasePage() {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  const [tablesStatus, setTablesStatus] = useState<'checking' | 'found' | 'error'>('checking')
  const [authStatus, setAuthStatus] = useState<'checking' | 'working' | 'error'>('checking')
  const [error, setError] = useState<string | null>(null)
  const [tables, setTables] = useState<string[]>([])

  useEffect(() => {
    testConnection()
  }, [])

  const testConnection = async () => {
    try {
      const supabase = createClient()
      
      // Test basic connection
      const { data, error: connectionError } = await supabase
        .from('organizations')
        .select('count')
        .limit(1)
      
      if (connectionError) {
        throw connectionError
      }
      
      setConnectionStatus('connected')
      
      // Test tables exist
      const { data: tablesData, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .in('table_name', ['organizations', 'users', 'suppliers', 'contracts', 'products'])
      
      if (tablesError) {
        throw tablesError
      }
      
      const tableNames = tablesData?.map(t => t.table_name) || []
      setTables(tableNames)
      
      if (tableNames.length >= 3) {
        setTablesStatus('found')
      } else {
        setTablesStatus('error')
        setError('Required tables not found. Please run the database schema.')
      }
      
      // Test authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        throw authError
      }
      
      if (user) {
        setAuthStatus('working')
      } else {
        setAuthStatus('error')
        setError('No authenticated user found. Please log in.')
      }
      
    } catch (err) {
      console.error('Connection test failed:', err)
      setConnectionStatus('error')
      setTablesStatus('error')
      setAuthStatus('error')
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'checking':
        return <Loader2 className="h-4 w-4 animate-spin" />
      case 'connected':
      case 'found':
      case 'working':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'found':
      case 'working':
        return 'bg-green-100 text-green-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Supabase Connection Debug</h1>
          <p className="text-muted-foreground">Test your Supabase connection and database setup</p>
        </div>
        <Button onClick={testConnection} variant="outline">
          Test Again
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(connectionStatus)}
              Supabase Connection
            </CardTitle>
            <CardDescription>
              Test basic connection to Supabase
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Badge className={getStatusColor(connectionStatus)}>
              {connectionStatus === 'checking' ? 'Testing...' : 
               connectionStatus === 'connected' ? 'Connected' : 'Failed'}
            </Badge>
            {connectionStatus === 'error' && (
              <p className="text-sm text-red-600 mt-2">
                Check your .env.local file and Supabase credentials
              </p>
            )}
          </CardContent>
        </Card>

        {/* Tables Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(tablesStatus)}
              Database Tables
            </CardTitle>
            <CardDescription>
              Check if required tables exist
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Badge className={getStatusColor(tablesStatus)}>
              {tablesStatus === 'checking' ? 'Checking...' : 
               tablesStatus === 'found' ? 'Found' : 'Missing'}
            </Badge>
            {tables.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-muted-foreground">Found tables:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {tables.map(table => (
                    <Badge key={table} variant="outline" className="text-xs">
                      {table}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Auth Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(authStatus)}
              Authentication
            </CardTitle>
            <CardDescription>
              Test user authentication
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Badge className={getStatusColor(authStatus)}>
              {authStatus === 'checking' ? 'Checking...' : 
               authStatus === 'working' ? 'Working' : 'Not Authenticated'}
            </Badge>
            {authStatus === 'error' && (
              <p className="text-sm text-red-600 mt-2">
                Please log in to test authentication
              </p>
            )}
          </CardContent>
        </Card>

        {/* Environment Variables */}
        <Card>
          <CardHeader>
            <CardTitle>Environment Variables</CardTitle>
            <CardDescription>
              Check your .env.local configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={process.env.NEXT_PUBLIC_SUPABASE_URL ? 'default' : 'destructive'}>
                  {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing'}
                </Badge>
                <span className="text-sm">NEXT_PUBLIC_SUPABASE_URL</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'default' : 'destructive'}>
                  {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'}
                </Badge>
                <span className="text-sm">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Error Details</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
          <CardDescription>
            Follow these steps to set up your Supabase connection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium">1. Create .env.local file</h4>
              <p className="text-sm text-muted-foreground">
                Add your Supabase credentials to .env.local
              </p>
            </div>
            <div>
              <h4 className="font-medium">2. Run database schema</h4>
              <p className="text-sm text-muted-foreground">
                Copy and run the SQL from db/initial_schema.sql in your Supabase SQL Editor
              </p>
            </div>
            <div>
              <h4 className="font-medium">3. Set up Row Level Security</h4>
              <p className="text-sm text-muted-foreground">
                Run the RLS policies from scripts/setup-supabase.md
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
