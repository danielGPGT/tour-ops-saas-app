'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText, 
  Download, 
  Eye, 
  Trash2, 
  Upload,
  Calendar,
  File,
  Image,
  Archive
} from 'lucide-react'

interface ContractDocument {
  id: string
  name: string
  size: number
  type: string
  url: string
  uploaded_at: string
}

interface ContractDocumentViewerProps {
  contractId: number
  documents: ContractDocument[]
  onDocumentDelete?: (documentId: string) => void
  onDocumentUpload?: (documents: ContractDocument[]) => void
}

export function ContractDocumentViewer({
  contractId,
  documents,
  onDocumentDelete,
  onDocumentUpload
}: ContractDocumentViewerProps) {
  const [selectedDocument, setSelectedDocument] = useState<ContractDocument | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'viewer'>('list')

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <FileText className="w-5 h-5 text-red-600" />
    if (type.includes('word')) return <FileText className="w-5 h-5 text-blue-600" />
    if (type.includes('image')) return <Image className="w-5 h-5 text-green-600" />
    return <Archive className="w-5 h-5 text-gray-600" />
  }

  const getFileTypeLabel = (type: string) => {
    if (type.includes('pdf')) return 'PDF Document'
    if (type.includes('word')) return 'Word Document'
    if (type.includes('image')) return 'Image'
    return 'Document'
  }

  const handleViewDocument = (document: ContractDocument) => {
    setSelectedDocument(document)
    setViewMode('viewer')
  }

  const handleDownloadDocument = (document: ContractDocument) => {
    const link = document.createElement('a')
    link.href = document.url
    link.download = document.name
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDeleteDocument = (documentId: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      onDocumentDelete?.(documentId)
    }
  }

  const groupedDocuments = documents.reduce((acc, doc) => {
    const type = doc.type.split('/')[0]
    if (!acc[type]) acc[type] = []
    acc[type].push(doc)
    return acc
  }, {} as Record<string, ContractDocument[]>)

  if (viewMode === 'viewer' && selectedDocument) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => setViewMode('list')}
            >
              ← Back to Documents
            </Button>
            <div>
              <h3 className="text-lg font-medium">{selectedDocument.name}</h3>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(selectedDocument.size)} • {getFileTypeLabel(selectedDocument.type)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => handleDownloadDocument(selectedDocument)}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button
              variant="outline"
              onClick={() => handleDeleteDocument(selectedDocument.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {selectedDocument.type.includes('pdf') ? (
              <iframe
                src={selectedDocument.url}
                className="w-full h-[600px] border-0"
                title={selectedDocument.name}
              />
            ) : selectedDocument.type.includes('image') ? (
              <img
                src={selectedDocument.url}
                alt={selectedDocument.name}
                className="w-full h-auto max-h-[600px] object-contain"
              />
            ) : (
              <div className="flex items-center justify-center h-[600px] bg-muted">
                <div className="text-center space-y-4">
                  <File className="w-16 h-16 text-muted-foreground mx-auto" />
                  <div>
                    <p className="text-lg font-medium">Preview not available</p>
                    <p className="text-muted-foreground">
                      This file type cannot be previewed in the browser
                    </p>
                    <Button
                      className="mt-4"
                      onClick={() => handleDownloadDocument(selectedDocument)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download to view
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Contract Documents</h2>
          <p className="text-muted-foreground">
            {documents.length} document{documents.length !== 1 ? 's' : ''} uploaded
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            <FileText className="w-4 h-4 mr-1" />
            {documents.length} files
          </Badge>
        </div>
      </div>

      {/* Document Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Documents</TabsTrigger>
          {Object.keys(groupedDocuments).map((type) => (
            <TabsTrigger key={type} value={type}>
              {type === 'application' ? 'Documents' : type === 'image' ? 'Images' : type}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {documents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No documents uploaded</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Upload contract documents, terms sheets, and other related files
                </p>
                <Button>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Documents
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <Card key={doc.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {getFileIcon(doc.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{doc.name}</h4>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                          <span>{formatFileSize(doc.size)}</span>
                          <span>•</span>
                          <span>{getFileTypeLabel(doc.type)}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDocument(doc)}
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadDocument(doc)}
                      >
                        <Download className="w-4 h-4" />
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {Object.entries(groupedDocuments).map(([type, docs]) => (
          <TabsContent key={type} value={type} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {docs.map((doc) => (
                <Card key={doc.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {getFileIcon(doc.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{doc.name}</h4>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                          <span>{formatFileSize(doc.size)}</span>
                          <span>•</span>
                          <span>{getFileTypeLabel(doc.type)}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDocument(doc)}
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadDocument(doc)}
                      >
                        <Download className="w-4 h-4" />
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
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
