#!/usr/bin/env node

/**
 * Script to verify Firebase configuration
 * Run: node scripts/verify-firebase-config.js
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🔍 Verifying Firebase configuration...\n');

try {
  const envPath = join(projectRoot, '.env.local');
  const envContent = readFileSync(envPath, 'utf-8');
  
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
  ];

  let allValid = true;
  const config = {};

  requiredVars.forEach((varName) => {
    const regex = new RegExp(`^${varName}=(.+)$`, 'm');
    const match = envContent.match(regex);
    
    if (match && match[1]) {
      const value = match[1].trim();
      if (value && !value.includes('your-') && value !== '') {
        config[varName] = value;
        // Mask sensitive values
        const displayValue = varName.includes('API_KEY') 
          ? `${value.substring(0, 10)}...` 
          : value;
        console.log(`✅ ${varName}: ${displayValue}`);
      } else {
        console.log(`⚠️  ${varName}: placeholder value (needs to be replaced)`);
        allValid = false;
      }
    } else {
      console.log(`❌ ${varName}: missing`);
      allValid = false;
    }
  });

  console.log('\n' + '='.repeat(60));
  
  if (allValid) {
    console.log('✅ All Firebase configuration variables are set!');
    console.log('\n📋 Configuration summary:');
    console.log(`   Project ID: ${config.VITE_FIREBASE_PROJECT_ID}`);
    console.log(`   Auth Domain: ${config.VITE_FIREBASE_AUTH_DOMAIN}`);
    console.log(`   Storage Bucket: ${config.VITE_FIREBASE_STORAGE_BUCKET}`);
    console.log('\n💡 If you still get API key errors:');
    console.log('   1. Make sure you copied the values from Firebase Console');
    console.log('   2. Restart the dev server: npm run dev');
    console.log('   3. Check that values don\'t have quotes around them');
    console.log('   4. Verify API key restrictions in Firebase Console');
  } else {
    console.log('❌ Firebase configuration is incomplete.');
    console.log('\n📝 To fix this:');
    console.log('   1. Go to Firebase Console: https://console.firebase.google.com/');
    console.log('   2. Select your project (or create a new one)');
    console.log('   3. Go to Project Settings > General');
    console.log('   4. Scroll to "Your apps" section');
    console.log('   5. Click the Web icon (</>) or create a new web app');
    console.log('   6. Copy the config values to .env.local');
    console.log('\n📖 See FIREBASE_SETUP.md for detailed step-by-step instructions.');
  }
  
  process.exit(allValid ? 0 : 1);
} catch (error: any) {
  if (error.code === 'ENOENT') {
    console.log('❌ .env.local file not found!');
    console.log('\n📝 Create .env.local file:');
    console.log('   1. Copy .env.local.example to .env.local (if exists)');
    console.log('   2. Or create new .env.local file');
    console.log('   3. Add Firebase configuration values');
    console.log('\n📖 See FIREBASE_SETUP.md for instructions.');
  } else {
    console.error('❌ Error reading .env.local:', error.message);
  }
  process.exit(1);
}

