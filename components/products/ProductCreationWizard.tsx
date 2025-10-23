"use client"

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { productSchema, type ProductFormData } from '@/lib/validations/product.schema'
import { useProductTypes } from '@/lib/hooks/useProducts'
import { EventToast, showSuccess, showError } from '@/components/common/EventToast'
import { ImageUpload } from '@/components/common/ImageUpload'
import { 
  Star, 
  Calendar, 
  Clock, 
  Car, 
  Ticket, 
  MapPin, 
  Tag, 
  Image as ImageIcon,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Package,
  Building,
  Users,
  Utensils,
  Wifi,
  Waves,
  Dumbbell,
  Coffee
} from 'lucide-react'
import type { ProductType, ProductTypeCode } from '@/lib/types/product'

interface ProductCreationWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: ProductFormData) => void
  isLoading?: boolean
}

  const productTypeInfo = {
    accommodation: {
      icon: Star,
      title: 'Accommodation',
      description: 'Hotels, resorts, hostels, and other lodging options',
      color: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    event: {
      icon: Ticket,
      title: 'Event',
      description: 'Concerts, festivals, shows, and special events',
      color: 'bg-purple-100 text-purple-800 border-purple-200'
    },
    'tickets & passes': {
      icon: Ticket,
      title: 'Event',
      description: 'Events, concerts, festivals, and special occasions',
      color: 'bg-purple-100 text-purple-800 border-purple-200'
    },
    activity: {
      icon: Clock,
      title: 'Activity',
      description: 'Tours, excursions, and experiential activities',
      color: 'bg-green-100 text-green-800 border-green-200'
    },
    'activities & experiences': {
      icon: Clock,
      title: 'Activities & Experiences',
      description: 'Tours, excursions, and experiential activities',
      color: 'bg-green-100 text-green-800 border-green-200'
    },
    transfer: {
      icon: Car,
      title: 'Transfer',
      description: 'Transportation services between locations',
      color: 'bg-orange-100 text-orange-800 border-orange-200'
    },
    transfers: {
      icon: Car,
      title: 'Transfer',
      description: 'Transportation services between locations',
      color: 'bg-orange-100 text-orange-800 border-orange-200'
    },
    package: {
      icon: Package,
      title: 'Package',
      description: 'Multi-component packages combining multiple services',
      color: 'bg-pink-100 text-pink-800 border-pink-200'
    },
    'extras & add-ons': {
      icon: Package,
      title: 'Extras & Add-ons',
      description: 'Additional services and extras to enhance experiences',
      color: 'bg-indigo-100 text-indigo-800 border-indigo-200'
    }
  }

const amenityOptions = [
  { value: 'wifi', label: 'WiFi', icon: Wifi },
  { value: 'pool', label: 'Pool', icon: Waves },
  { value: 'gym', label: 'Gym', icon: Dumbbell },
  { value: 'restaurant', label: 'Restaurant', icon: Utensils },
  { value: 'coffee', label: 'Coffee Shop', icon: Coffee },
  { value: 'spa', label: 'Spa', icon: Star },
  { value: 'parking', label: 'Parking', icon: Car },
  { value: 'concierge', label: 'Concierge', icon: Users },
  { value: 'room_service', label: 'Room Service', icon: Package },
  { value: 'business_center', label: 'Business Center', icon: Building }
]

export function ProductCreationWizard({ open, onOpenChange, onSubmit, isLoading }: ProductCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedProductType, setSelectedProductType] = useState<ProductType | null>(null)
  const { data: productTypes } = useProductTypes()
  
  

  const form = useForm<any>({
    defaultValues: {
      product_type_id: '',
      name: '',
      code: '',
      description: '',
      location: {
        city: '',
        country: '',
        lat: undefined,
        lng: undefined,
        address: ''
      },
      attributes: {},
      tags: [],
      media: [],
      is_active: true
    }
  })

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      setCurrentStep(1)
      setSelectedProductType(null)
      form.reset({
        product_type_id: '',
        name: '',
        code: '',
        description: '',
        location: {
          city: '',
          country: '',
          lat: undefined,
          lng: undefined,
          address: ''
        },
        attributes: {},
        tags: [],
        media: [],
        is_active: true
      })
    }
  }, [open, form])

  const steps = [
    { id: 1, title: 'Product Type', description: 'Select the type of product' },
    { id: 2, title: 'Basic Info', description: 'Name, code, and description' },
    { id: 3, title: 'Location', description: 'Where is this product located?' },
    { id: 4, title: 'Attributes', description: 'Type-specific details' },
    { id: 5, title: 'Images', description: 'Add product images' },
    { id: 6, title: 'Review', description: 'Review and create' }
  ]

  const handleProductTypeSelect = (type: ProductType) => {
    setSelectedProductType(type)
    form.setValue('product_type_id', type.id)
    setCurrentStep(2)
  }

  // Validation functions for each step
  const validateStep1 = () => {
    if (!selectedProductType) {
      showError('Please select a product type to continue')
      return false
    }
    return true
  }

  const validateStep2 = () => {
    const name = form.getValues('name')
    const code = form.getValues('code')
    
    if (!name || name.trim().length < 3) {
      showError('Product name must be at least 3 characters long')
      return false
    }
    
    if (!code || code.trim().length < 2) {
      showError('Product code must be at least 2 characters long')
      return false
    }
    
    return true
  }

  const validateStep3 = () => {
    const city = form.getValues('location.city')
    const country = form.getValues('location.country')
    
    if (!city || city.trim().length === 0) {
      showError('City is required')
      return false
    }
    
    if (!country || country.trim().length === 0) {
      showError('Country is required')
      return false
    }
    
    return true
  }

  const validateStep4 = () => {
    if (!selectedProductType) {
      showError('Please select a product type first')
      return false
    }

    const typeName = selectedProductType.type_name?.toLowerCase()
    
    // Validate based on product type
    switch (typeName) {
      case 'accommodation':
        const starRating = form.getValues('attributes.star_rating')
        if (!starRating || starRating < 1 || starRating > 5) {
          showError('Please select a valid star rating (1-5 stars)')
          return false
        }
        break
      case 'event':
      case 'tickets & passes':
        const eventName = form.getValues('attributes.event_name')
        if (!eventName || eventName.trim().length === 0) {
          showError('Name is required')
          return false
        }
        break
      case 'activity':
      case 'activities & experiences':
        const activityType = form.getValues('attributes.activity_type')
        const durationHours = form.getValues('attributes.duration_hours')
        const durationType = form.getValues('attributes.duration_type')
        const difficultyLevel = form.getValues('attributes.difficulty_level')
        const groupType = form.getValues('attributes.group_type')
        const seasonality = form.getValues('attributes.seasonality')
        const ageRestriction = form.getValues('attributes.age_restriction')
        
        if (!activityType) {
          showError('Activity category is required')
          return false
        }
        if (!durationHours || durationHours <= 0) {
          showError('Duration in hours is required')
          return false
        }
        if (!durationType) {
          showError('Duration type is required')
          return false
        }
        if (!difficultyLevel) {
          showError('Difficulty level is required')
          return false
        }
        if (!groupType) {
          showError('Group type is required')
          return false
        }
        if (!seasonality) {
          showError('Seasonality is required')
          return false
        }
        if (!ageRestriction) {
          showError('Age restriction is required')
          return false
        }
        break
      case 'transfer':
      case 'transfers':
        const transferType = form.getValues('attributes.transfer_type')
        if (!transferType) {
          showError('Transfer type is required')
          return false
        }
        break
      case 'package':
        const packageType = form.getValues('attributes.package_type')
        const durationNights = form.getValues('attributes.duration_nights')
        if (!packageType) {
          showError('Package type is required')
          return false
        }
        if (!durationNights || durationNights <= 0) {
          showError('Duration in nights is required')
          return false
        }
        break
      case 'extras & add-ons':
        const extraCategory = form.getValues('attributes.extra_category')
        if (!extraCategory) {
          showError('Extra category is required')
          return false
        }
        break
    }
    
    return true
  }

  const validateStep5 = () => {
    // Step 5 validation is optional as images can be empty
    return true
  }

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return validateStep1()
      case 2:
        return validateStep2()
      case 3:
        return validateStep3()
      case 4:
        return validateStep4()
      case 5:
        return validateStep5()
      default:
        return true
    }
  }

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep < 6) {
        setCurrentStep(currentStep + 1)
        showSuccess(`Step ${currentStep + 1} completed!`)
      }
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = (data: any) => {
    // Final validation before submit
    if (!validateStep1() || !validateStep2() || !validateStep3()) {
      showError('Please complete all required fields before creating the product')
      return
    }
    
    // Clean up the data before submitting
    const cleanedData = {
      ...data,
      location: {
        ...data.location,
        lat: data.location.lat && !isNaN(data.location.lat) ? data.location.lat : undefined,
        lng: data.location.lng && !isNaN(data.location.lng) ? data.location.lng : undefined
      }
    }
    
    console.log('Wizard submitting data:', cleanedData)
    onSubmit(cleanedData as ProductFormData)
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  const addTag = () => {
    const input = document.getElementById('tag-input') as HTMLInputElement
    const newTag = input.value.trim()
    if (newTag && !form.watch('tags')?.includes(newTag)) {
      form.setValue('tags', [...(form.watch('tags') || []), newTag])
      input.value = ''
    }
  }

  const removeTag = (tagToRemove: string) => {
    form.setValue('tags', form.watch('tags')?.filter((tag: any) => tag !== tagToRemove) || [])
  }

  const handleAmenityChange = (amenityValue: string, checked: boolean) => {
    const currentAmenities = form.watch('attributes.amenities') || []
    if (checked) {
      form.setValue('attributes.amenities', [...currentAmenities, amenityValue])
    } else {
      form.setValue('attributes.amenities', currentAmenities.filter((a: string) => a !== amenityValue))
    }
  }

  const renderProductTypeSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Select Product Type</h2>
        <p className="text-muted-foreground">Choose the type of product you want to create</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {productTypes?.map((type) => {
          const typeInfo = productTypeInfo[type.type_name as keyof typeof productTypeInfo] || {
            icon: Package,
            title: type.type_name || 'Unknown',
            description: 'Product type',
            color: 'bg-gray-100 text-gray-800 border-gray-200'
          }
          const IconComponent = typeInfo.icon
          
          return (
            <Card 
              key={type.id} 
              className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary"
              onClick={() => handleProductTypeSelect(type)}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-gray-100">
                    <IconComponent className="h-6 w-6 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{typeInfo.title}</h3>
                    <p className="text-sm text-muted-foreground">{typeInfo.description}</p>
                    <Badge className={`mt-2 ${typeInfo.color}`}>
                      {type.type_code}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )

  const renderBasicInfo = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Basic Information</h2>
        <p className="text-muted-foreground">Enter the basic details for your product</p>
          </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                {...form.register('name')}
                placeholder="Enter product name"
                className={form.formState.errors.name && 'border-red-500'}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500">{(form.formState.errors.name as any)?.message}</p>
              )}
        </div>
            <div className="space-y-2">
              <Label htmlFor="code">Product Code *</Label>
              <Input
                id="code"
                {...form.register('code')}
                placeholder="Enter product code"
                className={form.formState.errors.code && 'border-red-500'}
              />
              {form.formState.errors.code && (
                <p className="text-sm text-red-500">{(form.formState.errors.code as any)?.message}</p>
      )}
    </div>
      </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Enter product description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {form.watch('tags')?.map((tag: any, index: any) => (
                <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                  {tag} ×
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                id="tag-input"
                placeholder="Add a tag"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag()
                  }
                }}
              />
              <Button type="button" variant="outline" size="sm" onClick={addTag}>
                <Tag className="h-4 w-4 mr-1" />
                Add Tag
              </Button>
            </div>
        </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderLocation = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Location Information</h2>
        <p className="text-muted-foreground">Where is this product located?</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
          <Input
                id="city"
                {...form.register('location.city')}
                placeholder="Enter city"
                className={(form.formState.errors.location as any)?.city && 'border-red-500'}
              />
              {(form.formState.errors.location as any)?.city && (
                <p className="text-sm text-red-500">{(form.formState.errors.location as any).city.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Input
                id="country"
                {...form.register('location.country')}
                placeholder="Enter country"
                className={(form.formState.errors.location as any)?.country && 'border-red-500'}
              />
              {(form.formState.errors.location as any)?.country && (
                <p className="text-sm text-red-500">{(form.formState.errors.location as any).country.message}</p>
              )}
            </div>
        </div>

          <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
              <Label htmlFor="lat">Latitude</Label>
              <Input
                id="lat"
                type="number"
                step="any"
                {...form.register('location.lat', { valueAsNumber: true })}
                placeholder="Latitude"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lng">Longitude</Label>
              <Input
                id="lng"
                type="number"
                step="any"
                {...form.register('location.lng', { valueAsNumber: true })}
                placeholder="Longitude"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                {...form.register('location.address')}
                placeholder="Street address"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderHotelAttributes = () => (
      <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Star className="h-5 w-5" />
        <h3 className="text-lg font-medium">Hotel Details</h3>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="star_rating">Star Rating *</Label>
          <Select
            value={form.watch('attributes.star_rating')?.toString() || ''}
            onValueChange={(value) => form.setValue('attributes.star_rating', parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select rating" />
              </SelectTrigger>
              <SelectContent>
              {[1, 2, 3, 4, 5].map((rating) => (
                <SelectItem key={rating} value={rating.toString()}>
                  {rating} Star{rating !== 1 ? 's' : ''}
                </SelectItem>
              ))}
              </SelectContent>
            </Select>
          </div>
        <div className="space-y-2">
          <Label htmlFor="check_in_time">Check-in Time</Label>
            <Input
            id="check_in_time"
            {...form.register('attributes.check_in_time')}
            placeholder="14:00"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="check_out_time">Check-out Time</Label>
          <Input
            id="check_out_time"
            {...form.register('attributes.check_out_time')}
            placeholder="11:00"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="property_type">Property Type</Label>
        <Select
          value={form.watch('attributes.property_type') || ''}
          onValueChange={(value) => form.setValue('attributes.property_type', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select property type" />
              </SelectTrigger>
              <SelectContent>
            <SelectItem value="hotel">Hotel</SelectItem>
            <SelectItem value="resort">Resort</SelectItem>
            <SelectItem value="apartment">Apartment</SelectItem>
            <SelectItem value="villa">Villa</SelectItem>
              </SelectContent>
            </Select>
          </div>

      <div className="space-y-2">
        <Label>Amenities</Label>
        <div className="grid grid-cols-2 gap-2">
          {amenityOptions.map((amenity) => {
            const IconComponent = amenity.icon
            const isSelected = form.watch('attributes.amenities')?.includes(amenity.value) || false
            
            return (
              <div key={amenity.value} className="flex items-center space-x-2">
                <Checkbox
                  id={amenity.value}
                  checked={isSelected}
                  onCheckedChange={(checked) => handleAmenityChange(amenity.value, checked as boolean)}
                />
                <Label htmlFor={amenity.value} className="flex items-center gap-2 text-sm">
                  <IconComponent className="h-4 w-4" />
                  {amenity.label}
                </Label>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  const renderEventTicketAttributes = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Ticket className="h-5 w-5" />
        <h3 className="text-lg font-medium">Event Details</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
          <Label htmlFor="event_name">Name *</Label>
              <Input
            id="event_name"
            {...form.register('attributes.event_name')}
            placeholder="e.g., F1 Grand Prix, Music Festival"
              />
            </div>
        <div className="space-y-2">
          <Label htmlFor="event_category">Event Category</Label>
          <Select
            value={form.watch('attributes.event_category') || ''}
            onValueChange={(value) => form.setValue('attributes.event_category', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sports">Sports</SelectItem>
              <SelectItem value="music">Music</SelectItem>
              <SelectItem value="festival">Festival</SelectItem>
              <SelectItem value="exhibition">Exhibition</SelectItem>
              <SelectItem value="theater">Theater</SelectItem>
              <SelectItem value="conference">Conference</SelectItem>
              <SelectItem value="attraction">Attraction</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
            </div>
          </div>

      <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
          <Label htmlFor="start_date">Start Date</Label>
              <Input
            id="start_date"
            type="date"
            {...form.register('attributes.start_date')}
              />
            </div>
        <div className="space-y-2">
          <Label htmlFor="end_date">End Date</Label>
          <Input
            id="end_date"
            type="date"
            {...form.register('attributes.end_date')}
          />
          </div>
        </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="age_restriction">Age Restriction</Label>
          <Select
            value={form.watch('attributes.age_restriction') || ''}
            onValueChange={(value) => form.setValue('attributes.age_restriction', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select age restriction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_ages">All Ages</SelectItem>
              <SelectItem value="18+">18+ Only</SelectItem>
              <SelectItem value="21+">21+ Only</SelectItem>
              <SelectItem value="family">Family Friendly</SelectItem>
              <SelectItem value="adults_only">Adults Only</SelectItem>
            </SelectContent>
          </Select>
            </div>
        <div className="space-y-2">
          <Label htmlFor="event_status">Event Status</Label>
          <Select
            value={form.watch('attributes.event_status') || ''}
            onValueChange={(value) => form.setValue('attributes.event_status', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
            </div>
          </div>
      </div>
  )

  const renderActivityAttributes = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5" />
        <h3 className="text-lg font-medium">Activity Details</h3>
      </div>

      {/* 1. Duration */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="duration_hours">Duration (hours) *</Label>
          <Input
            id="duration_hours"
            type="number"
            {...form.register('attributes.duration_hours', { valueAsNumber: true })}
            placeholder="4"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="duration_type">Duration Type *</Label>
          <Select
            value={form.watch('attributes.duration_type') || ''}
            onValueChange={(value) => form.setValue('attributes.duration_type', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select duration type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="half_day">Half Day (2-4 hours)</SelectItem>
              <SelectItem value="full_day">Full Day (6-8 hours)</SelectItem>
              <SelectItem value="multi_day">Multi Day (2+ days)</SelectItem>
              <SelectItem value="short">Short (1-2 hours)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 2. Difficulty Level */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="difficulty_level">Difficulty Level *</Label>
          <Select
            value={form.watch('attributes.difficulty_level') || ''}
            onValueChange={(value) => form.setValue('attributes.difficulty_level', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="moderate">Moderate</SelectItem>
              <SelectItem value="challenging">Challenging</SelectItem>
              <SelectItem value="expert">Expert</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="physical_requirements">Physical Requirements</Label>
          <Input
            id="physical_requirements"
            {...form.register('attributes.physical_requirements')}
            placeholder="e.g., walking, climbing, swimming"
          />
        </div>
      </div>

      {/* 3. Group Type */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="group_type">Group Type *</Label>
          <Select
            value={form.watch('attributes.group_type') || ''}
            onValueChange={(value) => form.setValue('attributes.group_type', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select group type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">Private</SelectItem>
              <SelectItem value="group">Group</SelectItem>
              <SelectItem value="self_guided">Self-guided</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="max_group_size">Maximum Group Size</Label>
          <Input
            id="max_group_size"
            type="number"
            {...form.register('attributes.max_group_size', { valueAsNumber: true })}
            placeholder="20"
          />
        </div>
      </div>

      {/* 4. Category/Theme */}
      <div className="space-y-2">
        <Label htmlFor="activity_type">Activity Category *</Label>
        <Select
          value={form.watch('attributes.activity_type') || ''}
          onValueChange={(value) => form.setValue('attributes.activity_type', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select activity category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="adventure">Adventure</SelectItem>
            <SelectItem value="cultural">Cultural</SelectItem>
            <SelectItem value="culinary">Culinary</SelectItem>
            <SelectItem value="nature">Nature</SelectItem>
            <SelectItem value="educational">Educational</SelectItem>
            <SelectItem value="entertainment">Entertainment</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 5. Seasonality */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="seasonality">Seasonality *</Label>
          <Select
            value={form.watch('attributes.seasonality') || ''}
            onValueChange={(value) => form.setValue('attributes.seasonality', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select seasonality" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="year_round">Year-round</SelectItem>
              <SelectItem value="seasonal">Seasonal</SelectItem>
              <SelectItem value="weather_dependent">Weather-dependent</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="best_months">Best Months/Season</Label>
          <Input
            id="best_months"
            {...form.register('attributes.best_months')}
            placeholder="e.g., March-May, September-November"
          />
        </div>
      </div>

      {/* 6. Age Restrictions */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="age_restriction">Age Restriction *</Label>
          <Select
            value={form.watch('attributes.age_restriction') || ''}
            onValueChange={(value) => form.setValue('attributes.age_restriction', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select age restriction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="family_friendly">Family-friendly</SelectItem>
              <SelectItem value="adult_only">Adult-only (18+)</SelectItem>
              <SelectItem value="teen_adult">Teen & Adult (13+)</SelectItem>
              <SelectItem value="senior_friendly">Senior-friendly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="minimum_age">Minimum Age</Label>
          <Input
            id="minimum_age"
            type="number"
            {...form.register('attributes.minimum_age', { valueAsNumber: true })}
            placeholder="e.g., 8, 12, 16"
          />
        </div>
      </div>
    </div>
  )

  const renderTransferAttributes = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Car className="h-5 w-5" />
        <h3 className="text-lg font-medium">Transfer Details</h3>
      </div>

      <div className="space-y-2">
        <Label htmlFor="transfer_type">Transfer Type *</Label>
        <Select
          value={form.watch('attributes.transfer_type') || ''}
          onValueChange={(value) => form.setValue('attributes.transfer_type', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select transfer type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="airport">Airport Transfer</SelectItem>
            <SelectItem value="circuit">Circuit Transfer</SelectItem>
            <SelectItem value="city">City Transfer</SelectItem>
            <SelectItem value="inter_city">Inter-City Transfer</SelectItem>
            <SelectItem value="hotel_shuttle">Hotel Shuttle</SelectItem>
            <SelectItem value="private_transfer">Private Transfer</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  const renderPackageAttributes = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Package className="h-5 w-5" />
        <h3 className="text-lg font-medium">Package Details</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="package_type">Package Type *</Label>
          <Select
            value={form.watch('attributes.package_type') || ''}
            onValueChange={(value) => form.setValue('attributes.package_type', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select package type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_inclusive">All Inclusive</SelectItem>
              <SelectItem value="half_board">Half Board</SelectItem>
              <SelectItem value="bed_breakfast">Bed & Breakfast</SelectItem>
              <SelectItem value="room_only">Room Only</SelectItem>
              <SelectItem value="custom">Custom Package</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="duration_nights">Duration (nights) *</Label>
          <Input
            id="duration_nights"
            type="number"
            {...form.register('attributes.duration_nights', { valueAsNumber: true })}
            placeholder="7"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="min_guests">Minimum Guests</Label>
          <Input
            id="min_guests"
            type="number"
            {...form.register('attributes.min_guests', { valueAsNumber: true })}
            placeholder="2"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="max_guests">Maximum Guests</Label>
          <Input
            id="max_guests"
            type="number"
            {...form.register('attributes.max_guests', { valueAsNumber: true })}
            placeholder="10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="included_services">Included Services</Label>
        <Textarea
          id="included_services"
          {...form.register('attributes.included_services')}
          placeholder="List all included services..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="excluded_services">Excluded Services</Label>
        <Textarea
          id="excluded_services"
          {...form.register('attributes.excluded_services')}
          placeholder="List excluded services..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="validity_start">Validity Start Date</Label>
          <Input
            id="validity_start"
            type="date"
            {...form.register('attributes.validity_start')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="validity_end">Validity End Date</Label>
          <Input
            id="validity_end"
            type="date"
            {...form.register('attributes.validity_end')}
          />
        </div>
      </div>
    </div>
  )

  const renderExtrasAttributes = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Package className="h-5 w-5" />
        <h3 className="text-lg font-medium">Extras & Add-ons Details</h3>
      </div>

      <div className="space-y-2">
        <Label htmlFor="extra_category">Extra Category *</Label>
        <Select
          value={form.watch('attributes.extra_category') || ''}
          onValueChange={(value) => form.setValue('attributes.extra_category', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select extra category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="transportation">Transportation</SelectItem>
            <SelectItem value="equipment">Equipment & Gear</SelectItem>
            <SelectItem value="food_beverage">Food & Beverage</SelectItem>
            <SelectItem value="photography">Photography Services</SelectItem>
            <SelectItem value="guide_services">Guide Services</SelectItem>
            <SelectItem value="insurance">Insurance</SelectItem>
            <SelectItem value="entertainment">Entertainment</SelectItem>
            <SelectItem value="wellness">Wellness & Spa</SelectItem>
            <SelectItem value="shopping">Shopping & Souvenirs</SelectItem>
            <SelectItem value="other">Other Services</SelectItem>
          </SelectContent>
        </Select>
      </div>


      <div className="space-y-2">
        <Label htmlFor="description">Service Description</Label>
        <Textarea
          id="description"
          {...form.register('attributes.description')}
          placeholder="Describe what this extra service includes..."
          rows={3}
        />
      </div>
    </div>
  )

  const renderAttributes = () => {
    if (!selectedProductType) {
      return (
        <div className="text-center py-8">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Please select a product type first</p>
            </div>
      )
    }

    const typeName = selectedProductType.type_name?.toLowerCase()

    switch (typeName) {
      case 'accommodation':
        return renderHotelAttributes()
      case 'event':
      case 'tickets & passes':
        return renderEventTicketAttributes()
      case 'activity':
      case 'activities & experiences':
        return renderActivityAttributes()
      case 'transfer':
      case 'transfers':
        return renderTransferAttributes()
      case 'package':
        return renderPackageAttributes()
      case 'extras & add-ons':
        return renderExtrasAttributes()
      default:
        return (
          <div className="text-center py-8">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No specific attributes for this product type</p>
            <p className="text-xs text-muted-foreground mt-2">Type name: {typeName}</p>
            <p className="text-xs text-muted-foreground">Full type: {JSON.stringify(selectedProductType)}</p>
          </div>
        )
    }
  }

  const renderImages = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Product Images</h2>
        <p className="text-muted-foreground">Add up to 5 images to showcase your product (optional)</p>
      </div>

      <ImageUpload
        images={form.watch('media') || []}
        onImagesChange={(images) => form.setValue('media', images)}
        maxImages={5}
        disabled={isLoading}
      />
    </div>
  )

  const renderReview = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Review & Create</h2>
        <p className="text-muted-foreground">Review your product details before creating</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name:</span>
              <span className="font-medium">{form.watch('name')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Code:</span>
              <span className="font-medium">{form.watch('code')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <span className="font-medium">{selectedProductType?.type_name}</span>
            </div>
            {form.watch('description') && (
            <div className="flex justify-between">
                <span className="text-muted-foreground">Description:</span>
                <span className="font-medium text-right max-w-xs truncate">
                  {form.watch('description')}
                </span>
            </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">City:</span>
              <span className="font-medium">{form.watch('location.city')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Country:</span>
              <span className="font-medium">{form.watch('location.country')}</span>
            </div>
            {form.watch('location.address') && (
            <div className="flex justify-between">
                <span className="text-muted-foreground">Address:</span>
                <span className="font-medium text-right max-w-xs truncate">
                  {form.watch('location.address')}
              </span>
            </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attributes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(form.watch('attributes') || {}).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-muted-foreground capitalize">
                  {key.replace(/_/g, ' ')}:
                </span>
                <span className="font-medium">
                  {Array.isArray(value) ? value.join(', ') : (value as any)?.toString()}
                </span>
        </div>
            ))}
      </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return renderProductTypeSelection()
      case 2:
        return renderBasicInfo()
      case 3:
        return renderLocation()
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Product Attributes</h2>
              <p className="text-muted-foreground">Configure {selectedProductType?.type_name}-specific attributes</p>
            </div>
            <Card>
              <CardContent className="p-6">
                {renderAttributes()}
              </CardContent>
            </Card>
          </div>
        )
      case 5:
        return renderImages()
      case 6:
        return renderReview()
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Create New Product</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Step Progress */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 overflow-x-auto pb-2">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center min-w-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep >= step.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      step.id
                    )}
            </div>
                  <div className="ml-2 min-w-0">
                    <p className="text-sm font-medium">{step.title}</p>
                    <p className="text-xs text-muted-foreground hidden sm:block">{step.description}</p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="w-12 h-px bg-gray-200 mx-4 hidden sm:block" />
                  )}
                </div>
              ))}
            </div>
      </div>

          {/* Step Content */}
          <div className="min-h-[500px]">
            {renderStep()}
      </div>

      {/* Navigation */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
        </Button>
        
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              {currentStep < 6 ? (
                <Button type="button" onClick={handleNext}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
        <Button 
                  type="button"
                  onClick={form.handleSubmit(handleSubmit)}
                  disabled={isLoading}
        >
                  {isLoading ? 'Creating...' : 'Create Product'}
        </Button>
              )}
      </div>
    </div>
    </div>
      </DialogContent>
    </Dialog>
  )
}

