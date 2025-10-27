'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, Building2, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type Organization = {
  id: string
  name: string
  slug: string
  code: string
  subscription_plan: string
  subscription_status: string
  is_active: boolean
  current_users: number
  max_users: number
  created_at: string
  user_count: number
  owner_email: string | null
}

export default function AdminOrganizationsPage() {
  const supabase = createClient()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    org_name: '',
    org_slug: '',
    org_code: '',
    admin_email: '',
    admin_first_name: '',
    admin_last_name: '',
    admin_password: '',
    subscription_plan: 'free'
  })

  useEffect(() => {
    loadOrganizations()
  }, [])

  const loadOrganizations = async () => {
    setLoading(true)
    try {
      // Try to use the RPC function if it exists
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_all_organizations')
      
      if (!rpcError && rpcData) {
        setOrganizations(rpcData || [])
        return
      }
      
      // Fallback: Query directly from tables if RPC doesn't exist yet
      console.log('RPC function not available, using direct query...')
      const { data, error } = await supabase
        .from('organizations')
        .select(`
          *,
          users!inner(email, role)
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      // Transform the data to match the expected format
      const transformed = (data || []).map((org: any) => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        code: org.code,
        subscription_plan: org.subscription_plan || 'free',
        subscription_status: org.subscription_status || 'active',
        is_active: org.is_active,
        current_users: org.current_users || 0,
        max_users: org.max_users || 5,
        created_at: org.created_at,
        user_count: org.users?.length || 0,
        owner_email: org.users?.find((u: any) => u.role === 'owner')?.email || null
      }))
      
      setOrganizations(transformed)
    } catch (error) {
      console.error('Error loading organizations:', error)
      toast.error('Failed to load organizations. Make sure you have applied the migration.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const { data, error } = await supabase.rpc('create_organization_with_admin', {
        p_org_name: formData.org_name,
        p_org_slug: formData.org_slug,
        p_org_code: formData.org_code,
        p_admin_email: formData.admin_email,
        p_admin_first_name: formData.admin_first_name,
        p_admin_last_name: formData.admin_last_name,
        p_admin_password: formData.admin_password, // TODO: Hash this!
        p_subscription_plan: formData.subscription_plan
      })

      if (error) throw error

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to create organization')
      }

      toast.success('Organization created successfully!')
      setShowCreateForm(false)
      setFormData({
        org_name: '',
        org_slug: '',
        org_code: '',
        admin_email: '',
        admin_first_name: '',
        admin_last_name: '',
        admin_password: '',
        subscription_plan: 'free'
      })
      loadOrganizations()
    } catch (error) {
      console.error('Error creating organization:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create organization')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleStatus = async (orgId: string) => {
    try {
      const { error } = await supabase.rpc('toggle_organization_status', {
        p_org_id: orgId
      })
      
      if (error) throw error
      
      toast.success('Organization status updated')
      loadOrganizations()
    } catch (error) {
      console.error('Error toggling status:', error)
      toast.error('Failed to update organization status')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Organizations</h1>
          <p className="text-gray-600 mt-1">Manage all organizations in the system</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Organization
        </Button>
      </div>

      {showCreateForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create New Organization</CardTitle>
            <CardDescription>
              Create a new organization with an initial admin user
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateOrganization} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="org_name">Organization Name *</Label>
                  <Input
                    id="org_name"
                    value={formData.org_name}
                    onChange={(e) => setFormData({ ...formData, org_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org_slug">Slug *</Label>
                  <Input
                    id="org_slug"
                    value={formData.org_slug}
                    onChange={(e) => setFormData({ ...formData, org_slug: e.target.value })}
                    required
                    placeholder="my-company"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org_code">Code *</Label>
                  <Input
                    id="org_code"
                    value={formData.org_code}
                    onChange={(e) => setFormData({ ...formData, org_code: e.target.value })}
                    required
                    placeholder="MC"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subscription_plan">Subscription Plan</Label>
                  <select
                    id="subscription_plan"
                    value={formData.subscription_plan}
                    onChange={(e) => setFormData({ ...formData, subscription_plan: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value="free">Free</option>
                    <option value="starter">Starter</option>
                    <option value="professional">Professional</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Admin User Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin_email">Email *</Label>
                    <Input
                      id="admin_email"
                      type="email"
                      value={formData.admin_email}
                      onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin_password">Password *</Label>
                    <Input
                      id="admin_password"
                      type="password"
                      value={formData.admin_password}
                      onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin_first_name">First Name *</Label>
                    <Input
                      id="admin_first_name"
                      value={formData.admin_first_name}
                      onChange={(e) => setFormData({ ...formData, admin_first_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin_last_name">Last Name *</Label>
                    <Input
                      id="admin_last_name"
                      value={formData.admin_last_name}
                      onChange={(e) => setFormData({ ...formData, admin_last_name: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create Organization
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Organizations ({organizations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations.map((org) => (
                <TableRow key={org.id}>
                  <TableCell className="font-medium">{org.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{org.subscription_plan}</Badge>
                  </TableCell>
                  <TableCell>
                    {org.is_active ? (
                      <Badge className="bg-green-500">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="mr-1 h-3 w-3" />
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {org.user_count} / {org.max_users}
                  </TableCell>
                  <TableCell>{org.owner_email || 'N/A'}</TableCell>
                  <TableCell>{new Date(org.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleStatus(org.id)}
                    >
                      {org.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
