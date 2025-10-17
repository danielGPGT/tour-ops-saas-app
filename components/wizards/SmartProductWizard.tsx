'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CheckCircle2, ChevronRight, ChevronLeft, Plus, Building2, Calendar, Car, Activity, Utensils, Wrench, Ticket, MoreHorizontal, ArrowRight, Check, ChevronsUpDown, Trash2, X } from 'lucide-react'
import { getProductTypeConfig, getAvailableProductTypes } from '@/lib/config/product-form-config'
import { getAttributesForProductType, type AttributeField } from '@/lib/config/product-type-attributes'
import { cn } from '@/lib/utils'
import { ImageUpload, type ImageFile } from '@/components/ui/image-upload'
import { AmenitiesSelector } from '@/components/ui/amenities-selector'
import { SearchableCombobox } from '@/components/ui/searchable-combobox'
import { toast } from 'sonner'

// Icons mapping for product types
const productTypeIcons = {
  accommodation: Building2,
  event: Calendar,
  transfer: Car,
  activity: Activity,
  meal: Utensils,
  equipment: Wrench,
  pass: Ticket,
  ancillary: Plus,
  other: MoreHorizontal
}

const STEPS = [
  { id: 'type', title: 'Product Type', description: 'Choose the type of product' },
  { id: 'collection', title: 'Collection', description: 'Select or create a collection' },
  { id: 'details', title: 'Product Details', description: 'Configure product information' }
]

// For editing, we skip the product type step and reorder for better UX
const getStepsForMode = (isEditing: boolean) => {
  if (isEditing) {
    return [
      { id: 'details', title: 'Product Details', description: 'Configure product information' },
      { id: 'collection', title: 'Collection (Optional)', description: 'Change collection if needed' }
    ]
  }
  return STEPS
}

interface WizardData {
  // Step 1: Product Type
  productType: string
  
  // Step 2: Collection
  collectionId?: number
  collectionName?: string
  createNewCollection: boolean
  newCollectionName?: string
  newCollectionType?: string
  newCollectionLocation?: string
  newCollectionDescription?: string
  
  // Step 3: Product Details
  productName: string
  productDescription: string
  productStatus: string
  productAttributes: Record<string, any>
  productImages: ImageFile[]
}

interface SmartProductWizardProps {
  isOpen: boolean
  onCancel: () => void
  onComplete: (data: WizardData) => void
  preselectedCollection?: {
    id: number
    name: string
    type: string
  }
  preselectedProductType?: string
  existingVariant?: {
    id: number
    name: string
    description?: string
    status: string
    attributes: any
    images?: any[]
    product_id: number
    products: {
      id: number
      name: string
      type: string
    }
  }
}

