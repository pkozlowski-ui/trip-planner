# Quick Fix: Missing or Insufficient Permissions

## Problem
Error: "Missing or insufficient permissions" when loading trip plans.

## Quick Solution (5 minutes)

### Step 1: Open Firebase Console
1. Go to: https://console.firebase.google.com/
2. Select your project
3. Click **Firestore Database** → **Rules** (left sidebar)

### Step 2: Copy This Code
Copy the entire code block below:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tripPlans/{planId} {
      allow read: if request.auth != null && 
                     (resource.data.userId == request.auth.uid || 
                      resource.data.isPublic == true);
      allow create: if request.auth != null && 
                       request.resource.data.userId == request.auth.uid;
      allow update: if request.auth != null && 
                       resource.data.userId == request.auth.uid;
      allow delete: if request.auth != null && 
                       resource.data.userId == request.auth.uid;
      
      match /days/{dayId} {
        allow read, write: if request.auth != null;
        
        match /locations/{locationId} {
          allow read, write: if request.auth != null;
        }
      }
    }
  }
}
```

### Step 3: Paste and Publish
1. **Delete** all existing rules in the editor
2. **Paste** the code above
3. Click **"Publish"** button
4. Wait for confirmation

### Step 4: Test
1. **Refresh browser** (hard refresh: `Cmd+Shift+R` or `Ctrl+Shift+R`)
2. Try loading trip plans again
3. Error should be gone! ✅

## What These Rules Do

- ✅ **Authenticated users** can read their own trip plans
- ✅ **Authenticated users** can read public trip plans
- ✅ **Authenticated users** can create plans (must set their own `userId`)
- ✅ **Authenticated users** can update/delete their own plans
- ✅ **Authenticated users** can read/write days and locations

## Still Having Issues?

1. **Check if you're logged in**: Look at the top right of the app
2. **Check browser console** (F12) for exact error message
3. **Verify rules were published**: Check Firebase Console → Rules tab
4. **Try logging out and back in**: Sometimes auth tokens need refresh

## Need More Details?

See `FIRESTORE_SECURITY_RULES.md` for detailed explanation and testing.

