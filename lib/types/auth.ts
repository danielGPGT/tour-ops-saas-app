export interface InvitationData {
  invitation_id: string
  organization_id: string
  organization_name: string
  organization_slug: string
  email: string
  role: 'owner' | 'admin' | 'manager' | 'agent' | 'viewer'
  is_valid: boolean
  error_message: string | null
}

export interface SignupFormData {
  email: string
  password: string
  firstName: string
  lastName: string
}

export interface LoginFormData {
  email: string
  password: string
  rememberMe?: boolean
}

export interface ForgotPasswordFormData {
  email: string
}

export interface ChangePasswordFormData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface AuthError {
  message: string
  code?: string
}
