'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function DebugPage() {
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runDiagnostics = async () => {
    setIsLoading(true);
    
    const results = {
      timestamp: new Date().toISOString(),
      tests: []
    };

    // Test 1: Environment Variables
    const envTest = {
      name: 'Environment Variables',
      status: 'checking',
      details: {}
    };
    
    try {
      const response = await fetch('/api/debug/env');
      const data = await response.json();
      envTest.status = response.ok ? 'pass' : 'fail';
      envTest.details = data;
    } catch (error) {
      envTest.status = 'fail';
      envTest.details = { error: error instanceof Error ? error.message : 'Unknown error' };
    }
    
    results.tests.push(envTest);

    // Test 2: Basic Database Connection
    const dbTest = {
      name: 'Database Connection',
      status: 'checking',
      details: {}
    };
    
    try {
      const response = await fetch('/api/test-db');
      const data = await response.json();
      dbTest.status = response.ok ? 'pass' : 'fail';
      dbTest.details = data;
    } catch (error) {
      dbTest.status = 'fail';
      dbTest.details = { error: error instanceof Error ? error.message : 'Unknown error' };
    }
    
    results.tests.push(dbTest);

    // Test 3: Database Schema
    const schemaTest = {
      name: 'Database Schema',
      status: 'checking',
      details: {}
    };
    
    try {
      const response = await fetch('/api/debug/db');
      const data = await response.json();
      schemaTest.status = response.ok ? 'pass' : 'fail';
      schemaTest.details = data;
    } catch (error) {
      schemaTest.status = 'fail';
      schemaTest.details = { error: error instanceof Error ? error.message : 'Unknown error' };
    }
    
    results.tests.push(schemaTest);

    // Test 4: Wizard API Endpoints
    const wizardTest = {
      name: 'Wizard API Endpoints',
      status: 'checking',
      details: {}
    };
    
    try {
      const response = await fetch('/api/test-wizard');
      const data = await response.json();
      wizardTest.status = response.ok ? 'pass' : 'fail';
      wizardTest.details = data;
    } catch (error) {
      wizardTest.status = 'fail';
      wizardTest.details = { error: error instanceof Error ? error.message : 'Unknown error' };
    }
    
    results.tests.push(wizardTest);

    // Test 5: Supabase Wizard Connection
    const supabaseTest = {
      name: 'Supabase Wizard Connection',
      status: 'checking',
      details: {}
    };
    
    try {
      const response = await fetch('/api/test-supabase-wizard');
      const data = await response.json();
      supabaseTest.status = response.ok ? 'pass' : 'fail';
      supabaseTest.details = data;
    } catch (error) {
      supabaseTest.status = 'fail';
      supabaseTest.details = { error: error instanceof Error ? error.message : 'Unknown error' };
    }
    
    results.tests.push(supabaseTest);

    // Test 6: Product Creation API
    const apiTest = {
      name: 'Product Creation API',
      status: 'checking',
      details: {}
    };
    
    try {
      const testData = {
        productType: 'accommodation',
        productName: 'Test Hotel',
        supplier: { name: 'Test Supplier' },
        pricing: { cost: '100', price: '150' },
        availability: { 
          model: 'fixed', 
          quantity: 10, 
          dateFrom: '2025-01-01', 
          dateTo: '2025-01-31' 
        }
      };
      
      const response = await fetch('/api/products/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      });
      
      const data = await response.json();
      apiTest.status = response.ok ? 'pass' : 'fail';
      apiTest.details = data;
    } catch (error) {
      apiTest.status = 'fail';
      apiTest.details = { error: error instanceof Error ? error.message : 'Unknown error' };
    }
    
    results.tests.push(apiTest);

    setTestResults(results);
    setIsLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pass':
        return <Badge className="bg-green-100 text-green-800">✓ Pass</Badge>;
      case 'fail':
        return <Badge className="bg-red-100 text-red-800">✗ Fail</Badge>;
      case 'checking':
        return <Badge className="bg-yellow-100 text-yellow-800">⏳ Checking</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>🔧 System Diagnostics</CardTitle>
            <CardDescription>
              Run diagnostics to check your database setup and API endpoints
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Button 
                onClick={runDiagnostics} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Running Diagnostics...' : 'Run Diagnostics'}
              </Button>
            </div>

            {testResults && (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Last run: {new Date(testResults.timestamp).toLocaleString()}
                </div>
                
                {testResults.tests.map((test: any, index: number) => (
                  <Card key={index}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{test.name}</CardTitle>
                        {getStatusBadge(test.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                        {JSON.stringify(test.details, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <Alert>
              <AlertDescription>
                <strong>Common Issues & Solutions:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• <strong>DATABASE_URL not set:</strong> Add to .env.local file</li>
                  <li>• <strong>Database connection failed:</strong> Check Supabase credentials</li>
                  <li>• <strong>Schema issues:</strong> Run `npx prisma db push`</li>
                  <li>• <strong>Tables missing:</strong> Run the migration script</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
