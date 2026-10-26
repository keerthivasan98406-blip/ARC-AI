import fs from 'fs';
import path from 'path';

console.log('🔍 Verifying Environment Variables...');
const envUrl = process.env.VITE_API_URL;
console.log('Current VITE_API_URL:', envUrl || 'NOT SET');
if (!envUrl) {
  console.error('❌ VITE_API_URL is missing!');
  process.exit(1);
} else {
  console.log('✅ VITE_API_URL is configured:', envUrl);
}
