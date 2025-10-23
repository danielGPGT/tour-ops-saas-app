# Image Upload Setup Guide

## 🎯 Overview
This guide will help you set up image upload functionality for your tour operations SaaS application.

## 📋 What's Been Implemented

### ✅ Components Created:
- **`ImageUpload.tsx`** - Drag & drop image upload component with react-dropzone
- **`StorageService.ts`** - Supabase storage service for handling file uploads
- **SQL Setup Script** - Database setup for storage bucket and policies

### ✅ Features:
- **Drag & Drop Upload** - Users can drag images directly onto the upload area
- **Up to 5 Images** - Maximum of 5 images per product
- **Primary Image Selection** - Users can set which image is the primary one
- **Image Preview** - Real-time preview of uploaded images
- **File Validation** - Supports JPG, PNG, WebP up to 5MB each
- **Automatic Upload** - Images are uploaded after product creation

## 🚀 Setup Instructions

### 1. Run the Storage Setup SQL
Copy and paste the contents of `scripts/setup-storage.sql` into your Supabase SQL Editor and run it.

This will:
- Create the `product-images` storage bucket
- Set up proper access policies
- Configure file size limits and allowed MIME types

### 2. Verify Storage Bucket
After running the SQL, verify the bucket was created:
```sql
SELECT * FROM storage.buckets WHERE id = 'product-images';
```

### 3. Test Image Upload
1. Go to Products → Create New Product
2. Navigate to Step 5 (Images)
3. Drag and drop images or click "Choose Files"
4. Set primary image if desired
5. Complete the product creation
6. Images will be automatically uploaded to Supabase Storage

## 🎨 How It Works

### Upload Flow:
1. **User selects images** → Images are stored as preview URLs (blob:)
2. **Product is created** → Product record is saved to database
3. **Images are uploaded** → Preview URLs are converted to files and uploaded to Supabase Storage
4. **Product is updated** → Product record is updated with actual image URLs

### Storage Structure:
```
product-images/
├── {product-id}/
│   ├── {timestamp}-{random}.jpg
│   ├── {timestamp}-{random}.png
│   └── {timestamp}-{random}.webp
```

## 🔧 Configuration

### File Limits:
- **Maximum files**: 5 per product
- **File size**: 5MB per image
- **Supported formats**: JPG, PNG, WebP
- **Recommended size**: 1200x800 pixels

### Storage Policies:
- **Upload**: Authenticated users only
- **View**: Public (can be made private if needed)
- **Update/Delete**: Authenticated users only

## 🐛 Troubleshooting

### Common Issues:

1. **"Bucket not found" error**
   - Make sure you ran the SQL setup script
   - Check that the bucket exists in Supabase Dashboard → Storage

2. **Upload permissions error**
   - Verify your Supabase RLS policies are set up correctly
   - Check that the user is authenticated

3. **Images not showing after upload**
   - Check the browser console for errors
   - Verify the storage bucket is public
   - Check that the image URLs are accessible

### Debug Steps:
1. Check browser console for errors
2. Verify Supabase Storage bucket exists
3. Check storage policies in Supabase Dashboard
4. Test with a single image first

## 🎉 You're All Set!

The image upload functionality is now fully integrated into your product creation wizard. Users can:
- Upload up to 5 images per product
- Drag and drop images for easy upload
- Set a primary image
- See real-time previews
- Have images automatically uploaded to Supabase Storage

The system handles all the complexity of file uploads, storage, and database updates automatically!
