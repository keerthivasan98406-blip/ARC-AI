import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting AKbot AI Backend...');

const serverPath = path.join(__dirname, 'server', 'index.js');
const child = spawn('node', [serverPath], { stdio: 'inherit' });

child.on('error', (err) => {
  console.error('Failed to start server:', err);
});
