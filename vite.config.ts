import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';
import dotenv from 'dotenv';

dotenv.config();

function devApiPlugin(): Plugin {
  return {
    name: 'dev-api-chat-handler',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = req.url ? req.url.split('?')[0] : '';
        if (pathname === '/api/chat' || pathname === '/.netlify/functions/chat') {
          if (req.method === 'OPTIONS') {
            res.statusCode = 200;
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
            res.end();
            return;
          }

          if (req.method === 'POST') {
            let bodyStr = '';
            req.setEncoding('utf-8');
            req.on('data', (chunk) => {
              bodyStr += chunk;
            });
            req.on('end', async () => {
              try {
                const { handler } = await import('./netlify/functions/chat.mjs');
                const result = await handler({
                  httpMethod: 'POST',
                  body: bodyStr,
                  headers: (req.headers || {}) as Record<string, string>
                });
                res.statusCode = result.statusCode || 200;
                if (result.headers) {
                  for (const [k, v] of Object.entries(result.headers)) {
                    res.setHeader(k, v);
                  }
                }
                res.end(result.body);
              } catch (err: any) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: err?.message || 'Internal server error in dev API' }));
              }
            });
            return;
          }
        }
        next();
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), devApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve('.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

