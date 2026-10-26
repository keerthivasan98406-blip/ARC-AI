import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: '/',
      build: {
        outDir: 'dist',
        assetsDir: 'assets',
        emptyOutDir: true,
      },
      server: {
        port: 3000,
        host: '0.0.0.0',
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Security-Policy': "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; script-src * 'unsafe-inline' 'unsafe-eval' blob: data: chrome-extension:; connect-src * 'unsafe-inline' http://127.0.0.1:* http://localhost:*; img-src * data: blob: https: http:; style-src * 'unsafe-inline';"
        },
        proxy: {
          '/api': {
            target: 'http://127.0.0.1:5000',
            changeOrigin: true,
            secure: false,
          }
        }
      },
      plugins: [react()],
      css: {
        postcss: {
          plugins: [tailwindcss, autoprefixer],
        },
      },
      define: {
        'import.meta.env.VITE_OPENROUTER_API_KEY': JSON.stringify(env.VITE_OPENROUTER_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
