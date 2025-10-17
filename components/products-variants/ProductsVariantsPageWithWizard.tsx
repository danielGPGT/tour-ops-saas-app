'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { SmartProductWizard } from '@/components/wizards/SmartProductWizard'
import { toast } from 'sonner'

interface ProductsVariantsPageWithWizardProps {
  children?: React.ReactNode
}

export function ProductsVariantsPageWithWizard({ children }: ProductsVariantsPageWithWizardProps) {
  const [wizardOpen, setWizardOpen] = useState(false)

  const handleWizardComplete = async (data: any) => {
    // The SmartProductWizard already handles the API call internally
    // We just need to close the wizard and refresh the page
    setWizardOpen(false)
    // Refresh the page to show the new product
    window.location.reload()
  }

  return (
    <>
      {children}
      
      {/* Add Product Button */}
      <Button 
        size="sm" 
        className="h-8 gap-1"
        onClick={() => setWizardOpen(true)}
      >
        <Plus className="h-3 w-3" />
        Add Product
      </Button>

      {/* Smart Product Wizard */}
      <SmartProductWizard
        isOpen={wizardOpen}
        onCancel={() => setWizardOpen(false)}
        onComplete={handleWizardComplete}
      />
    </>
  )
}
