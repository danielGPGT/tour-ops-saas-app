'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Search, Plus, Star, Clock, DollarSign, Users, FileText } from 'lucide-react'
import { CONTRACT_TEMPLATES, ContractTemplate } from '@/lib/contract-templates'

interface ContractTemplateSelectorProps {
  onSelectTemplate: (template: ContractTemplate) => void
  suppliers: any[]
  onClose?: () => void
}

export function ContractTemplateSelector({ 
  onSelectTemplate, 
  suppliers, 
  onClose 
}: ContractTemplateSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null)

  const categories = [
    { value: 'all', label: 'All Templates', icon: '📋' },
    { value: 'accommodation', label: 'Accommodation', icon: '🏨' },
    { value: 'activity', label: 'Activities', icon: '🎯' },
    { value: 'transfer', label: 'Transfers', icon: '🚌' },
    { value: 'event', label: 'Events', icon: '🎪' },
    { value: 'cruise', label: 'Cruises', icon: '🚢' },
    { value: 'package', label: 'Packages', icon: '📦' }
  ]

  const filteredTemplates = CONTRACT_TEMPLATES.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const handleTemplateSelect = (template: ContractTemplate) => {
    setSelectedTemplate(template)
  }

  const handleCreateFromTemplate = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate)
      onClose?.()
    }
  }

  const TemplateCard = ({ template }: { template: ContractTemplate }) => (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        selectedTemplate?.id === template.id 
          ? 'ring-2 ring-primary border-primary' 
          : 'hover:border-primary/50'
      }`}
      onClick={() => handleTemplateSelect(template)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{template.icon}</span>
            <div>
              <CardTitle className="text-sm font-medium">{template.name}</CardTitle>
              <CardDescription className="text-xs">{template.description}</CardDescription>
            </div>
          </div>
          <Badge className={template.color}>
            {template.contractType.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <DollarSign className="w-3 h-3" />
              <span>{template.defaultTerms.commissionRate || 0}% commission</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{template.defaultDeadlines.length} deadlines</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-1">
            {template.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {template.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{template.tags.length - 3} more
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const TemplatePreview = ({ template }: { template: ContractTemplate }) => (
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        <span className="text-3xl">{template.icon}</span>
        <div>
          <h3 className="text-lg font-semibold">{template.name}</h3>
          <p className="text-sm text-muted-foreground">{template.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium">Contract Type</Label>
          <Badge className={template.color}>
            {template.contractType.replace('_', ' ')}
          </Badge>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Commission Rate</Label>
          <div className="text-sm font-medium">{template.defaultTerms.commissionRate || 0}%</div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Currency</Label>
          <div className="text-sm font-medium">{template.defaultTerms.currency}</div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Payment Terms</Label>
          <div className="text-sm font-medium">{template.defaultTerms.paymentTerms}</div>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium">Default Deadlines</Label>
        <div className="space-y-1">
          {template.defaultDeadlines.map((deadline, index) => (
            <div key={index} className="flex items-center justify-between text-xs">
              <span>{deadline.name}</span>
              <span className="text-muted-foreground">{deadline.daysBeforeEvent} days before</span>
            </div>
          ))}
        </div>
      </div>

      {template.suggestedSuppliers && template.suggestedSuppliers.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs font-medium">Suggested Suppliers</Label>
          <div className="flex flex-wrap gap-1">
            {template.suggestedSuppliers.map(supplier => (
              <Badge key={supplier} variant="outline" className="text-xs">
                {supplier}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Choose a Contract Template</h2>
          <p className="text-sm text-muted-foreground">
            Start with a pre-built template or create from scratch
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onClose}>
          Cancel
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(category => (
              <SelectItem key={category.value} value={category.value}>
                <div className="flex items-center space-x-2">
                  <span>{category.icon}</span>
                  <span>{category.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Templates List */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">
            Templates ({filteredTemplates.length})
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredTemplates.map(template => (
              <TemplateCard key={template.id} template={template} />
            ))}
            {filteredTemplates.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No templates found</p>
                <p className="text-xs">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </div>

        {/* Template Preview */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Template Details</h3>
          {selectedTemplate ? (
            <div className="border rounded-lg p-4">
              <TemplatePreview template={selectedTemplate} />
              <div className="mt-6 pt-4 border-t">
                <Button 
                  onClick={handleCreateFromTemplate}
                  className="w-full"
                  disabled={!selectedTemplate}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Contract from Template
                </Button>
              </div>
            </div>
          ) : (
            <div className="border rounded-lg p-8 text-center text-muted-foreground">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Select a template to preview details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
