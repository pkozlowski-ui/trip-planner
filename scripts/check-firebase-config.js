#!/usr/bin/env node

/**
 * Script to check Firebase configuration
 * Run: node scripts/check-firebase-config.js
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

try {
  const envContent = readFileSync(join(projectRoot, '.env.local'), 'utf-8');
  
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
  ];

  console.log('🔍 Checking Firebase configuration...\n');

  let allValid = true;
  const config = {};

  requiredVars.forEach((varName) => {
    const regex = new RegExp(`^${varName}=(.+)$`, 'm');
    const match = envContent.match(regex);
    
    if (match && match[1]) {
      const value = match[1].trim();
      if (value && !value.includes('your-') && value !== '') {
        config[varName] = value;
        console.log(`✅ ${varName}: configured`);
      } else {
        console.log(`⚠️  ${varName}: placeholder value (needs to be replaced)`);
        allValid = false;
      }
    } else {
      console.log(`❌ ${varName}: missing`);
      allValid = false;
    }
  });

  console.log('\n' + '='.repeat(50));
  
  if (allValid) {
    console.log('✅ All Firebase configuration variables are set!');
    console.log('\n📋 Configuration summary:');
    console.log(`   Project ID: ${config.VITE_FIREBASE_PROJECT_ID}`);
    console.log(`   Auth Domain: ${config.VITE_FIREBASE_AUTH_DOMAIN}`);
    console.log(`   Storage Bucket: ${config.VITE_FIREBASE_STORAGE_BUCKET}`);
    console.log('\n🚀 You can now test Firebase initialization in your app.');
  } else {
    console.log('❌ Firebase configuration is incomplete.');
    console.log('\n📝 Next steps:');
    console.log('   1. Go to Firebase Console: https://console.firebase.google.com/');
    console.log('   2. Create a new project or select existing one');
    console.log('   3. Go to Project Settings > General');
    console.log('   4. Scroll to "Your apps" and click Web icon');
    console.log('   5. Copy the config values to .env.local');
    console.log('\n📖 See FIREBASE_SETUP.md for detailed instructions.');
  }
  
  process.exit(allValid ? 0 : 1);
} catch (error) {
  if (error.code === 'ENOENT') {
    console.log('❌ .env.local file not found!');
    console.log('\n📝 Create .env.local file with Firebase configuration.');
    console.log('   See FIREBASE_SETUP.md for instructions.');
  } else {
    console.error('❌ Error reading .env.local:', error.message);
  }
  process.exit(1);
}