export function SmartProductWizard({
  isOpen,
  onCancel,
  onComplete,
  preselectedCollection,
  preselectedProductType,
  existingVariant
}: SmartProductWizardProps) {
  const isEditing = !!existingVariant
  const steps = getStepsForMode(isEditing)
  const [currentStep, setCurrentStep] = useState(0)
  const [data, setData] = useState<WizardData>(() => {
    // Debug: Log the existing variant data
    console.log('SmartProductWizard - existingVariant:', existingVariant)
    console.log('SmartProductWariant - preselectedProductType:', preselectedProductType)
    console.log('SmartProductWizard - preselectedCollection:', preselectedCollection)
    
    return {
      productType: existingVariant?.products?.type || preselectedProductType || '',
      collectionId: existingVariant?.product_id || preselectedCollection?.id,
      collectionName: existingVariant?.products?.name || preselectedCollection?.name,
      createNewCollection: false,
      newCollectionType: existingVariant?.products?.type || preselectedCollection?.type || preselectedProductType || '',
      productName: existingVariant?.name || '',
      productDescription: existingVariant?.description || '',
      productStatus: existingVariant?.status || 'active',
      productAttributes: existingVariant?.attributes || {},
      productImages: existingVariant?.images || []
    }
  })

  const [collections, setCollections] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Load data on mount
  useEffect(() => {
    if (isOpen) {
      loadCollections()
    }
  }, [isOpen])

  // Ensure product type is set when editing
  useEffect(() => {
    if (isEditing && existingVariant?.products?.type && !data.productType) {
      updateData({ productType: existingVariant.products.type })
    }
  }, [isEditing, existingVariant, data.productType])

  // Update data when existingVariant changes (for editing)
  useEffect(() => {
    if (isEditing && existingVariant) {
      setData({
        productType: existingVariant.products?.type || '',
        collectionId: existingVariant.product_id,
        collectionName: existingVariant.products?.name || '',
        createNewCollection: false,
        newCollectionType: existingVariant.products?.type || '',
        productName: existingVariant.name || '',
        productDescription: existingVariant.description || '',
        productStatus: existingVariant.status || 'active',
        productAttributes: existingVariant.attributes || {},
        productImages: existingVariant.images || []
      })
    }
  }, [isEditing, existingVariant])

  const loadCollections = async () => {
    try {
      const response = await fetch('/api/products')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // Convert string IDs to numbers for consistency
          const collectionsData = (result.data || []).map((collection: any) => ({
            ...collection,
            id: parseInt(collection.id)
          }))
          setCollections(collectionsData)
        } else {
          console.error('API error:', result.error)
          setCollections([])
        }
      } else {
        console.error('Failed to fetch collections:', response.statusText)
        setCollections([])
      }
    } catch (error) {
      console.error('Failed to load collections:', error)
      setCollections([])
    }
  }

  const updateData = (updates: Partial<WizardData>) => {
    setData(prev => ({ ...prev, ...updates }))
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    setLoading(true)
    try {
      let finalData = { ...data }
      
      // If creating a new collection, create it first
      if (data.createNewCollection && data.newCollectionName && data.newCollectionType) {
        const response = await fetch('/api/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: data.newCollectionName,
            type: data.newCollectionType
          })
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            // Update the data with the newly created collection
            finalData = {
              ...data,
              collectionId: parseInt(result.data.id),
              collectionName: result.data.name
            }
          } else {
            throw new Error(result.error || 'Failed to create collection')
          }
        } else {
          throw new Error('Failed to create collection')
        }
      }

      // Now create or update the product variant
      const isEditing = !!existingVariant
      const collectionId = finalData.collectionId || (isEditing ? existingVariant.product_id : null)
      
      if (collectionId && finalData.productName) {
        const endpoint = isEditing ? `/api/products/variants/${existingVariant.id}` : '/api/products/smart-create'
        const method = isEditing ? 'PUT' : 'POST'
        
        const variantResponse = await fetch(endpoint, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productId: collectionId,
            productName: finalData.productName,
            productDescription: finalData.productDescription,
            productStatus: finalData.productStatus,
            productAttributes: finalData.productAttributes,
            productImages: finalData.productImages
          })
        })

        if (variantResponse.ok) {
          const variantResult = await variantResponse.json()
          if (variantResult.success) {
            // Show success toast
            const actionText = isEditing ? 'updated' : 'created'
            const descriptionText = isEditing 
              ? `"${finalData.productName}" has been updated in ${finalData.collectionName}`
              : `"${finalData.productName}" has been added to ${finalData.collectionName}`
              
            toast.success(`Product ${actionText.charAt(0).toUpperCase() + actionText.slice(1)} Successfully!`, {
              description: descriptionText,
              action: {
                label: 'View Product',
                onClick: () => {
                  // You can navigate to the product page here if needed
                  console.log('Navigate to product:', variantResult.data.id)
                }
              }
            })
            
            // Call the onComplete callback with the final data
            await onComplete(finalData)
          } else {
            throw new Error(variantResult.error || `Failed to ${isEditing ? 'update' : 'create'} product`)
          }
        } else {
          const errorResult = await variantResponse.json()
          throw new Error(errorResult.error || `Failed to ${isEditing ? 'update' : 'create'} product`)
        }
      } else {
        throw new Error(`Missing required data for product ${isEditing ? 'update' : 'creation'}`)
      }
    } catch (error) {
      console.error('Error in handleComplete:', error)
      // Show error message to user
      const errorMessage = error instanceof Error ? error.message : 'Failed to create product'
      
      // Check if it's a duplicate name error and show a specific toast
      if (errorMessage.includes('already exists for this collection')) {
        toast.error('Product Name Already Exists', {
          description: errorMessage,
          action: {
            label: 'Choose Different Name',
            onClick: () => {
              // Focus on the product name input field
              const nameInput = document.querySelector('input[name="productName"]') as HTMLInputElement
              if (nameInput) {
                nameInput.focus()
                nameInput.select()
              }
            }
          }
        })
      } else {
        toast.error('Failed to Create Product', {
          description: errorMessage
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const canProceed = () => {
    const currentStepData = steps[currentStep]
    if (!currentStepData) return false

    switch (currentStepData.id) {
      case 'type': // Product Type
        return data.productType
      case 'collection': // Collection
        // When editing, collection is optional - allow proceeding even if not set
        if (isEditing) return true
        return data.createNewCollection 
          ? (data.newCollectionName && data.newCollectionType)
          : data.collectionId
      case 'details': // Product Details
        return data.productName && data.productStatus
      default:
        return false
    }
  }

  const renderStep = () => {
    const currentStepData = steps[currentStep]
    if (!currentStepData) return null

    switch (currentStepData.id) {
      case 'type':
        return <ProductTypeStep data={data} updateData={updateData} />
      case 'collection':
        return <CollectionStep data={data} updateData={updateData} collections={collections} />
      case 'details':
        return <ProductDetailsStep data={data} updateData={updateData} />
      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="w-full !max-w-7xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-xl font-semibold">
            {existingVariant ? 'Edit Product' : 'Smart Product Wizard'}
          </DialogTitle>
          <DialogDescription>
            {existingVariant ? 'Update your product settings' : 'Create a new product with guided setup'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-[600px]">
          {/* Sidebar */}
          <div className="w-64 bg-muted/30 p-6 border-r border-border">
            <div className="space-y-2">
              {steps.map((step, index) => {
                const isActive = index === currentStep
                const isCompleted = index < currentStep
                const Icon = step.id === 'type' ? productTypeIcons[data.productType as keyof typeof productTypeIcons] || MoreHorizontal : CheckCircle2

                return (
                  <div
                    key={step.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                      isActive ? 'bg-primary/10 border border-primary/20' : ''
                    }`}
                  >
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      isCompleted ? 'bg-primary text-primary-foreground' : 
                      isActive ? 'bg-primary text-primary-foreground' : 
                      'bg-muted text-muted-foreground'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-foreground'}`}>
                        {step.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {renderStep()}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border bg-muted/30">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            {currentStep === steps.length - 1 ? (
              <Button
                onClick={handleComplete}
                disabled={!canProceed() || loading}
              >
                {loading ? (existingVariant ? 'Updating...' : 'Creating...') : (existingVariant ? 'Update Product' : 'Create Product')}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={nextStep}
                disabled={!canProceed()}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Step Components
function ProductTypeStep({ data, updateData }: { data: WizardData; updateData: (updates: Partial<WizardData>) => void }) {
  const productTypes = getAvailableProductTypes()

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2 text-foreground">Choose Product Type</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Select the type of product you want to create. This will determine the available configuration options.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {productTypes.map((type) => {
          const Icon = productTypeIcons[type.value as keyof typeof productTypeIcons] || MoreHorizontal
          const isSelected = data.productType === type.value

          return (
            <Card
              key={type.value}
              className={`cursor-pointer transition-all hover:shadow-md hover:border-primary/50 ${
                isSelected ? 'ring-2 ring-primary bg-primary/5 border-primary' : 'border-border'
              }`}
              onClick={() => updateData({ 
                productType: type.value,
                newCollectionType: type.value 
              })}
            >
              <CardContent className="">
                <div className="flex items-start space-x-3">
                  <Icon className={`h-6 w-6 mt-1 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div className="flex-1">
                    <h4 className="font-medium text-sm text-foreground">{type.label}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {data.productType && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary">
                Selected: {productTypes.find(t => t.value === data.productType)?.label}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function CollectionStep({ 
  data, 
  updateData, 
  collections 
}: { 
  data: WizardData
  updateData: (updates: Partial<WizardData>) => void
  collections: any[]
}) {
  const productTypeConfig = getProductTypeConfig(data.productType)
  const [collectionOpen, setCollectionOpen] = useState(false)
  

  const filteredCollections = collections.filter(collection => collection.type === data.productType)
  const selectedCollection = collections.find(c => c.id === data.collectionId)

  return (
    <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2 text-foreground">Collection Assignment</h3>
          <p className="text-sm text-muted-foreground mb-6">
            {data.collectionId ? 
              `Currently assigned to: ${data.collectionName || 'Unknown Collection'}. You can change this if needed.` :
              `Choose an existing collection or create a new one for this ${data.productType} product.`
            }
          </p>
        </div>

      {/* Toggle between existing and new collection */}
      <div className="flex space-x-4 mb-6">
        <Button
          variant={!data.createNewCollection ? 'default' : 'outline'}
          onClick={() => updateData({ createNewCollection: false })}
          className="flex-1"
        >
          Use Existing Collection
        </Button>
        <Button
          variant={data.createNewCollection ? 'default' : 'outline'}
          onClick={() => updateData({ createNewCollection: true })}
          className="flex-1"
        >
          Create New Collection
        </Button>
      </div>

      {!data.createNewCollection ? (
        // Existing Collections - Searchable Combobox
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Select Collection</Label>
            <Popover open={collectionOpen} onOpenChange={setCollectionOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={collectionOpen}
                  className="w-full justify-between"
                >
                  {selectedCollection ? selectedCollection.name : (data.collectionName || "Select a collection...")}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search collections..." />
                  <CommandList>
                    <CommandEmpty>No collections found.</CommandEmpty>
                    <CommandGroup>
                      {filteredCollections.map((collection) => (
                        <CommandItem
                          key={collection.id}
                          value={collection.name}
                          onSelect={() => {
                            updateData({ 
                              collectionId: collection.id, 
                              collectionName: collection.name 
                            })
                            setCollectionOpen(false)
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              data.collectionId === collection.id ? "opacity-100" : "opacity-0"
                            }`}
                          />
                          <div className="flex-1">
                            <div className="font-medium">{collection.name}</div>
                            <div className="text-xs text-muted-foreground capitalize">
                              {collection.type} Collection
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          
          {filteredCollections.length === 0 && (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">No existing {data.productType} collections found.</p>
              <Button
                variant="outline"
                onClick={() => updateData({ createNewCollection: true })}
              >
                Create New Collection
              </Button>
            </div>
          )}
        </div>
      ) : (
        // New Collection Form
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">New Collection Details</CardTitle>
              <CardDescription>
                Create a new {data.productType} collection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="collection-name">Collection Name</Label>
                <Input
                  id="collection-name"
                  placeholder="e.g., Fairmont Palm Dubai, F1 Abu Dhabi GP"
                  value={data.newCollectionName || ''}
                  onChange={(e) => updateData({ newCollectionName: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="collection-type">Collection Type</Label>
                <SearchableCombobox
                  value={data.newCollectionType || data.productType}
                  onValueChange={(value) => updateData({ newCollectionType: value })}
                  options={[data.productType]}
                  placeholder="Select collection type..."
                  searchPlaceholder="Search collection types..."
                  emptyMessage="No collection types found."
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="collection-location">Location (Optional)</Label>
                <Input
                  id="collection-location"
                  placeholder="e.g., Dubai, UAE"
                  value={data.newCollectionLocation || ''}
                  onChange={(e) => updateData({ newCollectionLocation: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="collection-description">Description (Optional)</Label>
                <Textarea
                  id="collection-description"
                  rows={3}
                  placeholder="Brief description of this collection..."
                  value={data.newCollectionDescription || ''}
                  onChange={(e) => updateData({ newCollectionDescription: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {data.collectionId && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary">
                Selected Collection: {data.collectionName}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ProductDetailsStep({ data, updateData }: { data: WizardData; updateData: (updates: Partial<WizardData>) => void }) {
  const attributes = getAttributesForProductType(data.productType)
  
  const updateAttribute = (key: string, value: any) => {
    updateData({
      productAttributes: {
        ...data.productAttributes,
        [key]: value
      }
    })
  }

  const renderAttributeField = (attribute: AttributeField) => {
    const value = data.productAttributes[attribute.key]
    const fieldId = `attribute-${attribute.key}`

    switch (attribute.type) {
      case 'text':
        return (
          <Input
            id={fieldId}
            placeholder={attribute.placeholder || `Enter ${attribute.label.toLowerCase()}`}
            value={value || ''}
            onChange={(e) => updateAttribute(attribute.key, e.target.value)}
            className="h-7 text-xs"
          />
        )
      
      case 'number':
        return (
          <Input
            id={fieldId}
            type="number"
            placeholder={attribute.placeholder || `Enter ${attribute.label.toLowerCase()}`}
            value={value || ''}
            min={attribute.validation?.min}
            max={attribute.validation?.max}
            onChange={(e) => updateAttribute(attribute.key, e.target.value ? Number(e.target.value) : '')}
            className="h-7 text-xs"
          />
        )
      
      case 'textarea':
        return (
          <Textarea
            id={fieldId}
            rows={2}
            placeholder={attribute.placeholder || `Enter ${attribute.label.toLowerCase()}`}
            value={value || ''}
            onChange={(e) => updateAttribute(attribute.key, e.target.value)}
            className="text-xs"
          />
        )
      
      case 'select':
        return (
          <SearchableCombobox
            value={value || ''}
            onValueChange={(newValue) => updateAttribute(attribute.key, newValue)}
            options={attribute.options || []}
            placeholder={`Select ${attribute.label.toLowerCase()}`}
            searchPlaceholder={`Search ${attribute.label.toLowerCase()}...`}
            emptyMessage={`No ${attribute.label.toLowerCase()} found.`}
            className="w-full"
          />
        )
      
      case 'multiselect':
        const selectedValues = Array.isArray(value) ? value : []
        const toggleOption = (option: string) => {
          const newValues = selectedValues.includes(option)
            ? selectedValues.filter(v => v !== option)
            : [...selectedValues, option]
          updateAttribute(attribute.key, newValues)
        }
        
        return (
          <div className="space-y-1">
            <div className="flex flex-wrap gap-1">
              {selectedValues.map((option) => (
                <Badge key={option} variant="secondary" className="cursor-pointer text-xs px-1 py-0" onClick={() => toggleOption(option)}>
                  {option}
                  <X className="w-2 h-2 ml-1" />
                </Badge>
              ))}
            </div>
            <SearchableCombobox
              value=""
              onValueChange={toggleOption}
              options={attribute.options?.filter(option => !selectedValues.includes(option)) || []}
              placeholder="Add option..."
              searchPlaceholder="Search options..."
              emptyMessage="No options available."
              className="w-full"
            />
          </div>
        )
      
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={fieldId}
              checked={Boolean(value)}
              onCheckedChange={(checked) => updateAttribute(attribute.key, checked)}
              className="h-3 w-3"
            />
            <Label htmlFor={fieldId} className="text-xs">
              {attribute.placeholder || attribute.label}
            </Label>
          </div>
        )
      
      case 'toggle':
        return (
          <div className="flex items-center justify-between">
            <Label htmlFor={fieldId} className="text-xs">
              {attribute.label}
            </Label>
            <Switch
              id={fieldId}
              checked={Boolean(value)}
              onCheckedChange={(checked) => updateAttribute(attribute.key, checked)}
              className="h-4 w-7"
            />
          </div>
        )
      
      case 'amenities':
        return (
          <AmenitiesSelector
            selectedAmenities={Array.isArray(value) ? value : []}
            onAmenitiesChange={(amenities) => updateAttribute(attribute.key, amenities)}
            availableAmenities={attribute.options || []}
            maxAmenities={20}
          />
        )
      
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold mb-1 text-foreground">Product Details</h3>
        <p className="text-xs text-muted-foreground">
          Configure the basic information and attributes for your {data.productType} product.
        </p>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="product-name" className="text-xs font-medium">Product Name *</Label>
              <Input
                id="product-name"
                name="productName"
                placeholder="e.g., Standard Double Room"
                value={data.productName}
                onChange={(e) => updateData({ productName: e.target.value })}
                className="h-7 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="product-status" className="text-xs font-medium">Status *</Label>
              <SearchableCombobox
                value={data.productStatus}
                onValueChange={(value) => updateData({ productStatus: value })}
                options={['active', 'inactive', 'draft']}
                placeholder="Select status..."
                searchPlaceholder="Search status..."
                emptyMessage="No status found."
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="product-description" className="text-xs font-medium">Description</Label>
            <Textarea
              id="product-description"
              rows={2}
              placeholder="Describe this product..."
              value={data.productDescription}
              onChange={(e) => updateData({ productDescription: e.target.value })}
              className="text-xs"
            />
          </div>
        </CardContent>
      </Card>

              {/* Product Type Specific Attributes */}
              {attributes.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm capitalize">{data.productType} Details</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 gap-3">
                      {attributes.map((attribute) => (
                        <div key={attribute.key} className="space-y-1">
                          {attribute.type === 'toggle' ? (
                            renderAttributeField(attribute)
                          ) : attribute.type === 'amenities' ? (
                            <div className="col-span-2">
                              <Label htmlFor={`attribute-${attribute.key}`} className="text-xs font-medium flex items-center gap-1 mb-2">
                                {attribute.label}
                                {attribute.required && <span className="text-red-500">*</span>}
                              </Label>
                              {renderAttributeField(attribute)}
                            </div>
                          ) : (
                            <>
                              <Label htmlFor={`attribute-${attribute.key}`} className="text-xs font-medium flex items-center gap-1">
                                {attribute.label}
                                {attribute.required && <span className="text-red-500">*</span>}
                              </Label>
                              {renderAttributeField(attribute)}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Product Images */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Product Images</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Upload images to showcase your {data.productType} product
                  </p>
                </CardHeader>
                <CardContent className="pt-0">
                  <ImageUpload
                    images={data.productImages}
                    onChange={(images) => updateData({ productImages: images })}
                    maxImages={5}
                    maxSize={5}
                  />
                </CardContent>
              </Card>
    </div>
  )
}