'use client'

import { ReactNode } from 'react'
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface SideCardSection {
  id: string
  title: string
  icon?: ReactNode
  content: ReactNode
  defaultOpen?: boolean
}

interface SideCardProps {
  sections: SideCardSection[]
  className?: string
  defaultValue?: string[]
}

export function SideCard({ sections, className, defaultValue }: SideCardProps) {
  // Get default values - all sections that have defaultOpen: true
  const initialDefaultValue = defaultValue || sections
    .filter(section => section.defaultOpen)
    .map(section => section.id)

  return (
    <Card className={cn('p-0 overflow-hidden', className)}>
      <Accordion 
        type="multiple" 
        defaultValue={initialDefaultValue.length > 0 ? initialDefaultValue : [sections[0]?.id]}
        className="w-full"
      >
        {sections.map((section, index) => (
          <AccordionItem 
            key={section.id} 
            value={section.id}
            className={cn(
              'border-b last:border-b-0',
              index === 0 && 'border-t-0'
            )}
          >
            <AccordionTrigger className="px-4 py-3 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2 text-sm font-medium">
                {section.icon && (
                  <div className="flex h-4 w-4 items-center justify-center text-muted-foreground">
                    {section.icon}
                  </div>
                )}
                <span>{section.title}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 py-3 pt-0">
              {section.content}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Card>
  )
}

