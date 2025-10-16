"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Check, ChevronsUpDown, Hotel, Activity, Car, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// Product templates with opinionated defaults
const PRODUCT_TEMPLATES = [
  {
    id: "hotel",
    name: "3-Star Hotel Room",
    description: "Standard hotel accommodation with flexible room types",
    icon: Hotel,
    color: "bg-blue-500",
    suggestedMargin: 0.20,
    defaultSettings: {
      inventoryModel: "committed",
      pricingModel: "per_person",
      channels: ["direct", "agent"],
      markets: ["all"],
      cancellationPolicy: {
        noticePeriod: { days: 30, type: "calendar" },
        penalties: {
          earlyTermination: { percentage: 10, minimumAmount: 50, currency: "GBP" }
        }
      }
    }
  },
  {
    id: "activity",
    name: "Full-Day Activity",
    description: "Day-long tour or activity with group pricing",
    icon: Activity,
    color: "bg-green-500",
    suggestedMargin: 0.30,
    defaultSettings: {
      inventoryModel: "committed",
      pricingModel: "per_person",
      channels: ["direct", "agent"],
      markets: ["all"]
    }
  },
  {
    id: "transfer",
    name: "Airport Transfer",
    description: "Point-to-point transportation service",
    icon: Car,
    color: "bg-purple-500",
    suggestedMargin: 0.25,
    defaultSettings: {
      inventoryModel: "freesale",
      pricingModel: "per_person",
      channels: ["direct", "agent"],
      markets: ["all"]
    }
  }
];

interface ProductCreationWizardProps {
  onComplete: (productData: any) => void;
  onCancel: () => void;
}

