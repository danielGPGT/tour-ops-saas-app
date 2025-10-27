-- ============================================================================
-- Migration: Add User Invitations System
-- ============================================================================
-- This migration adds support for inviting users to organizations
-- Required for the signup flow that uses invitation tokens
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- Organization Invitations Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Invitation details
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'agent', -- owner | admin | agent | viewer
  token TEXT NOT NULL UNIQUE,
  
  -- Invitation status
  status VARCHAR(20) DEFAULT 'pending', -- pending | accepted | expired | revoked
  
  -- Meta info
  invited_by UUID REFERENCES users(id),
  invited_by_name VARCHAR(255),
  
  -- Expiry
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invitations_org ON organization_invitations(organization_id);
CREATE INDEX idx_invitations_token ON organization_invitations(token);
CREATE INDEX idx_invitations_email ON organization_invitations(email);
CREATE INDEX idx_invitations_status ON organization_invitations(status);

-- ----------------------------------------------------------------------------
-- Function: Validate Invitation Token
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION validate_invitation_token(p_token TEXT)
RETURNS TABLE (
  invitation_id UUID,
  organization_id UUID,
  organization_name TEXT,
  organization_slug TEXT,
  email TEXT,
  role TEXT,
  is_valid BOOLEAN,
  error_message TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    inv.id,
    inv.organization_id,
    o.name,
    o.slug,
    inv.email,
    inv.role,
    CASE 
      WHEN inv.status = 'accepted' THEN FALSE
      WHEN inv.status = 'revoked' THEN FALSE
      WHEN inv.expires_at < NOW() THEN FALSE
      ELSE TRUE
    END as is_valid,
    CASE 
      WHEN inv.status = 'accepted' THEN 'This invitation has already been accepted'
      WHEN inv.status = 'revoked' THEN 'This invitation has been revoked'
      WHEN inv.expires_at < NOW() THEN 'This invitation has expired'
      ELSE NULL
    END as error_message
  FROM organization_invitations inv
  JOIN organizations o ON inv.organization_id = o.id
  WHERE inv.token = p_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- Function: Accept Invitation
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION accept_invitation(
  p_token TEXT,
  p_auth_user_id UUID,
  p_first_name VARCHAR(100),
  p_last_name VARCHAR(100)
)
RETURNS JSONB AS $$
DECLARE
  v_invitation RECORD;
  v_user_id UUID;
BEGIN
  -- Get invitation details
  SELECT * INTO v_invitation
  FROM organization_invitations
  WHERE token = p_token
  AND status = 'pending'
  AND expires_at > NOW();
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid or expired invitation token'
    );
  END IF;
  
  -- Create user in your custom users table
  INSERT INTO users (
    organization_id,
    email,
    first_name,
    last_name,
    role,
    is_active,
    email_verified
  ) VALUES (
    v_invitation.organization_id,
    v_invitation.email,
    p_first_name,
    p_last_name,
    v_invitation.role,
    true,
    false  -- Will be verified after they click email confirmation
  )
  RETURNING id INTO v_user_id;
  
  -- Mark invitation as accepted
  UPDATE organization_invitations
  SET 
    status = 'accepted',
    accepted_at = NOW()
  WHERE id = v_invitation.id;
  
  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'organization_id', v_invitation.organization_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- Function: Create Invitation
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_invitation(
  p_organization_id UUID,
  p_email VARCHAR(255),
  p_role VARCHAR(50),
  p_invited_by UUID,
  p_expires_days INTEGER DEFAULT 7
)
RETURNS TABLE (
  invitation_id UUID,
  signup_url TEXT
) AS $$
DECLARE
  v_token TEXT;
  v_invitation_id UUID;
  v_invited_by_name VARCHAR(255);
  v_app_url TEXT := current_setting('app.base_url', true);
BEGIN
  -- Generate secure token
  v_token := encode(gen_random_bytes(32), 'base64');
  
  -- Get inviter name
  SELECT first_name || ' ' || last_name INTO v_invited_by_name
  FROM users
  WHERE id = p_invited_by;
  
  -- Create invitation
  INSERT INTO organization_invitations (
    organization_id,
    email,
    role,
    token,
    invited_by,
    invited_by_name,
    expires_at,
    status
  ) VALUES (
    p_organization_id,
    p_email,
    p_role,
    v_token,
    p_invited_by,
    v_invited_by_name,
    NOW() + (p_expires_days || ' days')::INTERVAL,
    'pending'
  )
  RETURNING id INTO v_invitation_id;
  
  -- Return invitation details
  RETURN QUERY
  SELECT 
    v_invitation_id,
    COALESCE(v_app_url, 'http://localhost:3000') || '/signup?token=' || v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- Function: Get User Profile
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_user_profile()
RETURNS TABLE (
  id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  role TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  organization JSONB
) AS $$
DECLARE
  v_org_id UUID;
BEGIN
  -- Get user's organization_id from auth.uid
  -- Note: You'll need to map Supabase auth.uid to your users table
  -- For now, this is a placeholder that needs to be implemented based on your auth setup
  SELECT u.organization_id INTO v_org_id
  FROM users u
  -- WHERE u.?? = auth.uid()  -- You'll need to add a field linking to Supabase auth
  LIMIT 1;
  
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.role,
    u.is_active,
    u.created_at,
    u.updated_at,
    jsonb_build_object(
      'id', o.id,
      'name', o.name,
      'slug', o.slug,
      'code', o.code
    ) as organization
  FROM users u
  JOIN organizations o ON u.organization_id = o.id
  WHERE u.id = v_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_profile() IS '⚠️ Placeholder - needs to be updated to map Supabase auth.uid to users table';

COMMIT;
