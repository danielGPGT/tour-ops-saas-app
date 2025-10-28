'use client'

import React from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { 
  AlertCircle, 
  RefreshCw, 
  LogOut, 
  Shield,
  Building2,
  XCircle
} from 'lucide-react'
import { useAuth, type AuthError } from '@/lib/hooks/useAuth'

interface AuthErrorHandlerProps {
  error: AuthError
  className?: string
}

const errorConfig = {
  NO_EMAIL: {
    icon: AlertCircle,
    title: 'Email Not Found',
    severity: 'warning' as const,
    canRetry: false,
    showSignOut: true
  },
  PROFILE_NOT_FOUND: {
    icon: Shield,
    title: 'Account Not Found',
    severity: 'destructive' as const,
    canRetry: true,
    showSignOut: true
  },
  ORG_INACTIVE: {
    icon: Building2,
    title: 'Organization Inactive',
    severity: 'destructive' as const,
    canRetry: false,
    showSignOut: true
  },
  PROFILE_LOAD_ERROR: {
    icon: RefreshCw,
    title: 'Profile Load Error',
    severity: 'warning' as const,
    canRetry: true,
    showSignOut: false
  },
  SESSION_ERROR: {
    icon: XCircle,
    title: 'Session Error',
    severity: 'destructive' as const,
    canRetry: true,
    showSignOut: true
  },
  SIGNOUT_ERROR: {
    icon: LogOut,
    title: 'Sign Out Error',
    severity: 'warning' as const,
    canRetry: true,
    showSignOut: false
  },
  INIT_ERROR: {
    icon: AlertCircle,
    title: 'Authentication Error',
    severity: 'destructive' as const,
    canRetry: true,
    showSignOut: false
  }
}

const getErrorMessage = (error: AuthError): string => {
  switch (error.code) {
    case 'NO_EMAIL':
      return 'Your account does not have an email address. Please contact support.'
    case 'PROFILE_NOT_FOUND':
      return 'Your user profile could not be found or may be inactive. Please contact your administrator.'
    case 'ORG_INACTIVE':
      return 'Your organization account is inactive. Please contact your administrator or support.'
    case 'PROFILE_LOAD_ERROR':
      return 'Failed to load your user profile. Please try refreshing the page.'
    case 'SESSION_ERROR':
      return 'There was an error with your session. Please sign in again.'
    case 'SIGNOUT_ERROR':
      return 'There was an error signing you out. Please try again.'
    case 'INIT_ERROR':
      return 'Authentication service is unavailable. Please try again or contact support.'
    default:
      return error.message || 'An unknown authentication error occurred.'
  }
}

export function AuthErrorHandler({ error, className }: AuthErrorHandlerProps) {
  const { refreshProfile, signOut, clearError } = useAuth()
  
  const config = errorConfig[error.code as keyof typeof errorConfig] || {
    icon: AlertCircle,
    title: 'Authentication Error',
    severity: 'destructive' as const,
    canRetry: true,
    showSignOut: true
  }

  const Icon = config.icon

  const handleRetry = async () => {
    clearError()
    await refreshProfile()
  }

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <Alert variant={config.severity} className={className}>
      <Icon className="h-4 w-4" />
      <AlertTitle>{config.title}</AlertTitle>
      <AlertDescription className="mt-2">
        <p>{getErrorMessage(error)}</p>
        
        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && error.details && (
          <details className="mt-2 text-xs">
            <summary className="cursor-pointer">Debug Details</summary>
            <pre className="mt-1 whitespace-pre-wrap">
              {JSON.stringify(error.details, null, 2)}
            </pre>
          </details>
        )}
        
        {/* Action buttons */}
        <div className="flex gap-2 mt-3">
          {config.canRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
          
          {config.showSignOut && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="text-xs"
            >
              <LogOut className="h-3 w-3 mr-1" />
              Sign Out
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={clearError}
            className="text-xs"
          >
            <XCircle className="h-3 w-3 mr-1" />
            Dismiss
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}

/**
 * Hook to use auth error handler in components
 */
export function useAuthErrorHandler() {
  const { error } = useAuth()
  
  const AuthErrorComponent = error ? (
    <AuthErrorHandler error={error} className="mb-4" />
  ) : null
  
  return {
    error,
    AuthErrorComponent,
    hasError: !!error
  }
}
