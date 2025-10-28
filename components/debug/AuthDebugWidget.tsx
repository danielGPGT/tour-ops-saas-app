'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/hooks/useAuth'
import { Bug } from 'lucide-react'

export function AuthDebugWidget() {
  const { user, profile, loading, error, isAuthenticated, isProfileLoaded, organizationId, userRole } = useAuth()

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-900">
          <Bug className="h-5 w-5" />
          Auth Debug Info
        </CardTitle>
        <CardDescription className="text-orange-800">
          Debug information for authentication and profile loading
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Auth Loading:</strong> 
            <Badge variant={loading ? 'destructive' : 'default'} className="ml-2">
              {loading ? 'Loading' : 'Complete'}
            </Badge>
          </div>
          <div>
            <strong>Is Authenticated:</strong>
            <Badge variant={isAuthenticated ? 'default' : 'destructive'} className="ml-2">
              {isAuthenticated ? 'Yes' : 'No'}
            </Badge>
          </div>
          <div>
            <strong>Profile Loaded:</strong>
            <Badge variant={isProfileLoaded ? 'default' : 'destructive'} className="ml-2">
              {isProfileLoaded ? 'Yes' : 'No'}
            </Badge>
          </div>
          <div>
            <strong>Organization ID:</strong>
            <Badge variant={organizationId ? 'default' : 'destructive'} className="ml-2">
              {organizationId || 'None'}
            </Badge>
          </div>
          <div>
            <strong>User Role:</strong>
            <Badge variant={userRole ? 'default' : 'secondary'} className="ml-2">
              {userRole || 'None'}
            </Badge>
          </div>
          <div>
            <strong>User Email:</strong>
            <span className="ml-2 text-muted-foreground">
              {user?.email || 'None'}
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded">
            <div className="font-medium text-destructive">Auth Error:</div>
            <div className="text-sm text-destructive/80">
              {error.code}: {error.message}
            </div>
            {error.details && (
              <pre className="text-xs mt-2 text-muted-foreground">
                {JSON.stringify(error.details, null, 2)}
              </pre>
            )}
          </div>
        )}

        {profile && (
          <div className="p-3 bg-muted/50 rounded">
            <div className="font-medium">Profile Data:</div>
            <pre className="text-xs mt-2 text-muted-foreground overflow-auto max-h-32">
              {JSON.stringify({
                id: profile.id,
                email: profile.email,
                organization_id: profile.organization_id,
                organization_name: profile.organization?.name,
                role: profile.role,
                is_active: profile.is_active
              }, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
