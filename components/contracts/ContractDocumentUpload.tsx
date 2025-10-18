'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Upload, 
  FileText, 
  X, 
  CheckCircle, 
  AlertCircle,
  Download,
  Eye,
  Trash2
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'

interface ContractDocument {
  id: string
  name: string
  size: number
  type: string
  url: string
  uploaded_at: string
}

interface ContractDocumentUploadProps {
  contractId: number
  orgId: number
  onUploadComplete?: (documents: ContractDocument[]) => void
  existingDocuments?: ContractDocument[]
}

export function ContractDocumentUpload({
  contractId,
  orgId,
  onUploadComplete,
  existingDocuments = []
}: ContractDocumentUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [documents, setDocuments] = useState<ContractDocument[]>(existingDocuments)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null)
    setUploading(true)
    setUploadProgress(0)

    try {
      const uploadPromises = acceptedFiles.map(async (file, index) => {
        const fileExt = file.name.split('.').pop()
        const fileName = `${contractId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `${orgId}/${fileName}`

        const { data, error } = await supabase.storage
          .from('contracts')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (error) throw error

        // Get the public URL
        const { data: urlData } = supabase.storage
          .from('contracts')
          .getPublicUrl(filePath)

        const document: ContractDocument = {
          id: data.path,
          name: file.name,
          size: file.size,
          type: file.type,
          url: urlData.publicUrl,
          uploaded_at: new Date().toISOString()
        }

        return document
      })

      const uploadedDocuments = await Promise.all(uploadPromises)
      const newDocuments = [...documents, ...uploadedDocuments]
      
      setDocuments(newDocuments)
      setUploadProgress(100)
      
      onUploadComplete?.(newDocuments)
      toast.success(`${acceptedFiles.length} document(s) uploaded successfully`)
      
    } catch (error) {
      console.error('Upload error:', error)
      setError(error instanceof Error ? error.message : 'Upload failed')
      toast.error('Failed to upload documents')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }, [contractId, orgId, documents, onUploadComplete, supabase])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true
  })

  const handleDeleteDocument = async (documentId: string) => {
    try {
      const { error } = await supabase.storage
        .from('contracts')
        .remove([documentId])

      if (error) throw error

      const newDocuments = documents.filter(doc => doc.id !== documentId)
      setDocuments(newDocuments)
      onUploadComplete?.(newDocuments)
      
      toast.success('Document deleted successfully')
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete document')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄'
    if (type.includes('word')) return '📝'
    if (type.includes('image')) return '🖼️'
    return '📎'
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="w-5 h-5" />
            <span>Upload Contract Documents</span>
          </CardTitle>
          <CardDescription>
            Upload PDF contracts, terms sheets, and other contract documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
              }
              ${uploading ? 'pointer-events-none opacity-50' : ''}
            `}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <div className="space-y-2">
              <p className="text-lg font-medium">
                {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
              </p>
              <p className="text-sm text-muted-foreground">
                or click to select files
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                <Badge variant="outline">PDF</Badge>
                <Badge variant="outline">DOC</Badge>
                <Badge variant="outline">DOCX</Badge>
                <Badge variant="outline">TXT</Badge>
                <Badge variant="outline">JPG</Badge>
                <Badge variant="outline">PNG</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Max file size: 50MB
              </p>
            </div>
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert className="mt-4">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Document List */}
      {documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Contract Documents ({documents.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getFileIcon(doc.type)}</span>
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <span>{formatFileSize(doc.size)}</span>
                        <span>•</span>
                        <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(doc.url, '_blank')}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(doc.url, '_blank')}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
