/**
 * Debug utility to check Firebase configuration
 * Available only in development mode
 * Run this in browser console: debugFirebaseConfig()
 */

export function debugFirebaseConfig() {
  console.log('🔍 Firebase Configuration Debug');
  console.log('='.repeat(60));
  
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  console.log('📋 Environment Variables:');
  Object.entries(config).forEach(([key, value]) => {
    const displayValue = key === 'apiKey' && value
      ? `${value.substring(0, 20)}...`
      : value || '❌ NOT SET';
    const status = value && !value.includes('your-') ? '✅' : '❌';
    console.log(`  ${status} ${key}: ${displayValue}`);
  });

  console.log('\n💡 Common Issues:');
  console.log('  1. If values show "NOT SET":');
  console.log('     - Check .env.local file exists');
  console.log('     - Restart dev server: npm run dev');
  console.log('  2. If API key shows but still get errors:');
  console.log('     - Check Firebase Console > Authentication > Sign-in method');
  console.log('     - Make sure Email/Password is ENABLED');
  console.log('     - Check API key restrictions in Firebase Console');
  console.log('  3. If storageBucket uses .firebasestorage.app:');
  console.log('     - This is correct for newer Firebase projects');
  console.log('     - Make sure Storage is enabled in Firebase Console');

  return config;
}

// Make it available globally for easy debugging
if (typeof window !== 'undefined') {
  (window as any).debugFirebaseConfig = debugFirebaseConfig;
}

