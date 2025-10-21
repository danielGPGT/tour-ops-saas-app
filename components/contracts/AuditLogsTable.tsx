'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Activity,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface AuditLog {
  id: string
  user_id: string | null
  entity_type: string
  entity_id: string
  action: string
  old_values: Record<string, any> | null
  new_values: Record<string, any> | null
  changed_fields: string[]
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

interface AuditLogsTableProps {
  entityType?: string
  entityId?: bigint
  className?: string
}

export function AuditLogsTable({ entityType, entityId, className }: AuditLogsTableProps) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [expandedLog, setExpandedLog] = useState<string | null>(null)

  const pageSize = 20

  useEffect(() => {
    fetchLogs()
  }, [entityType, entityId, currentPage, searchTerm, actionFilter])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        ...(entityType && { entityType }),
        ...(entityId && { entityId: entityId.toString() }),
        ...(searchTerm && { search: searchTerm }),
        ...(actionFilter !== 'all' && { action: actionFilter }),
      })

      const response = await fetch(`/api/audit-logs?${params}`)
      const data = await response.json()
      
      setLogs(data.logs || [])
      setTotalPages(Math.ceil((data.total || 0) / pageSize))
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create': return 'bg-green-100 text-green-800 border-green-200'
      case 'update': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'delete': return 'bg-red-100 text-red-800 border-red-200'
      case 'status_change': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'duplicate': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'bulk_update': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'bulk_delete': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getEntityTypeIcon = (entityType: string) => {
    switch (entityType) {
      case 'contract': return '📄'
      case 'contract_version': return '📋'
      case 'contract_deadline': return '⏰'
      default: return '📝'
    }
  }

  const formatChangedFields = (fields: string[]) => {
    if (fields.length === 0) return 'No fields changed'
    if (fields.length <= 3) return fields.join(', ')
    return `${fields.slice(0, 3).join(', ')} and ${fields.length - 3} more`
  }

  const toggleExpanded = (logId: string) => {
    setExpandedLog(expandedLog === logId ? null : logId)
  }

  const renderValueDiff = (oldValues: Record<string, any> | null, newValues: Record<string, any> | null, changedFields: string[]) => {
    if (!oldValues && !newValues) return null

    return (
      <div className="space-y-2">
        {changedFields.map(field => (
          <div key={field} className="border rounded p-2 bg-muted/50">
            <div className="font-medium text-sm">{field}</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-red-600 font-medium">Before:</div>
                <div className="truncate">{oldValues?.[field]?.toString() || 'N/A'}</div>
              </div>
              <div>
                <div className="text-green-600 font-medium">After:</div>
                <div className="truncate">{newValues?.[field]?.toString() || 'N/A'}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
          <CardDescription>Loading audit trail...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Activity className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Audit Logs
        </CardTitle>
        <CardDescription>
          Complete audit trail of all changes and activities
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="create">Create</SelectItem>
              <SelectItem value="update">Update</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
              <SelectItem value="status_change">Status Change</SelectItem>
              <SelectItem value="duplicate">Duplicate</SelectItem>
              <SelectItem value="bulk_update">Bulk Update</SelectItem>
              <SelectItem value="bulk_delete">Bulk Delete</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Changes</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No audit logs found
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge className={cn("px-2 py-1", getActionColor(log.action))}>
                        {log.action.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{getEntityTypeIcon(log.entity_type)}</span>
                        <span className="text-sm font-medium">
                          {log.entity_type.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          #{log.entity_id}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          {log.user_id ? `User ${log.user_id.slice(0, 8)}` : 'System'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatChangedFields(log.changed_fields)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(log.id)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Expanded Details */}
        {expandedLog && (
          <div className="mt-4 border rounded-lg p-4 bg-muted/50">
            {(() => {
              const log = logs.find(l => l.id === expandedLog)
              if (!log) return null

              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Change Details</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedLog(null)}
                    >
                      Close
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-sm mb-2">Metadata</h5>
                      <div className="space-y-1 text-sm">
                        <div><strong>IP:</strong> {log.ip_address || 'N/A'}</div>
                        <div><strong>User Agent:</strong> {log.user_agent ? log.user_agent.slice(0, 50) + '...' : 'N/A'}</div>
                        <div><strong>Changed Fields:</strong> {log.changed_fields.length}</div>
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-sm mb-2">Value Changes</h5>
                      {renderValueDiff(log.old_values, log.new_values, log.changed_fields)}
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
