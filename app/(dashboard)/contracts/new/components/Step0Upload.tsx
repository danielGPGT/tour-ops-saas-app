'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { FileText, CheckCircle, AlertCircle, Loader2, Copy } from 'lucide-react'
import { usePDFExtraction } from '../hooks/usePDFExtraction'
import { useAuth } from '@/lib/hooks/useAuth'
import { toast } from 'sonner'

interface Step0UploadProps {
  method: 'pdf' | 'manual'
  extractedData: any
  onExtractedData: (data: any) => void
  onNext: () => void
  onDataUpdate: (data: any) => void
}

export function Step0Upload({ 
  method, 
  extractedData, 
  onExtractedData, 
  onNext, 
  onDataUpdate 
}: Step0UploadProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractionProgress, setExtractionProgress] = useState(0)
  const [extractionResults, setExtractionResults] = useState<any>(null)
  const [showReview, setShowReview] = useState(false)
  const [contractText, setContractText] = useState('')

  const { user, loading } = useAuth()
  const { extractFromPDF } = usePDFExtraction()

  const handleTextExtraction = useCallback(async () => {
    if (!contractText.trim()) {
      toast.error('Please paste the contract text')
      return
    }

    if (!user?.id) {
      toast.error('Please log in to use the extraction feature')
      return
    }

    console.log('🚀 STARTING TEXT EXTRACTION...')
    console.log('👤 User authenticated:', !!user?.id)
    console.log('📝 Contract text length:', contractText.length)
    console.log('📝 Contract text preview:', contractText.substring(0, 100))

    setIsProcessing(true)
    setExtractionProgress(0)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setExtractionProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // Create a mock file object for text input
      const textFile = new File([contractText], 'contract.txt', { type: 'text/plain' })
      
      const result = await extractFromPDF(textFile)
      
      clearInterval(progressInterval)
      setExtractionProgress(100)
      
      setExtractionResults(result)
      onExtractedData(result) // Pass the full result object, not just extracted
      setShowReview(true)
      
      toast.success('Contract data extracted successfully!')
      
    } catch (error) {
      console.error('Text extraction failed:', error)
      toast.error('Failed to extract contract data. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }, [contractText, extractFromPDF, onExtractedData, user?.id])

  const handleReviewComplete = () => {
    if (extractionResults?.extracted) {
      onDataUpdate(extractionResults.extracted)
    }
    onNext()
  }

  const handleStartManual = () => {
    onNext()
  }

  // Show loading state while authentication is being checked
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Loading...
          </h2>
          <p className="text-muted-foreground">
            Checking authentication
          </p>
        </div>
      </div>
    )
  }

  // Show error if not authenticated
  if (!user) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Authentication Required
          </h2>
          <p className="text-muted-foreground">
            Please log in to use the contract extraction feature
          </p>
        </div>
      </div>
    )
  }

  if (showReview && extractionResults) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Contract Data Extracted Successfully!
          </h2>
          <p className="text-muted-foreground">
            Review the extracted information below
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Extracted Contract Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {extractionResults.extracted && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Supplier</label>
                    <p className="text-sm">{extractionResults.extracted.supplier_name || 'Not found'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Contract Name</label>
                    <p className="text-sm">{extractionResults.extracted.contract_name || 'Not found'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Contract Type</label>
                    <p className="text-sm">{extractionResults.extracted.contract_type || 'Not found'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Total Value</label>
                    <p className="text-sm">{extractionResults.extracted.total_value ? `${extractionResults.extracted.currency} ${extractionResults.extracted.total_value.toLocaleString()}` : 'Not found'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Valid From</label>
                    <p className="text-sm">{extractionResults.extracted.contract_dates?.valid_from || 'Not found'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Valid To</label>
                    <p className="text-sm">{extractionResults.extracted.contract_dates?.valid_to || 'Not found'}</p>
                  </div>
                </div>

                {extractionResults.extracted.supplier_contact && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Supplier Contact</label>
                    <div className="text-sm space-y-1">
                      <p><strong>Name:</strong> {extractionResults.extracted.supplier_contact.name}</p>
                      <p><strong>Title:</strong> {extractionResults.extracted.supplier_contact.title}</p>
                      <p><strong>Phone:</strong> {extractionResults.extracted.supplier_contact.phone}</p>
                      <p><strong>Email:</strong> {extractionResults.extracted.supplier_contact.email}</p>
                    </div>
                  </div>
                )}

                {extractionResults.extracted.client_contact && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Client Contact</label>
                    <div className="text-sm space-y-1">
                      <p><strong>Name:</strong> {extractionResults.extracted.client_contact.name}</p>
                      <p><strong>Title:</strong> {extractionResults.extracted.client_contact.title}</p>
                      <p><strong>Phone:</strong> {extractionResults.extracted.client_contact.phone}</p>
                      <p><strong>Email:</strong> {extractionResults.extracted.client_contact.email}</p>
                    </div>
                  </div>
                )}

                {extractionResults.extracted.room_requirements && extractionResults.extracted.room_requirements.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Room Requirements</label>
                    <div className="space-y-2">
                      {extractionResults.extracted.room_requirements.map((room: any, index: number) => (
                        <div key={index} className="p-3 bg-muted rounded-lg">
                          <p><strong>Type:</strong> {room.room_type}</p>
                          <p><strong>Rate:</strong> {room.total_rate} {extractionResults.extracted.currency}</p>
                          <p><strong>Quantity:</strong> {room.quantity} rooms</p>
                          <p><strong>Nights:</strong> {room.nights}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {extractionResults.extracted.payment_schedule && extractionResults.extracted.payment_schedule.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Payment Schedule</label>
                    <div className="space-y-2">
                      {extractionResults.extracted.payment_schedule.map((payment: any, index: number) => (
                        <div key={index} className="p-3 bg-muted rounded-lg">
                          <p><strong>Payment {payment.payment_number}:</strong> {payment.percentage}% - {payment.amount} {extractionResults.extracted.currency}</p>
                          <p><strong>Due:</strong> {payment.due_date || 'Upon signing'}</p>
                          <p><strong>Description:</strong> {payment.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {extractionResults.extracted.special_terms && extractionResults.extracted.special_terms.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Special Terms</label>
                    <ul className="text-sm space-y-1">
                      {extractionResults.extracted.special_terms.map((term: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-muted-foreground">•</span>
                          <span>{term}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            {extractionResults.warnings && extractionResults.warnings.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warnings:</strong> {extractionResults.warnings.join(', ')}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => setShowReview(false)}>
            Back to Edit
          </Button>
          <Button onClick={handleReviewComplete}>
            Continue to Contract Details
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Contract Text Extraction
        </h2>
        <p className="text-muted-foreground">
          Paste your contract text below and we'll extract the key information automatically
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Paste Contract Text
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Copy and paste the contract text from your document
          </p>
        </CardHeader>
        <CardContent>
          <Textarea
            value={contractText}
            onChange={(e) => setContractText(e.target.value)}
            placeholder="Paste your contract text here..."
            className="min-h-[300px]"
          />
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-muted-foreground">
              {contractText.length} characters
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleTextExtraction}
                disabled={!contractText.trim() || isProcessing}
                className="flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    Extract Data
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isProcessing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Extracting contract data...</span>
              </div>
              <Progress value={extractionProgress} className="w-full" />
              <p className="text-xs text-muted-foreground text-center">
                {extractionProgress < 30 ? 'Processing text...' :
                 extractionProgress < 60 ? 'Analyzing contract structure...' :
                 extractionProgress < 90 ? 'Extracting key information...' :
                 'Finalizing results...'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={handleStartManual}>
          Enter Details Manually Instead
        </Button>
      </div>
    </div>
  )
}