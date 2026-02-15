# Supabase Storage Setup for Avatar Upload

This guide explains how to set up Supabase Storage to enable avatar uploads in the application.

## 1. Create Storage Bucket

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **Create a new bucket**
4. Configure the bucket:
   - **Name**: `avatars`
   - **Public bucket**: Enable (checked)
   - **File size limit**: 2MB (optional, also enforced in API)
   - **Allowed MIME types**: `image/jpeg, image/jpg, image/png, image/webp` (optional)

## 2. Set Up Storage Policies

After creating the bucket, you need to set up Row Level Security (RLS) policies:

### Policy 1: Allow authenticated users to upload their own avatars

```sql
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'avatars'
  AND auth.uid()::text = (storage.filename(name) LIKE auth.uid()::text || '-%')
);
```

### Policy 2: Allow public read access to avatars

```sql
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

### Policy 3: Allow users to delete their own avatars

```sql
CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = 'avatars'
  AND auth.uid()::text = (storage.filename(name) LIKE auth.uid()::text || '-%')
);
```

## 3. Using the Supabase Dashboard (Alternative Method)

If you prefer using the UI:

1. Go to **Storage** → **Policies** → **New Policy**
2. For **Insert (Upload)**:
   - Target roles: `authenticated`
   - Policy name: `Users can upload their own avatar`
   - USING expression:
     ```sql
     bucket_id = 'avatars' AND (storage.foldername(name))[1] = 'avatars'
     ```
   - WITH CHECK expression:
     ```sql
     auth.uid()::text = (storage.filename(name) LIKE auth.uid()::text || '-%')
     ```

3. For **Select (Download)**:
   - Target roles: `public`
   - Policy name: `Avatar images are publicly accessible`
   - USING expression:
     ```sql
     bucket_id = 'avatars'
     ```

4. For **Delete**:
   - Target roles: `authenticated`
   - Policy name: `Users can delete their own avatar`
   - USING expression:
     ```sql
     bucket_id = 'avatars' AND auth.uid()::text = (storage.filename(name) LIKE auth.uid()::text || '-%')
     ```

## 4. Test the Setup

1. Run the development server: `pnpm dev`
2. Log in to the application
3. Go to the Profile page
4. Click "Upload Avatar" and select an image
5. The image should upload successfully and appear in the avatar preview
6. Check Supabase Storage dashboard to verify the file was uploaded

## 5. File Naming Convention

The application uses the following naming convention for avatar files:

```
avatars/{user_id}-{timestamp}.{extension}
```

Example: `avatars/550e8400-e29b-41d4-a716-446655440000-1708012345678.jpg`

This ensures:
- Files are organized in the `avatars` folder
- Each user can only upload files with their user ID
- Unique timestamps prevent filename collisions
- The file extension is preserved from the original upload

## 6. Security Features

The implementation includes several security measures:

- **File type validation**: Only JPEG, PNG, and WebP images are allowed
- **File size limit**: Maximum 2MB enforced both client-side and server-side
- **User authentication**: Only authenticated users can upload
- **User isolation**: Users can only upload/delete their own avatars
- **Public read access**: Avatars are publicly readable (necessary for displaying them)

## 7. Troubleshooting

### Issue: "Failed to upload file" error

**Possible causes:**
1. Storage bucket not created
2. RLS policies not set up correctly
3. File exceeds size limit
4. Invalid file type

**Solution:**
- Verify the `avatars` bucket exists in Supabase Storage
- Check that all policies are created and enabled
- Ensure file is under 2MB and is a valid image type

### Issue: Avatar not displaying after upload

**Possible causes:**
1. Public read policy not set up
2. Profile not updated with new avatar URL

**Solution:**
- Verify the "Avatar images are publicly accessible" policy is enabled
- Check browser console for any CORS or network errors
- Refresh the page to reload the profile data

### Issue: Can't delete old avatars

**Note:** The current implementation doesn't automatically delete old avatars when uploading new ones. This is intentional to prevent data loss, but you may want to implement cleanup logic in the future.

To manually delete old avatars:
1. Go to Supabase Storage dashboard
2. Navigate to the `avatars` bucket
3. Delete old files manually

## 8. Future Enhancements

Consider implementing:
- Automatic deletion of old avatars when uploading new ones
- Image resizing/optimization on the server side
- CDN integration for faster image delivery
- Support for drag-and-drop upload
- Crop/edit functionality before upload
