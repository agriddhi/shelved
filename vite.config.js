import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { callUpstream } from './api/ai-core.mjs';

// Dev-only /api/ai middleware — mirrors the Vercel function so the
// LLM draft path works identically with `npm run dev`.
// Falls back gracefully: without a key the client uses rule-based drafts.

function devApi(env) {
  return {
    name: 'shelved-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/ai', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }
        let raw = '';
        for await (const chunk of req) raw += chunk;
        let body = {};
        try {
          body = JSON.parse(raw || '{}');
        } catch {
          body = {};
        }
        const out = await callUpstream(body, env);
        if (out.error) {
          res.statusCode = out.status || 502;
          res.end(JSON.stringify({ error: out.error }));
          return;
        }
        res.end(JSON.stringify({ text: out.text, model: out.model }));
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss(), devApi(env)],
    resolve: {
      // Framer marketplace components import { addPropertyControls, ... } from "framer".
      alias: { framer: fileURLToPath(new URL('./src/lib/framer-shim.js', import.meta.url)) },
    },
    test: {
      environment: 'node',
      include: ['src/**/*.test.js'],
    },
  };
});
