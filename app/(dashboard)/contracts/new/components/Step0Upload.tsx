'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Copy } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
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
  const [showTextInput, setShowTextInput] = useState(false)

  const { user, loading } = useAuth()
  const { extractFromPDF } = usePDFExtraction()

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file')
      return
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File size must be less than 10MB')
      return
    }

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

      const result = await extractFromPDF(file)
      
      clearInterval(progressInterval)
      setExtractionProgress(100)
      
      setExtractionResults(result)
      onExtractedData(result) // Pass the full result object, not just extracted
      setShowReview(true)
      
      toast.success('Contract data extracted successfully!')
      
    } catch (error) {
      console.error('PDF extraction failed:', error)
      toast.error('Failed to extract contract data. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }, [extractFromPDF, onExtractedData])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false
  })

  const handleReviewComplete = () => {
    if (extractionResults?.extracted) {
      onDataUpdate(extractionResults.extracted)
    }
    onNext()
  }

  const handleStartManual = () => {
    onNext()
  }

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

      // Create a mock file for the text extraction
      const mockFile = new File([contractText], 'contract.txt', { type: 'text/plain' })
      const result = await extractFromPDF(mockFile)
      
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
  }, [contractText, user?.id, extractFromPDF, onExtractedData])

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
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Review Extracted Information
          </h2>
          <p className="text-muted-foreground">
            We found the following information. Please review and edit if needed.
          </p>
        </div>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {extractionResults.extracted.supplier_name && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Supplier</div>
                      <div className="text-sm text-muted-foreground">
                        {extractionResults.extracted.supplier_name}
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Extracted
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {extractionResults.extracted.client_name && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Client</div>
                      <div className="text-sm text-muted-foreground">
                        {extractionResults.extracted.client_name}
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Extracted
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {extractionResults.extracted.contract_name && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Event Name</div>
                      <div className="text-sm text-muted-foreground">
                        {extractionResults.extracted.contract_name}
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Extracted
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {extractionResults.extracted.total_value && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Total Value</div>
                      <div className="text-sm text-muted-foreground">
                        {extractionResults.extracted.currency} {extractionResults.extracted.total_value.toLocaleString()}
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Extracted
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Event Dates */}
          {extractionResults.extracted.event_dates && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Event Dates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {extractionResults.extracted.event_dates.start_date && (
                    <div>
                      <div className="text-sm font-medium">Start Date</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(extractionResults.extracted.event_dates.start_date).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                  {extractionResults.extracted.event_dates.end_date && (
                    <div>
                      <div className="text-sm font-medium">End Date</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(extractionResults.extracted.event_dates.end_date).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                  {extractionResults.extracted.event_dates.check_in && (
                    <div>
                      <div className="text-sm font-medium">Check-in</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(extractionResults.extracted.event_dates.check_in).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                  {extractionResults.extracted.event_dates.check_out && (
                    <div>
                      <div className="text-sm font-medium">Check-out</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(extractionResults.extracted.event_dates.check_out).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contact Information */}
          {(extractionResults.extracted.supplier_contact || extractionResults.extracted.client_contact) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {extractionResults.extracted.supplier_contact && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Supplier Contact</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div><strong>{extractionResults.extracted.supplier_contact.name}</strong></div>
                      <div className="text-sm text-muted-foreground">{extractionResults.extracted.supplier_contact.title}</div>
                      {extractionResults.extracted.supplier_contact.phone && (
                        <div className="text-sm">📞 {extractionResults.extracted.supplier_contact.phone}</div>
                      )}
                      {extractionResults.extracted.supplier_contact.email && (
                        <div className="text-sm">✉️ {extractionResults.extracted.supplier_contact.email}</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {extractionResults.extracted.client_contact && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Client Contact</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div><strong>{extractionResults.extracted.client_contact.name}</strong></div>
                      <div className="text-sm text-muted-foreground">{extractionResults.extracted.client_contact.title}</div>
                      {extractionResults.extracted.client_contact.phone && (
                        <div className="text-sm">📞 {extractionResults.extracted.client_contact.phone}</div>
                      )}
                      {extractionResults.extracted.client_contact.email && (
                        <div className="text-sm">✉️ {extractionResults.extracted.client_contact.email}</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Room Requirements */}
          {extractionResults.extracted.room_requirements && extractionResults.extracted.room_requirements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Room Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {extractionResults.extracted.room_requirements.map((room: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-sm font-medium">Room Type</div>
                          <div className="text-sm text-muted-foreground">{room.room_type}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">Rate</div>
                          <div className="text-sm text-muted-foreground">
                            {extractionResults.extracted.currency} {room.total_rate}
                            {room.surcharge > 0 && ` (${room.base_rate} + ${room.surcharge} surcharge)`}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">Quantity</div>
                          <div className="text-sm text-muted-foreground">{room.quantity} rooms</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">Nights</div>
                          <div className="text-sm text-muted-foreground">{room.nights} nights</div>
                        </div>
                      </div>
                      {room.includes && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          Includes: {room.includes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Schedule */}
          {extractionResults.extracted.payment_schedule && extractionResults.extracted.payment_schedule.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {extractionResults.extracted.payment_schedule.map((payment: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Payment {payment.payment_number}</div>
                        <div className="text-sm text-muted-foreground">{payment.description}</div>
                        {payment.due_date && (
                          <div className="text-sm text-muted-foreground">
                            Due: {new Date(payment.due_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {extractionResults.extracted.currency} {payment.amount.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">{payment.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Special Terms */}
          {extractionResults.extracted.special_terms && extractionResults.extracted.special_terms.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Special Terms</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {extractionResults.extracted.special_terms.map((term: string, index: number) => (
                    <li key={index} className="text-sm">• {term}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Warnings */}
          {extractionResults.warnings && extractionResults.warnings.length > 0 && (
            <Alert className="col-span-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-2">Couldn't extract:</div>
                <ul className="list-disc list-inside space-y-1">
                  {extractionResults.warnings.map((warning: string, index: number) => (
                    <li key={index} className="text-sm">{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => setShowReview(false)}>
            Start Over
          </Button>
          <Button onClick={handleReviewComplete}>
            Looks Good - Continue
          </Button>
        </div>
      </div>
    )
  }

  if (isProcessing) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Processing Contract...
          </h2>
          <p className="text-muted-foreground">
            AI is extracting information from your contract
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              
              <div>
                <div className="font-medium mb-2">🤖 Extracting information...</div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>✓ Found supplier information</div>
                  <div>✓ Found contract dates</div>
                  <div>✓ Found allocation details</div>
                  <div>✓ Found payment terms</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Extraction Progress</span>
                  <span>{extractionProgress}%</span>
                </div>
                <Progress value={extractionProgress} className="w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (method === 'pdf') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Upload Contract PDF
          </h2>
          <p className="text-muted-foreground">
            Drop your contract PDF here and let AI extract the information
          </p>
        </div>

        {!showTextInput ? (
          <>
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200
                ${isDragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5'
                }
              `}
            >
              <input {...getInputProps()} />
              
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {isDragActive ? 'Drop your PDF here' : 'Drop PDF here or click to upload'}
              </h3>
              
              <p className="text-muted-foreground mb-4">
                Supported format: PDF (max 10MB)
              </p>
              
              <div className="text-sm text-primary/80 space-y-1">
                <div>✨ Extracts: supplier, dates, rates,</div>
                <div>payment terms, cancellation...</div>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => setShowTextInput(true)}>
                <Copy className="h-4 w-4 mr-2" />
                Paste Contract Text Instead
              </Button>
              <Button variant="outline" onClick={handleStartManual}>
                Enter Details Manually Instead
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Copy className="h-5 w-5" />
                  Paste Contract Text
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Copy and paste the contract text from your PDF document
                </p>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={contractText}
                  onChange={(e) => setContractText(e.target.value)}
                  placeholder="Paste your contract text here..."
                  className="min-h-[200px]"
                />
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-muted-foreground">
                    {contractText.length} characters
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowTextInput(false)}>
                      Back to PDF Upload
                    </Button>
                    <Button 
                      onClick={handleTextExtraction}
                      disabled={!contractText.trim()}
                    >
                      Extract Data
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    )
  }

  // Manual entry option
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Manual Contract Entry
        </h2>
        <p className="text-muted-foreground">
          Fill out the 3-step wizard to create your contract
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center">
              <FileText className="h-8 w-8 text-secondary" />
            </div>
            
            <div>
              <div className="font-medium mb-2">📝 Step-by-step form</div>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>✓ Contract basics</div>
                <div>✓ Allocations & releases</div>
                <div>✓ Optional rates</div>
                <div>⚡ 80% faster than before</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button onClick={handleStartManual}>
          Start Manual Entry
        </Button>
      </div>
    </div>
  )
}
