# Firebase Services

## Configuration

Firebase is configured in `config.ts` with automatic validation of environment variables.

### Environment Variables

All Firebase configuration is loaded from `.env.local`:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

See `FIREBASE_SETUP.md` for detailed setup instructions.

## Services

### Authentication (`auth.ts`)

**Available functions:**
- `registerWithEmail(email, password, displayName?)` - Register new user
- `signInWithEmail(email, password)` - Sign in existing user
- `signInWithGoogle()` - Sign in with Google
- `signOutUser()` - Sign out current user
- `resetPassword(email)` - Send password reset email
- `getCurrentUser()` - Get current authenticated user

**Usage:**
```typescript
import { registerWithEmail, signInWithEmail, signInWithGoogle } from '@/services/firebase/auth';

// Register
await registerWithEmail('user@example.com', 'password123', 'John Doe');

// Sign in
await signInWithEmail('user@example.com', 'password123');

// Sign in with Google
await signInWithGoogle();
```

### Firestore Service (`firestore.ts`)

**Trip Plans:**
- `getTripPlans(userId)` - Get all trip plans for a user
- `getTripPlan(planId)` - Get a single trip plan with all days and locations
- `createTripPlan(userId, planData)` - Create a new trip plan
- `updateTripPlan(planId, updates)` - Update trip plan metadata
- `deleteTripPlan(planId)` - Delete trip plan and all its days/locations

**Days:**
- `getDays(planId)` - Get all days for a trip plan
- `createDay(planId, dayData)` - Create a new day
- `updateDay(planId, dayId, updates)` - Update a day
- `deleteDay(planId, dayId)` - Delete a day and all its locations

**Locations:**
- `getLocations(planId, dayId)` - Get all locations for a day
- `createLocation(planId, dayId, locationData)` - Create a new location
- `updateLocation(planId, dayId, locationId, updates)` - Update a location
- `deleteLocation(planId, dayId, locationId)` - Delete a location

**Media:**
- `addMediaToLocation(planId, dayId, locationId, media)` - Add media to a location
- `removeMediaFromLocation(planId, dayId, locationId, mediaId)` - Remove media from a location

**Usage:**
```typescript
import {
  getTripPlans,
  createTripPlan,
  createDay,
  createLocation,
} from '@/services/firebase/firestore';

// Get all user's trip plans
const plans = await getTripPlans(userId);

// Create a new trip plan
const planId = await createTripPlan(userId, {
  title: 'My Trip',
  description: 'A great adventure',
  isPublic: false,
});

// Add a day
const dayId = await createDay(planId, {
  dayNumber: 1,
  date: new Date('2024-06-01'),
});

// Add a location
const locationId = await createLocation(planId, dayId, {
  name: 'Paris',
  category: 'city',
  coordinates: { lat: 48.8566, lng: 2.3522 },
  order: 1,
});
```

### Firestore Database (`db`)

Direct access to Firestore database instance:
```typescript
import { db } from '@/services/firebase/config';
import { collection, addDoc, getDocs } from 'firebase/firestore';

// Direct Firestore operations (use firestore.ts service functions instead)
const tripsRef = collection(db, 'tripPlans');
```

### Storage (`storage`)

**Usage:**
```typescript
import { storage } from '@/services/firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Upload file
const storageRef = ref(storage, 'images/photo.jpg');
await uploadBytes(storageRef, file);
const url = await getDownloadURL(storageRef);
```

## Debugging

In development mode, use browser console:
```javascript
debugFirebaseConfig()
```

This will show detailed Firebase configuration status.

## Troubleshooting

See:
- `FIREBASE_SETUP.md` - Initial setup
- `FIREBASE_TROUBLESHOOTING.md` - Common issues
- `FIX_AUTH_ERROR.md` - Authentication errors

