# Contract Document Upload Feature

## Overview

The contract document upload feature allows users to upload, view, and manage contract-related documents directly within the contract management system. Documents are stored securely in Supabase Storage with organization-based access control.

## Features

### 📁 Document Upload
- **Drag & Drop Interface** - Intuitive file upload with visual feedback
- **Multiple File Types** - Support for PDF, DOC, DOCX, TXT, JPG, PNG, GIF
- **File Size Limit** - 50MB maximum file size
- **Progress Tracking** - Real-time upload progress indication
- **Error Handling** - Comprehensive error messages and validation

### 👁️ Document Viewer
- **Inline Preview** - PDF and image files can be viewed directly in browser
- **File Management** - Download, delete, and organize documents
- **File Type Icons** - Visual indicators for different file types
- **Metadata Display** - File size, upload date, and type information
- **Tabbed Organization** - Group documents by type (Documents, Images, etc.)

### 🔒 Security & Access Control
- **Organization Isolation** - Documents are stored per organization
- **RLS Policies** - Row-level security for document access
- **Role-Based Access** - Admin/Manager can upload, all roles can view
- **Secure URLs** - Time-limited access to document URLs

## Setup Instructions

### 1. Install Dependencies
```bash
node scripts/install-dependencies.js
```

### 2. Set Up Supabase Storage
```bash
node scripts/run-storage-setup.js
```

### 3. Environment Variables
Ensure your `.env.local` has:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## File Structure

```
components/contracts/
├── ContractDocumentUpload.tsx    # Upload component with drag & drop
├── ContractDocumentViewer.tsx    # Document viewer and management
└── ContractDetailView.tsx        # Updated with Documents tab

scripts/
├── setup-contracts-storage.js    # Supabase storage setup
├── run-storage-setup.js         # Storage setup runner
└── install-dependencies.js      # Dependency installer
```

## Usage

### Upload Documents
1. Navigate to a contract detail view
2. Click the "Documents" tab
3. Drag and drop files or click to select
4. Files are automatically uploaded to Supabase Storage

### View Documents
1. In the Documents tab, click "View" on any document
2. PDF files open in an embedded viewer
3. Images display inline
4. Other files show download option

### Manage Documents
- **Download** - Click download button to save locally
- **Delete** - Click delete button to remove from storage
- **Organize** - Use tabs to filter by file type

## Storage Structure

```
supabase-storage/
└── contracts/
    └── {org_id}/
        └── {contract_id}/
            ├── {timestamp}-{random}.pdf
            ├── {timestamp}-{random}.docx
            └── ...
```

## Security Features

### Row-Level Security (RLS)
- **Upload Policy** - Only admin/manager roles can upload
- **View Policy** - All authenticated users can view org documents
- **Delete Policy** - Only admin/manager roles can delete
- **Update Policy** - Only admin/manager roles can update metadata

### File Validation
- **MIME Type Checking** - Only allowed file types accepted
- **File Size Limits** - 50MB maximum per file
- **Virus Scanning** - Supabase handles security scanning
- **Access Logging** - All file operations are logged

## API Integration

### Upload Document
```typescript
const { data, error } = await supabase.storage
  .from('contracts')
  .upload(`${orgId}/${contractId}/${fileName}`, file)
```

### Get Document URL
```typescript
const { data } = supabase.storage
  .from('contracts')
  .getPublicUrl(filePath)
```

### Delete Document
```typescript
const { error } = await supabase.storage
  .from('contracts')
  .remove([filePath])
```

## Error Handling

### Upload Errors
- File size too large
- Invalid file type
- Network connectivity issues
- Storage quota exceeded

### Access Errors
- Insufficient permissions
- Document not found
- Expired access token

## Performance Considerations

### File Size Optimization
- **Compression** - Images are automatically optimized
- **Chunked Upload** - Large files uploaded in chunks
- **Progress Tracking** - Real-time upload progress

### Caching
- **CDN Integration** - Supabase CDN for fast delivery
- **Browser Caching** - Documents cached in browser
- **Lazy Loading** - Documents loaded on demand

## Future Enhancements

### Planned Features
- **Document Versioning** - Track document changes over time
- **Digital Signatures** - E-signature integration
- **Document Templates** - Pre-built contract templates
- **OCR Integration** - Text extraction from images
- **Collaborative Editing** - Real-time document collaboration

### Advanced Security
- **Encryption at Rest** - Additional encryption layer
- **Audit Trails** - Complete document access logging
- **Watermarking** - Automatic document watermarking
- **Access Expiration** - Time-limited document access

## Troubleshooting

### Common Issues
1. **Upload Fails** - Check file size and type
2. **Permission Denied** - Verify user role and organization
3. **Slow Loading** - Check network and file size
4. **Preview Not Working** - Ensure file type is supported

### Debug Steps
1. Check browser console for errors
2. Verify Supabase connection
3. Confirm storage bucket exists
4. Check RLS policies are active
5. Validate file permissions

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Supabase storage documentation
3. Contact system administrator
4. Submit issue to development team