export function ProductCreationWizard({ onComplete, onCancel }: ProductCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({
    // Basic info
    name: "",
    supplier: "",
    supplierId: null,
    
    // Pricing
    costPerPerson: "",
    pricePerPerson: "",
    
    // Availability
    availabilityType: "fixed", // fixed, unlimited, on-request
    quantity: "",
    startDate: null,
    endDate: null,
    
    // Room-specific (for hotels)
    roomTypes: [],
    
    // Advanced (hidden by default)
    advancedSettings: {
      inventoryModel: "committed",
      pricingModel: "per_person",
      currency: "GBP",
      channels: ["direct", "agent"],
      markets: ["all"]
    }
  });

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = PRODUCT_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setFormData(prev => ({
        ...prev,
        advancedSettings: {
          ...prev.advancedSettings,
          ...template.defaultSettings
        }
      }));
    }
  };

  const calculateMargin = () => {
    const cost = parseFloat(formData.costPerPerson) || 0;
    const price = parseFloat(formData.pricePerPerson) || 0;
    if (cost === 0) return 0;
    return ((price - cost) / cost) * 100;
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return selectedTemplate && formData.name.trim() !== "";
      case 2:
        return formData.supplier.trim() !== "" && 
               formData.costPerPerson !== "" && 
               formData.pricePerPerson !== "";
      case 3:
        if (formData.availabilityType === "fixed") {
          return formData.quantity !== "" && formData.startDate && formData.endDate;
        }
        return true;
      default:
        return true;
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">What type of product are you adding?</h3>
        <p className="text-muted-foreground">Choose a template to get started quickly</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PRODUCT_TEMPLATES.map((template) => {
          const Icon = template.icon;
          return (
            <Card 
              key={template.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                selectedTemplate === template.id && "ring-2 ring-primary"
              )}
              onClick={() => handleTemplateSelect(template.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", template.color)}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {template.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Badge variant="secondary" className="text-xs">
                  ~{Math.round(template.suggestedMargin * 100)}% margin
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedTemplate && (
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Check className="h-4 w-4 text-green-600" />
            <span className="font-medium">Template Selected</span>
          </div>
          <p className="text-sm text-muted-foreground">
            This template includes recommended settings for {PRODUCT_TEMPLATES.find(t => t.id === selectedTemplate)?.name.toLowerCase()}.
            You can customize these later in advanced settings.
          </p>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Basic Information</h3>
        <p className="text-muted-foreground">Tell us about your product</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Product Name</Label>
          <Input
            id="name"
            placeholder="e.g., Hotel ABC Deluxe Room"
            value={formData.name}
            onChange={(e) => updateFormData("name", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="supplier">Supplier</Label>
          <div className="flex gap-2">
            <Select onValueChange={(value) => updateFormData("supplierId", value)}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select existing supplier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">+ Create New Supplier</SelectItem>
                {/* TODO: Load existing suppliers */}
              </SelectContent>
            </Select>
          </div>
          {formData.supplierId === "new" && (
            <Input
              placeholder="Enter supplier name"
              value={formData.supplier}
              onChange={(e) => updateFormData("supplier", e.target.value)}
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="costPerPerson">Your Cost (per person)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">£</span>
              <Input
                id="costPerPerson"
                type="number"
                placeholder="0.00"
                className="pl-8"
                value={formData.costPerPerson}
                onChange={(e) => updateFormData("costPerPerson", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pricePerPerson">Selling Price (per person)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">£</span>
              <Input
                id="pricePerPerson"
                type="number"
                placeholder="0.00"
                className="pl-8"
                value={formData.pricePerPerson}
                onChange={(e) => updateFormData("pricePerPerson", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Margin indicator */}
        {formData.costPerPerson && formData.pricePerPerson && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Your Margin</span>
              <span className={cn(
                "text-sm font-bold",
                calculateMargin() > 0 ? "text-green-600" : "text-red-600"
              )}>
                {calculateMargin().toFixed(1)}%
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {selectedTemplate && `Suggested: ${Math.round(PRODUCT_TEMPLATES.find(t => t.id === selectedTemplate)!.suggestedMargin * 100)}%`}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Availability</h3>
        <p className="text-muted-foreground">How many can you sell?</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Availability Type</Label>
          <Select onValueChange={(value) => updateFormData("availabilityType", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select availability type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unlimited">
                <div>
                  <div className="font-medium">Unlimited</div>
                  <div className="text-sm text-muted-foreground">No limit, always available</div>
                </div>
              </SelectItem>
              <SelectItem value="fixed">
                <div>
                  <div className="font-medium">Fixed Quantity</div>
                  <div className="text-sm text-muted-foreground">Limited number per day</div>
                </div>
              </SelectItem>
              <SelectItem value="on-request">
                <div>
                  <div className="font-medium">On Request</div>
                  <div className="text-sm text-muted-foreground">Check with supplier each time</div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.availabilityType === "fixed" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity per day</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="100"
                value={formData.quantity}
                onChange={(e) => updateFormData("quantity", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Available from</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.startDate ? format(formData.startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.startDate}
                      onSelect={(date) => updateFormData("startDate", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Available until</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.endDate ? format(formData.endDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.endDate}
                      onSelect={(date) => updateFormData("endDate", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </>
        )}

        {formData.availabilityType === "unlimited" && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Unlimited availability
              </span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              This product will always show as available. Perfect for freesale inventory.
            </p>
          </div>
        )}

        {formData.availabilityType === "on-request" && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                On-request booking
              </span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              Bookings will require manual confirmation from the supplier.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Review & Create</h3>
        <p className="text-muted-foreground">Check your product details</p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Product Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Name:</span>
              <span className="text-sm font-medium">{formData.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Supplier:</span>
              <span className="text-sm font-medium">{formData.supplier}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Cost:</span>
              <span className="text-sm font-medium">£{formData.costPerPerson} per person</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Price:</span>
              <span className="text-sm font-medium">£{formData.pricePerPerson} per person</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Margin:</span>
              <span className={cn(
                "text-sm font-medium",
                calculateMargin() > 0 ? "text-green-600" : "text-red-600"
              )}>
                {calculateMargin().toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Availability:</span>
              <span className="text-sm font-medium">
                {formData.availabilityType === "unlimited" ? "Unlimited" :
                 formData.availabilityType === "fixed" ? `${formData.quantity} per day` :
                 "On request"}
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Your product will be created with recommended settings</li>
            <li>• You can customize pricing and availability later</li>
            <li>• The product will be available for booking immediately</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    // Transform form data into the complex schema structure
    const productData = {
      // Basic product info
      name: formData.name,
      type: selectedTemplate,
      status: "active",
      
      // Supplier
      supplier: {
        name: formData.supplier,
        id: formData.supplierId
      },
      
      // Pricing
      costPerPerson: parseFloat(formData.costPerPerson),
      pricePerPerson: parseFloat(formData.pricePerPerson),
      margin: calculateMargin(),
      
      // Availability
      availability: {
        type: formData.availabilityType,
        quantity: formData.availabilityType === "fixed" ? parseInt(formData.quantity) : null,
        startDate: formData.startDate,
        endDate: formData.endDate
      },
      
      // Advanced settings (from template)
      settings: formData.advancedSettings
    };
    
    onComplete(productData);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress indicator */}
      <div className="flex items-center justify-center mb-8">
        {[1, 2, 3, 4].map((step) => (
          <React.Fragment key={step}>
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
              step <= currentStep 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted text-muted-foreground"
            )}>
              {step}
            </div>
            {step < 4 && (
              <div className={cn(
                "w-12 h-1 mx-2",
                step < currentStep ? "bg-primary" : "bg-muted"
              )} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step content */}
      <div className="min-h-[400px]">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={currentStep === 1 ? onCancel : handlePrevious}>
          {currentStep === 1 ? "Cancel" : "Previous"}
        </Button>
        
        <Button 
          onClick={currentStep === 4 ? handleFinish : handleNext}
          disabled={!isStepValid(currentStep)}
        >
          {currentStep === 4 ? "Create Product" : "Next"}
        </Button>
      </div>
    </div>
  );
}
