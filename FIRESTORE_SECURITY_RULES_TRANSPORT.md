# Firestore Security Rules - Transport Support

## Updated Rules for Transport Subcollection

The security rules need to include support for the `transports` subcollection. Update your Firestore Security Rules in Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Trip Plans Collection
    match /tripPlans/{planId} {
      // Allow read/write if user is authenticated and owns the plan
      allow read: if request.auth != null && 
                     (resource.data.userId == request.auth.uid || 
                      resource.data.isPublic == true);
      
      allow create: if request.auth != null && 
                       request.resource.data.userId == request.auth.uid;
      
      allow update: if request.auth != null && 
                       resource.data.userId == request.auth.uid;
      
      allow delete: if request.auth != null && 
                       resource.data.userId == request.auth.uid;
      
      // Days Subcollection
      match /days/{dayId} {
        // Allow read/write if user can access the parent plan
        allow read: if request.auth != null;
        allow write: if request.auth != null;
        
        // Locations Subcollection
        match /locations/{locationId} {
          // Allow read/write if user can access the parent plan
          allow read: if request.auth != null;
          allow write: if request.auth != null;
        }
        
        // Transports Subcollection (NEW)
        match /transports/{transportId} {
          // Allow read/write if user can access the parent plan
          allow read: if request.auth != null;
          allow write: if request.auth != null;
        }
      }
    }
  }
}
```

## Key Changes

Added the `transports` subcollection rules:
```javascript
match /transports/{transportId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null;
}
```

This allows authenticated users to read and write transport documents within days they have access to.

## Steps to Update

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Rules**
4. Update the rules to include the `transports` subcollection
5. Click **"Publish"**
6. Refresh your browser
