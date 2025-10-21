-- Create sequence for audit_logs first
CREATE SEQUENCE public.audit_logs_id_seq
  AS bigint
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;

-- Add audit logs table for tracking all changes
CREATE TABLE public.audit_logs (
  id bigint NOT NULL DEFAULT nextval('audit_logs_id_seq'::regclass),
  org_id bigint NOT NULL,
  user_id text, -- Can be null for system operations
  entity_type text NOT NULL, -- 'contract', 'contract_version', 'contract_deadline', etc.
  entity_id bigint NOT NULL,
  action text NOT NULL, -- 'create', 'update', 'delete', 'status_change', etc.
  old_values jsonb,
  new_values jsonb,
  changed_fields text[], -- Array of field names that changed
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id)
);

-- Create indexes for better performance
CREATE INDEX idx_audit_logs_org_id ON public.audit_logs(org_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);

-- Add comments for documentation
COMMENT ON TABLE public.audit_logs IS 'Audit trail for all entity changes';
COMMENT ON COLUMN public.audit_logs.entity_type IS 'Type of entity being audited (contract, contract_version, etc.)';
COMMENT ON COLUMN public.audit_logs.entity_id IS 'ID of the entity being audited';
COMMENT ON COLUMN public.audit_logs.action IS 'Action performed (create, update, delete, status_change)';
COMMENT ON COLUMN public.audit_logs.old_values IS 'Previous values before change (JSON)';
COMMENT ON COLUMN public.audit_logs.new_values IS 'New values after change (JSON)';
COMMENT ON COLUMN public.audit_logs.changed_fields IS 'Array of field names that were modified';
