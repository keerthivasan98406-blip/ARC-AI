// Run this once with: node generate-icons.js
// Generates simple PNG icons for the extension using canvas (Node doesn't have canvas by default)
// Instead we'll create SVG files that Chrome accepts as icons via data URI hack
// Actually: Chrome requires actual PNG files. We'll create them as simple colored squares using sharp or jimp.
// Since we may not have those, we provide SVG fallback icons that can be manually converted.

// Simple SVG icon content — save as icon.svg and convert to PNG at 16/48/128px
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="28" fill="#0b101e"/>
  <rect x="4" y="4" width="120" height="120" rx="24" fill="url(#grad)"/>
  <defs>
    <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#7c3aed"/>
      <stop offset="100%" stop-color="#06b6d4"/>
    </linearGradient>
  </defs>
  <text x="64" y="80" text-anchor="middle" font-size="60" font-family="Arial">🤖</text>
</svg>`;

const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'icons');
if (!fs.existsSync(dir)) fs.mkdirSync(dir);

fs.writeFileSync(path.join(dir, 'icon.svg'), svg);
console.log('SVG icon written to icons/icon.svg');
console.log('Convert to PNG at 16x16, 48x48, 128x128 and save as icon16.png, icon48.png, icon128.png');
console.log('Or use any online SVG→PNG converter.');
