# Firestore Indexes Setup Guide

## Problem
Slow queries (20+ seconds) when loading trip plans. This is likely due to missing Firestore indexes.

## How to Check for Missing Indexes

### Method 1: Run Query and Get Automatic Link (RECOMMENDED) ⭐
**This is the easiest and recommended method by Firebase:**

1. Open your app in the browser
2. Open Developer Tools (F12)
3. Go to Console tab
4. Try to load a trip plan (or perform the action that's slow)
5. Look for errors in the console
6. **Firebase will automatically provide a clickable link** in the error message that looks like:
   ```
   ⚠️ MISSING INDEX: Query requires an index...
   🔗 CLICK THIS LINK TO CREATE THE INDEX AUTOMATICALLY:
   https://console.firebase.google.com/project/your-project/firestore/indexes?create_composite=...
   ```
7. **Click the link** - it will open Firebase Console with the index pre-configured
8. Click "Create Index" button
9. Wait for the index to build (1-5 minutes)

**Why this method is best:**
- ✅ Firebase automatically detects what index is needed
- ✅ Link pre-configures the index correctly
- ✅ No manual configuration needed
- ✅ Less chance of errors

### Method 2: Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Indexes**
4. Look for any indexes marked as "Building" or check the "Missing Indexes" section

## Required Indexes

Based on the code analysis, you need these indexes:

### 1. Days Collection Index
**Collection Path**: `tripPlans/{planId}/days`
**Fields**:
- `dayNumber` (Ascending)

**Why**: The `getDays()` function uses `orderBy('dayNumber', 'asc')`

### 2. Locations Collection Index
**Collection Path**: `tripPlans/{planId}/days/{dayId}/locations`
**Fields**:
- `order` (Ascending)

**Why**: The `getLocations()` function uses `orderBy('order', 'asc')`

### 3. Trip Plans Collection Index (if needed)
**Collection Path**: `tripPlans`
**Fields**:
- `userId` (Ascending)

**Why**: The `getTripPlans()` function uses `where('userId', '==', userId)`. This should have an automatic index, but if you see errors, create it manually.

## How to Create Indexes

### Option 1: Use Automatic Link from Firebase (RECOMMENDED) ⭐
**This is the method recommended by Firebase:**

1. **Run your query** - Open the app and try to load a trip plan
2. **Check browser console** - Open Developer Tools (F12) → Console tab
3. **Look for the error** - You'll see an error about missing index
4. **Find the automatic link** - Firebase includes a clickable link in the error message:
   ```
   🔗 CLICK THIS LINK TO CREATE THE INDEX AUTOMATICALLY:
   https://console.firebase.google.com/project/.../firestore/indexes?create_composite=...
   ```
5. **Click the link** - It opens Firebase Console with the index already configured
6. **Click "Create Index"** - The index configuration is pre-filled
7. **Wait for build** - Usually takes 1-5 minutes

**Advantages:**
- ✅ No manual configuration needed
- ✅ Firebase knows exactly what index is required
- ✅ Pre-configured correctly
- ✅ Less chance of mistakes

### Option 2: Manual Creation
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Indexes**
4. Click **"Create Index"**
5. Configure:
   - **Collection ID**: Enter the collection path (e.g., `days` for subcollection)
   - **Fields**: Add fields and sort order
   - **Query scope**: Collection (default)
6. Click **"Create"**
7. Wait for index to build

### Option 3: Using Firebase CLI (Advanced)
If you have Firebase CLI installed:
```bash
firebase deploy --only firestore:indexes
```

## Index Creation Details

### For Days Collection:
```
Collection: tripPlans/{planId}/days
Field: dayNumber
Order: Ascending
Query scope: Collection
```

### For Locations Collection:
```
Collection: tripPlans/{planId}/days/{dayId}/locations
Field: order
Order: Ascending
Query scope: Collection
```

## After Creating Indexes

1. **Wait for Index to Build**: Indexes usually build in 1-5 minutes
2. **Check Status**: In Firebase Console → Indexes, you'll see "Building" → "Enabled"
3. **Test**: Try loading a trip plan again
4. **Expected Performance**:
   - First load: < 2 seconds
   - Cached load: < 100ms

## Troubleshooting

### Index Still Building
- Wait a few more minutes
- Check Firebase Console for status
- Large collections may take longer

### Still Getting Errors
- Check browser console for exact error message
- Verify index was created for correct collection path
- Ensure field names match exactly (case-sensitive)

### Performance Still Slow
- Check Firestore → Usage for unexpected read counts
- Review Security Rules (complex rules can slow queries)
- Check network connection
- Verify Firestore region matches your location

## Security Rules Check

While checking indexes, also review Security Rules:
1. Go to **Firestore Database** → **Rules**
2. Ensure rules are simple and don't require reading multiple documents
3. Test rules in **Rules Playground**

Example of simple, fast rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tripPlans/{planId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      
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

## Next Steps

1. ✅ Create missing indexes
2. ✅ Wait for indexes to build
3. ✅ Test performance
4. ✅ Review Security Rules
5. ✅ Monitor Firestore Usage

## Expected Results

After creating indexes:
- **Dashboard load**: < 500ms
- **Plan load (first)**: < 2 seconds
- **Plan load (cached)**: < 100ms
- **No console errors**: Missing index errors should disappear

