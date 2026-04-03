import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Validate environment variables
const requiredEnvVars = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check for missing or placeholder values
const missingVars: string[] = [];
Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (!value || value === `your-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}` || value.includes('your-')) {
    missingVars.push(key);
  }
});

if (missingVars.length > 0) {
  console.error('❌ Firebase configuration error: Missing or invalid environment variables:', missingVars);
  console.error('Please update .env.local with your Firebase credentials from Firebase Console.');
  console.error('See FIREBASE_SETUP.md for instructions.');
}

// Firebase configuration
const firebaseConfig = {
  apiKey: requiredEnvVars.apiKey,
  authDomain: requiredEnvVars.authDomain,
  projectId: requiredEnvVars.projectId,
  storageBucket: requiredEnvVars.storageBucket,
  messagingSenderId: requiredEnvVars.messagingSenderId,
  appId: requiredEnvVars.appId,
};

// Validate that all required config values are present
const isValidConfig = Object.values(firebaseConfig).every(
  (value) => value && typeof value === 'string' && value.length > 0 && !value.includes('your-')
);

if (!isValidConfig) {
  const missing = Object.entries(firebaseConfig)
    .filter(([_, value]) => !value || typeof value !== 'string' || value.length === 0 || value.includes('your-'))
    .map(([key]) => key);
  
  console.error('❌ Firebase configuration error: Missing or invalid values for:', missing);
  console.error('Current config:', {
    apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 10)}...` : 'MISSING',
    authDomain: firebaseConfig.authDomain || 'MISSING',
    projectId: firebaseConfig.projectId || 'MISSING',
  });
  throw new Error(
    `Firebase configuration is incomplete. Missing: ${missing.join(', ')}. ` +
    'Please check your .env.local file and restart the dev server.'
  );
}

// Initialize Firebase only if it hasn't been initialized yet
let app: FirebaseApp;
try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    console.log('✅ Firebase initialized successfully');
  } else {
    app = getApps()[0];
  }
} catch (error: any) {
  console.error('❌ Firebase initialization error:', error);
  if (error.code === 'app/invalid-app-credentials' || error.message?.includes('configuration')) {
    throw new Error(
      'Firebase configuration error. Please check your .env.local file and ensure all values are correct. ' +
      'Make sure to restart the dev server after changing .env.local'
    );
  }
  throw error;
}

// Initialize Firebase services
export const auth: Auth = getAuth(app);

// Initialize Firestore with persistent cache for better performance
export let db: Firestore;
try {
  // Use new cache API (replaces deprecated enableIndexedDbPersistence)
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
  console.log('✅ Firestore initialized with persistent cache');
} catch (error: any) {
  console.warn('⚠️ Failed to initialize Firestore with persistent cache, using default:', error);
  // Fallback to default Firestore if cache initialization fails
  db = getFirestore(app);
}

export const storage: FirebaseStorage = getStorage(app);

// Export config for debugging (only in development)
if (import.meta.env.DEV) {
  console.log('🔧 Firebase Config (dev mode):', {
    apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 20)}...` : 'MISSING',
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
  });
}

export default app;

