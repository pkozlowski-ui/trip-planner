# Firebase Storage Security Rules

## Storage Rules for Media Uploads

To enable image uploads for locations, you need to configure Firebase Storage Security Rules.

### Setup Instructions

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Storage** → **Rules** (in the tabs near the top)
4. Copy and paste the following rules:

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Trip Plan Images
    match /plans/{planId}/locations/{locationId}/images/{imageId} {
      // Allow read if user is authenticated
      allow read: if request.auth != null;
      
      // Allow write (upload) if:
      // - User is authenticated
      // - File is an image (jpeg, png, webp, gif)
      // - File size is less than 5MB
      allow write: if request.auth != null
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
      
      // Allow delete if user is authenticated
      allow delete: if request.auth != null;
    }
  }
}
```

5. Click **"Publish"** to save the rules

## Rule Explanation

### Path Structure
- `/plans/{planId}/locations/{locationId}/images/{imageId}`
- Organized by trip plan → location → individual images
- Easy to manage and clean up when plans/locations are deleted

### Permissions

#### Read
- Any authenticated user can view images
- Required for displaying images in shared plans

#### Write (Upload)
- User must be authenticated
- File must be an image (JPEG, PNG, WebP, GIF)
- Maximum file size: 5MB
- Prevents abuse and excessive storage usage

#### Delete
- User must be authenticated
- Allows cleanup of unwanted images

## File Size Limits

Current limit: **5MB per image**

To change this limit, modify the `request.resource.size < 5 * 1024 * 1024` line:
- 1MB: `1 * 1024 * 1024`
- 10MB: `10 * 1024 * 1024`
- 2MB: `2 * 1024 * 1024`

## Supported File Types

Current: All image types (`image/*`)

To restrict to specific formats:
```javascript
request.resource.contentType.matches('image/(jpeg|png|webp)')
```

## Production Enhancements

For production, consider adding:

1. **User Ownership Check**
```javascript
// Check if user owns the plan
allow write: if request.auth != null
             && request.resource.size < 5 * 1024 * 1024
             && request.resource.contentType.matches('image/.*')
             && firestore.get(/databases/(default)/documents/tripPlans/$(planId)).data.userId == request.auth.uid;
```

2. **Rate Limiting**
- Implement Cloud Functions to track upload frequency
- Prevent spam uploads

3. **Image Validation**
- Use Cloud Functions to validate image dimensions
- Automatically generate thumbnails
- Compress images for web delivery

4. **Storage Quotas**
- Set per-user storage limits
- Track total storage usage per plan
- Clean up unused images automatically

## Testing

After publishing rules:
1. Refresh your browser (`Cmd+Shift+R` or `Ctrl+Shift+R`)
2. Try uploading an image to a location
3. Verify image appears in Firebase Storage Console
4. Check that image URL works in the app

## Troubleshooting

### "Permission denied" error
- Verify user is authenticated
- Check file size is under 5MB
- Confirm file type is an image
- Ensure rules are published

### Images not appearing
- Check Firebase Storage Console for uploaded files
- Verify download URL is correct
- Check browser console for errors

### Upload fails silently
- File might be too large (>5MB)
- User might not be authenticated
- Check browser console for detailed error

## Need Help?

If you encounter issues:
1. Check browser console for error messages
2. Verify Storage rules are published
3. Test in Firebase Console → Storage → Rules Playground
4. Check that storage bucket is enabled in Firebase Console
