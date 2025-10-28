import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { AuthSession } from './server-session'

export interface ApiContext {
  session: AuthSession
  organizationId: string
  userId: string
  userRole: string
}

/**
 * API Route wrapper that ensures authentication and provides session context
 */
export function withAuth<T extends Record<string, any> = {}>(
  handler: (request: NextRequest, context: ApiContext & T) => Promise<Response>
) {
  return async (request: NextRequest, additionalContext?: T): Promise<Response> => {
    try {
      const supabase = await createClient()
      
      // Get the authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Authentication required',
            code: 'UNAUTHORIZED'
          },
          { status: 401 }
        )
      }

      // Get user profile with organization info
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select(`
          id,
          organization_id,
          role,
          is_active,
          email_verified,
          organization:organizations!inner(
            id,
            name,
            is_active
          )
        `)
        .eq('auth_id', user.id)
        .eq('is_active', true)
        .single()

      if (profileError || !profile) {
        console.error('Profile error for user:', user.id, profileError)
        return NextResponse.json(
          { 
            success: false, 
            error: 'User profile not found or inactive',
            code: 'PROFILE_NOT_FOUND'
          },
          { status: 403 }
        )
      }

      // Check if organization is active
      if (!profile.organization?.is_active) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Organization is inactive',
            code: 'ORG_INACTIVE'
          },
          { status: 403 }
        )
      }

      const session: AuthSession = {
        user,
        organizationId: profile.organization_id,
        userId: profile.id,
        userRole: profile.role || 'agent',
        isActive: profile.is_active
      }

      const context: ApiContext = {
        session,
        organizationId: profile.organization_id,
        userId: profile.id,
        userRole: profile.role || 'agent'
      }

      // Merge with additional context if provided
      const fullContext = additionalContext 
        ? { ...context, ...additionalContext }
        : context

      return await handler(request, fullContext as ApiContext & T)

    } catch (error) {
      console.error('API Auth middleware error:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Internal server error',
          code: 'INTERNAL_ERROR'
        },
        { status: 500 }
      )
    }
  }
}

/**
 * API wrapper that requires specific role
 */
export function withRole<T extends Record<string, any> = {}>(
  requiredRole: string | string[],
  handler: (request: NextRequest, context: ApiContext & T) => Promise<Response>
) {
  return withAuth<T>(async (request, context) => {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    
    if (!roles.includes(context.userRole)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Insufficient permissions. Required role: ${roles.join(' or ')}`,
          code: 'INSUFFICIENT_PERMISSIONS'
        },
        { status: 403 }
      )
    }

    return await handler(request, context)
  })
}

/**
 * Standardized success response
 */
export function successResponse(data: any, message?: string, status: number = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      message
    },
    { status }
  )
}

/**
 * Standardized error response
 */
export function errorResponse(
  error: string, 
  code?: string, 
  status: number = 400,
  details?: any
) {
  return NextResponse.json(
    {
      success: false,
      error,
      code,
      details
    },
    { status }
  )
}

/**
 * Validate request body against Zod schema
 */
export async function validateRequestBody<T>(
  request: NextRequest,
  schema: any
): Promise<{ data: T | null; error: Response | null }> {
  try {
    const body = await request.json()
    const result = schema.safeParse(body)

    if (!result.success) {
      return {
        data: null,
        error: errorResponse(
          'Invalid request data',
          'VALIDATION_ERROR',
          400,
          result.error.errors
        )
      }
    }

    return { data: result.data, error: null }
  } catch (error) {
    return {
      data: null,
      error: errorResponse(
        'Invalid JSON in request body',
        'INVALID_JSON',
        400
      )
    }
  }
}
