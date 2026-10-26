// Generates minimal valid PNG icons for the Chrome extension
// Run once: node create-icons.js
// No external dependencies needed

const fs   = require('fs');
const path = require('path');
const dir  = path.join(__dirname, 'icons');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

// Minimal 1x1 valid PNG — we'll use a proper tiny PNG
// This is a real 16x16 purple square PNG in base64 (pre-generated)
const png16 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlz' +
  'AAALEwAACxMBAJqcGAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAABFSURB' +
  'VDiNY/z//z8DJYCJgUIw8A0Y+A6gHFAegQb+////Q7EBIwMVwKiBUQOjBkYNjBoYNTBqYNTAqAFi' +
  'AwAA//8DADLaBo+KGNu6AAAAAElFTkSuQmCC',
  'base64'
);

// For a proper colored icon, generate a simple PNG programmatically
// PNG structure: signature + IHDR + IDAT + IEND
function createSolidPNG(size, r, g, b) {
  // PNG signature
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);   // width
  ihdrData.writeUInt32BE(size, 4);   // height
  ihdrData.writeUInt8(8, 8);          // bit depth
  ihdrData.writeUInt8(2, 9);          // color type = RGB
  ihdrData.writeUInt8(0, 10);         // compression
  ihdrData.writeUInt8(0, 11);         // filter
  ihdrData.writeUInt8(0, 12);         // interlace
  const ihdr = makeChunk('IHDR', ihdrData);

  // IDAT — raw pixel data (no compression for simplicity via zlib)
  const zlib = require('zlib');
  const rowSize = 1 + size * 3; // filter byte + RGB per pixel
  const rawData = Buffer.alloc(size * rowSize);
  for (let y = 0; y < size; y++) {
    const base = y * rowSize;
    rawData[base] = 0; // filter type none
    for (let x = 0; x < size; x++) {
      // Simple gradient effect
      const px = base + 1 + x * 3;
      const t  = (x + y) / (size * 2);
      rawData[px]     = Math.round(r + (0x06 - r) * t);  // blend purple→cyan R
      rawData[px + 1] = Math.round(g + (0xb6 - g) * t);  // G
      rawData[px + 2] = Math.round(b + (0xd4 - b) * t);  // B
    }
  }
  const compressed = zlib.deflateSync(rawData);
  const idat = makeChunk('IDAT', compressed);

  // IEND
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

function makeChunk(type, data) {
  const crc32 = require('zlib').crc32 || makeCRC32;
  const typeBytes = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.concat([typeBytes, data]);
  const crcVal = computeCRC(crcBuf);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crcVal >>> 0, 0);
  return Buffer.concat([len, typeBytes, data, crc]);
}

// CRC32 implementation
function computeCRC(buf) {
  const table = makeCRCTable();
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    c = table[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  }
  return (c ^ 0xFFFFFFFF) >>> 0;
}

let _crcTable = null;
function makeCRCTable() {
  if (_crcTable) return _crcTable;
  _crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    _crcTable[n] = c;
  }
  return _crcTable;
}

// Generate icons: purple (#7c3aed) → cyan (#06b6d4) gradient
const sizes = [16, 48, 128];
for (const sz of sizes) {
  const png = createSolidPNG(sz, 0x7c, 0x3a, 0xed);
  const outPath = path.join(dir, `icon${sz}.png`);
  fs.writeFileSync(outPath, png);
  console.log(`✓ Created ${outPath}`);
}

console.log('\nIcons created! You can now load the extension in Chrome.');
