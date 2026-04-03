# Firestore Security Rules Setup

## Problem
Error: "Missing or insufficient permissions" when loading trip plans.

## Solution
Configure Firestore Security Rules in Firebase Console to allow authenticated users to read/write their own trip plans.

## Step-by-Step Instructions

### 1. Open Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Rules** (in the left sidebar)

### 2. Copy and Paste Security Rules

Copy the following rules and paste them into the Rules editor:

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
      }
    }
  }
}
```

### 3. Publish Rules
1. Click **"Publish"** button at the top of the Rules editor
2. Wait for confirmation that rules have been published
3. Rules take effect immediately

## Rule Explanation

### Trip Plans (`/tripPlans/{planId}`)
- **Read**: User must be authenticated AND (owns the plan OR plan is public)
- **Create**: User must be authenticated AND must set `userId` to their own UID
- **Update**: User must be authenticated AND must own the plan
- **Delete**: User must be authenticated AND must own the plan

### Days (`/tripPlans/{planId}/days/{dayId}`)
- **Read/Write**: User must be authenticated (simplified - assumes parent plan access is checked)

### Locations (`/tripPlans/{planId}/days/{dayId}/locations/{locationId}`)
- **Read/Write**: User must be authenticated (simplified - assumes parent plan access is checked)

## Testing Rules

### Using Rules Playground (Recommended)
1. In Firebase Console → Firestore → Rules
2. Click **"Rules Playground"** tab
3. Test scenarios:
   - **Read own plan**: Authenticated user reading their own plan
   - **Read public plan**: Authenticated user reading public plan
   - **Create plan**: Authenticated user creating a plan
   - **Update own plan**: Authenticated user updating their own plan
   - **Delete own plan**: Authenticated user deleting their own plan

### Test Scenarios

#### Scenario 1: Read Own Plan
- **Location**: `tripPlans/{planId}`
- **Method**: `get`
- **Authenticated**: Yes
- **User ID**: `test-user-123`
- **Resource Data**: `{ userId: "test-user-123", isPublic: false }`
- **Expected**: ✅ Allow

#### Scenario 2: Read Public Plan
- **Location**: `tripPlans/{planId}`
- **Method**: `get`
- **Authenticated**: Yes
- **User ID**: `test-user-123`
- **Resource Data**: `{ userId: "other-user-456", isPublic: true }`
- **Expected**: ✅ Allow

#### Scenario 3: Create Plan
- **Location**: `tripPlans/{planId}`
- **Method**: `create`
- **Authenticated**: Yes
- **User ID**: `test-user-123`
- **Request Data**: `{ userId: "test-user-123", title: "My Trip" }`
- **Expected**: ✅ Allow

#### Scenario 4: Update Own Plan
- **Location**: `tripPlans/{planId}`
- **Method**: `update`
- **Authenticated**: Yes
- **User ID**: `test-user-123`
- **Resource Data**: `{ userId: "test-user-123" }`
- **Request Data**: `{ title: "Updated Title" }`
- **Expected**: ✅ Allow

## Common Issues

### Issue 1: "Missing or insufficient permissions"
**Cause**: Rules are too restrictive or user is not authenticated.

**Solution**:
1. Check if user is logged in (check browser console)
2. Verify rules allow authenticated users
3. Check if `userId` matches `request.auth.uid`

### Issue 2: Can't create plans
**Cause**: Rules require `userId` to match authenticated user's UID.

**Solution**:
1. Ensure `createTripPlan` sets `userId` correctly
2. Check that user is authenticated before creating
3. Verify rules allow creation with matching `userId`

### Issue 3: Can't read subcollections (days/locations)
**Cause**: Rules for subcollections are too restrictive.

**Solution**:
1. Ensure subcollection rules allow authenticated users
2. Check that parent plan access is allowed
3. Verify rules don't require additional checks for subcollections

## Development vs Production

### Development (Current Rules)
- Allows authenticated users to read/write their own plans
- Allows reading public plans
- Simplified subcollection rules (assumes parent access)

### Production (Recommended Enhancements)
For production, consider adding:
- Rate limiting
- Data validation
- More granular permissions
- Audit logging

Example production rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tripPlans/{planId} {
      // Validate data structure
      allow create: if request.auth != null && 
                       request.resource.data.userId == request.auth.uid &&
                       request.resource.data.keys().hasAll(['title', 'userId', 'createdAt', 'updatedAt']);
      
      allow read: if request.auth != null && 
                     (resource.data.userId == request.auth.uid || 
                      resource.data.isPublic == true);
      
      allow update: if request.auth != null && 
                       resource.data.userId == request.auth.uid &&
                       !request.resource.data.diff(resource.data).affectedKeys().hasAny(['userId', 'createdAt']);
      
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

## After Updating Rules

1. **Publish rules** in Firebase Console
2. **Refresh browser** (hard refresh: `Cmd+Shift+R` or `Ctrl+Shift+R`)
3. **Test**: Try loading trip plans again
4. **Check console**: Should no longer see "Missing or insufficient permissions" error

## Verification

After updating rules, verify:
- ✅ Can load trip plans list
- ✅ Can create new trip plan
- ✅ Can read own trip plan
- ✅ Can update own trip plan
- ✅ Can delete own trip plan
- ✅ Can read days and locations

## Need Help?

If you still see permission errors:
1. Check browser console for exact error message
2. Verify user is authenticated (`request.auth != null`)
3. Check Rules Playground in Firebase Console
4. Verify `userId` matches `request.auth.uid` in your data

